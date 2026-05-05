const router = require('express').Router();
const competencesController = require('../controllers/competences.controller');

router.get('/', competencesController.listCompetences);

module.exports = router;
