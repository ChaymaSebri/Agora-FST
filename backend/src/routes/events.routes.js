const router = require('express').Router();
const eventsController = require('../controllers/events.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', eventsController.listEvents);
router.get('/:id', eventsController.getEventById);
router.post('/', authenticate, eventsController.createEvent);
router.patch('/:id', authenticate, eventsController.updateEvent);
router.delete('/:id', authenticate, eventsController.deleteEvent);

router.post('/:id/participations', eventsController.createParticipation);
router.delete('/:id/participations/:utilisateurId', eventsController.deleteParticipation);
router.get('/:id/participations', eventsController.listParticipations);

module.exports = router;
