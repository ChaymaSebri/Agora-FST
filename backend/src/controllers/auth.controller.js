const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const result = await authService.verifyEmail(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function resendVerificationCode(req, res, next) {
  try {
    const result = await authService.resendVerificationCode(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    const result = await authService.requestPasswordReset(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res) {
  return res.status(200).json({
    message: 'Deconnexion reussie',
  });
}

async function me(req, res) {
  return res.status(200).json({
    user: req.user,
  });
}

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerificationCode,
  requestPasswordReset,
  resetPassword,
  logout,
  me,
};
