const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { sendNotificationToEmployees, viewMyNotifications, markAsRead } = require('../controllers/notificationController');

router.post('/send', protect, adminOnly, sendNotificationToEmployees);
router.get('/my-notifications', protect, viewMyNotifications);
router.patch('/:id/read', protect, markAsRead);

module.exports = router;