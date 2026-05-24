const { ProjectTask, Projet, Utilisateur } = require('../models');
const ApiError = require('../utils/apiError');

const TASK_POPULATE = [
  { path: 'assignedTo', select: 'nom prenom email role niveau filiere avatarUrl' },
  { path: 'assignedBy', select: 'nom prenom email role' },
  { path: 'projectId', select: 'titre description deadline statut progression clubId etudiantIds' },
];

function serializeUser(user) {
  if (!user || !user._id) return null;

  return {
    id: user._id.toString(),
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
    niveau: user.niveau,
    filiere: user.filiere,
    avatarUrl: user.avatarUrl,
  };
}

function serializeProject(project) {
  if (!project || !project._id) return null;

  return {
    id: project._id.toString(),
    titre: project.titre,
    description: project.description,
    deadline: project.deadline,
    statut: project.statut,
    progression: project.progression,
    clubId: project.clubId?.toString(),
  };
}

function serializeTask(task) {
  return {
    id: task._id.toString(),
    projectId: task.projectId?._id ? task.projectId._id.toString() : String(task.projectId),
    assignedTo: serializeUser(task.assignedTo),
    assignedBy: serializeUser(task.assignedBy),
    project: serializeProject(task.projectId),
    title: task.title,
    description: task.description || '',
    role: task.role || '',
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function buildProgressStats(tasks) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'in_progress').length;
  const blockedTasks = tasks.filter((task) => task.status === 'blocked').length;
  const todoTasks = tasks.filter((task) => task.status === 'todo').length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return {
    totalTasks,
    completedTasks,
    inProgressTasks,
    blockedTasks,
    todoTasks,
    remainingTasks: totalTasks - completedTasks,
    progressPercentage,
  };
}

async function findProjectForClub(projectId, user) {
  if (!user || user.role !== 'club' || !user.clubId) {
    throw new ApiError(403, 'Seul le club créateur du projet peut effectuer cette action');
  }

  const project = await Projet.findOne({ _id: projectId, clubId: user.clubId })
    .populate('etudiantIds', 'nom prenom email role niveau filiere avatarUrl');

  if (!project) {
    throw new ApiError(404, 'Projet non trouvé pour ce club');
  }

  return project;
}

function assertParticipant(project, assignedTo) {
  const isParticipant = Array.isArray(project.etudiantIds)
    && project.etudiantIds.some((student) => String(student._id || student) === String(assignedTo));

  if (!isParticipant) {
    throw new ApiError(400, 'La tâche doit être assignée à un étudiant participant au projet');
  }
}

async function updateProjectProgress(projectId) {
  const tasks = await ProjectTask.find({ projectId }).select('status');
  const stats = buildProgressStats(tasks);

  await Projet.findByIdAndUpdate(projectId, { progression: stats.progressPercentage });

  return stats;
}

async function createTask(payload, user, projectIdOverride = null) {
  const projectId = projectIdOverride || payload.projectId;
  if (!projectId) {
    throw new ApiError(400, 'Le projet associé à la tâche est obligatoire');
  }

  const project = await findProjectForClub(projectId, user);
  assertParticipant(project, payload.assignedTo);

  const assignee = await Utilisateur.findOne({ _id: payload.assignedTo, role: 'etudiant' });
  if (!assignee) {
    throw new ApiError(404, 'Étudiant assigné introuvable');
  }

  const task = await ProjectTask.create({
    projectId: project._id,
    assignedTo: assignee._id,
    assignedBy: user._id,
    title: payload.title,
    description: payload.description || '',
    role: payload.role || '',
    priority: payload.priority || 'medium',
    status: payload.status || 'todo',
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
    completedAt: payload.status === 'completed' ? new Date() : null,
  });

  await updateProjectProgress(project._id);
  return serializeTask(await task.populate(TASK_POPULATE));
}

async function getProjectTasks(projectId, user, filters = {}) {
  const project = await Projet.findById(projectId).populate('etudiantIds', 'nom prenom email role niveau filiere avatarUrl');

  if (!project) {
    throw new ApiError(404, 'Projet non trouvé');
  }

  const isOwnerClub = user?.role === 'club' && String(project.clubId) === String(user.clubId);
  const isParticipant = user?.role === 'etudiant'
    && project.etudiantIds.some((student) => String(student._id || student) === String(user._id));

  if (!isOwnerClub && !isParticipant && user?.role !== 'admin') {
    throw new ApiError(403, 'Accès refusé aux tâches de ce projet');
  }

  const query = { projectId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.priority) {
    query.priority = filters.priority;
  }

  const tasks = await ProjectTask.find(query).populate(TASK_POPULATE).sort({ createdAt: -1 });
  const stats = buildProgressStats(tasks);

  return {
    project: serializeProject(project),
    participants: project.etudiantIds.map(serializeUser),
    stats,
    tasks: tasks.map(serializeTask),
  };
}

async function updateTask(taskId, payload, user) {
  const task = await ProjectTask.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Tâche non trouvée');
  }

  const project = await findProjectForClub(task.projectId, user);
  const nextAssignedTo = payload.assignedTo || task.assignedTo;
  assertParticipant(project, nextAssignedTo);

  if (payload.assignedTo) task.assignedTo = payload.assignedTo;
  if (payload.title !== undefined) task.title = payload.title;
  if (payload.description !== undefined) task.description = payload.description;
  if (payload.role !== undefined) task.role = payload.role;
  if (payload.priority !== undefined) task.priority = payload.priority;
  if (payload.status !== undefined) {
    task.status = payload.status;
    task.completedAt = payload.status === 'completed' ? (task.completedAt || new Date()) : null;
  }
  if (payload.dueDate !== undefined) task.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;

  await task.save();
  await updateProjectProgress(task.projectId);
  return serializeTask(await task.populate(TASK_POPULATE));
}

async function deleteTask(taskId, user) {
  const task = await ProjectTask.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Tâche non trouvée');
  }

  await findProjectForClub(task.projectId, user);
  const projectId = task.projectId;
  await task.deleteOne();
  const stats = await updateProjectProgress(projectId);

  return { id: taskId, stats };
}

async function updateOwnTaskStatus(taskId, status, user) {
  if (!user || user.role !== 'etudiant') {
    throw new ApiError(403, 'Seul un étudiant peut modifier le statut de ses tâches');
  }

  const task = await ProjectTask.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Tâche non trouvée');
  }

  if (String(task.assignedTo) !== String(user._id)) {
    throw new ApiError(403, 'Vous ne pouvez modifier que vos propres tâches');
  }

  const project = await Projet.findById(task.projectId).select('etudiantIds clubId');
  if (!project) {
    throw new ApiError(404, 'Projet non trouvé');
  }

  const isParticipant = Array.isArray(project.etudiantIds)
    && project.etudiantIds.some((student) => String(student) === String(user._id));

  if (!isParticipant) {
    throw new ApiError(403, 'Vous devez participer à ce projet pour modifier cette tâche');
  }

  task.status = status;
  task.completedAt = status === 'completed' ? (task.completedAt || new Date()) : null;
  await task.save();
  await updateProjectProgress(task.projectId);

  return serializeTask(await task.populate(TASK_POPULATE));
}

async function getMyTasks(user) {
  if (!user || user.role !== 'etudiant') {
    throw new ApiError(403, 'Seul un étudiant peut consulter ses tâches');
  }

  const tasks = await ProjectTask.find({ assignedTo: user._id }).populate(TASK_POPULATE).sort({ dueDate: 1, createdAt: -1 });
  return tasks.map(serializeTask);
}

async function getMyParticipatingProjects(user) {
  if (!user || user.role !== 'etudiant') {
    throw new ApiError(403, 'Seul un étudiant peut consulter ses projets');
  }

  const projects = await Projet.find({ etudiantIds: user._id })
    .populate('clubId', 'nom')
    .populate('enseignantId', 'nom prenom email')
    .sort({ updatedAt: -1 });

  const projectIds = projects.map((project) => project._id);
  const tasks = await ProjectTask.find({ projectId: { $in: projectIds }, assignedTo: user._id })
    .populate(TASK_POPULATE)
    .sort({ dueDate: 1, createdAt: -1 });

  const allProjectTasks = await ProjectTask.find({ projectId: { $in: projectIds } }).select('projectId status');
  const tasksByProject = new Map();
  const myTasksByProject = new Map();

  allProjectTasks.forEach((task) => {
    const key = String(task.projectId);
    tasksByProject.set(key, [...(tasksByProject.get(key) || []), task]);
  });

  tasks.forEach((task) => {
    const key = String(task.projectId?._id || task.projectId);
    myTasksByProject.set(key, [...(myTasksByProject.get(key) || []), serializeTask(task)]);
  });

  return projects.map((project) => {
    const key = String(project._id);
    return {
      id: key,
      titre: project.titre,
      description: project.description,
      deadline: project.deadline,
      statut: project.statut,
      progression: project.progression,
      club: project.clubId ? { id: project.clubId._id.toString(), nom: project.clubId.nom } : null,
      enseignant: serializeUser(project.enseignantId),
      stats: buildProgressStats(tasksByProject.get(key) || []),
      tasks: myTasksByProject.get(key) || [],
    };
  });
}

async function getProjectProgress(projectId, user) {
  const project = await Projet.findById(projectId).populate('etudiantIds', 'nom prenom email role niveau filiere avatarUrl');
  if (!project) {
    throw new ApiError(404, 'Projet non trouvé');
  }

  const isOwnerClub = user?.role === 'club' && String(project.clubId) === String(user.clubId);
  const isParticipant = user?.role === 'etudiant'
    && project.etudiantIds.some((student) => String(student._id || student) === String(user._id));

  if (!isOwnerClub && !isParticipant && user?.role !== 'admin') {
    throw new ApiError(403, 'Accès refusé aux statistiques de ce projet');
  }

  const tasks = await ProjectTask.find({ projectId }).select('status');
  const stats = buildProgressStats(tasks);
  await Projet.findByIdAndUpdate(projectId, { progression: stats.progressPercentage });

  return {
    project: serializeProject(project),
    stats,
  };
}

module.exports = {
  createTask,
  getProjectTasks,
  updateTask,
  deleteTask,
  updateOwnTaskStatus,
  getMyTasks,
  getMyParticipatingProjects,
  getProjectProgress,
};
