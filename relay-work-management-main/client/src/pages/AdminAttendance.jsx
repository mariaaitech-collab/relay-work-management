import { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';

function AdminAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [startInput, setStartInput] = useState('09:00');
  const [endInput, setEndInput] = useState('09:30');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [todayRes, settingsRes] = await Promise.all([
        api.get('/admin/attendance/today'),
        api.get('/admin/attendance/settings')
      ]);
      setData(todayRes.data);
      setStartInput(todayRes.data.window?.start || settingsRes.data.start || '09:00');
      setEndInput(todayRes.data.window?.end || settingsRes.data.end || '09:30');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load attendance data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000); // real-time sync with employee check-ins
    return () => clearInterval(id);
  }, [load]);

  const saveWindow = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      await api.put('/admin/attendance/settings', { start: startInput, end: endInput });
      setFeedback('Attendance window updated.');
      load();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Could not update the attendance window.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="dashboard-empty">Loading attendance…</p>;
  if (error) return <div className="dashboard-feedback dashboard-feedback-error">{error}</div>;
  if (!data) return null;

  return (
    <>
      <div className="attendance-summary">
        <article className="dashboard-metric"><small>PRESENT</small><strong className="att-present-count">{data.present}</strong><span>Marked today</span></article>
        <article className="dashboard-metric"><small>ABSENT</small><strong className="att-absent-count">{data.absent}</strong><span>Auto / not marked</span></article>
        <article className="dashboard-metric"><small>PENDING</small><strong className="att-pending-count">{data.pending}</strong><span>Before window</span></article>
        <article className="dashboard-metric"><small>WINDOW</small><strong>{data.window?.start}–{data.window?.end}</strong><span>{data.past ? 'Locked for today' : 'Open — marking allowed'}</span></article>
      </div>

      <section className="dashboard-panel dashboard-section-panel">
        <div className="dashboard-panel-heading">
          <div><p className="dashboard-kicker">Attendance / Settings</p><h2>Daily attendance window</h2></div>
        </div>
        <form className="attendance-settings-form" onSubmit={saveWindow}>
          <label>Opens at
            <input type="time" value={startInput} onChange={(event) => setStartInput(event.target.value)} required />
          </label>
          <label>Closes at
            <input type="time" value={endInput} onChange={(event) => setEndInput(event.target.value)} required />
          </label>
          <button className="dashboard-button" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save window'}</button>
        </form>
        {feedback && <div className="dashboard-feedback">{feedback}</div>}
        <p className="section-description">
          Employees may mark themselves <b>Present</b> only during this window. Once it closes, anyone without a record is automatically locked in as <b>Absent</b>.
        </p>
      </section>

      <section className="dashboard-panel dashboard-section-panel">
        <div className="dashboard-panel-heading">
          <div><p className="dashboard-kicker">Attendance / {data.date}</p><h2>Daily status</h2></div>
          <span className="dashboard-pill">{data.total} employees</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table attendance-table">
            <thead>
              <tr><th>Employee</th><th>ID</th><th>Department</th><th>Status</th></tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="table-person">
                      <span className="dashboard-avatar">{row.name.charAt(0)}</span>
                      <span><b>{row.name}</b><small>{row.email}</small></span>
                    </div>
                  </td>
                  <td><span className="table-employee-id">{row.employeeId}</span></td>
                  <td>{row.department}</td>
                  <td>
                    <span className={`att-status att-${row.status}`}>
                      {row.status === 'present' ? 'Present' : row.status === 'absent' ? 'Absent' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

export default AdminAttendance;
