import { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';

// Evaluate the attendance window in the company timezone (Asia/Karachi / PKT)
// on the client as well, so the button enables/disables exactly when the window
// actually opens/closes for the user instead of depending on server poll lag.
// The backend uses the same timezone, so the two always agree.
const nowMinutesInTz = (tz) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
};

const isWithinWindowTz = (window, tz = 'Asia/Karachi') => {
  if (!window?.start || !window?.end) return false;
  const toMin = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return h * 60 + m;
  };
  const now = nowMinutesInTz(tz);
  return now >= toMin(window.start) && now <= toMin(window.end);
};

function EmployeeAttendance() {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get('/employee/attendance/today'),
        api.get('/employee/attendance/history')
      ]);
      setData(todayRes.data);
      setHistory(historyRes.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load attendance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // keep button/status in sync with the window clock
    return () => clearInterval(id);
  }, [load]);

  const markPresent = async () => {
    setMarking(true);
    setFeedback('');
    try {
      await api.post('/employee/attendance/mark');
      setFeedback('You are marked present for today.');
      load();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Could not mark attendance.');
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <p className="dashboard-empty">Loading attendance…</p>;
  if (error) return <div className="dashboard-feedback dashboard-feedback-error">{error}</div>;
  if (!data) return null;

  const statusLabel =
    data.status === 'present' ? 'Present' : data.status === 'absent' ? 'Absent' : 'Not marked yet';

  const recent = history.slice(0, 10);
  const within = data.window ? isWithinWindowTz(data.window) : false;

  return (
    <>
      <section className="dashboard-panel attendance-card-section">
        <div className="dashboard-panel-heading">
          <div><p className="dashboard-kicker">Attendance / {data.date}</p><h2>Daily check-in</h2></div>
        </div>
        <div className="attendance-card">
          <div className={`attendance-status-badge att-${data.status}`}>{statusLabel}</div>
          <p className="attendance-card-copy">
            {within
              ? 'Mark yourself present during the daily window below to register your attendance. Once the window closes, the option is disabled and you will be marked absent.'
              : 'The daily attendance window is currently closed, so attendance is locked. It opens during the admin-defined window shown below.'}
          </p>
          <div className="attendance-cutoff-info">
            <span>Attendance window</span>
            <strong>{data.window?.start}–{data.window?.end}</strong>
          </div>
          <button className="mark-present-btn" onClick={markPresent} disabled={marking || data.status === 'present' || !within || !data.canMark}>
            {data.status === 'present' ? 'Already marked present' : marking ? 'Marking…' : 'Mark me present'}
          </button>
          {feedback && (
            <div className={`dashboard-feedback ${data.status === 'present' ? '' : 'dashboard-feedback-error'}`}>
              {feedback}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-panel dashboard-section-panel">
        <div className="dashboard-panel-heading">
          <div><p className="dashboard-kicker">Attendance / History</p><h2>Recent days</h2></div>
        </div>
        {recent.length ? (
          <div className="attendance-history-list">
            {recent.map((row) => (
              <div className="attendance-history-row" key={row.id}>
                <span>{row.date}</span>
                <span className={`att-status att-${row.status}`}>
                  {row.status === 'present' ? 'Present' : 'Absent'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="dashboard-empty">No attendance records yet.</p>
        )}
      </section>
    </>
  );
}

export default EmployeeAttendance;
