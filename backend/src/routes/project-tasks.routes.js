const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const projectTasksController = require('../controllers/project-tasks.controller');

router.use(authenticate);

router.post('/', projectTasksController.createTask);
router.post('/project/:projectId', projectTasksController.createTask);
router.get('/me', projectTasksController.getMyTasks);
router.get('/project/:projectId', projectTasksController.getProjectTasks);
router.patch('/:id/status', projectTasksController.updateStatus);
router.patch('/:id', projectTasksController.updateTask);
router.delete('/:id', projectTasksController.deleteTask);

module.exports = router;
