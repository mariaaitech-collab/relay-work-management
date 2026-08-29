const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { testScoreCheck } = require('../controllers/scoreController');

// Sirf Admin hi ye manual test chala sake
router.post('/run-score-check', protect, adminOnly, testScoreCheck);

module.exports = router;