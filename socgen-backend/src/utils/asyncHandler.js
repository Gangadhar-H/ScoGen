// Wraps an async route handler so thrown errors reach errorHandler middleware
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

module.exports = asyncHandler;
