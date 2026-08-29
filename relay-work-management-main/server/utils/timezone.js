// Centralized timezone handling for the attendance window.
//
// The company operates in Asia/Karachi (PKT, UTC+5, no DST). Every window
// open/close comparison and the business-day "today" string are evaluated in
// this canonical timezone so the server's own locale/timezone can never cause
// the window to open late or close early for users.
//
// We deliberately use dayjs with the IANA timezone database (via the timezone
// plugin) rather than naive Date math, so offset handling is robust and the
// zone is explicit rather than implicit.

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const COMPANY_TZ = 'Asia/Karachi';

// Current wall-clock time in the company timezone as a dayjs object.
const nowInCompanyTz = () => dayjs().tz(COMPANY_TZ);

// Business-day date string (YYYY-MM-DD) in the company timezone.
const todayStr = () => nowInCompanyTz().format('YYYY-MM-DD');

// Build a dayjs in the company tz for today at the given "HH:MM" string.
const atWindowTime = (base, hhmm) => {
  const [h, m] = String(hhmm).split(':').map((n) => Number(n) || 0);
  return base.hour(h).minute(m).second(0).millisecond(0);
};

// True only while the current company-tz time is inside [start, end] (inclusive).
const isWithinWindow = (window) => {
  if (!window || !window.start || !window.end) return false;
  const now = nowInCompanyTz();
  const start = atWindowTime(now, window.start);
  const end = atWindowTime(now, window.end);
  return (now.isSame(start) || now.isAfter(start)) && (now.isSame(end) || now.isBefore(end));
};

// True once the company-tz time has passed the window end.
const isPastWindow = (window) => {
  if (!window || !window.end) return false;
  const now = nowInCompanyTz();
  const end = atWindowTime(now, window.end);
  return now.isAfter(end);
};

module.exports = { COMPANY_TZ, nowInCompanyTz, todayStr, isWithinWindow, isPastWindow };
