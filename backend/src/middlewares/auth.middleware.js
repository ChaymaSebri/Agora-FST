const jwt = require('jsonwebtoken');

const { Utilisateur } = require('../models');
const ApiError = require('../utils/apiError');

function extractBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

async function authenticate(req, res, next) {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw new ApiError(401, 'Token manquant ou invalide');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new ApiError(500, 'JWT_SECRET manquant dans les variables d environnement');
    }

    const payload = jwt.verify(token, secret);
    const user = await Utilisateur.findById(payload.sub).select('-motDePasse');

    if (!user) {
      throw new ApiError(401, 'Utilisateur introuvable pour ce token');
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expire'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Token invalide'));
    }

    return next(error);
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentification requise'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Acces refuse pour ce role'));
    }

    return next();
  };
}

module.exports = {
  authenticate,
  authorizeRoles,
};
