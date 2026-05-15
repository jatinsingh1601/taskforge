const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const { register, login, getMe, updateMe } = require('../controllers/authController');

router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.get('/me', auth, getMe);
router.put('/me', auth, updateMe);

module.exports = router;
