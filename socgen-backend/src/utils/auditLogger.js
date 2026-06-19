const prisma = require('../prismaClient');

/**
 * Writes an immutable audit log entry. Never throws — a logging failure
 * should never block the actual business operation.
 */
async function logAction({ req, userId, exceptionId, action, resourceType, resourceId, oldValue, newValue }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || (req && req.user ? req.user.id : null),
        exceptionId: exceptionId || null,
        action,
        resourceType,
        resourceId: resourceId || null,
        oldValue: oldValue || undefined,
        newValue: newValue || undefined,
        ipAddress: req ? (req.ip || req.headers['x-forwarded-for'] || null) : null,
      },
    });
  } catch (err) {
    console.error('Audit log write failed:', err.message);
  }
}

module.exports = { logAction };
