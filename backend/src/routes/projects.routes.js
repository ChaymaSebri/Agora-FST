const router = require('express').Router();
const { Projet, Utilisateur } = require('../models');
const { authenticate } = require('../middlewares/auth.middleware');
const ApiError = require('../utils/apiError');
const projectTaskService = require('../services/project-task.service');

router.get('/my-participations', authenticate, async (req, res, next) => {
  try {
    const projects = await projectTaskService.getMyParticipatingProjects(req.user);
    res.json({ success: true, data: { projects } });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/progress', authenticate, async (req, res, next) => {
  try {
    const data = await projectTaskService.getProjectProgress(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Get all projects with pagination and filtering
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, statut, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (statut) query.statut = statut;
    if (search) {
      query.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projets = await Projet.find(query)
      .populate('enseignantId', 'nom prenom email')
      .populate('etudiantIds', 'nom prenom email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Projet.countDocuments(query);

    res.json({
      projets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(new ApiError('Erreur lors de la récupération des projets', { status: 500 }));
  }
});

// Get project by ID
router.get('/:id', async (req, res, next) => {
  try {
    const projet = await Projet.findById(req.params.id)
      .populate('enseignantId', 'nom prenom email')
      .populate('etudiantIds', 'nom prenom email');

    if (!projet) {
      return next(new ApiError('Projet non trouvé', { status: 404 }));
    }

    res.json({ projet });
  } catch (error) {
    next(new ApiError('Erreur lors de la récupération du projet', { status: 500 }));
  }
});

// Create new project (requires authentication)
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { titre, description, objectif, deadline, statut, progression, imageUrl } = req.body;

    if (!titre || !deadline) {
      return next(new ApiError('Titre et deadline sont obligatoires', { status: 400 }));
    }

    const projet = await Projet.create({
      titre,
      description,
      imageUrl,
      objectif,
      deadline: new Date(deadline),
      statut: statut || 'en_attente',
      progression: progression || 0,
      enseignantId: req.user._id,
    });

    const populatedProjet = await projet.populate('enseignantId', 'nom prenom email');

    res.status(201).json({ projet: populatedProjet });
  } catch (error) {
    next(new ApiError('Erreur lors de la création du projet', { status: 500, data: error.message }));
  }
});

// Update project (requires authentication)
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { titre, description, objectif, deadline, statut, progression, imageUrl } = req.body;
    const projet = await Projet.findById(req.params.id);

    if (!projet) {
      return next(new ApiError('Projet non trouvé', { status: 404 }));
    }

    // Check if user is the project owner
    if (projet.enseignantId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError('Vous ne pouvez pas modifier ce projet', { status: 403 }));
    }

    // Update fields
    if (titre) projet.titre = titre;
    if (description) projet.description = description;
    if (objectif) projet.objectif = objectif;
    if (deadline) projet.deadline = new Date(deadline);
    if (statut) projet.statut = statut;
    if (progression !== undefined) projet.progression = Math.min(100, Math.max(0, progression));
    if (imageUrl !== undefined) projet.imageUrl = imageUrl;

    await projet.save();
    await projet.populate('enseignantId', 'nom prenom email');
    await projet.populate('etudiantIds', 'nom prenom email');

    res.json({ projet });
  } catch (error) {
    next(new ApiError('Erreur lors de la mise à jour du projet', { status: 500 }));
  }
});

// Delete project
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const projet = await Projet.findById(req.params.id);

    if (!projet) {
      return next(new ApiError('Projet non trouvé', { status: 404 }));
    }

    if (projet.enseignantId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError('Vous ne pouvez pas supprimer ce projet', { status: 403 }));
    }

    await Projet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    next(new ApiError('Erreur lors de la suppression du projet', { status: 500 }));
  }
});

// Add student to project
router.post('/:id/students/:studentId', authenticate, async (req, res, next) => {
  try {
    const projet = await Projet.findById(req.params.id);

    if (!projet) {
      return next(new ApiError('Projet non trouvé', { status: 404 }));
    }

    if (projet.enseignantId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError('Vous ne pouvez pas modifier ce projet', { status: 403 }));
    }

    if (!projet.etudiantIds.includes(req.params.studentId)) {
      projet.etudiantIds.push(req.params.studentId);
      await projet.save();
    }

    await projet.populate('enseignantId', 'nom prenom email');
    await projet.populate('etudiantIds', 'nom prenom email');

    res.json({ projet });
  } catch (error) {
    next(new ApiError('Erreur lors de l\'ajout de l\'étudiant', { status: 500 }));
  }
});

// Remove student from project
router.delete('/:id/students/:studentId', authenticate, async (req, res, next) => {
  try {
    const projet = await Projet.findById(req.params.id);

    if (!projet) {
      return next(new ApiError('Projet non trouvé', { status: 404 }));
    }

    if (projet.enseignantId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError('Vous ne pouvez pas modifier ce projet', { status: 403 }));
    }

    projet.etudiantIds = projet.etudiantIds.filter(
      (id) => id.toString() !== req.params.studentId
    );
    await projet.save();

    await projet.populate('enseignantId', 'nom prenom email');
    await projet.populate('etudiantIds', 'nom prenom email');

    res.json({ projet });
  } catch (error) {
    next(new ApiError('Erreur lors de la suppression de l\'étudiant', { status: 500 }));
  }
});

module.exports = router;
