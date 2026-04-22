const router = require('express').Router();
const clubsController = require('../controllers/clubs.controller');

router.get('/', clubsController.listClubs);

module.exports = router;
