const express = require('express');
const router = express.Router();
// const { register, login, getMe } = require('../controllers/authController');
// const { protect } = require('../middleware/auth');

// Routes will be implemented with controllers
// router.post('/register', register);
// router.post('/login', login);
// router.get('/me', protect, getMe);

// Placeholder routes
router.post('/register', (req, res) => {
  res.json({ message: 'Register route - to be implemented' });
});

router.post('/login', (req, res) => {
  res.json({ message: 'Login route - to be implemented' });
});

module.exports = router;
