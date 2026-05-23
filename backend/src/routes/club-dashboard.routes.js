const router = require('express').Router();
const clubDashboardController = require('../controllers/club-dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { checkRole } = require('../middlewares/authorization.middleware');

// ============================================================================
// CLUB STATS
// ============================================================================

router.get('/stats', authenticate, checkRole('club'), clubDashboardController.getClubStats);

// ============================================================================
// AVAILABLE TEACHERS
// ============================================================================

router.get('/available-teachers', authenticate, checkRole('club'), clubDashboardController.getAvailableTeachers);

// ============================================================================
// CLUB PROFILE & INFO
// ============================================================================

router.get('/profile', authenticate, checkRole('club'), clubDashboardController.getClubProfile);
router.patch('/profile', authenticate, checkRole('club'), clubDashboardController.updateClubProfile);

// ============================================================================
// EVENTS MANAGEMENT
// ============================================================================

router.get('/events', authenticate, checkRole('club'), clubDashboardController.listClubEvents);
router.post('/events', authenticate, checkRole('club'), clubDashboardController.createClubEvent);
router.patch('/events/:id', authenticate, checkRole('club'), clubDashboardController.updateClubEvent);
router.delete('/events/:id', authenticate, checkRole('club'), clubDashboardController.deleteClubEvent);

// ============================================================================
// EVENT PARTICIPATIONS & VALIDATIONS
// ============================================================================

router.get('/events/:eventId/participations', authenticate, checkRole('club'), clubDashboardController.listEventParticipations);
router.patch('/events/:eventId/participations/:participationId', authenticate, checkRole('club'), clubDashboardController.validateEventParticipation);
router.post('/events/:eventId/invite-teacher', authenticate, checkRole('club'), clubDashboardController.inviteTeacherToEvent);
router.get('/events/:eventId/teacher-invitations', authenticate, checkRole('club'), clubDashboardController.getEventTeacherInvitations);
router.delete('/events/:eventId/teacher-invitations/:invitationId', authenticate, checkRole('club'), clubDashboardController.cancelEventInvitation);

// ============================================================================
// PROJECTS MANAGEMENT
// ============================================================================

router.get('/projects', authenticate, checkRole('club'), clubDashboardController.listClubProjects);
router.post('/projects', authenticate, checkRole('club'), clubDashboardController.createClubProject);
router.patch('/projects/:projectId', authenticate, checkRole('club'), clubDashboardController.updateClubProject);
router.delete('/projects/:projectId', authenticate, checkRole('club'), clubDashboardController.deleteClubProject);

// ============================================================================
// PROJECT PARTICIPANTS & ROLES
// ============================================================================

router.get('/projects/:projectId/participants', authenticate, checkRole('club'), clubDashboardController.getProjectParticipants);
router.post('/projects/:projectId/participants', authenticate, checkRole('club'), clubDashboardController.addProjectParticipant);
router.delete('/projects/:projectId/participants/:utilisateurId', authenticate, checkRole('club'), clubDashboardController.removeProjectParticipant);
router.post('/projects/:projectId/invite-teacher', authenticate, checkRole('club'), clubDashboardController.inviteTeacherToProject);
router.get('/projects/:projectId/teacher-invitations', authenticate, checkRole('club'), clubDashboardController.getProjectTeacherInvitations);
router.delete('/projects/:projectId/teacher-invitations/:invitationId', authenticate, checkRole('club'), clubDashboardController.cancelProjectInvitation);

module.exports = router;
