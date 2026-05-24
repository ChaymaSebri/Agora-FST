const ApiError = require('../utils/apiError');
const projectParticipationRequestService = require('../services/project-participation-request.service');

async function createRequest(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'etudiant') {
      throw new ApiError(403, 'Seul un étudiant peut créer une demande de participation');
    }

    const { projectId, message } = req.body;
    if (!projectId) {
      throw new ApiError(400, 'projectId est requis');
    }

    const request = await projectParticipationRequestService.createRequest({
      projectId,
      studentId: req.user._id,
      message,
    });

    return res.status(201).json({
      success: true,
      message: 'Demande envoyée avec succès',
      data: request,
    });
  } catch (error) {
    return next(error);
  }
}

async function getMyRequests(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'etudiant') {
      throw new ApiError(403, 'Seul un étudiant peut consulter ses demandes');
    }

    const requests = await projectParticipationRequestService.getMyRequests(req.user._id);

    return res.status(200).json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    return next(error);
  }
}

async function getProjectRequests(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'club' || !req.user.clubId) {
      throw new ApiError(403, 'Seul le club organisateur peut consulter les demandes');
    }

    const { projectId } = req.params;
    const requests = await projectParticipationRequestService.getRequestsForProject({
      projectId,
      clubId: req.user.clubId,
    });

    return res.status(200).json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    return next(error);
  }
}

async function acceptRequest(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'club' || !req.user.clubId) {
      throw new ApiError(403, 'Seul le club organisateur peut accepter une demande');
    }

    const { id } = req.params;
    const request = await projectParticipationRequestService.acceptRequest({
      requestId: id,
      clubId: req.user.clubId,
      reviewerId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Demande acceptée',
      data: request,
    });
  } catch (error) {
    return next(error);
  }
}

async function rejectRequest(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'club' || !req.user.clubId) {
      throw new ApiError(403, 'Seul le club organisateur peut refuser une demande');
    }

    const { id } = req.params;
    const request = await projectParticipationRequestService.rejectRequest({
      requestId: id,
      clubId: req.user.clubId,
      reviewerId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Demande refusée',
      data: request,
    });
  } catch (error) {
    return next(error);
  }
}

async function cancelRequest(req, res, next) {
  try {
    if (!req.user || req.user.role !== 'etudiant') {
      throw new ApiError(403, 'Seul un étudiant peut annuler sa demande');
    }

    const { id } = req.params;
    const request = await projectParticipationRequestService.cancelRequest({
      requestId: id,
      studentId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: 'Demande annulée',
      data: request,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createRequest,
  getMyRequests,
  getProjectRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
};
