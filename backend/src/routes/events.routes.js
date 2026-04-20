const router = require('express').Router();
const eventsController = require('../controllers/events.controller');

router.get('/', eventsController.listEvents);
router.get('/:id', eventsController.getEventById);
router.post('/', eventsController.createEvent);
router.patch('/:id', eventsController.updateEvent);
router.delete('/:id', eventsController.deleteEvent);

router.post('/:id/participations', eventsController.createParticipation);
router.delete('/:id/participations/:utilisateurId', eventsController.deleteParticipation);
router.get('/:id/participations', eventsController.listParticipations);

module.exports = router;
