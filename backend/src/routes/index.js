const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/clubs', require('./clubs.routes'));
router.use('/projects', require('./projects.routes'));
router.use('/events', require('./events.routes'));
router.use('/stats', require('./stats.routes'));

module.exports = router;
