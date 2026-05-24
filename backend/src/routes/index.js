const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./users.routes'));
router.use('/clubs', require('./clubs.routes'));
router.use('/club-dashboard', require('./club-dashboard.routes'));
router.use('/teacher-dashboard', require('./teacher-dashboard.routes'));
router.use('/student', require('./student.routes'));
router.use('/projets', require('./projects.routes'));
router.use('/projects', require('./projects.routes'));
router.use('/project-tasks', require('./project-tasks.routes'));
router.use('/project-participation-requests', require('./project-participation-requests.routes'));
router.use('/news', require('./news.routes'));
router.use('/activities', require('./news.routes'));
router.use('/competences', require('./competences.routes'));
router.use('/events', require('./events.routes'));
router.use('/stats', require('./stats.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/notifications', require('./notifications.routes'));

module.exports = router;
