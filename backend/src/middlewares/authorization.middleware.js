const ApiError = require('../utils/apiError');

/**
 * Middleware pour vérifier qu'un utilisateur authentifié a un rôle spécifique
 * @param {...string} roles - Les rôles autorisés
 * @returns {Function} Middleware Express
 */
function checkRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentification requise'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Accès refusé. Rôles requis: ${roles.join(', ')}`
        )
      );
    }

    return next();
  };
}

/**
 * Middleware pour vérifier qu'un utilisateur est admin
 */
function isAdmin(req, res, next) {
  return checkRole('admin')(req, res, next);
}

/**
 * Middleware pour vérifier qu'un utilisateur est admin ou bureau exécutif
 */
function isAdminOrExecutive(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentification requise'));
  }

  // Vérifier le rôle ou si c'est un représentant de club
  const isAuthorized = req.user.role === 'admin';
  
  if (!isAuthorized) {
    return next(
      new ApiError(403, 'Accès refusé. Seul un administrateur peut accéder à cette ressource.')
    );
  }

  return next();
}

/**
 * Middleware pour vérifier qu'un utilisateur est admin, enseignant ou bureau exécutif
 */
function isAuthorizedForContent(req, res, next) {
  if (!req.user) {
    return next(new ApiError(401, 'Authentification requise'));
  }

  const authorizedRoles = ['admin', 'enseignant', 'club'];
  
  if (!authorizedRoles.includes(req.user.role)) {
    return next(
      new ApiError(403, 'Accès refusé.')
    );
  }

  return next();
}

module.exports = {
  checkRole,
  isAdmin,
  isAdminOrExecutive,
  isAuthorizedForContent,
};
