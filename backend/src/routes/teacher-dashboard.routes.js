const router = require('express').Router();
const teacherDashboardController = require('../controllers/teacher-dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/authorization.middleware');

// ============================================================================
// PUBLIC - Events (Read Only - Global View)
// ============================================================================

router.get('/events', teacherDashboardController.getAllEvents);
router.get('/events/:id', teacherDashboardController.getEventById);

// ============================================================================
// PUBLIC - Projects (Read Only - Global View)
// ============================================================================

router.get('/projects', teacherDashboardController.getAllProjects);
router.get('/projects/:id', teacherDashboardController.getProjectById);

// ============================================================================
// TEACHER ONLY - Projects Encadrement
// ============================================================================

router.get('/teacher/projects', authenticate, checkRole('enseignant'), teacherDashboardController.getTeacherProjectEncadrement);

// ============================================================================
// TEACHER ONLY - Event Invitations
// ============================================================================

router.get('/teacher/event-invitations', authenticate, checkRole('enseignant'), teacherDashboardController.getTeacherEventInvitations);
router.patch('/teacher/event-invitations/:invitationId', authenticate, checkRole('enseignant'), teacherDashboardController.respondToEventInvitation);

// ============================================================================
// TEACHER ONLY - Event Invitations (New System)
// ============================================================================

router.get('/teacher/event-invitations/pending', authenticate, checkRole('enseignant'), teacherDashboardController.getPendingEventInvitations);
router.patch('/teacher/event-invitations/:invitationId/respond', authenticate, checkRole('enseignant'), teacherDashboardController.respondToEventInvitation);

// ============================================================================
// TEACHER ONLY - Project Invitations (New System)
// ============================================================================

router.get('/teacher/project-invitations/pending', authenticate, checkRole('enseignant'), teacherDashboardController.getPendingProjectInvitations);
router.patch('/teacher/project-invitations/:invitationId/respond', authenticate, checkRole('enseignant'), teacherDashboardController.respondToProjectInvitation);

module.exports = router;
