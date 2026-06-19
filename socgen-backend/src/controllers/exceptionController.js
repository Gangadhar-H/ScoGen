const prisma = require('../prismaClient');
const { calculateRisk } = require('../utils/riskEngine');
const { logAction } = require('../utils/auditLogger');
const { notify, notifyRole } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

const ROLES_THAT_SEE_ALL = ['SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'];

// POST /api/exceptions
const createException = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    businessJustification,
    systemAffected,
    exceptionTypeId,
    policyId,
    departmentId,
    startDate,
    expiryDate,
  } = req.body;

  if (!title || !businessJustification || !systemAffected || !exceptionTypeId || !departmentId) {
    return res.status(400).json({
      error: 'title, businessJustification, systemAffected, exceptionTypeId, and departmentId are required',
    });
  }

  const exceptionType = await prisma.exceptionType.findUnique({ where: { id: exceptionTypeId } });
  if (!exceptionType) return res.status(400).json({ error: 'Invalid exceptionTypeId' });

  const risk = calculateRisk({
    baseRiskScore: exceptionType.baseRiskScore,
    startDate: startDate || new Date(),
    expiryDate: expiryDate,
    renewalCount: 0,
  });

  const exception = await prisma.exception.create({
    data: {
      title,
      description,
      businessJustification,
      systemAffected,
      exceptionTypeId,
      policyId: policyId || null,
      departmentId,
      requesterId: req.user.id,
      startDate: startDate ? new Date(startDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      riskScore: risk.finalScore,
      riskLevel: risk.riskLevel,
      status: 'DRAFT',
    },
  });

  await prisma.riskAssessment.create({
    data: {
      exceptionId: exception.id,
      typeRisk: risk.typeRisk,
      durationRisk: risk.durationRisk,
      renewalRisk: risk.renewalRisk,
      approvalBonus: risk.approvalBonus,
      finalScore: risk.finalScore,
      riskLevel: risk.riskLevel,
      assessmentNotes: 'Calculated on creation',
    },
  });

  await logAction({
    req,
    exceptionId: exception.id,
    action: 'CREATE_EXCEPTION',
    resourceType: 'exceptions',
    resourceId: exception.id,
    newValue: exception,
  });

  res.status(201).json(exception);
});

// GET /api/exceptions  (scoped by role)
const listExceptions = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);
  const { status, departmentId } = req.query;

  const where = {};
  if (status) where.status = status;
  if (departmentId) where.departmentId = departmentId;

  // RBAC scoping
  if (req.user.role === 'REQUESTER') {
    where.requesterId = req.user.id;
  } else if (req.user.role === 'APPROVER') {
    // Approvers see exceptions in their department awaiting manager review,
    // plus anything they've already acted on.
    where.OR = [
      { departmentId: req.user.departmentId, status: 'SUBMITTED' },
      { approvals: { some: { approverId: req.user.id } } },
    ];
  } else if (!ROLES_THAT_SEE_ALL.includes(req.user.role)) {
    where.requesterId = req.user.id;
  }
  // SECURITY_REVIEWER / AUDITOR / ADMIN see everything (subject to status/department filters above)

  const [data, total] = await Promise.all([
    prisma.exception.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { exceptionType: true, department: true, requester: { select: { id: true, name: true, email: true } } },
    }),
    prisma.exception.count({ where }),
  ]);

  res.json({ data, total, page, pageSize: limit });
});

// GET /api/exceptions/:id
const getException = asyncHandler(async (req, res) => {
  const exception = await prisma.exception.findUnique({
    where: { id: req.params.id },
    include: {
      exceptionType: { include: { complianceJunctions: { include: { framework: true } } } },
      department: true,
      policy: true,
      requester: { select: { id: true, name: true, email: true } },
      approvals: { include: { approver: { select: { id: true, name: true, email: true } } } },
      riskAssessment: true,
      anomalyFlags: true,
    },
  });

  if (!exception) return res.status(404).json({ error: 'Exception not found' });

  const canView =
    ROLES_THAT_SEE_ALL.includes(req.user.role) ||
    exception.requesterId === req.user.id ||
    (req.user.role === 'APPROVER' &&
      (exception.departmentId === req.user.departmentId ||
        exception.approvals.some((a) => a.approverId === req.user.id)));

  if (!canView) return res.status(403).json({ error: 'You do not have access to this exception' });

  res.json(exception);
});

// PUT /api/exceptions/:id  (only owner, only while DRAFT or INFO_REQUESTED)
const updateException = asyncHandler(async (req, res) => {
  const exception = await prisma.exception.findUnique({ where: { id: req.params.id } });
  if (!exception) return res.status(404).json({ error: 'Exception not found' });

  const isOwner = exception.requesterId === req.user.id;
  if (!isOwner && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only the requester or an admin can edit this exception' });
  }
  if (!['DRAFT', 'INFO_REQUESTED'].includes(exception.status) && req.user.role !== 'ADMIN') {
    return res.status(400).json({ error: `Cannot edit an exception in status ${exception.status}` });
  }

  const { title, description, businessJustification, systemAffected, startDate, expiryDate, exceptionTypeId, policyId } = req.body;

  const data = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (businessJustification !== undefined) data.businessJustification = businessJustification;
  if (systemAffected !== undefined) data.systemAffected = systemAffected;
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (expiryDate !== undefined) data.expiryDate = expiryDate ? new Date(expiryDate) : null;
  if (exceptionTypeId !== undefined) data.exceptionTypeId = exceptionTypeId;
  if (policyId !== undefined) data.policyId = policyId;

  // Recalculate risk if relevant fields changed
  const typeId = data.exceptionTypeId || exception.exceptionTypeId;
  const exceptionType = await prisma.exceptionType.findUnique({ where: { id: typeId } });
  const risk = calculateRisk({
    baseRiskScore: exceptionType.baseRiskScore,
    startDate: data.startDate !== undefined ? data.startDate : exception.startDate,
    expiryDate: data.expiryDate !== undefined ? data.expiryDate : exception.expiryDate,
    renewalCount: exception.renewalCount,
  });
  data.riskScore = risk.finalScore;
  data.riskLevel = risk.riskLevel;
  // Reset to DRAFT if it was sent back for more info
  if (exception.status === 'INFO_REQUESTED') data.status = 'DRAFT';

  const updated = await prisma.exception.update({ where: { id: exception.id }, data });

  await logAction({
    req,
    exceptionId: exception.id,
    action: 'UPDATE_EXCEPTION',
    resourceType: 'exceptions',
    resourceId: exception.id,
    oldValue: exception,
    newValue: updated,
  });

  res.json(updated);
});

// DELETE /api/exceptions/:id (only DRAFT, owner or admin)
const deleteException = asyncHandler(async (req, res) => {
  const exception = await prisma.exception.findUnique({ where: { id: req.params.id } });
  if (!exception) return res.status(404).json({ error: 'Exception not found' });

  const isOwner = exception.requesterId === req.user.id;
  if (!isOwner && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only the requester or an admin can delete this exception' });
  }
  if (exception.status !== 'DRAFT' && req.user.role !== 'ADMIN') {
    return res.status(400).json({ error: 'Only draft exceptions can be deleted' });
  }

  await prisma.exception.delete({ where: { id: exception.id } });

  await logAction({ req, action: 'DELETE_EXCEPTION', resourceType: 'exceptions', resourceId: exception.id, oldValue: exception });

  res.json({ success: true });
});

// POST /api/exceptions/:id/submit
const submitException = asyncHandler(async (req, res) => {
  const exception = await prisma.exception.findUnique({ where: { id: req.params.id } });
  if (!exception) return res.status(404).json({ error: 'Exception not found' });
  if (exception.requesterId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only the requester can submit this exception' });
  }
  if (!['DRAFT', 'INFO_REQUESTED'].includes(exception.status)) {
    return res.status(400).json({ error: `Cannot submit an exception in status ${exception.status}` });
  }
  if (!exception.startDate || !exception.expiryDate) {
    return res.status(400).json({ error: 'startDate and expiryDate must be set before submitting' });
  }

  const updated = await prisma.exception.update({
    where: { id: exception.id },
    data: { status: 'SUBMITTED' },
  });

  await prisma.approval.create({
    data: { exceptionId: exception.id, approvalRole: 'MANAGER', decision: 'PENDING' },
  });

  await notifyRole(
    'APPROVER',
    exception.departmentId,
    exception.id,
    'APPROVAL_REQUIRED',
    `Exception "${exception.title}" needs your review`
  );

  await logAction({
    req,
    exceptionId: exception.id,
    action: 'SUBMIT_FOR_REVIEW',
    resourceType: 'exceptions',
    resourceId: exception.id,
    oldValue: { status: exception.status },
    newValue: { status: 'SUBMITTED' },
  });

  res.json(updated);
});

// POST /api/exceptions/:id/renew  (must be ACTIVE)
const renewException = asyncHandler(async (req, res) => {
  const exception = await prisma.exception.findUnique({ where: { id: req.params.id } });
  if (!exception) return res.status(404).json({ error: 'Exception not found' });
  if (exception.requesterId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only the requester can renew this exception' });
  }
  if (exception.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Only active exceptions can be renewed' });
  }

  const durationMs = exception.expiryDate.getTime() - exception.startDate.getTime();
  const newStart = new Date(exception.expiryDate);
  const newExpiry = new Date(newStart.getTime() + durationMs);

  const updated = await prisma.exception.update({
    where: { id: exception.id },
    data: {
      status: 'SUBMITTED',
      renewalCount: { increment: 1 },
      startDate: newStart,
      expiryDate: newExpiry,
    },
  });

  await prisma.approval.create({
    data: { exceptionId: exception.id, approvalRole: 'MANAGER', decision: 'PENDING' },
  });

  await notifyRole(
    'APPROVER',
    exception.departmentId,
    exception.id,
    'RENEWAL_REQUIRED',
    `Renewal requested for exception "${exception.title}"`
  );

  await logAction({
    req,
    exceptionId: exception.id,
    action: 'RENEW',
    resourceType: 'exceptions',
    resourceId: exception.id,
    oldValue: { status: exception.status, renewalCount: exception.renewalCount },
    newValue: { status: 'SUBMITTED', renewalCount: updated.renewalCount },
  });

  res.json(updated);
});

// POST /api/exceptions/:id/revoke
const revokeException = asyncHandler(async (req, res) => {
  const exception = await prisma.exception.findUnique({ where: { id: req.params.id } });
  if (!exception) return res.status(404).json({ error: 'Exception not found' });

  const isOwner = exception.requesterId === req.user.id;
  const isSecurityOrAdmin = ['SECURITY_REVIEWER', 'ADMIN'].includes(req.user.role);
  if (!isOwner && !isSecurityOrAdmin) {
    return res.status(403).json({ error: 'You are not permitted to revoke this exception' });
  }
  if (!['ACTIVE', 'SUBMITTED', 'MANAGER_APPROVED', 'DRAFT'].includes(exception.status)) {
    return res.status(400).json({ error: `Cannot revoke an exception in status ${exception.status}` });
  }

  const { reason } = req.body;

  const updated = await prisma.exception.update({
    where: { id: exception.id },
    data: { status: 'REVOKED' },
  });

  const action = isSecurityOrAdmin && exception.requesterId !== req.user.id ? 'EMERGENCY_REVOKE' : 'REVOKE';

  await notify(exception.requesterId, exception.id, 'REJECTED', `Exception "${exception.title}" was revoked. Reason: ${reason || 'Not specified'}`);

  await logAction({
    req,
    exceptionId: exception.id,
    action,
    resourceType: 'exceptions',
    resourceId: exception.id,
    oldValue: { status: exception.status },
    newValue: { status: 'REVOKED', reason: reason || null },
  });

  res.json(updated);
});

module.exports = {
  createException,
  listExceptions,
  getException,
  updateException,
  deleteException,
  submitException,
  renewException,
  revokeException,
};
