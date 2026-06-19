const prisma = require('../prismaClient');
const { calculateRisk } = require('../utils/riskEngine');
const { logAction } = require('../utils/auditLogger');
const { notify, notifyRole } = require('../services/notificationService');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/approvals?status=PENDING&role=MANAGER
const listApprovals = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 10);
  const { decision, role } = req.query;

  const where = {};
  if (decision) where.decision = decision;
  if (role) where.approvalRole = role;

  if (req.user.role === 'APPROVER') {
    where.approvalRole = 'MANAGER';
    where.exception = { departmentId: req.user.departmentId };
  } else if (req.user.role === 'SECURITY_REVIEWER') {
    where.approvalRole = 'SECURITY_REVIEWER';
  }

  const [data, total] = await Promise.all([
    prisma.approval.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { exception: true },
    }),
    prisma.approval.count({ where }),
  ]);

  res.json({ data, total, page, pageSize: limit });
});

async function getPendingApproval(exceptionId, approvalRole) {
  return prisma.approval.findFirst({
    where: { exceptionId, approvalRole, decision: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
}

// POST /api/approvals/:exceptionId/approve
const approve = asyncHandler(async (req, res) => {
  const exception = await prisma.exception.findUnique({
    where: { id: req.params.exceptionId },
    include: { exceptionType: true },
  });
  if (!exception) return res.status(404).json({ error: 'Exception not found' });

  const { comments, overrideRiskScore, overrideReason } = req.body;
  const role = req.user.role;

  if (role === 'APPROVER' || role === 'ADMIN') {
    if (exception.status !== 'SUBMITTED') {
      return res.status(400).json({ error: `Exception must be SUBMITTED for manager approval (current: ${exception.status})` });
    }
    const pending = await getPendingApproval(exception.id, 'MANAGER');
    if (!pending) return res.status(400).json({ error: 'No pending manager approval found' });
    if (pending.approverId === req.user.id) {
      return res.status(400).json({ error: 'You cannot approve your own request' });
    }
    if (exception.requesterId === req.user.id) {
      return res.status(403).json({ error: 'Approvers cannot approve their own exceptions' });
    }

    await prisma.approval.update({
      where: { id: pending.id },
      data: { approverId: req.user.id, decision: 'APPROVED', comments, approvedAt: new Date() },
    });

    const risk = calculateRisk({
      baseRiskScore: exception.exceptionType.baseRiskScore,
      startDate: exception.startDate,
      expiryDate: exception.expiryDate,
      renewalCount: exception.renewalCount,
      managerApproved: true,
    });

    const updated = await prisma.exception.update({
      where: { id: exception.id },
      data: { status: 'MANAGER_APPROVED', riskScore: risk.finalScore, riskLevel: risk.riskLevel },
    });

    await prisma.approval.create({
      data: { exceptionId: exception.id, approvalRole: 'SECURITY_REVIEWER', decision: 'PENDING' },
    });

    await notifyRole('SECURITY_REVIEWER', null, exception.id, 'APPROVAL_REQUIRED', `Exception "${exception.title}" needs security review`);

    await logAction({
      req,
      exceptionId: exception.id,
      action: 'APPROVE',
      resourceType: 'approvals',
      resourceId: pending.id,
      oldValue: { status: exception.status },
      newValue: { status: 'MANAGER_APPROVED' },
    });

    return res.json(updated);
  }

  if (role === 'SECURITY_REVIEWER' || role === 'ADMIN') {
    if (exception.status !== 'MANAGER_APPROVED') {
      return res.status(400).json({ error: `Exception must be MANAGER_APPROVED for security approval (current: ${exception.status})` });
    }
    const pending = await getPendingApproval(exception.id, 'SECURITY_REVIEWER');
    if (!pending) return res.status(400).json({ error: 'No pending security approval found' });

    await prisma.approval.update({
      where: { id: pending.id },
      data: {
        approverId: req.user.id,
        decision: 'APPROVED',
        comments,
        overrideRiskScore: overrideRiskScore ?? null,
        overrideReason: overrideReason || null,
        approvedAt: new Date(),
      },
    });

    const risk = calculateRisk({
      baseRiskScore: exception.exceptionType.baseRiskScore,
      startDate: exception.startDate,
      expiryDate: exception.expiryDate,
      renewalCount: exception.renewalCount,
      managerApproved: true,
      securityApproved: true,
      overrideScore: overrideRiskScore,
    });

    const updated = await prisma.exception.update({
      where: { id: exception.id },
      data: {
        status: 'ACTIVE',
        riskScore: risk.finalScore,
        riskLevel: risk.riskLevel,
        startDate: exception.startDate || new Date(),
      },
    });

    await prisma.riskAssessment.upsert({
      where: { exceptionId: exception.id },
      update: {
        finalScore: risk.finalScore,
        riskLevel: risk.riskLevel,
        approvalBonus: risk.approvalBonus,
        assessmentNotes: overrideRiskScore != null ? `Security override: ${overrideReason || 'no reason given'}` : 'Recalculated after security approval',
      },
      create: {
        exceptionId: exception.id,
        typeRisk: risk.typeRisk,
        durationRisk: risk.durationRisk,
        renewalRisk: risk.renewalRisk,
        approvalBonus: risk.approvalBonus,
        finalScore: risk.finalScore,
        riskLevel: risk.riskLevel,
      },
    });

    await notify(exception.requesterId, exception.id, 'APPROVAL_CONFIRMED', `Your exception "${exception.title}" is now ACTIVE`);

    await logAction({
      req,
      exceptionId: exception.id,
      action: overrideRiskScore != null ? 'OVERRIDE_RISK_SCORE' : 'APPROVE',
      resourceType: 'approvals',
      resourceId: pending.id,
      oldValue: { status: exception.status, riskScore: exception.riskScore },
      newValue: { status: 'ACTIVE', riskScore: risk.finalScore },
    });

    return res.json(updated);
  }

  return res.status(403).json({ error: 'Your role cannot approve exceptions' });
});

// POST /api/approvals/:exceptionId/reject
const reject = asyncHandler(async (req, res) => {
  const exception = await prisma.exception.findUnique({ where: { id: req.params.exceptionId } });
  if (!exception) return res.status(404).json({ error: 'Exception not found' });

  const { reason } = req.body;
  const approvalRole = req.user.role === 'SECURITY_REVIEWER' ? 'SECURITY_REVIEWER' : 'MANAGER';

  if (!['SUBMITTED', 'MANAGER_APPROVED'].includes(exception.status)) {
    return res.status(400).json({ error: `Cannot reject an exception in status ${exception.status}` });
  }
  if (!['APPROVER', 'SECURITY_REVIEWER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Your role cannot reject exceptions' });
  }

  const pending = await getPendingApproval(exception.id, approvalRole);
  if (pending) {
    await prisma.approval.update({
      where: { id: pending.id },
      data: { approverId: req.user.id, decision: 'REJECTED', comments: reason, approvedAt: new Date() },
    });
  }

  const updated = await prisma.exception.update({ where: { id: exception.id }, data: { status: 'REJECTED' } });

  await notify(exception.requesterId, exception.id, 'REJECTED', `Your exception "${exception.title}" was rejected. Reason: ${reason || 'Not specified'}`);

  await logAction({
    req,
    exceptionId: exception.id,
    action: 'REJECT',
    resourceType: 'exceptions',
    resourceId: exception.id,
    oldValue: { status: exception.status },
    newValue: { status: 'REJECTED', reason: reason || null },
  });

  res.json(updated);
});

// POST /api/approvals/:exceptionId/request-info
const requestInfo = asyncHandler(async (req, res) => {
  const exception = await prisma.exception.findUnique({ where: { id: req.params.exceptionId } });
  if (!exception) return res.status(404).json({ error: 'Exception not found' });

  const { message } = req.body;
  const approvalRole = req.user.role === 'SECURITY_REVIEWER' ? 'SECURITY_REVIEWER' : 'MANAGER';

  if (!['SUBMITTED', 'MANAGER_APPROVED'].includes(exception.status)) {
    return res.status(400).json({ error: `Cannot request info on an exception in status ${exception.status}` });
  }
  if (!['APPROVER', 'SECURITY_REVIEWER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Your role cannot request more information' });
  }

  const pending = await getPendingApproval(exception.id, approvalRole);
  if (pending) {
    await prisma.approval.update({
      where: { id: pending.id },
      data: { approverId: req.user.id, decision: 'MORE_INFO', comments: message },
    });
  }

  const updated = await prisma.exception.update({ where: { id: exception.id }, data: { status: 'INFO_REQUESTED' } });

  await notify(exception.requesterId, exception.id, 'INFO_REQUESTED', `More information requested for "${exception.title}": ${message || ''}`);

  await logAction({
    req,
    exceptionId: exception.id,
    action: 'REQUEST_INFO',
    resourceType: 'exceptions',
    resourceId: exception.id,
    oldValue: { status: exception.status },
    newValue: { status: 'INFO_REQUESTED', message: message || null },
  });

  res.json(updated);
});

module.exports = { listApprovals, approve, reject, requestInfo };
