const router = require('express').Router();
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', authenticate, usersController.listUsers);
router.get('/me', authenticate, usersController.getMyProfile);
router.patch('/me', authenticate, usersController.updateMyProfile);

module.exports = router;
