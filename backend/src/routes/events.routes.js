const router = require('express').Router();
const eventsController = require('../controllers/events.controller');
const { authenticate, authenticateOptional } = require('../middlewares/auth.middleware');

router.get('/', authenticateOptional, eventsController.listEvents);
router.get('/participations/me', authenticate, eventsController.listMyParticipations);
router.get('/invitations/me', authenticate, eventsController.listMyEventInvitations);
router.get('/:id/invitations', authenticate, eventsController.listEventInvitations);
router.patch('/invitations/:id', authenticate, eventsController.respondToEventInvitation);
router.get('/:id', eventsController.getEventById);
router.post('/', authenticate, eventsController.createEvent);
router.patch('/:id', authenticate, eventsController.updateEvent);
router.delete('/:id', authenticate, eventsController.deleteEvent);

router.post('/:id/participations', authenticate, eventsController.createParticipation);
router.delete('/:id/participations/:utilisateurId', authenticate, eventsController.deleteParticipation);
router.get('/:id/participations', authenticate, eventsController.listParticipations);
router.post('/:id/invitations', authenticate, eventsController.inviteTeachersToEvent);

module.exports = router;
