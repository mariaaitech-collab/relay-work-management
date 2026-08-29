import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heroBg from '../assets/hero_bg.jpg';
import logoImg from '../assets/relay_logo.png';
import api from '../api/axiosConfig';

const partnerMarks = ['NORTHSTAR', 'KINETIC', 'ATLAS LABS', 'MOTION', 'FIELDNOTE', 'ORBITAL'];

const features = [
  {
    eyebrow: 'Attendance',
    title: 'A clear signal on every workday.',
    detail: 'One-click check-ins create a reliable rhythm for teams without turning the day into paperwork.',
    className: 'bento-wide',
    visual: (
      <div className="bento-attendance" aria-hidden="true">
        <div className="attendance-grid">
          <div className="attendance-cell on"><span>M</span></div>
          <div className="attendance-cell on"><span>T</span></div>
          <div className="attendance-cell on"><span>W</span></div>
          <div className="attendance-cell on"><span>T</span></div>
          <div className="attendance-cell on"><span>F</span></div>
          <div className="attendance-cell"><span>S</span></div>
          <div className="attendance-cell"><span>S</span></div>
        </div>
      </div>
    )
  },
  {
    eyebrow: 'Proof of work',
    title: 'Evidence where decisions happen.',
    detail: 'Pair screenshots with GitHub repositories so progress is visible, contextual, and easy to review.',
    className: 'bento-tall',
    visual: <div className="bento-file"><span className="file-dot" /><span>release-notes.md</span><b>verified</b></div>
  },
  {
    eyebrow: 'Performance',
    title: 'Scores with a trail behind them.',
    detail: 'Transparent score history gives managers a useful signal without hiding the reasoning.',
    className: 'bento-score',
    visual: <div className="bento-score-number">94<span>%</span><small>team average</small></div>
  },
  {
    eyebrow: 'Signals',
    title: 'See what needs attention.',
    detail: 'Live notifications and at-risk signals keep the next conversation obvious.',
    className: 'bento-alert',
    visual: <div className="bento-signal"><span /><span /><span /><span /><span /></div>
  }
];

function LandingPage() {
  const navigate = useNavigate();
  const pageRef = useRef(null);

  const [lead, setLead] = useState({ name: '', email: '', company: '' });
  const [leadMsg, setLeadMsg] = useState('');
  const [leadError, setLeadError] = useState(false);
  const [leadSending, setLeadSending] = useState(false);

  const submitLead = async (event) => {
    event.preventDefault();
    setLeadSending(true);
    setLeadMsg('');
    setLeadError(false);
    try {
      const res = await api.post('/leads', { ...lead, source: 'website' });
      setLeadMsg(res.data.message || 'Thanks! Our team will reach out shortly.');
      setLead({ name: '', email: '', company: '' });
    } catch (err) {
      setLeadError(true);
      setLeadMsg(err.response?.data?.message || 'We couldn’t send your request. Please try again later.');
    } finally {
      setLeadSending(false);
    }
  };

  useEffect(() => {
    const targets = pageRef.current?.querySelectorAll('[data-reveal]');
    if (!targets?.length) return;
    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="saas-page" ref={pageRef}>
      <header className="saas-nav">
        <button className="brand-lockup" onClick={() => navigate('/')} aria-label="Relay home">
          <img src={logoImg} alt="" />
          <span>Relay <em>OS</em></span>
        </button>
        <nav className="saas-links" aria-label="Main navigation">
          <a href="#product">Product</a>
          <a href="#workflow">Workflow</a>
          <a href="#intelligence">Intelligence</a>
        </nav>
        <div className="saas-nav-actions">
          <button className="nav-signin" onClick={() => navigate('/login')}>Admin sign in</button>
          <button className="button button-small" onClick={() => navigate('/login')}>Open admin workspace <span>↗</span></button>
        </div>
      </header>

      <main>
        <section className="hero-section" id="product" style={{ '--hero-image': `url(${heroBg})` }}>
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> Workforce operations, without the fog</p>
            <h1>The signal behind<br /><span>better work.</span></h1>
            <p className="hero-lede">Relay brings attendance, proof of work, and performance signals into one calm operating layer for modern teams.</p>
            <div className="hero-actions">
              <button className="button" onClick={() => navigate('/login')}>Explore the workspace <span>↗</span></button>
              <a className="text-link" href="#workflow">See how it works <span>↓</span></a>
            </div>
            <div className="hero-meta"><span><b>●</b> Live team signals</span><span><b>↗</b> Role-aware access</span></div>
          </div>

          <div className="hero-console" aria-label="Relay product preview">
            <div className="console-top"><div className="console-brand"><img src={logoImg} alt="" /> Relay</div><span className="console-status"><i /> synced just now</span></div>
            <div className="console-body">
              <aside className="console-sidebar"><span className="console-label">Workspace</span><b className="console-active">◈ Overview</b><span>◌ Attendance</span><span>⌁ Work proof</span><span>◫ Performance</span><span>◉ Alerts <small>3</small></span><div className="console-sidebar-rule" /><span>⚙ Settings</span></aside>
              <div className="console-content">
                <div className="console-heading"><div><span className="console-kicker">Tuesday, 21 August</span><h2>Team signal</h2></div><span className="console-avatar">SA</span></div>
                <div className="console-stats"><div><small>TEAM SCORE</small><strong>94.2<span>%</span></strong><em>↑ 4.8% this month</em></div><div><small>CHECK-INS</small><strong>68<span>/72</span></strong><em>94% logged today</em></div><div><small>WORK PROOF</small><strong>87<span>%</span></strong><em>verified this week</em></div></div>
                <div className="console-chart"><div className="chart-header"><span>Performance trend</span><small>Last 7 days ↗</small></div><div className="chart-lines"><i /><i /><i /><i /><i /><i /><i /><div className="chart-path" /></div><div className="chart-days"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="mark-strip" aria-label="Teams using Relay">
          <span className="mark-intro">Built for teams that<br />care about the details</span>
          <div className="mark-window"><div className="mark-track">{[...partnerMarks, ...partnerMarks].map((mark, index) => <span key={`${mark}-${index}`}><i />{mark}</span>)}</div></div>
        </section>

        <section className="bento-section" id="workflow">
          <div className="section-heading" data-reveal><p className="eyebrow">One operating picture</p><h2>Less admin. More<br /><span>useful momentum.</span></h2><p>Every part of the workday connects, so people can spend less time reporting and more time moving the work forward.</p></div>
          <div className="bento-grid">{features.map((feature, index) => <article className={`bento-card ${feature.className}`} key={feature.title} data-reveal style={{ transitionDelay: `${index * 90}ms` }}><div><p className="card-eyebrow">{feature.eyebrow}</p><h3>{feature.title}</h3><p>{feature.detail}</p></div>{feature.visual}</article>)}</div>
        </section>

        <section className="included-section" data-reveal>
          <div className="included-head"><p className="eyebrow">Everything in one place</p><h2>And the day-to-day<br /><span>that keeps it moving.</span></h2></div>
          <div className="included-grid">
            <div className="included-item"><span className="included-num">01</span><span className="included-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8.5 12.5l2.2 2.2 4.3-4.6" /></svg></span><div><b>Tasks</b><p>Assign, track, and close work across the team without leaving the workspace.</p></div></div>
            <div className="included-item"><span className="included-num">02</span><span className="included-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H10l-4 3v-3H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" /></svg></span><div><b>Team queries</b><p>A shared space for questions and answers, so context stays where the work is.</p></div></div>
            <div className="included-item"><span className="included-num">03</span><span className="included-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg></span><div><b>Announcements</b><p>Keep everyone aligned with company updates pushed to the whole team.</p></div></div>
          </div>
        </section>

        <section className="glass-section" id="intelligence">
          <div className="glass-intro" data-reveal><p className="eyebrow">Clarity at a glance</p><h2>The work is complex.<br /><span>The view should not be.</span></h2><p>A focused layer for managers to spot patterns, understand context, and act before small gaps become expensive ones.</p><button className="text-link" onClick={() => navigate('/login')}>View the live dashboard <span>↗</span></button></div>
          <div className="glass-dashboard" data-reveal><div className="glass-dashboard-top"><span>Team intelligence</span><span className="glass-period">This month⌄</span></div><div className="glass-main-metric"><small>AVERAGE PERFORMANCE</small><strong>94.2%</strong><span><i /> +8.4% compared with last month</span></div><div className="glass-bars"><span style={{ height: '42%' }} /><span style={{ height: '57%' }} /><span style={{ height: '49%' }} /><span style={{ height: '72%' }} /><span style={{ height: '66%' }} /><span style={{ height: '88%' }} /><span style={{ height: '78%' }} /><span style={{ height: '96%' }} /><span style={{ height: '84%' }} /></div><div className="glass-bottom"><div><small>WORK PROOFS</small><b>1,284</b></div><div><small>ON TRACK</small><b>91%</b></div><div><small>OPEN SIGNALS</small><b className="signal-count">03</b></div></div></div>
        </section>

        <section className="final-cta" data-reveal><p className="eyebrow">Make the work visible</p><h2>A better signal for<br /><span>every team.</span></h2><p>Admins can open the workspace and start managing their team in minutes.</p><button className="button" onClick={() => navigate('/login')}>Open admin workspace <span>↗</span></button><p className="final-cta-signin">Team member? <button className="text-link" onClick={() => navigate('/employee-login')}>Employee sign in <span>↗</span></button></p></section>
        <section className="lead-capture" id="start" data-reveal>
          <div className="lead-capture-inner">
            <p className="eyebrow">Get started</p>
            <h2>Turn attendance into<br /><span>accountability.</span></h2>
            <p className="lead-capture-copy">Start a free trial in minutes, or book a guided demo with our team to see Relay OS running on your own workflow.</p>
            <form className="lead-form" onSubmit={submitLead}>
              <div className="lead-form-grid">
                <label>Full name
                  <input type="text" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} placeholder="Jordan Avery" required />
                </label>
                <label>Work email
                  <input type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} placeholder="you@company.com" required />
                </label>
                <label>Company
                  <input type="text" value={lead.company} onChange={(e) => setLead({ ...lead, company: e.target.value })} placeholder="Acme Inc." />
                </label>
                <button className="button" type="submit" disabled={leadSending}>{leadSending ? 'Sending...' : 'Book a Demo'}</button>
              </div>
              {leadMsg && <p className={`lead-form-feedback ${leadError ? 'error' : 'success'}`}>{leadMsg}</p>}
            </form>
            <div className="lead-capture-actions">
              <button className="button button-outline" onClick={() => navigate('/login')}>Open admin workspace <span>↗</span></button>
            </div>
            <ul className="lead-capture-trust">
              <li>No credit card required</li>
              <li>14-day free trial</li>
              <li>Cancel anytime</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="saas-footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <div className="brand-lockup"><img src={logoImg} alt="" /><span>Relay <em>OS</em></span></div>
            <p>Workforce performance, with context.</p>
            <span className="footer-status"><i /> Built for focused teams</span>
          </div>
          <div className="footer-links-group">
            <div><b>Explore</b><a href="#product">Product</a><a href="#workflow">Workflow</a><a href="#intelligence">Intelligence</a></div>
            <div><b>Workspace</b><button onClick={() => navigate('/login')}>Admin sign in</button><button onClick={() => navigate('/employee-login')}>Employee sign in</button></div>
            <div><b>Relay</b><a href="mailto:hello@relay.example">Contact us</a><a href="#product">About the platform</a></div>
          </div>
        </div>
        <div className="footer-bottom"><span>© 2026 Relay OS. All rights reserved.</span><span>Built for better workdays.</span></div>
      </footer>
    </div>
  );
}

export default LandingPage;
