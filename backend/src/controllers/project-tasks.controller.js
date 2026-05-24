const ApiError = require('../utils/apiError');
const projectTaskService = require('../services/project-task.service');

const VALID_STATUS = ['todo', 'in_progress', 'completed', 'blocked'];

async function createTask(req, res, next) {
  try {
    const task = await projectTaskService.createTask(req.body, req.user, req.params.projectId);
    return res.status(201).json({ success: true, data: { task } });
  } catch (error) {
    return next(error);
  }
}

async function getProjectTasks(req, res, next) {
  try {
    const data = await projectTaskService.getProjectTasks(req.params.projectId, req.user, req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await projectTaskService.updateTask(req.params.id, req.body, req.user);
    return res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    return next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const data = await projectTaskService.deleteTask(req.params.id, req.user);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!VALID_STATUS.includes(status)) {
      throw new ApiError(400, 'Statut de tâche invalide');
    }

    const task = await projectTaskService.updateOwnTaskStatus(req.params.id, status, req.user);
    return res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    return next(error);
  }
}

async function getMyTasks(req, res, next) {
  try {
    const tasks = await projectTaskService.getMyTasks(req.user);
    return res.status(200).json({ success: true, data: { tasks } });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask,
  updateStatus,
  getMyTasks,
};
