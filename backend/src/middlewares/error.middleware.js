function errorMiddleware(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code,
    },
  });
}

module.exports = errorMiddleware;
