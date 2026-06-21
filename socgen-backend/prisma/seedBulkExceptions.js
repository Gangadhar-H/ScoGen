// Additive bulk seeder — adds ~100 more Exception records on top of an
// ALREADY-seeded database (run `npm run db:seed` first). It only READS
// existing Users/Departments/ExceptionTypes/Policies and creates new
// Exception/RiskAssessment/Approval rows referencing them — no new
// identities are created. Safe to run against a DB you've already used.
//
// Category mix mirrors the organizer's exception_labels.csv anomaly
// taxonomy, scaled to ~100 records:
//   COMPLIANT_EXCEPTION        ~63
//   STALLED_REVIEW             ~18
//   LONG_RUNNING_EXCEPTION      ~9
//   EXPIRED_ACTIVE_EXCEPTION    ~5
//   CRITICAL_RISK_EXCEPTION     ~4
//   HIGH_RISK_LONG_EXCEPTION    ~2

const { PrismaClient } = require("@prisma/client");
const { calculateRisk } = require("../src/utils/riskEngine");

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;

function daysFromNow(n) {
  return new Date(Date.now() + n * DAY);
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const SYSTEM_POOL = [
  "Production DB Cluster",
  "Customer Data Warehouse",
  "API Gateway",
  "Internal Monitoring Stack",
  "CI Build Server",
  "Finance Data Warehouse",
  "SFTP Gateway",
  "Payment Gateway Console",
  "Legacy HRIS",
  "HRIS Core Database",
  "HRIS Admin Console",
  "SIEM Log Forwarder",
  "Security Sandbox",
  "EDR / Incident Response Console",
  "Dev/Staging Environment",
  "Vendor Onboarding Portal",
  "Internal Reporting Service",
  "Analytics Pipeline",
  "Mobile Backend Gateway",
];

// Decides MANAGER / SECURITY_REVIEWER decisions for a given target status —
// same state machine the live app enforces (manager first, security second).
function decisionsFor(status) {
  if (status === "DRAFT" || status === "SUBMITTED") {
    return { managerDecision: undefined, securityDecision: undefined };
  }
  if (status === "REJECTED") {
    return { managerDecision: "REJECTED", securityDecision: undefined };
  }
  // MANAGER_APPROVED, ACTIVE, EXPIRED
  return {
    managerDecision: "APPROVED",
    securityDecision: ["ACTIVE", "EXPIRED"].includes(status)
      ? "APPROVED"
      : undefined,
  };
}

// Builds one Exception + RiskAssessment + Approval row(s), using the real
// risk engine — identical pattern to prisma/seed.js's seedException().
async function createExceptionRecord({
  requester,
  department,
  manager,
  securityReviewer,
  exceptionType,
  policy,
  title,
  businessJustification,
  systemAffected,
  startDate,
  expiryDate,
  renewalCount = 0,
  status,
  managerDecision,
  securityDecision,
  createdAt,
}) {
  const managerApproved =
    ["MANAGER_APPROVED", "ACTIVE", "EXPIRED"].includes(status) &&
    managerDecision === "APPROVED";
  const securityApproved =
    ["ACTIVE", "EXPIRED"].includes(status) && securityDecision === "APPROVED";

  const risk = calculateRisk({
    baseRiskScore: exceptionType.baseRiskScore,
    startDate,
    expiryDate,
    renewalCount,
    managerApproved,
    securityApproved,
  });

  const exception = await prisma.exception.create({
    data: {
      title,
      businessJustification,
      systemAffected,
      exceptionTypeId: exceptionType.id,
      policyId: policy ? policy.id : null,
      departmentId: department.id,
      requesterId: requester.id,
      startDate: startDate || null,
      expiryDate: expiryDate || null,
      renewalCount,
      riskScore: risk.finalScore,
      riskLevel: risk.riskLevel,
      status,
      isCritical: risk.riskLevel === "CRITICAL",
      ...(createdAt ? { createdAt } : {}),
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
      assessmentNotes: "Bulk seed — calculated via riskEngine",
    },
  });

  // MANAGER approval row — same gating as the live submit/approve flow.
  if (status !== "DRAFT") {
    await prisma.approval.create({
      data: {
        exceptionId: exception.id,
        approvalRole: "MANAGER",
        decision: managerDecision || "PENDING",
        approverId: managerDecision ? manager.id : null,
        comments:
          managerDecision === "REJECTED"
            ? "Insufficient business justification for the requested access."
            : managerDecision === "APPROVED"
            ? "Approved — justification on file."
            : null,
        approvedAt:
          managerDecision && managerDecision !== "PENDING" ? new Date() : null,
      },
    });
  }

  // SECURITY_REVIEWER approval row — only created once a manager has approved,
  // exactly like approvalController.approve() does it.
  if (managerApproved) {
    await prisma.approval.create({
      data: {
        exceptionId: exception.id,
        approvalRole: "SECURITY_REVIEWER",
        decision: securityDecision || "PENDING",
        approverId: securityDecision ? securityReviewer.id : null,
        comments:
          securityDecision === "APPROVED"
            ? "Approved with monitoring controls in place."
            : null,
        approvedAt:
          securityDecision && securityDecision !== "PENDING"
            ? new Date()
            : null,
      },
    });
  }

  return exception;
}

async function main() {
  const [
    departments,
    exceptionTypes,
    policies,
    requesters,
    approvers,
    securityReviewers,
  ] = await Promise.all([
    prisma.department.findMany(),
    prisma.exceptionType.findMany(),
    prisma.policy.findMany(),
    prisma.user.findMany({ where: { role: "REQUESTER" } }),
    prisma.user.findMany({ where: { role: "APPROVER" } }),
    prisma.user.findMany({ where: { role: "SECURITY_REVIEWER" } }),
  ]);

  if (
    !departments.length ||
    !exceptionTypes.length ||
    !requesters.length ||
    !approvers.length
  ) {
    console.error(
      "❌ No base data found. Run `npm run db:seed` first — this script only ADDS exceptions to existing users/departments/types, it never creates them."
    );
    process.exit(1);
  }

  const approverByDept = Object.fromEntries(
    approvers.map((a) => [a.departmentId, a])
  );
  const policiesByDept = {};
  for (const p of policies)
    (policiesByDept[p.ownerDepartmentId] ||= []).push(p);

  // Picks a real requester + their real department + their real manager.
  function context() {
    const requester = pick(requesters);
    const department = departments.find((d) => d.id === requester.departmentId);
    const manager = approverByDept[department.id] || null;
    const securityReviewer = securityReviewers.length
      ? pick(securityReviewers)
      : null;
    const deptPolicies = policiesByDept[department.id] || [];
    const policy =
      deptPolicies.length && Math.random() < 0.7 ? pick(deptPolicies) : null;
    return { requester, department, manager, securityReviewer, policy };
  }

  let created = 0;

  // ---- 1. COMPLIANT_EXCEPTION (~63) ----
  // Clean records across the full status range. ACTIVE ones are restricted
  // to lower base-risk types so they can't accidentally score CRITICAL and
  // trip the risk-accumulation rules below — every other status is gated
  // out of those rules entirely (they only check status === "ACTIVE").
  const lowRiskTypes = exceptionTypes.filter((t) => t.baseRiskScore <= 50);
  const COMPLIANT_STATUSES = [
    { status: "DRAFT", n: 8 },
    { status: "SUBMITTED", n: 10 },
    { status: "MANAGER_APPROVED", n: 10 },
    { status: "ACTIVE", n: 25 },
    { status: "EXPIRED", n: 7 },
    { status: "REJECTED", n: 3 },
  ];
  for (const { status, n } of COMPLIANT_STATUSES) {
    for (let i = 0; i < n; i++) {
      const { requester, department, manager, securityReviewer, policy } =
        context();
      const exceptionType =
        status === "ACTIVE" ? pick(lowRiskTypes) : pick(exceptionTypes);
      const startDate = daysFromNow(-randInt(0, 20));
      const expiryDate = new Date(startDate.getTime() + randInt(15, 90) * DAY);
      const { managerDecision, securityDecision } = decisionsFor(status);

      await createExceptionRecord({
        requester,
        department,
        manager,
        securityReviewer,
        exceptionType,
        policy,
        title: `${exceptionType.name} request — ${pick(SYSTEM_POOL)}`,
        businessJustification: `${
          requester.name
        } requires temporary ${exceptionType.name.toLowerCase()} access to support an active business initiative.`,
        systemAffected: pick(SYSTEM_POOL),
        startDate,
        expiryDate,
        renewalCount: 0,
        status,
        managerDecision,
        securityDecision,
      });
      created++;
    }
  }

  // ---- 2. STALLED_REVIEW (~18) — SUBMITTED for 35-90 days ----
  for (let i = 0; i < 18; i++) {
    const { requester, department, manager, securityReviewer, policy } =
      context();
    const exceptionType = pick(exceptionTypes);
    const startDate = daysFromNow(randInt(5, 20));
    const expiryDate = new Date(startDate.getTime() + randInt(30, 90) * DAY);

    await createExceptionRecord({
      requester,
      department,
      manager,
      securityReviewer,
      exceptionType,
      policy,
      title: `${exceptionType.name} request — ${pick(SYSTEM_POOL)}`,
      businessJustification: `${requester.name}'s request has been awaiting manager review for an extended period.`,
      systemAffected: pick(SYSTEM_POOL),
      startDate,
      expiryDate,
      renewalCount: 0,
      status: "SUBMITTED",
      createdAt: daysFromNow(-randInt(35, 90)),
    });
    created++;
  }

  // ---- 3. LONG_RUNNING_EXCEPTION (~9) — ACTIVE, duration > 180 days ----
  for (let i = 0; i < 9; i++) {
    const { requester, department, manager, securityReviewer, policy } =
      context();
    const exceptionType = pick(exceptionTypes);
    const startDate = daysFromNow(-randInt(30, 90));
    const expiryDate = new Date(startDate.getTime() + randInt(200, 280) * DAY);

    await createExceptionRecord({
      requester,
      department,
      manager,
      securityReviewer,
      exceptionType,
      policy,
      title: `${exceptionType.name} request — ${pick(SYSTEM_POOL)}`,
      businessJustification: `${requester.name} has an extended-duration exception that has not been converted to a permanent policy.`,
      systemAffected: pick(SYSTEM_POOL),
      startDate,
      expiryDate,
      renewalCount: 0,
      status: "ACTIVE",
      managerDecision: "APPROVED",
      securityDecision: "APPROVED",
    });
    created++;
  }

  // ---- 4. EXPIRED_ACTIVE_EXCEPTION (~5) — ACTIVE but expiry already passed ----
  for (let i = 0; i < 5; i++) {
    const { requester, department, manager, securityReviewer, policy } =
      context();
    const exceptionType = pick(exceptionTypes);
    const startDate = daysFromNow(-randInt(90, 200));
    const expiryDate = daysFromNow(-randInt(5, 60));

    await createExceptionRecord({
      requester,
      department,
      manager,
      securityReviewer,
      exceptionType,
      policy,
      title: `${exceptionType.name} request — ${pick(SYSTEM_POOL)}`,
      businessJustification: `${requester.name}'s access was never revoked after the approved window closed.`,
      systemAffected: pick(SYSTEM_POOL),
      startDate,
      expiryDate,
      renewalCount: randInt(0, 1),
      status: "ACTIVE",
      managerDecision: "APPROVED",
      securityDecision: "APPROVED",
    });
    created++;
  }

  // ---- 5. CRITICAL_RISK_EXCEPTION (~4) — ACTIVE with riskLevel CRITICAL ----
  const criticalTypes = exceptionTypes.filter((t) => t.baseRiskScore >= 60);
  for (let i = 0; i < 4; i++) {
    const { requester, department, manager, securityReviewer, policy } =
      context();
    const exceptionType = criticalTypes.length
      ? pick(criticalTypes)
      : pick(exceptionTypes);
    const startDate = daysFromNow(-randInt(20, 60));
    const expiryDate = new Date(startDate.getTime() + randInt(60, 90) * DAY);

    await createExceptionRecord({
      requester,
      department,
      manager,
      securityReviewer,
      exceptionType,
      policy,
      title: `${exceptionType.name} request — ${pick(SYSTEM_POOL)}`,
      businessJustification: `${requester.name} retains elevated, high-sensitivity access that warrants immediate security re-review.`,
      systemAffected: pick(SYSTEM_POOL),
      startDate,
      expiryDate,
      renewalCount: randInt(0, 1),
      status: "ACTIVE",
      managerDecision: "APPROVED",
      securityDecision: "APPROVED",
    });
    created++;
  }

  // ---- 6. HIGH_RISK_LONG_EXCEPTION (~2) — ACTIVE, HIGH risk, duration > 180 days ----
  const firewallType =
    exceptionTypes.find((t) => /firewall/i.test(t.name)) ||
    pick(exceptionTypes);
  for (let i = 0; i < 2; i++) {
    const { requester, department, manager, securityReviewer, policy } =
      context();
    const startDate = daysFromNow(-randInt(30, 90));
    const expiryDate = new Date(startDate.getTime() + randInt(200, 250) * DAY);

    await createExceptionRecord({
      requester,
      department,
      manager,
      securityReviewer,
      exceptionType: firewallType,
      policy,
      title: `${firewallType.name} request — ${pick(SYSTEM_POOL)}`,
      businessJustification: `${requester.name}'s firewall exception has been open long enough that risk is accumulating without re-review.`,
      systemAffected: pick(SYSTEM_POOL),
      startDate,
      expiryDate,
      renewalCount: 0,
      status: "ACTIVE",
      managerDecision: "APPROVED",
      securityDecision: "APPROVED",
    });
    created++;
  }

  console.log(`✅ Bulk seed complete — added ${created} exception records.`);
  console.log(
    "   Every record's requester/manager/security reviewer is a real, already-seeded user."
  );
  console.log(
    "   Check effects via /api/reports/governance-score or /api/reports/dashboard."
  );
}

main()
  .catch((e) => {
    console.error("Bulk seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
