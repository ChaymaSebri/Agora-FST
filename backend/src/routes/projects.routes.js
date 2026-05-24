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

const projectTaskService = require('../services/project-task.service');

// ─────────────────────────────
// NEW FEATURE ROUTES
// ─────────────────────────────

// projets où l'utilisateur participe
router.get('/my-participations', authenticate, async (req, res, next) => {
  try {
    const projects = await projectTaskService.getMyParticipatingProjects(req.user);
    res.json({ success: true, data: { projects } });
  } catch (error) {
    next(error);
  }
});

// progression d’un projet
router.get('/:id/progress', authenticate, async (req, res, next) => {
  try {
    const data = await projectTaskService.getProjectProgress(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────
// PROJETS
// ─────────────────────────────
router.get('/enseignants', authenticate, listEnseignants);
router.get('/', listProjects);
router.get('/:id', getProjectById);
router.post('/', authenticate, createProject);
router.put('/:id', authenticate, updateProject);
router.delete('/:id', authenticate, deleteProject);
router.post('/:id/rejoindre', authenticate, rejoindreProjet);

// ─────────────────────────────
// MEMBRES
// ─────────────────────────────
router.post('/:id/membres/:etudiantId', authenticate, addMember);
router.delete('/:id/membres/:etudiantId', authenticate, removeMember);
router.patch('/:id/encadrant', authenticate, assignEnseignant);

// ─────────────────────────────
// TÂCHES
// ─────────────────────────────
router.get('/:id/taches', authenticate, listTaches);
router.post('/:id/taches', authenticate, createTache);
router.put('/:id/taches/:tacheId', authenticate, updateTache);
router.delete('/:id/taches/:tacheId', authenticate, deleteTache);

module.exports = router;