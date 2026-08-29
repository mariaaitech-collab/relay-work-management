const { getAllEmployees, hasSubmittedOnDate, updateScore, logScoreChange } = require('../models/scoreModel');
const { User } = require('../models/userModel');
const { createWorkflowNotification } = require('../models/notificationModel');

const PENALTY = 2; // percentage deducted each day without a work submission

const getSystemSender = async () => {
  const admin = await User.findOne({ role: 'admin' }).select('_id');
  return admin ? admin._id : null;
};

// Automated daily performance percentage & penalty system.
const runDailyScoreCheck = async () => {
  console.log('Running daily score check...');

  // Evaluate yesterday's submission (a day closes, then we score it).
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDate = yesterday.toISOString().split('T')[0];

  const employees = await getAllEmployees();
  const admins = await User.find({ role: 'admin' }).select('_id');
  const adminIds = admins.map((a) => a._id);
  const senderId = adminIds[0] || null;

  for (const employee of employees) {
    // Blocked employees are held for manual admin review.
    if (employee.status === 'blocked') continue;

    const submitted = await hasSubmittedOnDate(employee.id, yesterdayDate);
    const oldScore = employee.performance_score;

    if (submitted) {
      // Work was submitted: performance is maintained at 100%.
      if (oldScore !== 100 || employee.status !== 'active') {
        await updateScore(employee.id, 100, 'active');
        await logScoreChange(employee.id, oldScore, 100, 'Daily work submitted – performance maintained at 100%', 'system');
        console.log(`${employee.name}: ${oldScore}% -> 100% (active)`);
      }
      continue;
    }

    // No submission: apply the daily penalty.
    let newScore = oldScore - PENALTY;
    if (newScore < 0) newScore = 0;

    let newStatus = 'active';
    if (newScore <= 30) newStatus = 'blocked';
    else if (newScore <= 60) newStatus = 'warning';

    await updateScore(employee.id, newScore, newStatus);
    await logScoreChange(employee.id, oldScore, newScore, `Missed daily work submission (-${PENALTY}%)`, 'system');
    console.log(`${employee.name}: ${oldScore}% -> ${newScore}% (${newStatus})`);

    // One-time threshold warnings (sent only when crossing the boundary).
    if (senderId) {
      if (newScore <= 60 && oldScore > 60 && newStatus === 'warning') {
        await createWorkflowNotification(senderId, [employee.id, ...adminIds], 'Warning: Employee performance is weak (60%). Immediate improvement required.', 'notifications');
      }
      if (newScore <= 50 && oldScore > 50) {
        await createWorkflowNotification(senderId, [employee.id], 'Critical Alert: Your progress has dropped to 50%. Submit your work immediately to recover your performance score.', 'notifications');
      }
    }
  }

  console.log('Daily score check completed.');
};

// Manual trigger for testing (Thunder Client / curl).
const testScoreCheck = async (req, res) => {
  try {
    await runDailyScoreCheck();
    res.status(200).json({ message: 'Score check completed. Check server logs and database.' });
  } catch (error) {
    res.status(500).json({ message: 'Error running score check', error: 'Internal server error' });
  }
};

module.exports = { runDailyScoreCheck, testScoreCheck };
