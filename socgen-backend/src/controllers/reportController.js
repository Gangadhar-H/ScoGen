const prisma = require("../prismaClient");
const asyncHandler = require("../utils/asyncHandler");
const { buildReportPdf } = require("../utils/pdfGenerator");
const {
  computeGovernanceScore,
  gradeFor,
} = require("../utils/governanceScoring");

// GET /api/reports/active-exceptions
const activeExceptions = asyncHandler(async (req, res) => {
  const { departmentId, startDate, endDate } = req.query;
  const where = { status: "ACTIVE" };
  if (departmentId) where.departmentId = departmentId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const data = await prisma.exception.findMany({
    where,
    include: {
      exceptionType: true,
      department: true,
      requester: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const byDepartment = {};
  const byType = {};
  const byRiskLevel = {};
  for (const e of data) {
    byDepartment[e.department.name] =
      (byDepartment[e.department.name] || 0) + 1;
    byType[e.exceptionType.name] = (byType[e.exceptionType.name] || 0) + 1;
    byRiskLevel[e.riskLevel] = (byRiskLevel[e.riskLevel] || 0) + 1;
  }

  res.json({ count: data.length, byDepartment, byType, byRiskLevel, data });
});

// GET /api/reports/expired-exceptions
const expiredExceptions = asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const where = { status: "EXPIRED" };
  if (departmentId) where.departmentId = departmentId;

  const data = await prisma.exception.findMany({
    where,
    include: { exceptionType: true, department: true },
    orderBy: { expiryDate: "desc" },
  });

  res.json({ count: data.length, data });
});

// GET /api/reports/critical-exceptions
const criticalExceptions = asyncHandler(async (req, res) => {
  const { departmentId } = req.query;
  const where = { riskLevel: "CRITICAL" };
  if (departmentId) where.departmentId = departmentId;

  const data = await prisma.exception.findMany({
    where,
    include: {
      exceptionType: true,
      department: true,
      requester: { select: { id: true, name: true } },
    },
    orderBy: { riskScore: "desc" },
  });

  res.json({ count: data.length, data });
});

// GET /api/reports/department-wise
const departmentWise = asyncHandler(async (req, res) => {
  const grouped = await prisma.exception.groupBy({
    by: ["departmentId", "status"],
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
    where: framework
      ? { name: { contains: framework, mode: "insensitive" } }
      : {},
    include: {
      exceptionTypes: {
        include: {
          exceptionType: {
            // _count instead of fetching every exception row just to count them
            include: { _count: { select: { exceptions: true } } },
          },
        },
      },
    },
  });

  const result = frameworks.map((f) => {
    const exceptionTypeNames = f.exceptionTypes.map(
      (j) => j.exceptionType.name
    );
    const exceptionCount = f.exceptionTypes.reduce(
      (sum, j) => sum + j.exceptionType._count.exceptions,
      0
    );
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
  if (req.user.role === "APPROVER" || req.user.role === "REQUESTER") {
    where.departmentId = req.user.departmentId;
  }

  const [
    activeCount,
    expiringSoon,
    pendingApprovals,
    highRiskCount,
    anomalyCount,
  ] = await Promise.all([
    prisma.exception.count({ where: { ...where, status: "ACTIVE" } }),
    prisma.exception.count({
      where: {
        ...where,
        status: "ACTIVE",
        expiryDate: { lte: sevenDaysOut, gte: new Date() },
      },
    }),
    prisma.approval.count({ where: { decision: "PENDING" } }),
    prisma.exception.count({
      where: { ...where, riskLevel: { in: ["HIGH", "CRITICAL"] } },
    }),
    // Read the persisted, hourly-refreshed flags instead of re-running the
    // full anomaly scan on every dashboard load.
    prisma.anomalyFlag.count({ where: { isResolved: false } }),
  ]);

  res.json({
    activeCount,
    expiringSoon,
    pendingApprovals,
    highRiskCount,
    anomalyCount,
  });
});

// GET /api/reports/export/pdf?type=active|expired|critical
const exportReportPdf = asyncHandler(async (req, res) => {
  const { type = "active" } = req.query;
  const statusMap = {
    active: "ACTIVE",
    expired: "EXPIRED",
    critical: undefined,
  };
  const where =
    type === "critical"
      ? { riskLevel: "CRITICAL" }
      : { status: statusMap[type] };

  const data = await prisma.exception.findMany({
    where,
    include: {
      exceptionType: true,
      department: true,
      requester: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = data.map((e) => ({
    title: e.title,
    department: e.department.name,
    type: e.exceptionType.name,
    requester: e.requester.name,
    riskLevel: e.riskLevel,
    riskScore: e.riskScore,
    status: e.status,
    expiryDate: e.expiryDate ? e.expiryDate.toISOString().slice(0, 10) : "—",
  }));

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${type}-exceptions-report.pdf"`
  );

  const doc = buildReportPdf({
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Exceptions Report`,
    rows,
    columns: [
      { key: "title", label: "Title" },
      { key: "department", label: "Dept" },
      { key: "riskLevel", label: "Risk" },
      { key: "status", label: "Status" },
      { key: "expiryDate", label: "Expires" },
    ],
  });
  doc.pipe(res);
  doc.end();
});

// GET /api/reports/policy-effectiveness
const policyEffectiveness = asyncHandler(async (req, res) => {
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

  const policies = await prisma.policy.findMany({
    include: {
      exceptions: { where: { createdAt: { gte: sixMonthsAgo } } },
    },
  });

  const result = policies
    .map((p) => {
      const count = p.exceptions.length;
      const isUnrealistic = count >= 10; // threshold — tune as needed
      return {
        policyId: p.id,
        policyCode: p.policyCode,
        title: p.title,
        severity: p.severity,
        exceptionCount: count,
        isUnrealistic,
        recommendation: isUnrealistic
          ? `Policy generated ${count} exceptions in the last 6 months — consider revising this policy rather than continuing to approve waivers.`
          : null,
      };
    })
    .sort((a, b) => b.exceptionCount - a.exceptionCount);

  res.json({ data: result });
});

// GET /api/reports/governance-score
const governanceScore = asyncHandler(async (req, res) => {
  const [departments, allExceptions, allApprovals, liveAnomalyFlags] =
    await Promise.all([
      prisma.department.findMany({ orderBy: { name: "asc" } }),
      prisma.exception.findMany({
        select: {
          id: true,
          departmentId: true,
          status: true,
          renewalCount: true,
        },
      }),
      prisma.approval.findMany({
        select: { exceptionId: true, decision: true },
      }),
      // Read persisted (hourly-refreshed) flags rather than re-running detectAnomalies() live
      prisma.anomalyFlag.findMany({
        where: { isResolved: false },
        select: { exceptionId: true, severity: true },
      }),
    ]);

  const exceptionsByDept = {};
  for (const e of allExceptions)
    (exceptionsByDept[e.departmentId] ||= []).push(e);

  const exceptionToDept = Object.fromEntries(
    allExceptions.map((e) => [e.id, e.departmentId])
  );

  const approvalsByDept = {};
  for (const a of allApprovals) {
    const deptId = exceptionToDept[a.exceptionId];
    if (deptId) (approvalsByDept[deptId] ||= []).push(a);
  }

  const flagsByDept = {};
  for (const f of liveAnomalyFlags) {
    const deptId = exceptionToDept[f.exceptionId];
    if (deptId) (flagsByDept[deptId] ||= []).push(f);
  }

  const departmentScores = departments.map((dept) => {
    const exceptions = exceptionsByDept[dept.id] || [];
    const approvals = approvalsByDept[dept.id] || [];
    const anomalyFlags = flagsByDept[dept.id] || [];
    const result = computeGovernanceScore({
      exceptions,
      approvals,
      anomalyFlags,
    });
    return {
      departmentId: dept.id,
      departmentName: dept.name,
      totalExceptions: exceptions.length,
      ...result,
    };
  });

  const scored = departmentScores.filter((d) => d.totalExceptions > 0);
  const organizationScore = scored.length
    ? Math.round(scored.reduce((sum, d) => sum + d.score, 0) / scored.length)
    : 100;

  res.json({
    organizationScore,
    organizationGrade: gradeFor(organizationScore),
    departments: departmentScores,
  });
});

module.exports = {
  activeExceptions,
  expiredExceptions,
  criticalExceptions,
  departmentWise,
  complianceImpact,
  dashboard,
  exportReportPdf,
  policyEffectiveness,
  governanceScore,
};
