function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'P2002') {
    return res.status(409).json({ error: `Duplicate value for field: ${err.meta?.target}` });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Invalid reference to a related record' });
  }

  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
