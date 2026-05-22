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
// TEACHER ONLY - Event Invitations
// ============================================================================

router.get('/teacher/event-invitations', authenticate, checkRole('enseignant'), teacherDashboardController.getTeacherEventInvitations);
router.patch('/teacher/event-invitations/:invitationId', authenticate, checkRole('enseignant'), teacherDashboardController.respondToEventInvitation);

// ============================================================================
// TEACHER ONLY - Project Encadrement
// ============================================================================

router.get('/teacher/projects', authenticate, checkRole('enseignant'), teacherDashboardController.getTeacherProjectEncadrement);
router.get('/teacher/project-invitations', authenticate, checkRole('enseignant'), teacherDashboardController.getTeacherProjectInvitations);

module.exports = router;
