const { User, findUserById, findAdmins } = require('../models/userModel');
const { addProofOfWork, getWorkHistory, checkTodaySubmission } = require('../models/workModel');
const { Task } = require('../models/taskModel');
const { createWorkflowNotification } = require('../models/notificationModel');
const { recordActivity } = require('../models/activityModel');
const { markPresent, getEmployeeAttendance, getHistory } = require('../models/attendanceModel');
const { isPastWindow } = require('../controllers/attendanceController');
const { todayStr } = require('../utils/timezone');

// Apna profile/score dekhna
const getMyProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      job_role: user.job_role,
      performance_score: user.performance_score,
      status: user.status
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// Proof of work submit karna (real image upload ke sath)
const submitWork = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const { githubLink, taskId } = req.body;
    const screenshotUrl = req.file ? req.file.path : null;

    if (!taskId) {
      return res.status(400).json({ message: 'Choose an assigned task before submitting work' });
    }
    const task = await Task.findOne({ _id: taskId, assignee_ids: userId, status: { $in: ['assigned', 'in_progress', 'open'] } });
    if (!task) {
      return res.status(403).json({ message: 'You can only submit work for an assigned open task' });
    }
    if (!screenshotUrl && !githubLink) {
      return res.status(400).json({ message: 'Screenshot or GitHub link is required' });
    }

    const existing = await checkTodaySubmission(userId, today, taskId);
    if (existing) {
      return res.status(400).json({ message: 'Work already submitted for today' });
    }

    const work = await addProofOfWork(userId, today, screenshotUrl, githubLink, taskId);
    await Task.findByIdAndUpdate(taskId, { status: 'submitted' });
    const user = await findUserById(userId);
    const admins = await findAdmins();
    await createWorkflowNotification(userId, admins.map((admin) => admin._id), `${user.name} submitted work for: ${task.title}`, 'reviews');
    await recordActivity({ actorId: userId, employeeId: userId, taskId, type: 'task_submitted', message: `${user.name} submitted ${task.title}` });
    res.status(201).json({ message: 'Work submitted successfully', work });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// Apni history dekhna
const myHistory = async (req, res) => {
  try {
    const history = await getWorkHistory(req.user.id);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// Attendance mark karna
const markMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = todayStr();

    const past = await isPastWindow();
    if (past) {
      return res.status(423).json({ message: 'Attendance cut-off time has passed. You can no longer mark attendance.' });
    }

    const existing = await getEmployeeAttendance(userId, today);
    if (existing && existing.status === 'present') {
      return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    const attendance = await markPresent(userId, today);
    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

// Attendance history dekhna
const myAttendanceHistory = async (req, res) => {
  try {
    const history = await getHistory(req.user.id);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

const startTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignee_ids: req.user.id, status: { $in: ['assigned', 'open'] } },
      { status: 'in_progress' },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Assigned task not found or already started' });
    await recordActivity({ actorId: req.user.id, employeeId: req.user.id, taskId: task.id, type: 'task_started', message: `Started ${task.title}` });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};


const getTeam = async (req, res) => {
  try {
    const team = await User.find({ role: 'employee', _id: { $ne: req.user.id }, status: { $ne: 'blocked' } })
      .select('name email job_role department status')
      .sort({ name: 1 });
    res.status(200).json(team);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: 'Internal server error' });
  }
};

module.exports = {
  getMyProfile,
  submitWork,
  myHistory,
  markMyAttendance,
  myAttendanceHistory,
  startTask,
  getTeam
};