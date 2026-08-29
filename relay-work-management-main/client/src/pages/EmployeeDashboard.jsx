import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import logoImg from '../assets/relay_logo.png';
import MessageCenter from '../components/MessageCenter';
import ThemeToggle from '../components/ThemeToggle';
import EmployeeAttendance from './EmployeeAttendance';

const navItems = [
  ['home', '⌂', 'Home'],
  ['tasks', '✓', 'My tasks'],
  ['attendance', '◷', 'Attendance'],
  ['calendar', '▦', 'Calendar'],
  ['announcements', '▱', 'Announcements'],
  ['team', '♙', 'My team'],
  ['notifications', '◉', 'Notifications']
];
const taskTabs = ['all', 'assigned', 'in_progress', 'submitted', 'completed'];

const dayKey = (value) => new Date(value).toISOString().split('T')[0];
const displayStatus = (status) => status === 'in_progress' ? 'In progress' : status.charAt(0).toUpperCase() + status.slice(1);

function EmployeeDashboard() {
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [workHistory, setWorkHistory] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [team, setTeam] = useState([]);
  const [activeNav, setActiveNav] = useState('home');
  const [taskTab, setTaskTab] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const loadWorkspace = async () => {
    setLoading(true);
    setError('');
    try {
      const [profileRes, taskRes, workRes, attendanceRes, notificationRes, teamRes] = await Promise.all([
        api.get('/employee/profile'), api.get('/employee/tasks'), api.get('/employee/history'),
        api.get('/employee/attendance-history'), api.get('/notifications/my-notifications'), api.get('/employee/team')
      ]);
      setProfile(profileRes.data);
      setTasks(taskRes.data);
      setWorkHistory(workRes.data);
      setAttendanceHistory(attendanceRes.data);
      setNotifications(notificationRes.data);
      setTeam(teamRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Workspace data could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { queueMicrotask(loadWorkspace); }, []);

  const today = dayKey(new Date());
  const activeTasks = tasks.filter((task) => !['completed', 'cancelled'].includes(task.status));
  const completedTasks = tasks.filter((task) => task.status === 'completed');
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress');
  const dueSoonCutoff = new Date();
  dueSoonCutoff.setDate(dueSoonCutoff.getDate() + 2);
  const dueSoonTasks = activeTasks.filter((task) => task.due_date && dayKey(task.due_date) <= dayKey(dueSoonCutoff));
  const filteredTasks = taskTab === 'all' ? tasks : tasks.filter((task) => task.status === taskTab || (taskTab === 'assigned' && task.status === 'open'));
  const unreadNotifications = notifications.filter((notification) => !notification.read_at);
  const completionRate = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const setSection = (section) => {
    setActiveNav(section);
    setSelectedTask(null);
  };

  const startTask = async (task) => {
    try {
      await api.patch(`/employee/tasks/${task.id || task._id}/start`);
      setFeedback(`Started task: ${task.title}`);
      setSelectedTask(null);
      loadWorkspace();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Task could not be started.');
    }
  };

  const openSubmit = (task = null) => {
    setSelectedTaskId(task?.id || task?._id || '');
    setSelectedTask(null);
    setShowSubmit(true);
  };

  const submitWork = async (event) => {
    event.preventDefault();
    if (!selectedTaskId) return setFeedback('Choose a task before submitting work.');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('taskId', selectedTaskId);
      if (githubLink) formData.append('githubLink', githubLink);
      if (screenshotFile) formData.append('screenshot', screenshotFile);
      await api.post('/employee/submit-work', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setGithubLink(''); setScreenshotFile(null); setSelectedTaskId(''); setShowSubmit(false);
      setFeedback('Work submitted for review.');
      loadWorkspace();
    } catch (err) {
      setFeedback(err.response?.data?.message || 'Work could not be submitted.');
    } finally { setSubmitting(false); }
  };

  const openNotification = async (notification) => {
    const id = notification.id || notification._id;
    if (!notification.read_at) {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((items) => items.map((item) => (item.id === id || item._id === id) ? { ...item, read_at: new Date().toISOString() } : item));
    }
    setSection(notification.source || 'notifications');
  };

  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };
  const upcomingTasks = useMemo(() => [...activeTasks].sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999')).slice(0, 4), [activeTasks]);

  if (loading) return <div className="dashboard-loading"><span /> Loading your workspace</div>;
  if (!profile) return <div className="dashboard-loading"><p>{error || 'Unable to load workspace.'}</p><button className="dashboard-button" onClick={loadWorkspace}>Try again</button></div>;

  return <main className="dashboard-shell employee-workspace">
    <aside className="dashboard-sidebar">
      <div><button className="dashboard-brand" onClick={() => navigate('/')}><img src={logoImg} alt="" /><span>Relay <em>OS</em></span></button><p className="dashboard-nav-label">Workspace</p><nav className="dashboard-nav">{navItems.map(([id, icon, label]) => <button key={id} className={activeNav === id ? 'active' : ''} onClick={() => setSection(id)}><span>{icon}</span>{label}{id === 'notifications' && unreadNotifications.length > 0 && <small>{unreadNotifications.length}</small>}</button>)}</nav><p className="dashboard-nav-label">Communication</p><nav className="dashboard-nav"><button className={activeNav === 'queries' ? 'active' : ''} onClick={() => setSection('queries')}><span>◌</span>Queries</button></nav></div>
      <div className="dashboard-profile-wrap"><ThemeToggle /><button className="dashboard-profile" onClick={() => setSection('profile')}><span className="dashboard-avatar">{profile.name.charAt(0)}</span><span><b>{profile.name}</b><small>{profile.job_role || 'Employee'}</small></span><strong>↗</strong></button><button className="employee-logout" onClick={logout}>Sign out</button></div>
    </aside>

    <section className="dashboard-main">
      <header className="dashboard-header"><div><p className="dashboard-kicker">My workspace / {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p><h1>{activeNav === 'home' ? <>Good morning, <span>{profile.name.split(' ')[0]}.</span></> : navItems.find(([id]) => id === activeNav)?.[2] || 'My profile'}</h1></div><div className="dashboard-header-actions"><button className="dashboard-icon-button" onClick={() => setSection('notifications')} aria-label="Open notifications">◉{unreadNotifications.length > 0 && <small>{unreadNotifications.length}</small>}</button><button className="dashboard-button" onClick={() => openSubmit()} disabled={activeTasks.length === 0}>Submit work <span>↗</span></button></div></header>
      {feedback && <div className="dashboard-feedback">{feedback}<button onClick={() => setFeedback('')}>×</button></div>}
      {error && <div className="dashboard-feedback dashboard-feedback-error">{error}<button onClick={loadWorkspace}>Retry</button></div>}

      {activeNav === 'home' && <><p className="workspace-lede">Here is what is on your plate today.</p><div className="employee-stat-grid"><article><small>ASSIGNED</small><strong>{activeTasks.length}</strong><span>Open tasks</span></article><article><small>IN PROGRESS</small><strong>{inProgressTasks.length}</strong><span>Currently working</span></article><article><small>COMPLETED</small><strong>{completedTasks.length}</strong><span>{completionRate}% completion rate</span></article><article><small>DUE SOON</small><strong>{dueSoonTasks.length}</strong><span>Next 48 hours</span></article></div><div className="employee-home-grid"><section className="dashboard-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Focus list</p><h2>Today's tasks</h2></div><button className="text-action" onClick={() => setSection('tasks')}>View all ↗</button></div><div className="task-list">{upcomingTasks.length ? upcomingTasks.map((task) => <button className="employee-task-row" key={task.id || task._id} onClick={() => setSelectedTask(task)}><span className={`priority-dot ${task.priority || 'medium'}`} /><span><b>{task.title}</b><small>{profile.job_role || 'Workspace'} · {task.priority || 'Medium'} priority</small></span><span className="task-due">{task.due_date ? (dayKey(task.due_date) === today ? 'Due today' : `Due ${new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`) : 'No deadline'}</span><strong>Open →</strong></button>) : <p className="dashboard-empty">You have no open tasks.</p>}</div></section><section className="dashboard-panel employee-progress-panel"><p className="dashboard-kicker">Your progress</p><h2>This week</h2><div className="progress-ring"><strong>{completionRate}%</strong><span>completion</span></div><div className="status-list"><span><i className="done" /> Attendance <b>{attendanceHistory.length} days</b></span><span><i className={completedTasks.length ? 'done' : ''} /> Work proof <b>{workHistory.length} submitted</b></span></div></section></div><div className="employee-home-grid lower"><section className="dashboard-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Latest</p><h2>Announcements</h2></div><button className="text-action" onClick={() => setSection('announcements')}>Open ↗</button></div>{notifications.filter((notification) => notification.source === 'notifications').slice(0, 2).map((notification) => <button className="announcement-row" onClick={() => openNotification(notification)} key={notification.id || notification._id}><b>◉ {notification.message}</b><small>{new Date(notification.created_at || notification.createdAt).toLocaleString()}</small></button>)}{notifications.filter((notification) => notification.source === 'notifications').length === 0 && <p className="dashboard-empty">No new announcements.</p>}</section><section className="dashboard-panel"><p className="dashboard-kicker">Upcoming</p><h2>Deadlines</h2>{upcomingTasks.slice(0, 3).map((task) => <div className="deadline-row" key={task.id || task._id}><span className={`priority-dot ${task.priority || 'medium'}`} /><span>{task.title}</span><small>{task.due_date || 'No date'}</small></div>)}</section></div></>}

      {activeNav === 'tasks' && <section className="dashboard-panel dashboard-section-panel employee-tasks-section"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">My workspace / Task list</p><h2>My tasks</h2></div><button className="dashboard-button" onClick={() => openSubmit()} disabled={activeTasks.length === 0}>Submit proof <span>↗</span></button></div><div className="task-tabs">{taskTabs.map((tab) => <button className={taskTab === tab ? 'active' : ''} onClick={() => setTaskTab(tab)} key={tab}>{tab === 'in_progress' ? 'In progress' : tab.charAt(0).toUpperCase() + tab.slice(1)}</button>)}</div><div className="task-card-list">{filteredTasks.length ? filteredTasks.map((task) => <article className="employee-task-card" key={task.id || task._id} onClick={() => setSelectedTask(task)}><div className="task-card-top"><span className={`priority-label ${task.priority || 'medium'}`}>{task.priority || 'medium'} priority</span><span className={`status-chip ${task.status}`}>{displayStatus(task.status)}</span></div><h3>{task.title}</h3><p>{task.description || 'No description provided.'}</p><div className="task-card-meta"><span>Assigned {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'recently'}</span><span>{task.due_date ? `Due ${new Date(task.due_date).toLocaleDateString()}` : 'No deadline'}</span><strong>Open task →</strong></div></article>) : <p className="dashboard-empty">No tasks in this view.</p>}</div></section>}

      {activeNav === 'calendar' && <section className="dashboard-panel dashboard-section-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">My workspace / Calendar</p><h2>Task deadlines</h2></div><span className="dashboard-pill">August 2026</span></div><div className="employee-calendar">{Array.from({ length: 31 }, (_, index) => { const date = `2026-08-${String(index + 1).padStart(2, '0')}`; const due = tasks.filter((task) => task.due_date === date); return <div className={due.length ? 'has-task' : ''} key={date}><small>{index + 1}</small>{due.map((task) => <span title={task.title} key={task.id || task._id} />)}</div>; })}</div><div className="calendar-deadlines">{tasks.filter((task) => task.due_date).sort((a, b) => a.due_date.localeCompare(b.due_date)).map((task) => <button onClick={() => setSelectedTask(task)} key={task.id || task._id}><span className={`priority-dot ${task.priority || 'medium'}`} /><b>{task.title}</b><small>{task.due_date}</small></button>)}</div></section>}

      {activeNav === 'announcements' && <section className="dashboard-panel dashboard-section-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">My workspace / Announcements</p><h2>Team announcements</h2></div><span className="dashboard-pill">{notifications.filter((notification) => notification.source === 'notifications' && !notification.read_at).length} unread</span></div><div className="announcement-list">{notifications.filter((notification) => notification.source === 'notifications').length ? notifications.filter((notification) => notification.source === 'notifications').map((notification) => <button onClick={() => openNotification(notification)} className={`announcement-card ${notification.read_at ? 'read' : 'unread'}`} key={notification.id || notification._id}><span className="list-icon">▱</span><span className="announcement-body"><b>{notification.message}</b><small>Admin · {new Date(notification.created_at || notification.createdAt).toLocaleString()} · {notification.read_at ? 'Read' : 'Unread'}</small></span>{!notification.read_at && <em className="new-tag">New</em>}</button>) : <p className="dashboard-empty">No announcements from your team yet.</p>}</div></section>}
      {activeNav === 'team' && <section className="dashboard-panel dashboard-section-panel"><p className="dashboard-kicker">My workspace / People</p><h2>My team</h2><p className="section-description">People you can collaborate with. Performance details stay private to managers.</p><div className="team-grid">{team.map((member) => <article key={member.id || member._id}><span className="dashboard-avatar">{member.name.charAt(0)}</span><div><b>{member.name}</b><small>{member.job_role || 'Employee'}</small><em>{member.status}</em></div></article>)}</div></section>}
      {activeNav === 'notifications' && <section className="dashboard-panel dashboard-section-panel"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">My workspace / Inbox</p><h2>Notifications</h2></div><span className="dashboard-pill">{unreadNotifications.length} unread</span></div><div className="notification-list">{notifications.length ? notifications.map((notification) => <button className={notification.read_at ? 'read' : 'unread'} onClick={() => openNotification(notification)} key={notification.id || notification._id}><span className="list-icon">◉</span><span><b>{notification.message}</b><small>{new Date(notification.created_at || notification.createdAt).toLocaleString()} · {notification.read_at ? 'Read' : 'Unread'}</small></span><strong>→</strong></button>) : <p className="dashboard-empty">Your inbox is clear.</p>}</div></section>}
      {activeNav === 'queries' && <MessageCenter />}
      {activeNav === 'attendance' && <EmployeeAttendance />}
      {activeNav === 'profile' && <section className="dashboard-panel dashboard-section-panel profile-section"><p className="dashboard-kicker">My workspace / Account</p><h2>{profile.name}</h2><div className="profile-hero"><span className="profile-large-avatar">{profile.name.charAt(0)}</span><div><strong>{profile.job_role || 'Employee'}</strong><span>{profile.email}</span><small>Active workspace member</small></div></div><div className="profile-details"><div><small>ROLE</small><b>{profile.job_role || 'Employee'}</b></div><div><small>STATUS</small><b>{profile.status}</b></div><div><small>ATTENDANCE</small><b>{attendanceHistory.length} days</b></div></div><button className="dashboard-button" onClick={logout}>Sign out of Relay</button></section>}
    </section>

    {selectedTask && <div className="dashboard-modal-backdrop"><div className="dashboard-modal task-detail-modal"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Task detail</p><h2>{selectedTask.title}</h2></div><button className="modal-close" onClick={() => setSelectedTask(null)}>×</button></div><div className="task-detail-badges"><span className={`priority-label ${selectedTask.priority || 'medium'}`}>{selectedTask.priority || 'medium'} priority</span><span className={`status-chip ${selectedTask.status}`}>{displayStatus(selectedTask.status)}</span></div><p className="task-detail-description">{selectedTask.description || 'No description provided.'}</p><div className="task-detail-grid"><div><small>DEADLINE</small><b>{selectedTask.due_date || 'No deadline'}</b></div><div><small>ASSIGNED BY</small><b>{selectedTask.created_by?.name || 'Admin'}</b></div><div><small>ASSIGNED</small><b>{selectedTask.created_at ? new Date(selectedTask.created_at).toLocaleDateString() : 'Recently'}</b></div></div><div className="modal-actions">{['assigned', 'open'].includes(selectedTask.status) && <button className="dashboard-button secondary-button" onClick={() => startTask(selectedTask)}>Start task</button>}{['assigned', 'open', 'in_progress'].includes(selectedTask.status) && <button className="dashboard-button" onClick={() => openSubmit(selectedTask)}>Submit for review ↗</button>}</div></div></div>}
    {showSubmit && <div className="dashboard-modal-backdrop"><div className="dashboard-modal"><div className="dashboard-panel-heading"><div><p className="dashboard-kicker">Work submission</p><h2>Submit for review</h2></div><button className="modal-close" onClick={() => setShowSubmit(false)}>×</button></div><form className="dashboard-modal-form" onSubmit={submitWork}><label>Task<select value={selectedTaskId} onChange={(event) => setSelectedTaskId(event.target.value)} required><option value="">Select a task</option>{activeTasks.filter((task) => ['assigned', 'open', 'in_progress'].includes(task.status)).map((task) => <option value={task.id || task._id} key={task.id || task._id}>{task.title}</option>)}</select></label><label>GitHub repository URL<input type="url" value={githubLink} onChange={(event) => setGithubLink(event.target.value)} placeholder="https://github.com/you/project" /></label><label>Screenshot<input type="file" accept="image/*" onChange={(event) => setScreenshotFile(event.target.files[0])} /></label><button className="dashboard-button" type="submit" disabled={submitting}>{submitting ? 'Uploading...' : 'Submit for review ↗'}</button></form></div></div>}
  </main>;
}

export default EmployeeDashboard;
