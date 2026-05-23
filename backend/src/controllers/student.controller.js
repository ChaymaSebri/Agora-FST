const { Projet, ProjectParticipationRequest, Utilisateur, Club } = require('../models');
const ApiError = require('../utils/apiError');
const notificationService = require('../services/notification.service');

// ============================================================================
// REQUEST PARTICIPATION
// ============================================================================

async function requestProjectParticipation(req, res, next) {
  try {
    const { projectId } = req.params;
    const { message } = req.body;
    const studentId = req.user._id;

    // Vérifier que le projet existe
    const project = await Projet.findById(projectId).populate('clubId');

    if (!project) {
      return next(new ApiError(404, 'Projet non trouvé'));
    }

    // Vérifier que l'étudiant n'est pas déjà participant
    if (project.etudiantIds.includes(studentId)) {
      return next(new ApiError(400, 'Vous participez déjà à ce projet'));
    }

    // Vérifier s'il y a déjà une demande en attente ou acceptée
    const existingRequest = await ProjectParticipationRequest.findOne({
      projetId: projectId,
      etudiantId: studentId,
      statut: { $in: ['en_attente', 'accepte'] },
    });

    if (existingRequest) {
      if (existingRequest.statut === 'accepte') {
        return next(new ApiError(400, 'Vous participez déjà à ce projet'));
      }
      return next(new ApiError(400, 'Vous avez déjà une demande en attente pour ce projet'));
    }

    // Créer la demande de participation
    const participationRequest = new ProjectParticipationRequest({
      projetId: projectId,
      etudiantId: studentId,
      clubId: project.clubId._id,
      message,
      statut: 'en_attente',
    });

    await participationRequest.save();

    // Créer une notification pour le club
    try {
      const student = await Utilisateur.findById(studentId);
      const studentName = `${student.prenom} ${student.nom}`;
      
      await notificationService.createNotification(
        project.clubId._id.toString(),
        'participation_request',
        'Demande de participation à un projet',
        `${studentName} a demandé à participer au projet "${project.titre}".${message ? ` Message: ${message}` : ''}`,
        participationRequest._id,
        'participation'
      );
    } catch (notifError) {
      console.error('Erreur lors de la création de la notification:', notifError);
      // Ne pas bloquer la création de la demande
    }

    return res.status(201).json({
      success: true,
      message: 'Demande de participation envoyée avec succès',
      data: {
        id: participationRequest._id.toString(),
        projetId: projectId,
        statut: 'en_attente',
        dateRequete: participationRequest.dateRequete,
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ============================================================================
// GET STUDENT PARTICIPATION REQUESTS
// ============================================================================

async function getMyParticipationRequests(req, res, next) {
  try {
    const studentId = req.user._id;

    const requests = await ProjectParticipationRequest.find({
      etudiantId: studentId,
    })
      .populate('projetId', 'titre description deadline statut')
      .populate('clubId', 'nom')
      .sort({ dateRequete: -1 });

    return res.status(200).json({
      success: true,
      data: {
        requests: requests.map(r => ({
          id: r._id.toString(),
          projet: {
            id: r.projetId._id.toString(),
            titre: r.projetId.titre,
            description: r.projetId.description,
            deadline: r.projetId.deadline,
            statut: r.projetId.statut,
          },
          club: {
            id: r.clubId._id.toString(),
            nom: r.clubId.nom,
          },
          statut: r.statut,
          dateRequete: r.dateRequete,
          dateReponse: r.dateReponse,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  requestProjectParticipation,
  getMyParticipationRequests,
};
