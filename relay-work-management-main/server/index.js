require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('./config/db');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const leadRoutes = require('./routes/leadRoutes');
const testRoutes = require('./routes/testRoutes');
const { runDailyScoreCheck } = require('./controllers/scoreController');

const { autoMarkAbsent, getWindow, todayStr, isPastWindow } = require('./controllers/attendanceController');
const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim());
app.use(
  helmet(),
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: false
  }),
  express.json({ limit: '1mb' })
);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later.' }
});
if (process.env.NODE_ENV === 'production') app.use(generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again later.' }
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/auth', process.env.NODE_ENV === 'production' ? authLimiter : (req, res, next) => next(), authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/leads', leadRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test', testRoutes);
}

// ---------------------------------------------------------------
// Technical SEO: dynamically generated robots.txt + sitemap.xml
// ---------------------------------------------------------------
const SITE_URL = (process.env.SITE_URL || 'https://relay.example.com').replace(/\/$/, '');
const SEO_ROUTES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0', lastmod: true }
];

app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(
    `User-agent: *\n` +
    `Allow: /\n` +
    `Disallow: /login\n` +
    `Disallow: /register\n` +
    `Disallow: /forgot-password\n` +
    `Disallow: /reset-password\n` +
    `Disallow: /dashboard\n` +
    `Disallow: /admin\n` +
    `Sitemap: ${SITE_URL}/sitemap.xml\n`
  );
});

app.get('/sitemap.xml', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const urls = SEO_ROUTES.map((r) =>
    `  <url>\n` +
    `    <loc>${SITE_URL}${r.loc}</loc>\n` +
    (r.lastmod ? `    <lastmod>${today}</lastmod>\n` : '') +
    `    <changefreq>${r.changefreq}</changefreq>\n` +
    `    <priority>${r.priority}</priority>\n` +
    `  </url>`
  ).join('\n');
  res.type('application/xml');
  res.send(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>`
  );
});

app.get('/api/cron/daily-score-check', async (req, res) => {
  const expected = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  await runDailyScoreCheck();
  res.status(200).json({ message: 'Daily score check completed' });
});

const PORT = process.env.PORT || 5000;

// Periodic job: once the daily attendance window closes, any employee without a
// record for today is automatically locked in as "absent". Runs every minute.
let lastAutoMarkDate = '';
try {
  const cron = require('node-cron');
  cron.schedule('* * * * *', async () => {
    try {
      const today = todayStr();
      if (lastAutoMarkDate === today) return;
      const window = await getWindow();
      if (isPastWindow(window)) {
        await autoMarkAbsent(today);
        lastAutoMarkDate = today;
      }
    } catch (err) {
      console.error('Attendance cron error:', err.message);
    }
  });
} catch (err) {
  console.error('Attendance cron could not start:', err.message);
}

// Periodic job: run the automated performance penalty / maintenance check daily.
try {
  const cron = require('node-cron');
  cron.schedule('0 0 * * *', async () => {
    try {
      await runDailyScoreCheck();
    } catch (err) {
      console.error('Score cron error:', err.message);
    }
  });
} catch (err) {
  console.error('Score cron could not start:', err.message);
}

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;