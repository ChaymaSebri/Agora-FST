const { Club, ClubMembershipRequest } = require('../models');
const ApiError = require('../utils/apiError');

function buildFullName(user) {
  return [user.prenom, user.nom].filter(Boolean).join(' ').trim();
}

function serializeClub(club) {
  return {
    id: club._id.toString(),
    nom: club.nom,
    description: club.description,
    specialite: club.specialite,
    statut: club.statut,
    membersCount: Array.isArray(club.membreIds) ? club.membreIds.length : 0,
  };
}

function serializeMembershipRequest(request) {
  const clubDoc = request.clubId;
  const memberDoc = request.memberId;
  const resolvedByDoc = request.resolvedBy;

  return {
    id: request._id.toString(),
    status: request.status,
    requestedAt: request.requestedAt,
    resolvedAt: request.resolvedAt,
    club: clubDoc
      ? {
          id: clubDoc._id ? clubDoc._id.toString() : String(clubDoc),
          nom: clubDoc.nom || '',
          description: clubDoc.description || '',
          specialite: clubDoc.specialite || '',
          statut: clubDoc.statut || 'actif',
        }
      : null,
    member: memberDoc
      ? {
          id: memberDoc._id ? memberDoc._id.toString() : String(memberDoc),
          email: memberDoc.email || '',
          full_name: memberDoc.nom || memberDoc.prenom ? buildFullName(memberDoc) : '',
          role: memberDoc.role || '',
        }
      : null,
    resolvedBy: resolvedByDoc
      ? {
          id: resolvedByDoc._id ? resolvedByDoc._id.toString() : String(resolvedByDoc),
          email: resolvedByDoc.email || '',
          full_name: resolvedByDoc.nom || resolvedByDoc.prenom ? buildFullName(resolvedByDoc) : '',
          role: resolvedByDoc.role || '',
        }
      : null,
  };
}

async function listClubs(req, res, next) {
  try {
    const clubs = await Club.find({}).sort({ nom: 1 });

    return res.status(200).json({
      success: true,
      data: {
        items: clubs.map(serializeClub),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function requestMembership(req, res, next) {
  try {
    const { clubId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      throw new ApiError(401, 'Authentification requise');
    }

    const club = await Club.findById(clubId);
    if (!club) {
      throw new ApiError(404, 'Club introuvable');
    }

    const alreadyMember = Array.isArray(club.membreIds)
      ? club.membreIds.some((memberId) => String(memberId) === String(userId))
      : false;

    if (alreadyMember) {
      throw new ApiError(409, 'Vous êtes déjà membre de ce club');
    }

    const existingRequest = await ClubMembershipRequest.findOne({ clubId: club._id, memberId: userId });
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        throw new ApiError(409, 'Votre demande est déjà en attente');
      }

      if (existingRequest.status === 'accepted') {
        throw new ApiError(409, 'Vous êtes déjà membre de ce club');
      }
    }

    const request = await ClubMembershipRequest.create({
      clubId: club._id,
      memberId: userId,
      status: 'pending',
    });

    return res.status(201).json({
      success: true,
      data: serializeMembershipRequest(request),
    });
  } catch (error) {
    return next(error);
  }
}

async function listMyMembershipRequests(req, res, next) {
  try {
    const requests = await ClubMembershipRequest.find({ memberId: req.user._id })
      .populate('clubId', 'nom description specialite statut membreIds')
      .sort({ requestedAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        items: requests.map(serializeMembershipRequest),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function listClubMembershipRequests(req, res, next) {
  try {
    const clubId = req.user?.clubId;

    if (!clubId) {
      throw new ApiError(404, 'Aucun club associé à ce compte');
    }

    const requests = await ClubMembershipRequest.find({ clubId, status: 'pending' })
      .populate('clubId', 'nom description specialite statut')
      .populate('memberId', 'email nom prenom role createdAt')
      .sort({ requestedAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        items: requests.map(serializeMembershipRequest),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function resolveMembershipRequest(req, res, next) {
  try {
    const { requestId } = req.params;
    const action = String(req.body.action || '').toLowerCase();

    if (!['accept', 'deny'].includes(action)) {
      throw new ApiError(400, 'action doit etre accept ou deny');
    }

    const clubId = req.user?.clubId;
    if (!clubId) {
      throw new ApiError(404, 'Aucun club associé à ce compte');
    }

    const request = await ClubMembershipRequest.findOne({ _id: requestId, clubId })
      .populate('clubId', 'nom description specialite statut membreIds')
      .populate('memberId', 'email nom prenom role createdAt')
      .populate('resolvedBy', 'email nom prenom role');

    if (!request) {
      throw new ApiError(404, 'Demande introuvable');
    }

    if (request.status !== 'pending') {
      throw new ApiError(409, 'Cette demande a déjà été traitée');
    }

    if (action === 'accept') {
      request.status = 'accepted';
      request.resolvedAt = new Date();
      request.resolvedBy = req.user._id;
      await request.save();

      await Club.findByIdAndUpdate(clubId, {
        $addToSet: { membreIds: request.memberId._id },
      });

      const updatedRequest = await ClubMembershipRequest.findById(request._id)
        .populate('clubId', 'nom description specialite statut')
        .populate('memberId', 'email nom prenom role createdAt')
        .populate('resolvedBy', 'email nom prenom role');

      return res.status(200).json({
        success: true,
        data: serializeMembershipRequest(updatedRequest),
      });
    }

    await ClubMembershipRequest.deleteOne({ _id: request._id });

    return res.status(200).json({
      success: true,
      data: {
        id: request._id.toString(),
        status: 'denied',
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listClubs,
  requestMembership,
  listMyMembershipRequests,
  listClubMembershipRequests,
  resolveMembershipRequest,
};
