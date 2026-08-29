const { Attendance, markPresent, getAttendanceForDate, getEmployeeAttendance, getHistory } = require('../models/attendanceModel');
const { User } = require('../models/userModel');
const { getSetting, setSetting } = require('../models/settingsModel');

const DEFAULT_WINDOW = { start: '09:00', end: '09:30' };

const getWindow = async () => {
  const w = await getSetting('attendanceWindow', DEFAULT_WINDOW);
  if (w && w.start && w.end) return w;
  return DEFAULT_WINDOW;
};

// All window comparisons and the business-day date use the company timezone
// (Asia/Karachi / PKT) so the server's own locale can never open/close the
// window early or late for users. See utils/timezone.js.
const { todayStr, isWithinWindow: _isWithinWindow, isPastWindow: _isPastWindow } = require('../utils/timezone');

// True only while the current company-tz time is inside the admin-defined window.
const isWithinWindow = async () => _isWithinWindow(await getWindow());

// True once the window has fully closed for the day (in company tz).
const isPastWindow = async () => _isPastWindow(await getWindow());

// Cron / safety net: employees without a record for `date` become "absent".
const autoMarkAbsent = async (date) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('_id');
    if (!employees.length) return;
    const existing = await Attendance.find({ date }).select('user_id');
    const marked = new Set(existing.map((r) => r.user_id.toString()));
    const toInsert = employees
      .filter((e) => !marked.has(e._id.toString()))
      .map((e) => ({ user_id: e._id, date, status: 'absent', autoMarked: true }));
    if (toInsert.length) await Attendance.insertMany(toInsert);
  } catch (err) {
    console.error('autoMarkAbsent error:', err.message);
  }
};

const buildRows = (employees, recordsByUser, past) =>
  employees.map((e) => {
    const rec = recordsByUser[e._id.toString()];
    return {
      id: e._id,
      name: e.name,
      email: e.email,
      employeeId: e.employeeId,
      department: e.department,
      job_role: e.job_role,
      status: rec ? rec.status : (past ? 'absent' : 'pending')
    };
  });

// ADMIN: full roster attendance for today.
const adminAttendanceToday = async (req, res) => {
  try {
    const date = todayStr();
    const window = await getWindow();
    const past = await isPastWindow();
    const open = await isWithinWindow();
    if (past) await autoMarkAbsent(date);

    const records = await getAttendanceForDate(date);
    const recordsByUser = {};
    records.forEach((r) => { recordsByUser[r.user_id?._id?.toString()] = r; });

    const employees = await User.find({ role: 'employee' })
      .select('name email employeeId department job_role status');
    const rows = buildRows(employees, recordsByUser, past);

    res.status(200).json({
      date,
      window,
      past,
      open,
      total: rows.length,
      present: rows.filter((r) => r.status === 'present').length,
      absent: rows.filter((r) => r.status === 'absent').length,
      pending: rows.filter((r) => r.status === 'pending').length,
      rows
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// ADMIN: read attendance window setting.
const getWindowSetting = async (req, res) => {
  try {
    res.status(200).json(await getWindow());
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// ADMIN: update attendance window setting (HH:MM, 24h).
const updateWindowSetting = async (req, res) => {
  try {
    const { start, end } = req.body;
    const timeRe = /^([01]?\d|2[0-3]):[0-5]\d$/;
    if (!timeRe.test(String(start)) || !timeRe.test(String(end))) {
      return res.status(400).json({ message: 'Invalid time format. Use HH:MM (24-hour).' });
    }
    const [sh, sm] = String(start).split(':').map(Number);
    const [eh, em] = String(end).split(':').map(Number);
    if (eh * 60 + em <= sh * 60 + sm) {
      return res.status(400).json({ message: 'Window end must be after the window start.' });
    }
    await setSetting('attendanceWindow', { start, end });
    await autoMarkAbsent(todayStr()); // re-evaluate today if the window just closed
    res.status(200).json({ start, end, message: 'Attendance window updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// EMPLOYEE: today's own status.
const employeeAttendanceToday = async (req, res) => {
  try {
    const date = todayStr();
    const window = await getWindow();
    const past = await isPastWindow();
    const open = await isWithinWindow();
    if (past) await autoMarkAbsent(date);

    const rec = await getEmployeeAttendance(req.user.id, date);
    res.status(200).json({
      date,
      window,
      past,
      open,
      canMark: open && !rec,
      status: rec ? rec.status : (past ? 'absent' : 'pending'),
      markedAt: rec ? rec.markedAt : null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// EMPLOYEE: mark self present (only inside the window).
const employeeMarkPresent = async (req, res) => {
  try {
    const date = todayStr();
    const past = await isPastWindow();
    if (past) {
      return res.status(423).json({
        message: 'The attendance window has closed. You can no longer mark yourself present for today.'
      });
    }
    const within = await isWithinWindow();
    if (!within) {
      return res.status(423).json({
        message: 'The attendance window has not opened yet. You can mark attendance during the admin-defined window.'
      });
    }
    const existing = await getEmployeeAttendance(req.user.id, date);
    if (existing && existing.status === 'present') {
      return res.status(400).json({ message: 'You have already marked attendance for today.' });
    }
    const attendance = await markPresent(req.user.id, date);
    res.status(201).json({ message: 'Present marked successfully', attendance });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// EMPLOYEE: own attendance history.
const employeeAttendanceHistory = async (req, res) => {
  try {
    const history = await getHistory(req.user.id);
    res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

module.exports = {
  getWindow,
  isWithinWindow,
  isPastWindow,
  todayStr,
  autoMarkAbsent,
  adminAttendanceToday,
  getWindowSetting,
  updateWindowSetting,
  employeeAttendanceToday,
  employeeMarkPresent,
  employeeAttendanceHistory
};
