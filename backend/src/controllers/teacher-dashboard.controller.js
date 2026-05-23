const { Evenement, ParticipationEvenement, Utilisateur, Projet, InvitationEvenement, InvitationProjet } = require('../models');
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

// ============================================================================
// TEACHER EVENT INVITATIONS (NEW - with pending state)
// ============================================================================

async function getPendingEventInvitations(req, res, next) {
  try {
    const teacherId = req.user._id;

    const invitations = await InvitationEvenement.find({
      enseignantId: teacherId,
      statut: 'en_attente',
    })
      .populate({
        path: 'evenementId',
        populate: [
          { path: 'organisateurId', select: 'nom prenom email' },
          { path: 'clubId', select: 'nom' },
        ],
      })
      .sort({ dateInvitation: -1 });

    const eventInvitations = invitations.map(inv => ({
      id: inv._id.toString(),
      evenementId: inv.evenementId._id.toString(),
      titre: inv.evenementId.titre,
      description: inv.evenementId.description,
      date: inv.evenementId.date,
      lieu: inv.evenementId.lieu,
      capacite: inv.evenementId.capacite,
      type: inv.evenementId.type,
      clubId: inv.evenementId.clubId._id.toString(),
      clubName: inv.evenementId.clubId.nom,
      organisateur: `${inv.evenementId.organisateurId.nom} ${inv.evenementId.organisateurId.prenom}`,
      message: inv.message,
      statut: inv.statut,
      dateInvitation: inv.dateInvitation,
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
    const { statut, message } = req.body;
    const notificationService = require('../services/notification.service');

    if (!['accepte', 'refuse'].includes(statut)) {
      return next(new ApiError(400, 'Statut invalide. Doit être "accepte" ou "refuse".'));
    }

    const invitation = await InvitationEvenement.findById(invitationId)
      .populate('evenementId')
      .populate('clubId');

    if (!invitation) {
      return next(new ApiError(404, 'Invitation non trouvée'));
    }

    if (String(invitation.enseignantId) !== String(req.user._id)) {
      return next(new ApiError(403, 'Non autorisé'));
    }

    if (invitation.statut !== 'en_attente') {
      return next(new ApiError(400, 'Cette invitation a déjà été traitée'));
    }

    // Mettre à jour le statut de l'invitation
    invitation.statut = statut;
    invitation.dateReponse = new Date();
    await invitation.save();

    // Si acceptée, créer une participation à l'événement
    if (statut === 'accepte') {
      const participationExists = await ParticipationEvenement.findOne({
        evenementId: invitation.evenementId._id,
        utilisateurId: req.user._id,
      });

      if (!participationExists) {
        const participation = new ParticipationEvenement({
          evenementId: invitation.evenementId._id,
          utilisateurId: req.user._id,
          statut: 'confirme',
        });
        await participation.save();
      }
    }

    // Créer une notification pour le club
    try {
      const teacherName = `${req.user.prenom} ${req.user.nom}`;
      const responseText = statut === 'accepte' ? 'a accepté' : 'a refusé';
      const notificationType = statut === 'accepte' ? 'invitation_accepted' : 'invitation_refused';
      
      await notificationService.createNotification(
        invitation.clubId._id.toString(),
        notificationType,
        `Réponse à l'invitation pour l'événement`,
        `${teacherName} ${responseText} votre invitation pour l'événement "${invitation.evenementId.nom}".`,
        invitation._id,
        'invitation'
      );
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas bloquer la réponse si la notification échoue
    }

    return res.status(200).json({
      success: true,
      message: `Invitation ${statut === 'accepte' ? 'acceptée' : 'refusée'}`,
      data: {
        id: invitation._id.toString(),
        statut: invitation.statut,
        dateReponse: invitation.dateReponse,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// TEACHER PROJECT INVITATIONS (NEW - with pending state)
// ============================================================================

async function getPendingProjectInvitations(req, res, next) {
  try {
    const teacherId = req.user._id;

    const invitations = await InvitationProjet.find({
      enseignantId: teacherId,
      statut: 'en_attente',
    })
      .populate({
        path: 'projetId',
        populate: [
          { path: 'clubId', select: 'nom' },
          { path: 'etudiantIds', select: 'nom prenom email' },
        ],
      })
      .sort({ dateInvitation: -1 });

    const projectInvitations = invitations.map(inv => ({
      id: inv._id.toString(),
      projetId: inv.projetId._id.toString(),
      titre: inv.projetId.titre,
      description: inv.projetId.description,
      objectif: inv.projetId.objectif,
      deadline: inv.projetId.deadline,
      statut: inv.projetId.statut,
      progression: inv.projetId.progression,
      clubId: inv.projetId.clubId._id.toString(),
      clubName: inv.projetId.clubId.nom,
      etudiantsCount: inv.projetId.etudiantIds ? inv.projetId.etudiantIds.length : 0,
      message: inv.message,
      invitationStatut: inv.statut,
      dateInvitation: inv.dateInvitation,
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

async function respondToProjectInvitation(req, res, next) {
  try {
    const { invitationId } = req.params;
    const { statut, message } = req.body;
    const notificationService = require('../services/notification.service');

    if (!['accepte', 'refuse'].includes(statut)) {
      return next(new ApiError(400, 'Statut invalide. Doit être "accepte" ou "refuse".'));
    }

    const invitation = await InvitationProjet.findById(invitationId)
      .populate('projetId')
      .populate('clubId');

    if (!invitation) {
      return next(new ApiError(404, 'Invitation non trouvée'));
    }

    if (String(invitation.enseignantId) !== String(req.user._id)) {
      return next(new ApiError(403, 'Non autorisé'));
    }

    if (invitation.statut !== 'en_attente') {
      return next(new ApiError(400, 'Cette invitation a déjà été traitée'));
    }

    // Mettre à jour le statut de l'invitation
    invitation.statut = statut;
    invitation.dateReponse = new Date();
    await invitation.save();

    // Si acceptée, mettre à jour le projet
    if (statut === 'accepte') {
      const project = await Projet.findById(invitation.projetId._id);
      if (project && !project.enseignantId) {
        project.enseignantId = req.user._id;
        await project.save();
      }
    }

    // Créer une notification pour le club
    try {
      const teacherName = `${req.user.prenom} ${req.user.nom}`;
      const responseText = statut === 'accepte' ? 'a accepté' : 'a refusé';
      const notificationType = statut === 'accepte' ? 'invitation_accepted' : 'invitation_refused';
      
      await notificationService.createNotification(
        invitation.clubId._id.toString(),
        notificationType,
        `Réponse à l'invitation pour le projet`,
        `${teacherName} ${responseText} votre invitation pour le projet "${invitation.projetId.titre}".`,
        invitation._id,
        'invitation'
      );
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas bloquer la réponse si la notification échoue
    }

    return res.status(200).json({
      success: true,
      message: `Invitation ${statut === 'accepte' ? 'acceptée' : 'refusée'}`,
      data: {
        id: invitation._id.toString(),
        statut: invitation.statut,
        dateReponse: invitation.dateReponse,
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
  getPendingEventInvitations,
  getPendingProjectInvitations,
  respondToProjectInvitation,
};
