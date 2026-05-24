const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const controller = require('../controllers/project-participation-requests.controller');

router.use(authenticate);

router.post('/', controller.createRequest);
router.get('/me', controller.getMyRequests);
router.get('/project/:projectId', controller.getProjectRequests);
router.patch('/:id/accept', controller.acceptRequest);
router.patch('/:id/reject', controller.rejectRequest);
router.patch('/:id/cancel', controller.cancelRequest);

module.exports = router;
