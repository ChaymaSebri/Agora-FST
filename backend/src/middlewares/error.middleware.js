function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;

  if (status >= 500) {
    console.error(err);
  } else {
    console.warn(`[${status}] ${err.message}`);
  }

  res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      code: err.code,
    },
  });
}

module.exports = errorMiddleware;
