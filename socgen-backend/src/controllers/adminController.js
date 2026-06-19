const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');
const { logAction } = require('../utils/auditLogger');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const where = {};
  if (req.query.departmentId) where.departmentId = req.query.departmentId;
  if (req.query.role) where.role = req.query.role;

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, email: true, name: true, role: true, departmentId: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ data, total, page, pageSize: limit });
});

// POST /api/admin/users
const createUser = asyncHandler(async (req, res) => {
  const { email, name, password, role, departmentId } = req.body;
  if (!email || !name || !password || !role) {
    return res.status(400).json({ error: 'email, name, password, and role are required' });
  }
  const validRoles = ['REQUESTER', 'APPROVER', 'SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: `role must be one of ${validRoles.join(', ')}` });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, passwordHash, role, departmentId: departmentId || null },
  });

  await logAction({ req, action: 'CREATE_USER', resourceType: 'users', resourceId: user.id, newValue: { email, role } });

  res.status(201).json({ id: user.id, email: user.email, role: user.role });
});

// PUT /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const { role, departmentId, isActive, name } = req.body;
  const data = {};
  if (role !== undefined) data.role = role;
  if (departmentId !== undefined) data.departmentId = departmentId;
  if (isActive !== undefined) data.isActive = isActive;
  if (name !== undefined) data.name = name;

  const user = await prisma.user.update({ where: { id: req.params.id }, data });

  await logAction({ req, action: 'UPDATE_USER', resourceType: 'users', resourceId: user.id, newValue: data });

  res.json({ id: user.id, role: user.role, isActive: user.isActive });
});

// POST /api/admin/exception-types
const createExceptionType = asyncHandler(async (req, res) => {
  const { name, baseRiskScore, description } = req.body;
  if (!name || baseRiskScore === undefined) {
    return res.status(400).json({ error: 'name and baseRiskScore are required' });
  }
  const type = await prisma.exceptionType.create({ data: { name, baseRiskScore, description } });
  res.status(201).json(type);
});

// POST /api/admin/policies
const createPolicy = asyncHandler(async (req, res) => {
  const { policyCode, title, description, severity, ownerDepartmentId } = req.body;
  if (!policyCode || !title || !ownerDepartmentId) {
    return res.status(400).json({ error: 'policyCode, title, and ownerDepartmentId are required' });
  }
  const policy = await prisma.policy.create({
    data: { policyCode, title, description, severity: severity || 'MEDIUM', ownerDepartmentId },
  });
  res.status(201).json(policy);
});

// GET /api/admin/metrics - system-wide stats for the admin dashboard
const systemMetrics = asyncHandler(async (req, res) => {
  const [userCount, exceptionCount, activeCount, departmentCount] = await Promise.all([
    prisma.user.count(),
    prisma.exception.count(),
    prisma.exception.count({ where: { status: 'ACTIVE' } }),
    prisma.department.count(),
  ]);
  res.json({ userCount, exceptionCount, activeCount, departmentCount });
});

module.exports = { listUsers, createUser, updateUser, createExceptionType, createPolicy, systemMetrics };
