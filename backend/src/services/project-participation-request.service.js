const { ProjectParticipationRequest, Projet, Utilisateur, ParticipationEvenement } = require('../models');
const ApiError = require('../utils/apiError');
const notificationService = require('./notification.service');

function toResponse(request) {
  return {
    id: request._id.toString(),
    projectId: request.projectId?._id ? request.projectId._id.toString() : String(request.projectId),
    studentId: request.studentId?._id ? request.studentId._id.toString() : String(request.studentId),
    clubId: request.clubId?._id ? request.clubId._id.toString() : String(request.clubId),
    message: request.message || '',
    status: request.status || 'pending',
    reviewedBy: request.reviewedBy?._id ? request.reviewedBy._id.toString() : (request.reviewedBy ? String(request.reviewedBy) : null),
    reviewedAt: request.reviewedAt || null,
    dateRequete: request.dateRequete || request.createdAt,
    dateReponse: request.dateReponse || request.reviewedAt || null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    student: request.studentId && request.studentId._id ? {
      id: request.studentId._id.toString(),
      nom: request.studentId.nom,
      prenom: request.studentId.prenom,
      email: request.studentId.email,
      niveau: request.studentId.niveau,
      filiere: request.studentId.filiere,
    } : undefined,
    project: request.projectId && request.projectId._id ? {
      id: request.projectId._id.toString(),
      titre: request.projectId.titre,
      description: request.projectId.description,
      deadline: request.projectId.deadline,
      statut: request.projectId.statut,
    } : undefined,
  };
}

class ProjectParticipationRequestService {
  async createRequest({ projectId, studentId, message }) {
    const project = await Projet.findById(projectId).populate('clubId', 'nom');
    if (!project) {
      throw new ApiError(404, 'Projet non trouvé');
    }

    if (!project.clubId) {
      throw new ApiError(400, 'Ce projet n\'est associé à aucun club');
    }

    const student = await Utilisateur.findById(studentId);
    if (!student) {
      throw new ApiError(404, 'Étudiant non trouvé');
    }

    if (student.role !== 'etudiant') {
      throw new ApiError(403, 'Seul un étudiant peut créer une demande de participation');
    }

    const alreadyParticipating = Array.isArray(project.etudiantIds)
      ? project.etudiantIds.some((participantId) => String(participantId) === String(studentId))
      : false;

    if (alreadyParticipating) {
      throw new ApiError(400, 'Vous participez déjà à ce projet');
    }

    const existingRequest = await ProjectParticipationRequest.findOne({
      projectId,
      studentId,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        throw new ApiError(400, 'Vous participez déjà à ce projet');
      }
      throw new ApiError(400, 'Vous avez déjà une demande en attente pour ce projet');
    }

    const request = await ProjectParticipationRequest.create({
      projectId,
      projetId: projectId,
      studentId,
      etudiantId: studentId,
      clubId: project.clubId._id.toString(),
      message,
      status: 'pending',
      statut: 'en_attente',
    });

    try {
      const studentName = `${student.prenom} ${student.nom}`.trim();
      await notificationService.createNotification(
        project.clubId._id.toString(),
        'participation_request',
        'Demande de participation à un projet',
        `${studentName} a demandé à participer au projet "${project.titre}".${message ? ` Message: ${message}` : ''}`,
        request._id,
        'participation'
      );
    } catch (error) {
      console.error('Erreur lors de la notification du club:', error);
    }

    return toResponse(await request.populate([
      { path: 'studentId', select: 'nom prenom email niveau filiere' },
      { path: 'projectId', select: 'titre description deadline statut' },
    ]));
  }

  async getMyRequests(studentId) {
    const requests = await ProjectParticipationRequest.find({ studentId })
      .populate('studentId', 'nom prenom email niveau filiere')
      .populate('projectId', 'titre description deadline statut clubId')
      .sort({ createdAt: -1 });

    return requests.map(toResponse);
  }

  async getRequestsForProject({ projectId, clubId }) {
    const project = await Projet.findOne({ _id: projectId, clubId })
      .populate('clubId', 'nom');

    if (!project) {
      throw new ApiError(404, 'Projet non trouvé');
    }

    const requests = await ProjectParticipationRequest.find({ projectId })
      .populate('studentId', 'nom prenom email niveau filiere')
      .populate('projectId', 'titre description deadline statut clubId')
      .sort({ createdAt: -1 });

    return requests.map(toResponse);
  }

  async acceptRequest({ requestId, clubId, reviewerId }) {
    const request = await ProjectParticipationRequest.findById(requestId)
      .populate('studentId', 'nom prenom email')
      .populate('projectId');

    if (!request) {
      throw new ApiError(404, 'Demande de participation non trouvée');
    }

    const project = await Projet.findOne({ _id: request.projectId._id, clubId });
    if (!project) {
      throw new ApiError(403, 'Seul le club organisateur du projet peut valider cette demande');
    }

    if (request.status !== 'pending') {
      throw new ApiError(400, 'Cette demande a déjà été traitée');
    }

    if (Array.isArray(project.etudiantIds) && project.etudiantIds.some((participantId) => String(participantId) === String(request.studentId._id))) {
      throw new ApiError(400, 'Cet étudiant participe déjà à ce projet');
    }

    request.status = 'accepted';
    request.statut = 'confirme';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    await request.save();

    if (!Array.isArray(project.etudiantIds)) {
      project.etudiantIds = [];
    }

    if (!project.etudiantIds.some((participantId) => String(participantId) === String(request.studentId._id))) {
      project.etudiantIds.push(request.studentId._id);
      await project.save();
    }

    try {
      await notificationService.createNotification(
        request.studentId._id.toString(),
        'participation_approved',
        'Demande acceptée',
        `Votre demande de participation au projet "${project.titre}" a été acceptée.`,
        request._id,
        'participation'
      );
    } catch (error) {
      console.error('Erreur lors de la notification de l\'étudiant:', error);
    }

    return toResponse(request);
  }

  async rejectRequest({ requestId, clubId, reviewerId }) {
    const request = await ProjectParticipationRequest.findById(requestId)
      .populate('studentId', 'nom prenom email')
      .populate('projectId');

    if (!request) {
      throw new ApiError(404, 'Demande de participation non trouvée');
    }

    const project = await Projet.findOne({ _id: request.projectId._id, clubId });
    if (!project) {
      throw new ApiError(403, 'Seul le club organisateur du projet peut refuser cette demande');
    }

    if (request.status !== 'pending') {
      throw new ApiError(400, 'Cette demande a déjà été traitée');
    }

    request.status = 'rejected';
    request.statut = 'annule';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    await request.save();

    try {
      await notificationService.createNotification(
        request.studentId._id.toString(),
        'participation_rejected',
        'Demande refusée',
        `Votre demande de participation au projet "${project.titre}" a été refusée.`,
        request._id,
        'participation'
      );
    } catch (error) {
      console.error('Erreur lors de la notification de l\'étudiant:', error);
    }

    return toResponse(request);
  }

  async cancelRequest({ requestId, studentId }) {
    const request = await ProjectParticipationRequest.findById(requestId).populate('projectId');

    if (!request) {
      throw new ApiError(404, 'Demande de participation non trouvée');
    }

    if (String(request.studentId) !== String(studentId)) {
      throw new ApiError(403, 'Vous ne pouvez annuler que vos propres demandes');
    }

    if (request.status !== 'pending') {
      throw new ApiError(400, 'Seules les demandes en attente peuvent être annulées');
    }

    request.status = 'cancelled';
    request.statut = 'annule';
    request.reviewedAt = new Date();
    await request.save();

    return toResponse(request);
  }
}

module.exports = new ProjectParticipationRequestService();
