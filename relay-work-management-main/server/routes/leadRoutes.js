const express = require('express');
const router = express.Router();
const { captureLead } = require('../controllers/leadController');

// Public, unauthenticated lead capture endpoint.
router.post('/', captureLead);

module.exports = router;
