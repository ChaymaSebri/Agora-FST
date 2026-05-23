const mongoose = require('mongoose');
const { Evenement, ParticipationEvenement, Utilisateur, Club, Projet, Tache, InvitationEvenement, InvitationProjet } = require('../models');
const ApiError = require('../utils/apiError');

// ============================================================================
// CLUB STATS
// ============================================================================

async function getClubStats(req, res, next) {
  try {
    const clubId = req.user.clubId;

    // Compter les événements
    const eventsCount = await Evenement.countDocuments({ clubId });

    // Compter les projets
    const projectsCount = await Projet.countDocuments({ clubId });

    // Compter les participations actives
    const activeParticipations = await ParticipationEvenement.countDocuments({
      statut: { $in: ['inscrit', 'confirme', 'present'] },
    });

    // Compter les participants aux projets
    const projects = await Projet.find({ clubId }).select('etudiantIds');
    let totalProjectParticipants = 0;
    projects.forEach(p => {
      totalProjectParticipants += p.etudiantIds ? p.etudiantIds.length : 0;
    });

    // Calculer le taux de validation
    const totalInscriptions = await ParticipationEvenement.countDocuments();
    const confirmedInscriptions = await ParticipationEvenement.countDocuments({
      statut: { $in: ['confirme', 'present'] },
    });
    const validationRate = totalInscriptions > 0 
      ? Math.round((confirmedInscriptions / totalInscriptions) * 100)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        eventsCount,
        projectsCount,
        activeParticipations,
        totalProjectParticipants,
        validationRate,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// AVAILABLE TEACHERS
// ============================================================================

async function getAvailableTeachers(req, res, next) {
  try {
    // Récupérer tous les enseignants avec leurs informations
    const teachers = await Utilisateur.find({
      role: 'enseignant',
    })
      .select('_id nom prenom email avatarUrl')
      .sort({ nom: 1, prenom: 1 });

    const formattedTeachers = teachers.map(teacher => ({
      id: teacher._id.toString(),
      nom: teacher.nom,
      prenom: teacher.prenom,
      email: teacher.email,
      photo: teacher.avatarUrl || null,
      fullName: `${teacher.nom} ${teacher.prenom}`,
    }));

    return res.status(200).json({
      success: true,
      data: {
        items: formattedTeachers,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// CLUB PROFILE & INFO
// ============================================================================

async function getClubProfile(req, res, next) {
  try {
    const club = await Club.findById(req.user.clubId)
      .populate('bureauExecutifId', 'nom prenom email')
      .populate('membreIds', 'nom prenom email role');

    if (!club) {
      return next(new ApiError(404, 'Club non trouvé'));
    }

    return res.status(200).json({
      success: true,
      data: {
        id: club._id.toString(),
        nom: club.nom,
        description: club.description,
        specialite: club.specialite,
        statut: club.statut,
        dateCreation: club.dateCreation,
        bureauExecutif: club.bureauExecutifId ? {
          id: club.bureauExecutifId._id.toString(),
          nom: club.bureauExecutifId.nom,
          prenom: club.bureauExecutifId.prenom,
          email: club.bureauExecutifId.email,
        } : null,
        membresCount: club.membreIds ? club.membreIds.length : 0,
        membres: club.membreIds ? club.membreIds.map(m => ({
          id: m._id.toString(),
          nom: m.nom,
          prenom: m.prenom,
          email: m.email,
          role: m.role,
        })) : [],
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateClubProfile(req, res, next) {
  try {
    const { nom, description, specialite } = req.body;

    const club = await Club.findById(req.user.clubId);
    if (!club) {
      return next(new ApiError(404, 'Club non trouvé'));
    }

    if (nom) club.nom = nom;
    if (description) club.description = description;
    if (specialite) club.specialite = specialite;

    await club.save();

    return res.status(200).json({
      success: true,
      message: 'Profil du club mis à jour avec succès',
      data: {
        id: club._id.toString(),
        nom: club.nom,
        description: club.description,
        specialite: club.specialite,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// EVENTS MANAGEMENT
// ============================================================================

async function listClubEvents(req, res, next) {
  try {
    const events = await Evenement.find({
      clubId: req.user.clubId,
    })
      .populate('organisateurId', 'nom prenom email')
      .populate('clubId', 'nom')
      .sort({ date: -1 });

    const eventsWithParticipants = await Promise.all(
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
          createdAt: event.createdAt,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        items: eventsWithParticipants,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function createClubEvent(req, res, next) {
  try {
    const { titre, description, date, lieu, capacite, type } = req.body;

    if (!titre || !date) {
      return next(new ApiError(400, 'Le titre et la date sont obligatoires'));
    }

    const event = new Evenement({
      titre,
      description,
      date: new Date(date),
      lieu,
      capacite,
      type: type || 'autre',
      organisateurId: req.user._id,
      clubId: req.user.clubId,
    });

    await event.save();
    await event.populate('organisateurId', 'nom prenom email');

    return res.status(201).json({
      success: true,
      message: 'Événement créé avec succès',
      data: {
        id: event._id.toString(),
        titre: event.titre,
        description: event.description,
        date: event.date,
        lieu: event.lieu,
        capacite: event.capacite,
        type: event.type,
        organisateur: `${event.organisateurId.nom} ${event.organisateurId.prenom}`,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateClubEvent(req, res, next) {
  try {
    const { id } = req.params;
    const { titre, description, date, lieu, capacite, type } = req.body;

    const event = await Evenement.findOne({
      _id: id,
      clubId: req.user.clubId,
    });

    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    if (titre) event.titre = titre;
    if (description) event.description = description;
    if (date) event.date = new Date(date);
    if (lieu) event.lieu = lieu;
    if (capacite) event.capacite = capacite;
    if (type) event.type = type;

    await event.save();

    return res.status(200).json({
      success: true,
      message: 'Événement mis à jour avec succès',
      data: {
        id: event._id.toString(),
        titre: event.titre,
        description: event.description,
        date: event.date,
        lieu: event.lieu,
        capacite: event.capacite,
        type: event.type,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteClubEvent(req, res, next) {
  try {
    const { id } = req.params;

    const event = await Evenement.findOne({
      _id: id,
      clubId: req.user.clubId,
    });

    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    // Supprimer les participations associées
    await ParticipationEvenement.deleteMany({ evenementId: event._id });
    await Evenement.deleteOne({ _id: event._id });

    return res.status(200).json({
      success: true,
      message: 'Événement supprimé avec succès',
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// EVENT PARTICIPATIONS & VALIDATIONS
// ============================================================================

async function listEventParticipations(req, res, next) {
  try {
    const { eventId } = req.params;

    const event = await Evenement.findOne({
      _id: eventId,
      clubId: req.user.clubId,
    });

    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    const participations = await ParticipationEvenement.find({
      evenementId: eventId,
    }).populate('utilisateurId', 'nom prenom email role niveau filiere');

    return res.status(200).json({
      success: true,
      data: {
        items: participations.map(p => ({
          id: p._id.toString(),
          utilisateurId: p.utilisateurId._id.toString(),
          utilisateur: `${p.utilisateurId.nom} ${p.utilisateurId.prenom}`,
          email: p.utilisateurId.email,
          role: p.utilisateurId.role,
          niveau: p.utilisateurId.niveau,
          filiere: p.utilisateurId.filiere,
          statut: p.statut,
          dateInscription: p.dateInscription,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function validateEventParticipation(req, res, next) {
  try {
    const { eventId, participationId } = req.params;
    const { statut } = req.body;

    if (!['confirme', 'annule'].includes(statut)) {
      return next(new ApiError(400, 'Statut invalide'));
    }

    const event = await Evenement.findOne({
      _id: eventId,
      clubId: req.user.clubId,
    });

    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    const participation = await ParticipationEvenement.findById(participationId);

    if (!participation || String(participation.evenementId) !== String(event._id)) {
      return next(new ApiError(404, 'Participation non trouvée'));
    }

    participation.statut = statut;
    await participation.save();

    return res.status(200).json({
      success: true,
      message: `Participation ${statut === 'confirme' ? 'confirmée' : 'annulée'}`,
      data: {
        id: participation._id.toString(),
        statut: participation.statut,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function inviteTeacherToEvent(req, res, next) {
  try {
    const { eventId } = req.params;
    const { teacherId, message } = req.body;
    const notificationService = require('../services/notification.service');

    if (!teacherId) {
      return next(new ApiError(400, 'L\'ID de l\'enseignant est obligatoire'));
    }

    const event = await Evenement.findOne({
      _id: eventId,
      clubId: req.user.clubId,
    });

    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    const teacher = await Utilisateur.findOne({
      _id: teacherId,
      role: 'enseignant',
    });

    if (!teacher) {
      return next(new ApiError(404, 'Enseignant non trouvé'));
    }

    // Chercher les modèles
    const { InvitationEvenement } = require('../models');

    // Vérifier si l'invitation existe déjà (toute invitation, quel que soit le statut)
    let invitation = await InvitationEvenement.findOne({
      evenementId: event._id,
      enseignantId: teacherId,
    });

    if (invitation) {
      let errorMessage = 'Une invitation a déjà été envoyée à cet enseignant pour cet événement';
      
      if (invitation.statut === 'accepte') {
        errorMessage = 'L\'invitation a déjà été acceptée par cet enseignant';
      } else if (invitation.statut === 'refuse') {
        errorMessage = 'L\'invitation a déjà été refusée par cet enseignant';
      } else if (invitation.statut === 'en_attente') {
        errorMessage = 'Une invitation est déjà en attente pour cet enseignant';
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    // Créer une nouvelle invitation
    invitation = new (require('../models').InvitationEvenement)({
      evenementId: event._id,
      enseignantId: teacherId,
      clubId: req.user.clubId,
      message,
      statut: 'en_attente',
    });

    await invitation.save();

    // Créer une notification pour l'enseignant
    const club = await Club.findById(req.user.clubId);
    const clubName = club ? club.nom : 'Un club';
    
    try {
      await notificationService.createNotification(
        teacherId,
        'invitation_event',
        'Nouvelle invitation à un événement',
        `${clubName} vous invite à participer à l'événement "${event.nom}".${message ? ` Message: ${message}` : ''}`,
        event._id,
        'event'
      );
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas bloquer la création de l'invitation si la notification échoue
    }

    return res.status(201).json({
      success: true,
      message: 'Invitation envoyée avec succès',
      data: {
        id: invitation._id.toString(),
        evenementId: event._id.toString(),
        enseignantId: teacherId,
        statut: 'en_attente',
        dateInvitation: invitation.dateInvitation,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// PROJECTS MANAGEMENT
// ============================================================================

async function listClubProjects(req, res, next) {
  try {
    const projects = await Projet.find({
      clubId: req.user.clubId,
    })
      .populate('enseignantId', 'nom prenom email')
      .populate('etudiantIds', 'nom prenom email')
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
      etudiants: p.etudiantIds ? p.etudiantIds.map(e => ({
        id: e._id.toString(),
        nom: e.nom,
        prenom: e.prenom,
        email: e.email,
      })) : [],
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

async function createClubProject(req, res, next) {
  try {
    const { titre, description, objectif, dateDebut, deadline, enseignantId } = req.body;

    if (!titre || !deadline) {
      return next(new ApiError(400, 'Le titre et la deadline sont obligatoires'));
    }

    if (enseignantId) {
      const teacher = await Utilisateur.findOne({
        _id: enseignantId,
        role: 'enseignant',
      });

      if (!teacher) {
        return next(new ApiError(404, 'Enseignant non trouvé'));
      }
    }

    const project = new Projet({
      titre,
      description,
      objectif,
      dateDebut: dateDebut ? new Date(dateDebut) : new Date(),
      deadline: new Date(deadline),
      enseignantId: enseignantId || req.user._id,
      clubId: req.user.clubId,
      statut: 'en_attente',
    });

    await project.save();
    await project.populate('enseignantId', 'nom prenom email');

    return res.status(201).json({
      success: true,
      message: 'Projet créé avec succès',
      data: {
        id: project._id.toString(),
        titre: project.titre,
        description: project.description,
        objectif: project.objectif,
        deadline: project.deadline,
        statut: project.statut,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateClubProject(req, res, next) {
  try {
    const { projectId } = req.params;
    const { titre, description, objectif, dateDebut, deadline, statut, progression } = req.body;

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    });

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    if (titre) project.titre = titre;
    if (description) project.description = description;
    if (objectif) project.objectif = objectif;
    if (dateDebut) project.dateDebut = new Date(dateDebut);
    if (deadline) project.deadline = new Date(deadline);
    if (statut) project.statut = statut;
    if (typeof progression === 'number') project.progression = progression;

    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Projet mis à jour avec succès',
      data: {
        id: project._id.toString(),
        titre: project.titre,
        statut: project.statut,
        progression: project.progression,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteClubProject(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    });

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    // Supprimer les tâches associées
    await Tache.deleteMany({ projetId: project._id });
    await Projet.deleteOne({ _id: project._id });

    return res.status(200).json({
      success: true,
      message: 'Projet supprimé avec succès',
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// PROJECT PARTICIPANTS & ROLES
// ============================================================================

async function getProjectParticipants(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    }).populate('etudiantIds', 'nom prenom email');

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    return res.status(200).json({
      success: true,
      data: {
        items: project.etudiantIds.map(e => ({
          id: e._id.toString(),
          nom: e.nom,
          prenom: e.prenom,
          email: e.email,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function addProjectParticipant(req, res, next) {
  try {
    const { projectId } = req.params;
    const { utilisateurId } = req.body;

    if (!utilisateurId) {
      return next(new ApiError(400, 'L\'ID de l\'utilisateur est obligatoire'));
    }

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    });

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    const user = await Utilisateur.findOne({
      _id: utilisateurId,
      role: 'etudiant',
    });

    if (!user) {
      return next(new ApiError(404, 'Étudiant non trouvé'));
    }

    // Vérifier si déjà participant
    if (project.etudiantIds.includes(utilisateurId)) {
      return res.status(200).json({
        success: true,
        message: 'Étudiant déjà participant au projet',
      });
    }

    project.etudiantIds.push(utilisateurId);
    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Participant ajouté avec succès',
    });
  } catch (error) {
    return next(error);
  }
}

async function removeProjectParticipant(req, res, next) {
  try {
    const { projectId, utilisateurId } = req.params;

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    });

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    project.etudiantIds = project.etudiantIds.filter(
      id => String(id) !== String(utilisateurId)
    );

    await project.save();

    return res.status(200).json({
      success: true,
      message: 'Participant supprimé avec succès',
    });
  } catch (error) {
    return next(error);
  }
}

async function inviteTeacherToProject(req, res, next) {
  try {
    const { projectId } = req.params;
    const { teacherId, message } = req.body;
    const notificationService = require('../services/notification.service');

    if (!teacherId) {
      return next(new ApiError(400, 'L\'ID de l\'enseignant est obligatoire'));
    }

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    });

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    const teacher = await Utilisateur.findOne({
      _id: teacherId,
      role: 'enseignant',
    });

    if (!teacher) {
      return next(new ApiError(404, 'Enseignant non trouvé'));
    }

    // Chercher le modèle
    const { InvitationProjet } = require('../models');

    // Vérifier si l'invitation existe déjà (toute invitation, quel que soit le statut)
    let invitation = await InvitationProjet.findOne({
      projetId: project._id,
      enseignantId: teacherId,
    });

    if (invitation) {
      let errorMessage = 'Une invitation a déjà été envoyée à cet enseignant pour ce projet';
      
      if (invitation.statut === 'accepte') {
        errorMessage = 'L\'invitation a déjà été acceptée par cet enseignant';
      } else if (invitation.statut === 'refuse') {
        errorMessage = 'L\'invitation a déjà été refusée par cet enseignant';
      } else if (invitation.statut === 'en_attente') {
        errorMessage = 'Une invitation est déjà en attente pour cet enseignant';
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
      });
    }

    // Créer une nouvelle invitation
    invitation = new InvitationProjet({
      projetId: project._id,
      enseignantId: teacherId,
      clubId: req.user.clubId,
      message,
      statut: 'en_attente',
    });

    await invitation.save();

    // Créer une notification pour l'enseignant
    const club = await Club.findById(req.user.clubId);
    const clubName = club ? club.nom : 'Un club';
    
    try {
      await notificationService.createNotification(
        teacherId,
        'invitation_project',
        'Nouvelle invitation à un projet',
        `${clubName} vous invite à participer au projet "${project.titre}".${message ? ` Message: ${message}` : ''}`,
        project._id,
        'project'
      );
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas bloquer la création de l'invitation si la notification échoue
    }

    return res.status(201).json({
      success: true,
      message: 'Invitation envoyée avec succès',
      data: {
        id: invitation._id.toString(),
        projetId: project._id.toString(),
        enseignantId: teacherId,
        statut: 'en_attente',
        dateInvitation: invitation.dateInvitation,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// EVENT TEACHER INVITATIONS TRACKING
// ============================================================================

async function getEventTeacherInvitations(req, res, next) {
  try {
    const { eventId } = req.params;

    const event = await Evenement.findOne({
      _id: eventId,
      clubId: req.user.clubId,
    });

    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    const invitations = await InvitationEvenement.find({
      evenementId: eventId,
      clubId: req.user.clubId,
    })
      .populate('enseignantId', 'nom prenom email grade')
      .sort({ dateInvitation: -1 });

    return res.status(200).json({
      success: true,
      data: {
        items: invitations.map(inv => ({
          id: inv._id.toString(),
          enseignantId: inv.enseignantId._id.toString(),
          enseignant: `${inv.enseignantId.nom} ${inv.enseignantId.prenom}`,
          email: inv.enseignantId.email,
          grade: inv.enseignantId.grade,
          statut: inv.statut,
          message: inv.message,
          dateInvitation: inv.dateInvitation,
          dateReponse: inv.dateReponse,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function cancelEventInvitation(req, res, next) {
  try {
    const { eventId, invitationId } = req.params;

    const event = await Evenement.findOne({
      _id: eventId,
      clubId: req.user.clubId,
    });

    if (!event) {
      return next(new ApiError(404, 'Événement non trouvé'));
    }

    const invitation = await InvitationEvenement.findOne({
      _id: invitationId,
      evenementId: eventId,
      clubId: req.user.clubId,
    });

    if (!invitation) {
      return next(new ApiError(404, 'Invitation non trouvée'));
    }

    if (invitation.statut !== 'en_attente') {
      return next(new ApiError(400, 'Impossible d\'annuler une invitation déjà traitée'));
    }

    await InvitationEvenement.deleteOne({ _id: invitationId });

    return res.status(200).json({
      success: true,
      message: 'Invitation annulée',
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// PROJECT TEACHER INVITATIONS TRACKING
// ============================================================================

async function getProjectTeacherInvitations(req, res, next) {
  try {
    const { projectId } = req.params;

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    });

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    const invitations = await InvitationProjet.find({
      projetId: projectId,
      clubId: req.user.clubId,
    })
      .populate('enseignantId', 'nom prenom email grade')
      .sort({ dateInvitation: -1 });

    return res.status(200).json({
      success: true,
      data: {
        items: invitations.map(inv => ({
          id: inv._id.toString(),
          enseignantId: inv.enseignantId._id.toString(),
          enseignant: `${inv.enseignantId.nom} ${inv.enseignantId.prenom}`,
          email: inv.enseignantId.email,
          grade: inv.enseignantId.grade,
          statut: inv.statut,
          message: inv.message,
          dateInvitation: inv.dateInvitation,
          dateReponse: inv.dateReponse,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function cancelProjectInvitation(req, res, next) {
  try {
    const { projectId, invitationId } = req.params;

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    });

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    const invitation = await InvitationProjet.findOne({
      _id: invitationId,
      projetId: projectId,
      clubId: req.user.clubId,
    });

    if (!invitation) {
      return next(new ApiError(404, 'Invitation non trouvée'));
    }

    if (invitation.statut !== 'en_attente') {
      return next(new ApiError(400, 'Impossible d\'annuler une invitation déjà traitée'));
    }

    await InvitationProjet.deleteOne({ _id: invitationId });

    return res.status(200).json({
      success: true,
      message: 'Invitation annulée',
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// PROJECT PARTICIPATION REQUESTS
// ============================================================================

async function getProjectParticipationRequests(req, res, next) {
  try {
    const { projectId } = req.params;
    const notificationService = require('../services/notification.service');

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    });

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    const requests = await require('../models').ProjectParticipationRequest.find({
      projetId: projectId,
    })
      .populate('etudiantId', 'nom prenom email niveau filiere')
      .sort({ dateRequete: -1 });

    return res.status(200).json({
      success: true,
      data: {
        requests: requests.map(r => ({
          id: r._id.toString(),
          etudiant: {
            id: r.etudiantId._id.toString(),
            nom: r.etudiantId.nom,
            prenom: r.etudiantId.prenom,
            email: r.etudiantId.email,
            niveau: r.etudiantId.niveau,
            filiere: r.etudiantId.filiere,
          },
          statut: r.statut,
          message: r.message,
          dateRequete: r.dateRequete,
          dateReponse: r.dateReponse,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function respondToParticipationRequest(req, res, next) {
  try {
    const { projectId, requestId } = req.params;
    const { statut } = req.body;
    const notificationService = require('../services/notification.service');

    if (!['accepte', 'refuse'].includes(statut)) {
      return next(new ApiError(400, 'Statut invalide. Doit être "accepte" ou "refuse".'));
    }

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    });

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    const participationRequest = await require('../models').ProjectParticipationRequest.findOne({
      _id: requestId,
      projetId: projectId,
    })
      .populate('etudiantId')
      .populate('clubId');

    if (!participationRequest) {
      return next(new ApiError(404, 'Demande de participation non trouvée'));
    }

    if (participationRequest.statut !== 'en_attente') {
      return next(new ApiError(400, 'Cette demande a déjà été traitée'));
    }

    // Mettre à jour le statut de la demande
    participationRequest.statut = statut;
    participationRequest.dateReponse = new Date();
    await participationRequest.save();

    // Si acceptée, ajouter l'étudiant au projet
    if (statut === 'accepte') {
      if (!project.etudiantIds.includes(participationRequest.etudiantId._id)) {
        project.etudiantIds.push(participationRequest.etudiantId._id);
        await project.save();
      }
    }

    // Créer une notification pour l'étudiant
    try {
      const notificationType = statut === 'accepte' ? 'participation_approved' : 'participation_rejected';
      const notificationMessage = statut === 'accepte' 
        ? `Votre demande de participation au projet "${project.titre}" a été acceptée!`
        : `Votre demande de participation au projet "${project.titre}" a été refusée.`;
      
      await notificationService.createNotification(
        participationRequest.etudiantId._id.toString(),
        notificationType,
        `Réponse à votre demande de participation`,
        notificationMessage,
        participationRequest._id,
        'participation'
      );
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas bloquer la réponse si la notification échoue
    }

    return res.status(200).json({
      success: true,
      message: `Demande de participation ${statut === 'accepte' ? 'acceptée' : 'refusée'}`,
      data: {
        id: participationRequest._id.toString(),
        statut: participationRequest.statut,
        dateReponse: participationRequest.dateReponse,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function cancelParticipationRequest(req, res, next) {
  try {
    const { projectId, requestId } = req.params;

    const project = await Projet.findOne({
      _id: projectId,
      clubId: req.user.clubId,
    });

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    const participationRequest = await require('../models').ProjectParticipationRequest.findOne({
      _id: requestId,
      projetId: projectId,
    });

    if (!participationRequest) {
      return next(new ApiError(404, 'Demande de participation non trouvée'));
    }

    if (participationRequest.statut !== 'en_attente') {
      return next(new ApiError(400, 'Seules les demandes en attente peuvent être annulées'));
    }

    await require('../models').ProjectParticipationRequest.deleteOne({ _id: requestId });

    return res.status(200).json({
      success: true,
      message: 'Demande de participation annulée',
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getClubStats,
  getAvailableTeachers,
  getClubProfile,
  updateClubProfile,
  listClubEvents,
  createClubEvent,
  updateClubEvent,
  deleteClubEvent,
  listEventParticipations,
  validateEventParticipation,
  inviteTeacherToEvent,
  getEventTeacherInvitations,
  cancelEventInvitation,
  listClubProjects,
  createClubProject,
  updateClubProject,
  deleteClubProject,
  getProjectParticipants,
  addProjectParticipant,
  removeProjectParticipant,
  inviteTeacherToProject,
  getProjectTeacherInvitations,
  cancelProjectInvitation,
  getProjectParticipationRequests,
  respondToParticipationRequest,
  cancelParticipationRequest,
};
