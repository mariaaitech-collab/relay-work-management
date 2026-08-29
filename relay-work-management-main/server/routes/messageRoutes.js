const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { listContacts, listMessages, sendMessage } = require('../controllers/messageController');

router.get('/contacts', protect, listContacts);
router.get('/:contactId', protect, listMessages);
router.post('/', protect, sendMessage);

module.exports = router;
