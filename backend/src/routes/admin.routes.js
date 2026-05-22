const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/authorization.middleware');
const adminController = require('../controllers/admin.controller');

// Protéger toutes les routes admin avec authentification et vérification de rôle
router.use(authenticate);
router.use(isAdmin);

/**
 * =====================
 * DASHBOARD ROUTES
 * =====================
 */

// GET /api/admin/dashboard/stats - Obtenir les statistiques du dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

/**
 * =====================
 * USER MANAGEMENT ROUTES
 * =====================
 */

// GET /api/admin/users - Obtenir tous les utilisateurs
router.get('/users', adminController.getAllUsers);

// GET /api/admin/users/:id - Obtenir les détails d'un utilisateur
router.get('/users/:id', adminController.getUserById);

// PUT /api/admin/users/:id/role - Mettre à jour le rôle d'un utilisateur
router.put('/users/:id/role', adminController.updateUserRole);

// PUT /api/admin/users/:id/disable - Désactiver un compte utilisateur
router.put('/users/:id/disable', adminController.disableUser);

// PUT /api/admin/users/:id/enable - Réactiver un compte utilisateur
router.put('/users/:id/enable', adminController.enableUser);

/**
 * =====================
 * PROJECT MANAGEMENT ROUTES
 * =====================
 */

// GET /api/admin/projects - Obtenir tous les projets
router.get('/projects', adminController.getAllProjects);

// GET /api/admin/projects/:id - Obtenir les détails d'un projet
router.get('/projects/:id', adminController.getProjectById);

// PUT /api/admin/projects/:id - Mettre à jour un projet
router.put('/projects/:id', adminController.updateProject);

/**
 * =====================
 * TASK MANAGEMENT ROUTES
 * =====================
 */

// GET /api/admin/projects/:projectId/tasks - Obtenir toutes les tâches d'un projet
router.get('/projects/:projectId/tasks', adminController.getTasksByProject);

// PUT /api/admin/tasks/:id - Mettre à jour une tâche
router.put('/tasks/:id', adminController.updateTask);

/**
 * =====================
 * EVENT MANAGEMENT ROUTES
 * =====================
 */

// GET /api/admin/events - Obtenir tous les événements
router.get('/events', adminController.getAllEvents);

// GET /api/admin/events/:id - Obtenir les détails d'un événement
router.get('/events/:id', adminController.getEventById);

// PUT /api/admin/events/:id - Mettre à jour un événement
router.put('/events/:id', adminController.updateEvent);

// GET /api/admin/events/:id/participants-stats - Obtenir les statistiques des participants
router.get('/events/:id/participants-stats', adminController.getEventParticipantStats);

module.exports = router;
