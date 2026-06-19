const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');
const { signToken } = require('../utils/jwt');
const { logAction } = require('../utils/auditLogger');
const asyncHandler = require('../utils/asyncHandler');

const register = asyncHandler(async (req, res) => {
  const { email, password, name, departmentId, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'A user with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      departmentId: departmentId || null,
      // Self-registration defaults to REQUESTER. Other roles are assigned by an admin.
      role: role && role === 'REQUESTER' ? 'REQUESTER' : 'REQUESTER',
    },
  });

  const token = signToken({ id: user.id, role: user.role });

  await logAction({ req, userId: user.id, action: 'REGISTER', resourceType: 'users', resourceId: user.id });

  res.status(201).json({ id: user.id, email: user.email, name: user.name, role: user.role, token });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken({ id: user.id, role: user.role });

  await logAction({ req, userId: user.id, action: 'LOGIN', resourceType: 'users', resourceId: user.id });

  res.json({ id: user.id, email: user.email, name: user.name, role: user.role, departmentId: user.departmentId, token });
});

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { department: true },
  });
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
  });
});

module.exports = { register, login, me };
