import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import logoImg from '../assets/relay_logo.png';
import MessageCenter from '../components/MessageCenter';
import ThemeToggle from '../components/ThemeToggle';
import AdminAttendance from './AdminAttendance';

function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activity, setActivity] = useState([]);
  const [section, setSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', password: '', department: 'General', employeeId: '' });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [scoreEmployee, setScoreEmployee] = useState(null);
  const [scoreValue, setScoreValue] = useState('');
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [notifMessage, setNotifMessage] = useState('');
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', dueDate: '', priority: 'medium', assigneeIds: [] });
  const [reviewSubmission, setReviewSubmission] = useState(null);
  const [reviewMessage, setReviewMessage] = useState('');
  const navigate = useNavigate();

  const loadEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const [employeeResponse, taskResponse, submissionResponse, notificationResponse, activityResponse] = await Promise.all([
        api.get('/admin/employees'),
        api.get('/admin/tasks'),
        api.get('/admin/submissions'),
        api.get('/notifications/my-notifications'),
        api.get('/admin/activity')
      ]);
      setEmployees(employeeResponse.data);
      setTasks(taskResponse.data);
      setSubmissions(submissionResponse.data);
      setNotifications(notificationResponse.data);
      setActivity(activityResponse.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Employee data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { queueMicrotask(loadEmployees); }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const openNotification = async (notification) => {
    const notificationId = notification.id || notification._id;
    if (!notification.read_at) {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications((current) => current.map((item) => item.id === notificationId || item._id === notificationId ? { ...item, read_at: new Date().toISOString() } : item));
    }
    setSection(notification.source || 'notifications');
  };

  const averageScore = employees.length ? Math.round(employees.reduce((sum, employee) => sum + employee.performance_score, 0) / employees.length) : 0;
  const atRisk = employees.filter((employee) => employee.performance_score <= 60).length;
  const activeCount = employees.filter((employee) => employee.status === 'active').length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const overdueTasks = tasks.filter((task) => task.status === 'overdue').length;
  const pendingTasks = tasks.filter((task) => ['assigned', 'in_progress', 'submitted', 'open'].includes(task.status)).length;
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const handleAdd = async (event) => {
    event.preventDefault();
    try {
      await api.post('/admin/employees', { ...newEmployee, role: 'employee' });
      setNewEmployee({ name: '', email: '', password: '', department: 'General', employeeId: '' });
      setShowAddForm(false);
      setFeedback('Employee account created.');
      loadEmployees();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Employee could not be created.');
    }
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    try {
      await api.put(`/admin/employees/${editingEmployee.id || editingEmployee._id}`, { name: editingEmployee.name, email: editingEmployee.email, jobRole: editingEmployee.job_role, department: editingEmployee.department });
      setEditingEmployee(null);
      setFeedback('Employee details updated.');
      loadEmployees();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Employee could not be updated.');
    }
  };

  const handleScore = async (event) => {
    event.preventDefault();
    try {
      await api.put(`/admin/employees/${scoreEmployee.id || scoreEmployee._id}/score`, { newScore: Number(scoreValue), reason: 'Manual adjustment by Admin' });
      setScoreEmployee(null);
      setFeedback('Performance score updated.');
      loadEmployees();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Score could not be updated.');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/employees/${deleteEmployee.id || deleteEmployee._id}`);
      setDeleteEmployee(null);
      setFeedback('Employee account deleted.');
      loadEmployees();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Employee could not be deleted.');
    }
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    if (!sendToAll && selectedIds.length === 0) {
      setFeedback('Select at least one employee before sending.');
      return;
    }
    try {
      await api.post('/notifications/send', { message: notifMessage, recipientIds: sendToAll ? 'all' : selectedIds });
      setNotifMessage('');
      setSelectedIds([]);
      setFeedback('Announcement sent successfully.');
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Announcement could not be sent.');
    }
  };

  const createTask = async (event) => {
    event.preventDefault();
    if (taskForm.assigneeIds.length === 0) {
      setFeedback('Select at least one employee for this task.');
      return;
    }
    try {
      await api.post('/admin/tasks', taskForm);
      setTaskForm({ title: '', description: '', dueDate: '', priority: 'medium', assigneeIds: [] });
      setShowTaskForm(false);
      setFeedback('Task assigned successfully.');
      loadEmployees();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Task could not be assigned.');
    }
  };

  const reviewWork = async (status) => {
    if (status === 'changes_requested' && !reviewMessage.trim()) {
      setFeedback('Add a message explaining the requested changes.');
      return;
    }
    try {
      await api.put(`/admin/submissions/${reviewSubmission.id || reviewSubmission._id}/review`, { status, message: reviewMessage });
      setReviewSubmission(null);
      setReviewMessage('');
      setFeedback(status === 'approved' ? 'Work proof approved.' : 'Changes requested from employee.');
      loadEmployees();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Submission review failed.');
    }
  };

  if (loading) return <div className="dashboard-loading"><span /> Loading admin workspace</div>;

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div>
          <button className="dashboard-brand" onClick={() => navigate('/')}><img src={logoImg} alt="" /><span>Relay <em>OS</em></span></button>
          <p className="dashboard-nav-label">Main</p>
          <nav className="dashboard-nav"><button className={section === 'overview' ? 'active' : ''} onClick={() => setSection('overview')}><span>▦</span>Overview</button><button className={section === 'employees' ? 'active' : ''} onClick={() => setSection('employees')}><span>♙</span>Employees<small>{employees.length}</small></button><button className={section === 'tasks' ? 'active' : ''} onClick={() => setSection('tasks')}><span>□</span>Tasks<small>{pendingTasks}</small></button><button className={section === 'kanban' ? 'active' : ''} onClick={() => setSection('kanban')}><span>▤</span>Task board</button><button className={section === 'reviews' ? 'active' : ''} onClick={() => setSection('reviews')}><span>✓</span>Reviews<small>{submissions.filter((submission) => submission.review_status === 'pending').length}</small></button><button className={section === 'activity' ? 'active' : ''} onClick={() => setSection('activity')}><span>◔</span>Activity</button><button className={section === 'messages' ? 'active' : ''} onClick={() => setSection('messages')}><span>◌</span>Queries</button><button className={section === 'notifications' ? 'active' : ''} onClick={() => setSection('notifications')}><span>◉</span>Announcements</button><button className={section === 'attendance' ? 'active' : ''} onClick={() => setSection('attendance')}><span>◷</span>Attendance</button></nav>

        </div>
        <div className="dashboard-profile-wrap">
          <ThemeToggle />
          {showProfileMenu && <div className="dashboard-profile-menu"><button onClick={logout}>Sign out of Relay</button></div>}
          <button className="dashboard-profile" onClick={() => setShowProfileMenu((visible) => !visible)} aria-expanded={showProfileMenu}><span className="dashboard-avatar">A</span><span><b>System Admin</b><small>Administrator</small></span><strong>•••</strong></button>
        </div>
      </aside>

      <section className="dashboard-main">
        {section === 'overview' && <div className="command-metrics"><article><small>EMPLOYEES</small><strong>{employees.length}</strong><span>{activeCount} active</span></article><article><small>ASSIGNED TASKS</small><strong>{tasks.length}</strong><span>{pendingTasks} pending</span></article><article><small>COMPLETED</small><strong>{completedTasks}</strong><span>{completionRate}% completion</span></article><article><small>OVERDUE</small><strong className="command-danger">{overdueTasks}</strong><span>Needs attention</span></article></div>}
        <header className="dashboard-header"><div><p className="dashboard-kicker">Admin workspace / {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p><h1>{section === 'overview' ? 'Team overview.' : section === 'employees' ? 'Employee directory.' : section === 'tasks' ? 'Task assignments.' : section === 'reviews' ? 'Submission reviews.' : section === 'activity' ? 'Activity timeline.' : section === 'messages' ? 'Team queries.' : section === 'attendance' ? 'Attendance.' : 'Announcements.'}</h1></div><div className="dashboard-header-actions"><button className="dashboard-icon-button" onClick={() => setSection('notifications')} aria-label="Open notifications">◉{notifications.filter((notification) => !notification.read_at).length > 0 && <small>{notifications.filter((notification) => !notification.read_at).length}</small>}</button>{section !== 'attendance' && <button className="dashboard-button" onClick={() => section === 'tasks' ? setShowTaskForm(true) : setShowAddForm(true)}>{section === 'tasks' ? 'Assign task' : 'Add employee'} <span>+</span></button>}</div></header>
        {(feedback || error) && <div className={`dashboard-feedback ${error ? 'dashboard-feedback-error' : ''}`}>{error || feedback}<button onClick={() => { setFeedback(''); setError(''); }}>×</button></div>}

        {section === 'overview' && <><div className="dashboard-metrics"><article className="dashboard-metric dashboard-metric-featured"><small>TOTAL EMPLOYEES</small><strong>{employees.length}</strong><p>People in your workspace</p><b>↗ directory is up to date</b></article><article className="dashboard-metric"><small>AVERAGE SCORE</small><strong>{averageScore}<span>%</span></strong><p>Across active employees</p><b className="metric-neutral">{activeCount} active accounts</b></article><article className="dashboard-metric"><small>AT RISK</small><strong>{atRisk}</strong><p>Score below 60%</p><b className="metric-neutral">Needs manager review</b></article></div><div className="dashboard-grid-main"><section className="dashboard-panel dashboard-activity-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Team distribution</p><h2>Performance overview</h2></div><span className="dashboard-pill">Live data</span></div><div className="admin-score-bars">{[100, 80, 60, 40, 20].map((level) => <div key={level}><small>{level}</small><span style={{ width: `${Math.max(8, employees.filter((employee) => employee.performance_score >= level).length / Math.max(employees.length, 1) * 100)}%` }} /></div>)}</div><div className="panel-footer"><span>Employees grouped by current performance score.</span><button className="text-action" onClick={() => setSection('employees')}>Open directory ↗</button></div></section><section className="dashboard-panel dashboard-status-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Attention queue</p><h2>Needs review</h2></div><span className="status-dot warning" /></div><div className="admin-risk-number"><strong>{atRisk}</strong><span>at-risk employees</span></div><div className="status-list"><span><i className="done" /> Active accounts <b>{activeCount}</b></span><span><i /> Blocked accounts <b>{employees.filter((employee) => employee.status === 'blocked').length}</b></span></div></section></div></>}

        {section === 'employees' && <section className="dashboard-panel dashboard-section-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Main / Employee directory</p><h2>{employees.length} employees</h2></div><button className="dashboard-button" onClick={() => setShowAddForm(true)}>Add employee <span>+</span></button></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Employee</th><th>ID</th><th>Score</th><th>Status</th><th>Actions</th></tr></thead><tbody>{employees.map((employee) => { const id = employee.id || employee._id; return <tr key={id}><td><div className="table-person"><span className="dashboard-avatar">{employee.name.charAt(0)}</span><span><b>{employee.name}</b><small>{employee.email}</small></span></div></td><td><span className="table-employee-id">{employee.employeeId}</span></td><td><strong className="table-score">{employee.performance_score}%</strong></td><td><span className={`status-chip ${employee.status}`}>{employee.status}</span></td><td><div className="table-actions"><button onClick={() => setViewingEmployee(employee)}>View</button><button onClick={() => setEditingEmployee({ ...employee })}>Edit</button><button onClick={() => { setScoreEmployee(employee); setScoreValue(employee.performance_score); }}>Score</button><button className="danger-action" onClick={() => setDeleteEmployee(employee)}>Delete</button></div></td></tr>; })}</tbody></table>{employees.length === 0 && <p className="dashboard-empty">No employees yet.</p>}</div></section>}

        {section === 'tasks' && <section className="dashboard-panel dashboard-section-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Performance / Task assignments</p><h2>Assigned work</h2></div><button className="dashboard-button" onClick={() => setShowTaskForm(true)}>Create task <span>+</span></button></div><div className="admin-task-list">{tasks.length ? tasks.map((task) => <article key={task.id || task._id}><div><span className="task-state">{task.status}</span><h3>{task.title}</h3><p>{task.description || 'No task brief added.'}</p></div><div className="task-meta"><span>{task.assignee_ids?.length || 0} assignee{task.assignee_ids?.length === 1 ? '' : 's'}</span><span>{task.due_date ? `Due ${task.due_date}` : 'No due date'}</span></div></article>) : <p className="dashboard-empty">No tasks assigned yet.</p>}</div></section>}

        {section === 'reviews' && <section className="dashboard-panel dashboard-section-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Performance / Work review</p><h2>Submitted work</h2></div><span className="dashboard-pill">{submissions.filter((submission) => submission.review_status === 'pending').length} pending</span></div><div className="admin-review-list">{submissions.length ? submissions.map((submission) => <article key={submission.id || submission._id}><div className="review-person"><span className="dashboard-avatar">{submission.user_id?.name?.charAt(0) || '?'}</span><div><h3>{submission.task_id?.title || 'Legacy submission'}</h3><p>{submission.user_id?.name || 'Unknown employee'} · {new Date(submission.date).toLocaleDateString()}</p><small>{submission.github_link ? 'GitHub repository attached' : 'Screenshot attached'}</small></div></div><div className="review-actions"><span className={`review-status ${submission.review_status}`}>{submission.review_status === 'changes_requested' ? 'Changes requested' : submission.review_status}</span>{submission.review_status === 'pending' && <button className="dashboard-button" onClick={() => { setReviewSubmission(submission); setReviewMessage(''); }}>Review <span>↗</span></button>}</div></article>) : <p className="dashboard-empty">No work submissions to review.</p>}</div></section>}
        {section === 'activity' && <section className="dashboard-panel dashboard-section-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Operations / Activity</p><h2>Recent activity</h2></div><span className="dashboard-pill">Live timeline</span></div><div className="admin-activity-list">{activity.length ? activity.map((item) => <article key={item.id || item._id}><span className="activity-marker" /><div><b>{item.message}</b><small>{new Date(item.created_at || item.createdAt).toLocaleString()}</small></div></article>) : <p className="dashboard-empty">Activity will appear as your team works.</p>}</div></section>}
        {section === 'kanban' && <section className="dashboard-panel dashboard-section-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Operations / Task flow</p><h2>Task board</h2></div><button className="dashboard-button" onClick={() => setShowTaskForm(true)}>Assign task <span>+</span></button></div><div className="admin-kanban">{[['assigned', 'Assigned'], ['in_progress', 'In progress'], ['submitted', 'Review'], ['completed', 'Completed']].map(([status, label]) => <div key={status}><header><span>{label}</span><b>{tasks.filter((task) => task.status === status).length}</b></header>{tasks.filter((task) => task.status === status).map((task) => <article key={task.id || task._id}><span className={`priority-dot ${task.priority || 'medium'}`} /> <h3>{task.title}</h3><p>{task.assignee_ids?.map((assignee) => assignee.name).join(', ') || 'Unassigned'}</p><small>{task.due_date ? `Due ${task.due_date}` : 'No deadline'}</small></article>)}</div>)}</div></section>}
        {section === 'messages' && <MessageCenter />}
        {section === 'attendance' && <AdminAttendance />}

        {section === 'notifications' && <section className="dashboard-panel dashboard-section-panel admin-notification-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Main / Announcements</p><h2>Send a team update</h2></div><span className="dashboard-pill">{employees.length} recipients</span></div><form onSubmit={sendNotification} className="admin-notification-form"><textarea value={notifMessage} onChange={(event) => setNotifMessage(event.target.value)} placeholder="Write a clear update for your team..." required /><div className="notification-form-footer"><label><input type="checkbox" checked={sendToAll} onChange={(event) => setSendToAll(event.target.checked)} /> Send to all employees</label>{!sendToAll && <div className="recipient-list">{employees.map((employee) => { const id = employee.id || employee._id; return <label key={id}><input type="checkbox" checked={selectedIds.includes(id)} onChange={() => setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])} /> {employee.name}</label>; })}</div>}<button className="dashboard-button" type="submit">Send announcement <span>↗</span></button></div></form><div className="admin-alert-feed"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Workflow alerts</p><h2>Recent updates</h2></div><span className="dashboard-pill">{notifications.filter((notification) => !notification.read_at).length} unread</span></div>{notifications.slice(0, 6).map((notification) => <button className={`admin-alert-item ${notification.read_at ? 'read' : 'unread'}`} onClick={() => openNotification(notification)} key={notification.id || notification._id}><span className="list-icon">◉</span><span><b>{notification.message}</b><small>{new Date(notification.created_at || notification.createdAt).toLocaleString()} · {notification.read_at ? 'Read' : 'Unread'}</small></span><strong>↗</strong></button>)}</div></section>}
      </section>

      {showAddForm && <div className="dashboard-modal-backdrop"><div className="dashboard-modal"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Directory</p><h2>Add employee</h2></div><button className="modal-close" onClick={() => setShowAddForm(false)}>×</button></div><form onSubmit={handleAdd} className="dashboard-modal-form"><label>Full name<input value={newEmployee.name} onChange={(event) => setNewEmployee({ ...newEmployee, name: event.target.value })} required /></label><label>Email address<input type="email" value={newEmployee.email} onChange={(event) => setNewEmployee({ ...newEmployee, email: event.target.value })} required /></label><label>Temporary password<input type="password" value={newEmployee.password} onChange={(event) => setNewEmployee({ ...newEmployee, password: event.target.value })} minLength="6" required /></label><label>Department<input value={newEmployee.department} onChange={(event) => setNewEmployee({ ...newEmployee, department: event.target.value })} placeholder="Marketing" required /></label><label>Employee ID<input value={newEmployee.employeeId} onChange={(event) => setNewEmployee({ ...newEmployee, employeeId: event.target.value })} placeholder="e.g. EMP-7Q2K9" /></label><button className="dashboard-button" type="submit">Create account ↗</button></form></div></div>}
      {editingEmployee && <div className="dashboard-modal-backdrop"><div className="dashboard-modal"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Directory</p><h2>Edit employee</h2></div><button className="modal-close" onClick={() => setEditingEmployee(null)}>×</button></div><form onSubmit={handleEdit} className="dashboard-modal-form"><label>Full name<input value={editingEmployee.name} onChange={(event) => setEditingEmployee({ ...editingEmployee, name: event.target.value })} required /></label><label>Email address<input type="email" value={editingEmployee.email} onChange={(event) => setEditingEmployee({ ...editingEmployee, email: event.target.value })} required /></label><label>Job role<input value={editingEmployee.job_role || 'Employee'} onChange={(event) => setEditingEmployee({ ...editingEmployee, job_role: event.target.value })} placeholder="Product Designer" required /></label><label>Department<input value={editingEmployee.department || 'General'} onChange={(event) => setEditingEmployee({ ...editingEmployee, department: event.target.value })} placeholder="Marketing" required /></label><button className="dashboard-button" type="submit">Save changes ↗</button></form></div></div>}
      {scoreEmployee && <div className="dashboard-modal-backdrop"><div className="dashboard-modal"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Performance</p><h2>Update score</h2></div><button className="modal-close" onClick={() => setScoreEmployee(null)}>×</button></div><p className="modal-copy">{scoreEmployee.name} · current score <b>{scoreEmployee.performance_score}%</b></p><form onSubmit={handleScore} className="dashboard-modal-form"><label>{scoreEmployee.name}'s score<input type="number" min="0" max="100" value={scoreValue} onChange={(event) => setScoreValue(event.target.value)} required /></label><div className="score-quick-actions"><button type="button" onClick={() => setScoreValue(Math.max(0, (Number(scoreValue) || 0) + 10))}>+10%</button><button type="button" onClick={() => setScoreValue(Math.max(0, (Number(scoreValue) || 0) - 10))}>−10%</button><button type="button" className="reset-action" onClick={() => setScoreValue(100)}>Reset to 100%</button></div><button className="dashboard-button" type="submit">Save score ↗</button></form></div></div>}
      {deleteEmployee && <div className="dashboard-modal-backdrop"><div className="dashboard-modal"><p className="dashboard-kicker">Directory</p><h2>Delete {deleteEmployee.name}?</h2><p className="modal-copy">This permanently removes the employee account.</p><div className="modal-actions"><button className="dashboard-button secondary-button" onClick={() => setDeleteEmployee(null)}>Cancel</button><button className="dashboard-button danger-button" onClick={handleDelete}>Delete account</button></div></div></div>}
      {viewingEmployee && <div className="dashboard-modal-backdrop"><div className="dashboard-modal detail-modal"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Employee detail</p><h2>{viewingEmployee.name}</h2></div><button className="modal-close" onClick={() => setViewingEmployee(null)}>×</button></div><p className="modal-copy">{viewingEmployee.email}</p><div className="detail-stats"><div><small>EMPLOYEE ID</small><strong>{viewingEmployee.employeeId || '—'}</strong></div><div><small>SCORE</small><strong>{viewingEmployee.performance_score}%</strong></div><div><small>STATUS</small><strong>{viewingEmployee.status}</strong></div><div><small>JOINED</small><strong>{viewingEmployee.created_log ? `${viewingEmployee.created_log.date} ${viewingEmployee.created_log.month} ${viewingEmployee.created_log.year}, ${viewingEmployee.created_log.time}` : '—'}</strong></div></div></div></div>}
      {showTaskForm && <div className="dashboard-modal-backdrop"><div className="dashboard-modal task-modal"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Performance / Assignment</p><h2>Assign a task</h2></div><button className="modal-close" onClick={() => setShowTaskForm(false)}>×</button></div><form onSubmit={createTask} className="dashboard-modal-form"><label>Task title<input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="Prepare Q3 product brief" required /></label><label>Task brief<textarea value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} placeholder="What does good completion look like?" /></label><label>Due date<input type="date" value={taskForm.dueDate} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} /></label><fieldset><legend>Assign to employees</legend><div className="assignee-picker">{employees.map((employee) => { const id = employee.id || employee._id; return <label key={id}><input type="checkbox" checked={taskForm.assigneeIds.includes(id)} onChange={() => setTaskForm({ ...taskForm, assigneeIds: taskForm.assigneeIds.includes(id) ? taskForm.assigneeIds.filter((item) => item !== id) : [...taskForm.assigneeIds, id] })} /><span><b>{employee.name}</b><small>{employee.job_role || 'Employee'}</small></span></label>; })}</div></fieldset><button className="dashboard-button" type="submit">Assign task ↗</button></form></div></div>}
      {reviewSubmission && <div className="dashboard-modal-backdrop"><div className="dashboard-modal"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Work review</p><h2>{reviewSubmission.task_id?.title || 'Submitted work'}</h2></div><button className="modal-close" onClick={() => setReviewSubmission(null)}>×</button></div><p className="modal-copy">Submitted by {reviewSubmission.user_id?.name || 'employee'} on {new Date(reviewSubmission.date).toLocaleDateString()}.</p>{reviewSubmission.github_link && <a className="review-link" href={reviewSubmission.github_link} target="_blank" rel="noreferrer">Open GitHub repository ↗</a>}<label className="review-message-label">Feedback for employee<textarea value={reviewMessage} onChange={(event) => setReviewMessage(event.target.value)} placeholder="Explain what is strong or what needs changing..." /></label><div className="modal-actions"><button className="dashboard-button danger-button" onClick={() => reviewWork('changes_requested')}>Request changes</button><button className="dashboard-button" onClick={() => reviewWork('approved')}>Approve work ↗</button></div></div></div>}
    </main>
  );
}

export default AdminDashboard;
