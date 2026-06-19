const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/audit-logs?user=&action=&resource=&startDate=&endDate=&page=1
const listAuditLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const { user, action, resource, startDate, endDate } = req.query;

  const where = {};
  if (user) where.userId = user;
  if (action) where.action = action;
  if (resource) where.resourceType = resource;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ data, total, page, pageSize: limit });
});

// GET /api/audit-logs/:exceptionId  -> full timeline for one exception
const exceptionTimeline = asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    where: { exceptionId: req.params.exceptionId },
    orderBy: { createdAt: 'asc' },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  res.json({
    timeline: logs.map((l) => ({
      action: l.action,
      user: l.user ? { id: l.user.id, name: l.user.name } : null,
      timestamp: l.createdAt,
      oldValue: l.oldValue,
      newValue: l.newValue,
    })),
  });
});

module.exports = { listAuditLogs, exceptionTimeline };
