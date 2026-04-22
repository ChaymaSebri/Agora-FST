const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const {
  authenticate,
} = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
