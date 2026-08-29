const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  listEmployees,
  viewEmployee,
  addEmployee,
  editEmployee,
  removeEmployee,
  overrideScore
} = require('../controllers/adminController');
const { getDepartments } = require('../models/adminModel');
const { createTask, listTasks, updateTask, listActivity } = require('../controllers/taskController');
const { listSubmissions, reviewSubmission } = require('../controllers/reviewController');
const {
  adminAttendanceToday,
  getWindowSetting,
  updateWindowSetting
} = require('../controllers/attendanceController');

router.get('/employees', protect, adminOnly, listEmployees);
router.get('/departments', protect, adminOnly, async (req, res) => res.json(await getDepartments()));
router.get('/employees/:id', protect, adminOnly, viewEmployee);
router.post('/employees', protect, adminOnly, addEmployee);
router.put('/employees/:id', protect, adminOnly, editEmployee);
router.delete('/employees/:id', protect, adminOnly, removeEmployee);
router.put('/employees/:id/score', protect, adminOnly, overrideScore);
router.get('/tasks', protect, adminOnly, listTasks);
router.post('/tasks', protect, adminOnly, createTask);
router.put('/tasks/:id', protect, adminOnly, updateTask);
router.get('/activity', protect, adminOnly, listActivity);
router.get('/submissions', protect, adminOnly, listSubmissions);
router.put('/submissions/:id/review', protect, adminOnly, reviewSubmission);
router.get('/attendance/today', protect, adminOnly, adminAttendanceToday);
router.get('/attendance/settings', protect, adminOnly, getWindowSetting);
router.put('/attendance/settings', protect, adminOnly, updateWindowSetting);

module.exports = router;