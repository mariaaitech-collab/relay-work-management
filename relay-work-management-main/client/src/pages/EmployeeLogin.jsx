import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';
import logoImg from '../assets/relay_logo.png';

function EmployeeLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.user.role !== 'employee') {
        setError('This portal is for employee accounts only. Admins, please use the admin sign-in.');
        setLoading(false);
        return;
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-left" />
      <div className="auth-glow auth-glow-right" />

      <section className="auth-aside">
        <button className="auth-brand" onClick={() => navigate('/')} aria-label="Back to Relay home">
          <img src={logoImg} alt="" />
          <span>Relay <em>OS</em></span>
        </button>
        <div className="auth-aside-copy">
          <p className="eyebrow"><span className="eyebrow-dot" /> Employee workspace</p>
          <h1>Your day,<br /><span>in one place.</span></h1>
          <p>Mark attendance, submit your proof of work, and track your performance with full transparency.</p>
        </div>
        <div className="auth-aside-footer"><span><b>01</b> Attendance</span><span><b>02</b> Work proof</span><span><b>03</b> Performance</span></div>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand"><img src={logoImg} alt="" /><span>Relay <em>OS</em></span></div>
          <p className="auth-kicker">Employee portal</p>
          <h2>Welcome back.</h2>
          <p className="auth-subtitle">Sign in with the credentials provided by your administrator.</p>

          {error && <div className="auth-error" role="alert"><span>!</span>{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <label>Email address<input type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label>
            <label>Password<div className="auth-password"><input type="password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /><span>•••</span></div></label>
            <div className="auth-form-row"><span>Provided by your admin</span><Link to="/forgot-password">Forgot password?</Link></div>
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Connecting...' : 'Enter workspace'}<span>↗</span></button>
          </form>

          <p className="auth-signup">Are you an administrator? <Link to="/login">Admin sign in ↗</Link></p>
        </div>
      </section>
    </main>
  );
}

export default EmployeeLogin;
