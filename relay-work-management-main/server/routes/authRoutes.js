const express = require('express');
const router = express.Router();
const { login, forgotPassword, resetPassword } = require('../controllers/authController');
const { loginValidation } = require('../middleware/validators');

// NOTE: Employee accounts are invite-only. The Admin creates them from the
// Admin Dashboard, so there is no public self-registration endpoint here.
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;