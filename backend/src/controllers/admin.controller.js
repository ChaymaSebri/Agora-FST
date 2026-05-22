const {
  Utilisateur,
  Projet,
  Tache,
  Evenement,
  ParticipationEvenement,
  Club,
} = require('../models');
const ApiError = require('../utils/apiError');

/**
 * =====================
 * DASHBOARD - Statistics
 * =====================
 */

/**
 * Obtenir les statistiques du dashboard admin
 */
async function getDashboardStats(req, res, next) {
  try {
    // Compter les utilisateurs par rôle
    const stats = {
      users: {
        total: await Utilisateur.countDocuments(),
        students: await Utilisateur.countDocuments({ role: 'etudiant' }),
        teachers: await Utilisateur.countDocuments({ role: 'enseignant' }),
        clubs: await Utilisateur.countDocuments({ role: 'club' }),
        admins: await Utilisateur.countDocuments({ role: 'admin' }),
      },
      projects: {
        total: await Projet.countDocuments(),
        active: await Projet.countDocuments({ statut: 'en_cours' }),
        pending: await Projet.countDocuments({ statut: 'en_attente' }),
        completed: await Projet.countDocuments({ statut: 'termine' }),
        cancelled: await Projet.countDocuments({ statut: 'annule' }),
      },
      events: {
        total: await Evenement.countDocuments(),
        upcoming: await Evenement.countDocuments({ date: { $gt: new Date() } }),
        past: await Evenement.countDocuments({ date: { $lte: new Date() } }),
      },
      tasks: {
        total: await Tache.countDocuments(),
        completed: await Tache.countDocuments({ statut: 'terminee' }),
        inProgress: await Tache.countDocuments({ statut: 'en_cours' }),
        pending: await Tache.countDocuments({ statut: 'a_faire' }),
      },
    };

    // Calculer la progression moyenne des projets
    const projectsWithProgress = await Projet.find().select('progression');
    const avgProgress =
      projectsWithProgress.length > 0
        ? projectsWithProgress.reduce((sum, p) => sum + p.progression, 0) /
          projectsWithProgress.length
        : 0;

    stats.projects.averageProgress = Math.round(avgProgress);

    // Récupérer les derniers projets créés
    stats.recentProjects = await Projet.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('titre statut progression deadline')
      .populate('enseignantId', 'nom prenom');

    // Récupérer les prochains événements
    stats.upcomingEvents = await Evenement.find({ date: { $gt: new Date() } })
      .sort({ date: 1 })
      .limit(5)
      .select('titre date lieu capacite participantsCount')
      .populate('organisateurId', 'nom prenom');

    res.json(stats);
  } catch (error) {
    next(error);
  }
}

/**
 * =====================
 * USER MANAGEMENT
 * =====================
 */

/**
 * Obtenir tous les utilisateurs avec pagination
 */
async function getAllUsers(req, res, next) {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await Utilisateur.find(filter)
      .select('-motDePasse')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Utilisateur.countDocuments(filter);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtenir les détails d'un utilisateur
 */
async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    const user = await Utilisateur.findById(id)
      .select('-motDePasse')
      .populate('clubId', 'nom description');

    if (!user) {
      return next(new ApiError(404, 'Utilisateur non trouvé'));
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * Mettre à jour le rôle d'un utilisateur
 */
async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['etudiant', 'enseignant', 'club', 'admin'];
    if (!validRoles.includes(role)) {
      return next(new ApiError(400, 'Rôle invalide'));
    }

    // Empêcher de retirer le rôle admin du dernier admin
    if (role !== 'admin') {
      const currentUser = await Utilisateur.findById(id);
      if (currentUser.role === 'admin') {
        const adminCount = await Utilisateur.countDocuments({ role: 'admin' });
        if (adminCount === 1) {
          return next(
            new ApiError(400, 'Impossible de retirer le seul administrateur')
          );
        }
      }
    }

    const user = await Utilisateur.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-motDePasse');

    if (!user) {
      return next(new ApiError(404, 'Utilisateur non trouvé'));
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
}

/**
 * Désactiver un compte utilisateur (soft delete via flag)
 */
async function disableUser(req, res, next) {
  try {
    const { id } = req.params;

    // Empêcher de se désactiver soi-même
    if (req.user._id.toString() === id) {
      return next(new ApiError(400, 'Vous ne pouvez pas vous désactiver'));
    }

    const user = await Utilisateur.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    ).select('-motDePasse');

    if (!user) {
      return next(new ApiError(404, 'Utilisateur non trouvé'));
    }

    res.json({ message: 'Utilisateur désactivé', user });
  } catch (error) {
    next(error);
  }
}

/**
 * Réactiver un compte utilisateur
 */
async function enableUser(req, res, next) {
  try {
    const { id } = req.params;

    const user = await Utilisateur.findByIdAndUpdate(
      id,
      { active: true },
      { new: true }
    ).select('-motDePasse');

    if (!user) {
      return next(new ApiError(404, 'Utilisateur non trouvé'));
    }

    res.json({ message: 'Utilisateur réactivé', user });
  } catch (error) {
    next(error);
  }
}

/**
 * =====================
 * PROJECT MANAGEMENT
 * =====================
 */

/**
 * Obtenir tous les projets avec statistiques
 */
async function getAllProjects(req, res, next) {
  try {
    const { page = 1, limit = 10, statut, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (statut) {
      filter.statut = statut;
    }

    if (search) {
      filter.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const projects = await Projet.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('enseignantId', 'nom prenom email')
      .populate('etudiantIds', 'nom prenom email')
      .populate('clubId', 'nom')
      .sort({ createdAt: -1 });

    const total = await Projet.countDocuments(filter);

    // Ajouter le nombre de tâches pour chaque projet
    const projectsWithTasks = await Promise.all(
      projects.map(async (project) => {
        const tasksCount = await Tache.countDocuments({ projetId: project._id });
        const completedTasks = await Tache.countDocuments({
          projetId: project._id,
          statut: 'terminee',
        });
        return {
          ...project.toObject(),
          tasksCount,
          completedTasks,
        };
      })
    );

    res.json({
      projects: projectsWithTasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtenir les détails d'un projet avec ses tâches
 */
async function getProjectById(req, res, next) {
  try {
    const { id } = req.params;

    const project = await Projet.findById(id)
      .populate('enseignantId', 'nom prenom email specialite')
      .populate('etudiantIds', 'nom prenom email')
      .populate('clubId', 'nom description');

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    const tasks = await Tache.find({ projetId: id }).populate(
      'etudiantIds',
      'nom prenom'
    );

    res.json({
      ...project.toObject(),
      tasks,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mettre à jour le statut et la progression d'un projet
 */
async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const { statut, progression } = req.body;

    const validStatuts = ['en_cours', 'termine', 'annule', 'en_attente'];
    if (statut && !validStatuts.includes(statut)) {
      return next(new ApiError(400, 'Statut invalide'));
    }

    if (progression !== undefined) {
      if (progression < 0 || progression > 100) {
        return next(
          new ApiError(400, 'La progression doit être entre 0 et 100')
        );
      }
    }

    const project = await Projet.findByIdAndUpdate(
      id,
      { statut, progression },
      { new: true, runValidators: true }
    )
      .populate('enseignantId', 'nom prenom')
      .populate('etudiantIds', 'nom prenom');

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
}

/**
 * =====================
 * TASK MANAGEMENT
 * =====================
 */

/**
 * Obtenir toutes les tâches d'un projet
 */
async function getTasksByProject(req, res, next) {
  try {
    const { projectId } = req.params;

    const tasks = await Tache.find({ projetId: projectId })
      .populate('etudiantIds', 'nom prenom email')
      .sort({ deadline: 1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
}

/**
 * Mettre à jour le statut d'une tâche
 */
async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const validStatuts = ['a_faire', 'en_cours', 'terminee'];
    if (!validStatuts.includes(statut)) {
      return next(new ApiError(400, 'Statut invalide'));
    }

    const task = await Tache.findByIdAndUpdate(
      id,
      { statut },
      { new: true, runValidators: true }
    ).populate('etudiantIds', 'nom prenom');

    if (!task) {
      return next(new ApiError(404, 'Tâche non trouvée'));
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
}

/**
 * =====================
 * EVENT MANAGEMENT
 * =====================
 */

/**
 * Obtenir tous les événements
 */
async function getAllEvents(req, res, next) {
  try {
    const { page = 1, limit = 10, type, search } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (type) {
      filter.type = type;
    }

    if (search) {
      filter.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Evenement.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('organisateurId', 'nom prenom email')
      .populate('clubId', 'nom')
      .populate('coOrganizerClubIds', 'nom')
      .sort({ date: -1 });

    const total = await Evenement.countDocuments(filter);

    // Ajouter le nombre de participants
    const eventsWithParticipants = await Promise.all(
      events.map(async (event) => {
        const participantsCount = await ParticipationEvenement.countDocuments({
          evenementId: event._id,
          statut: { $in: ['inscrit', 'confirme', 'present'] },
        });
        return {
          ...event.toObject(),
          participantsCount,
        };
      })
    );

    res.json({
      events: eventsWithParticipants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtenir les détails d'un événement avec les participants
 */
async function getEventById(req, res, next) {
  try {
    const { id } = req.params;

    const event = await Evenement.findById(id)
      .populate('organisateurId', 'nom prenom email')
      .populate('clubId', 'nom description')
      .populate('coOrganizerClubIds', 'nom');

    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    const participations = await ParticipationEvenement.find({
      evenementId: id,
    }).populate('utilisateurId', 'nom prenom email');

    res.json({
      ...event.toObject(),
      participations,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mettre à jour un événement
 */
async function updateEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { titre, description, date, lieu, capacite, type } = req.body;

    const event = await Evenement.findByIdAndUpdate(
      id,
      {
        titre,
        description,
        date,
        lieu,
        capacite,
        type,
      },
      { new: true, runValidators: true }
    )
      .populate('organisateurId', 'nom prenom')
      .populate('clubId', 'nom');

    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
}

/**
 * Obtenir les statistiques des participants d'un événement
 */
async function getEventParticipantStats(req, res, next) {
  try {
    const { id } = req.params;

    const event = await Evenement.findById(id);
    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    const stats = {
      total: await ParticipationEvenement.countDocuments({ evenementId: id }),
      registered: await ParticipationEvenement.countDocuments({
        evenementId: id,
        statut: 'inscrit',
      }),
      confirmed: await ParticipationEvenement.countDocuments({
        evenementId: id,
        statut: 'confirme',
      }),
      cancelled: await ParticipationEvenement.countDocuments({
        evenementId: id,
        statut: 'annule',
      }),
      present: await ParticipationEvenement.countDocuments({
        evenementId: id,
        statut: 'present',
      }),
      capacity: event.capacite,
    };

    stats.available = Math.max(0, stats.capacity - stats.total);
    stats.fillPercentage =
      stats.capacity > 0 ? Math.round((stats.total / stats.capacity) * 100) : 0;

    res.json(stats);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  // Dashboard
  getDashboardStats,
  // Users
  getAllUsers,
  getUserById,
  updateUserRole,
  disableUser,
  enableUser,
  // Projects
  getAllProjects,
  getProjectById,
  updateProject,
  // Tasks
  getTasksByProject,
  updateTask,
  // Events
  getAllEvents,
  getEventById,
  updateEvent,
  getEventParticipantStats,
};
