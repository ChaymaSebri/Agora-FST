function responseMiddleware(req, res, next) {
  // Store the original json method
  const originalJson = res.json.bind(res);

  // Override the json method to wrap responses
  res.json = function (data) {
    // If data is already in the wrapped format, return as-is
    if (data?.success === true || data?.success === false) {
      return originalJson(data);
    }

    // If response is an error (status >= 400), don't wrap it
    if (res.statusCode >= 400) {
      return originalJson(data);
    }

    // Wrap successful responses
    return originalJson({
      success: true,
      data,
    });
  };

  next();
}

module.exports = responseMiddleware;
