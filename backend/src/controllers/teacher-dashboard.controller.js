const { Evenement, ParticipationEvenement, Utilisateur, Projet } = require('../models');
const ApiError = require('../utils/apiError');

// ============================================================================
// EVENTS - READ ONLY (Global View)
// ============================================================================

async function getAllEvents(req, res, next) {
  try {
    const events = await Evenement.find({})
      .populate('organisateurId', 'nom prenom email')
      .populate('clubId', 'nom')
      .sort({ date: -1 });

    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const participantsCount = await ParticipationEvenement.countDocuments({
          evenementId: event._id,
          statut: { $in: ['inscrit', 'confirme', 'present'] },
        });

        return {
          id: event._id.toString(),
          titre: event.titre,
          description: event.description,
          date: event.date,
          lieu: event.lieu,
          capacite: event.capacite,
          participantsCount,
          type: event.type,
          organisateurId: event.organisateurId._id.toString(),
          organisateur: `${event.organisateurId.nom} ${event.organisateurId.prenom}`,
          clubId: event.clubId._id.toString(),
          clubName: event.clubId.nom,
          createdAt: event.createdAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        items: eventsWithStats,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getEventById(req, res, next) {
  try {
    const event = await Evenement.findById(req.params.id)
      .populate('organisateurId', 'nom prenom email')
      .populate('clubId', 'nom');

    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    const participantsCount = await ParticipationEvenement.countDocuments({
      evenementId: event._id,
      statut: { $in: ['inscrit', 'confirme', 'present'] },
    });

    return res.status(200).json({
      success: true,
      data: {
        id: event._id.toString(),
        titre: event.titre,
        description: event.description,
        date: event.date,
        lieu: event.lieu,
        capacite: event.capacite,
        participantsCount,
        type: event.type,
        organisateur: `${event.organisateurId.nom} ${event.organisateurId.prenom}`,
        clubName: event.clubId.nom,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// PROJECTS - READ ONLY (Global View)
// ============================================================================

async function getAllProjects(req, res, next) {
  try {
    const projects = await Projet.find({})
      .populate('enseignantId', 'nom prenom email')
      .populate('etudiantIds', 'nom prenom email')
      .populate('clubId', 'nom')
      .sort({ deadline: -1 });

    const projectsWithStats = projects.map(p => ({
      id: p._id.toString(),
      titre: p.titre,
      description: p.description,
      objectif: p.objectif,
      dateDebut: p.dateDebut,
      deadline: p.deadline,
      statut: p.statut,
      progression: p.progression,
      enseignantId: p.enseignantId._id.toString(),
      enseignant: `${p.enseignantId.nom} ${p.enseignantId.prenom}`,
      etudiantsCount: p.etudiantIds ? p.etudiantIds.length : 0,
      clubId: p.clubId._id.toString(),
      clubName: p.clubId.nom,
      createdAt: p.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        items: projectsWithStats,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getProjectById(req, res, next) {
  try {
    const project = await Projet.findById(req.params.id)
      .populate('enseignantId', 'nom prenom email')
      .populate('etudiantIds', 'nom prenom email')
      .populate('clubId', 'nom');

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    return res.status(200).json({
      success: true,
      data: {
        id: project._id.toString(),
        titre: project.titre,
        description: project.description,
        objectif: project.objectif,
        dateDebut: project.dateDebut,
        deadline: project.deadline,
        statut: project.statut,
        progression: project.progression,
        enseignant: `${project.enseignantId.nom} ${project.enseignantId.prenom}`,
        etudiants: project.etudiantIds.map(e => ({
          id: e._id.toString(),
          nom: e.nom,
          prenom: e.prenom,
          email: e.email,
        })),
        clubName: project.clubId.nom,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// TEACHER INVITATIONS - Events
// ============================================================================

async function getTeacherEventInvitations(req, res, next) {
  try {
    const teacherId = req.user._id;

    // Trouver toutes les participations où l'enseignant a été invité
    const invitations = await ParticipationEvenement.find({
      utilisateurId: teacherId,
    })
      .populate({
        path: 'evenementId',
        populate: [
          { path: 'organisateurId', select: 'nom prenom email' },
          { path: 'clubId', select: 'nom' },
        ],
      })
      .sort({ createdAt: -1 });

    const eventInvitations = invitations.map(inv => ({
      id: inv._id.toString(),
      invitationId: inv._id.toString(),
      evenementId: inv.evenementId._id.toString(),
      titre: inv.evenementId.titre,
      description: inv.evenementId.description,
      date: inv.evenementId.date,
      lieu: inv.evenementId.lieu,
      capacite: inv.evenementId.capacite,
      type: inv.evenementId.type,
      statut: inv.statut,
      clubName: inv.evenementId.clubId.nom,
      organisateur: `${inv.evenementId.organisateurId.nom} ${inv.evenementId.organisateurId.prenom}`,
      dateInvitation: inv.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        items: eventInvitations,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function respondToEventInvitation(req, res, next) {
  try {
    const { invitationId } = req.params;
    const { statut } = req.body; // 'confirme' ou 'annule'
    const teacherId = req.user._id;

    if (!['confirme', 'annule'].includes(statut)) {
      return next(new ApiError(400, 'Statut invalide'));
    }

    const invitation = await ParticipationEvenement.findOne({
      _id: invitationId,
      utilisateurId: teacherId,
    });

    if (!invitation) {
      return next(new ApiError(404, 'Invitation non trouvée'));
    }

    invitation.statut = statut;
    await invitation.save();

    return res.status(200).json({
      success: true,
      message: `Invitation ${statut === 'confirme' ? 'acceptée' : 'refusée'}`,
      data: {
        id: invitation._id.toString(),
        statut: invitation.statut,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// TEACHER ENCADREMENT - Projects
// ============================================================================

async function getTeacherProjectEncadrement(req, res, next) {
  try {
    const teacherId = req.user._id;

    const projects = await Projet.find({
      enseignantId: teacherId,
    })
      .populate('etudiantIds', 'nom prenom email')
      .populate('clubId', 'nom')
      .sort({ deadline: -1 });

    const projectEncadrements = projects.map(p => ({
      id: p._id.toString(),
      titre: p.titre,
      description: p.description,
      objectif: p.objectif,
      dateDebut: p.dateDebut,
      deadline: p.deadline,
      statut: p.statut,
      progression: p.progression,
      etudiantsCount: p.etudiantIds ? p.etudiantIds.length : 0,
      etudiants: p.etudiantIds.map(e => ({
        id: e._id.toString(),
        nom: e.nom,
        prenom: e.prenom,
        email: e.email,
      })),
      clubName: p.clubId.nom,
      createdAt: p.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        items: projectEncadrements,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getTeacherProjectInvitations(req, res, next) {
  try {
    const teacherId = req.user._id;

    // Récupérer les projets dont l'enseignant a été invité (projects où il est co-encadrant)
    // Pour maintenant, on utilise un système simple : les projets où enseignantId n'est pas encore celui-ci
    // mais il y a une invitation en attente

    // Note: Nous utilisons le champ enseignantId directement
    // Les invitations de projet ne sont pas stockées comme les participations aux événements
    // Donc on retourne les projets où cet enseignant est encadrant

    const invitedProjects = await Projet.find({
      enseignantId: teacherId,
    })
      .populate('etudiantIds', 'nom prenom email')
      .populate('clubId', 'nom')
      .sort({ deadline: -1 });

    // Pour les véritables invitations (non encore acceptées), nous aurions besoin d'un modèle
    // Pour now, retournons juste les projets où l'enseignant est déjà encadrant

    const projectInvitations = invitedProjects.map(p => ({
      id: p._id.toString(),
      titre: p.titre,
      description: p.description,
      statut: p.statut,
      progression: p.progression,
      deadline: p.deadline,
      clubName: p.clubId.nom,
      reponse: 'accepte', // Simplification pour now
    }));

    return res.status(200).json({
      success: true,
      data: {
        items: projectInvitations,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAllEvents,
  getEventById,
  getAllProjects,
  getProjectById,
  getTeacherEventInvitations,
  respondToEventInvitation,
  getTeacherProjectEncadrement,
  getTeacherProjectInvitations,
};
