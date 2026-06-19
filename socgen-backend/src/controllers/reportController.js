const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');
const { detectAnomalies } = require('../utils/anomalyDetector');

// GET /api/reports/active-exceptions
const activeExceptions = asyncHandler(async (req, res) => {
  const { departmentId, startDate, endDate } = req.query;
  const where = { status: 'ACTIVE' };
  if (departmentId) where.departmentId = departmentId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const data = await prisma.exception.findMany({
    where,
    include: { exceptionType: true, department: true, requester: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const byDepartment = {};
  const byType = {};
  const byRiskLevel = {};
  for (const e of data) {
    byDepartment[e.department.name] = (byDepartment[e.department.name] || 0) + 1;
    byType[e.exceptionType.name] = (byType[e.exceptionType.name] || 0) + 1;
    byRiskLevel[e.riskLevel] = (byRiskLevel[e.riskLevel] || 0) + 1;
  }

  res.json({ count: data.length, byDepartment, byType, byRiskLevel, data });
});

// GET /api/reports/expired-exceptions
const expiredExceptions = asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const where = { status: 'EXPIRED' };
  if (departmentId) where.departmentId = departmentId;

  const data = await prisma.exception.findMany({
    where,
    include: { exceptionType: true, department: true },
    orderBy: { expiryDate: 'desc' },
  });

  res.json({ count: data.length, data });
});

// GET /api/reports/critical-exceptions
const criticalExceptions = asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const where = { riskLevel: 'CRITICAL' };
  if (departmentId) where.departmentId = departmentId;

  const data = await prisma.exception.findMany({
    where,
    include: { exceptionType: true, department: true, requester: { select: { id: true, name: true } } },
    orderBy: { riskScore: 'desc' },
  });

  res.json({ count: data.length, data });
});

// GET /api/reports/department-wise
const departmentWise = asyncHandler(async (req, res) => {
  const grouped = await prisma.exception.groupBy({
    by: ['departmentId', 'status'],
    _count: { id: true },
  });

  const departments = await prisma.department.findMany();
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  const result = {};
  for (const g of grouped) {
    const name = deptMap[g.departmentId] || g.departmentId;
    if (!result[name]) result[name] = {};
    result[name][g.status] = g._count.id;
  }

  res.json({ data: result });
});

// GET /api/reports/compliance-impact?framework=NIST
const complianceImpact = asyncHandler(async (req, res) => {
  const { framework } = req.query;

  const frameworks = await prisma.complianceFramework.findMany({
    where: framework ? { name: { contains: framework, mode: 'insensitive' } } : {},
    include: {
      exceptionTypes: {
        include: { exceptionType: { include: { exceptions: true } } },
      },
    },
  });

  const result = frameworks.map((f) => {
    const exceptionTypeNames = f.exceptionTypes.map((j) => j.exceptionType.name);
    const exceptionCount = f.exceptionTypes.reduce((sum, j) => sum + j.exceptionType.exceptions.length, 0);
    return {
      framework: f.name,
      controlCode: f.controlCode,
      mappedExceptionTypes: exceptionTypeNames,
      exceptionCount,
    };
  });

  res.json({ data: result });
});

// GET /api/reports/dashboard
const dashboard = asyncHandler(async (req, res) => {
  const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const where = {};
  if (req.user.role === 'APPROVER' || req.user.role === 'REQUESTER') {
    where.departmentId = req.user.departmentId;
  }

  const [activeCount, expiringSoon, pendingApprovals, highRiskCount, anomalies] = await Promise.all([
    prisma.exception.count({ where: { ...where, status: 'ACTIVE' } }),
    prisma.exception.count({ where: { ...where, status: 'ACTIVE', expiryDate: { lte: sevenDaysOut, gte: new Date() } } }),
    prisma.approval.count({ where: { decision: 'PENDING' } }),
    prisma.exception.count({ where: { ...where, riskLevel: { in: ['HIGH', 'CRITICAL'] } } }),
    detectAnomalies(),
  ]);

  res.json({
    activeCount,
    expiringSoon,
    pendingApprovals,
    highRiskCount,
    anomalyCount: anomalies.length,
  });
});

module.exports = { activeExceptions, expiredExceptions, criticalExceptions, departmentWise, complianceImpact, dashboard };
