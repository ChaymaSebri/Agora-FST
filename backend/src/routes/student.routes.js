const express = require('express');
const { authenticate, checkRole } = require('../middlewares/auth.middleware');
const studentController = require('../controllers/student.controller');

const router = express.Router();

// Tous les endpoints requirent une authentification
router.use(authenticate);

// ============================================================================
// PROJECT PARTICIPATION REQUESTS
// ============================================================================

// Demander de participer à un projet
router.post(
  '/projects/:projectId/participation-request',
  checkRole('etudiant'),
  studentController.requestProjectParticipation
);

// Récupérer les demandes de participation de l'étudiant
router.get(
  '/participation-requests',
  checkRole('etudiant'),
  studentController.getMyParticipationRequests
);

module.exports = router;
