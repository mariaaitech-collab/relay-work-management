const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|jpg|png)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG or PNG screenshots are allowed'));
  }
});

const { protect } = require('../middleware/authMiddleware');
const {
  getMyProfile,
  submitWork,
  myHistory,
  markMyAttendance,
  myAttendanceHistory,
  startTask,
  getTeam
} = require('../controllers/employeeController');
const { listAssignedTasks } = require('../controllers/taskController');
const {
  employeeAttendanceToday,
  employeeMarkPresent,
  employeeAttendanceHistory
} = require('../controllers/attendanceController');

router.get('/profile', protect, getMyProfile);
router.get('/tasks', protect, listAssignedTasks);
router.patch('/tasks/:id/start', protect, startTask);
router.get('/team', protect, getTeam);
router.post('/submit-work', protect, upload.single('screenshot'), submitWork);
router.get('/history', protect, myHistory);
router.post('/mark-attendance', protect, employeeMarkPresent);
router.get('/attendance-history', protect, employeeAttendanceHistory);
router.get('/attendance/today', protect, employeeAttendanceToday);
router.post('/attendance/mark', protect, employeeMarkPresent);
router.get('/attendance/history', protect, employeeAttendanceHistory);

module.exports = router;