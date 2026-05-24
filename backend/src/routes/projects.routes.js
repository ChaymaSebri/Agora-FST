const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  assignEnseignant,
  listEnseignants,
  listTaches,
  createTache,
  updateTache,
  deleteTache,
  rejoindreProjet
} = require('../controllers/projects.controller');

// ── Projets ──────────────────────────────────────────────────────────────────
router.get('/enseignants', authenticate, listEnseignants);
router.get('/',    listProjects);
router.get('/:id', getProjectById);
router.post('/',       authenticate, createProject);
router.put('/:id',     authenticate, updateProject);
router.delete('/:id',  authenticate, deleteProject);
router.post('/:id/rejoindre', authenticate, rejoindreProjet);
// ── Membres ──────────────────────────────────────────────────────────────────
router.post('/:id/membres/:etudiantId',    authenticate, addMember);
router.delete('/:id/membres/:etudiantId',  authenticate, removeMember);
router.patch('/:id/encadrant',             authenticate, assignEnseignant);

// ── Tâches ────────────────────────────────────────────────────────────────────
router.get('/:id/taches',                  authenticate, listTaches);
router.post('/:id/taches',                 authenticate, createTache);
router.put('/:id/taches/:tacheId',         authenticate, updateTache);
router.delete('/:id/taches/:tacheId',      authenticate, deleteTache);

module.exports = router;