const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { calculateRisk } = require("../src/utils/riskEngine");

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
function daysFromNow(n) {
  return new Date(Date.now() + n * DAY);
}

async function main() {
  // ============= DEPARTMENTS =============
  const itDept = await prisma.department.create({ data: { name: "IT" } });
  const financeDept = await prisma.department.create({
    data: { name: "Finance" },
  });
  const hrDept = await prisma.department.create({ data: { name: "HR" } });
  const secDept = await prisma.department.create({
    data: { name: "Security" },
  });

  // ============= USERS =============
  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@socgen.local",
      name: "Admin User",
      passwordHash: password,
      role: "ADMIN",
      departmentId: itDept.id,
    },
  });

  const auditor = await prisma.user.create({
    data: {
      email: "auditor@socgen.local",
      name: "Avery Auditor",
      passwordHash: password,
      role: "AUDITOR",
      departmentId: secDept.id,
    },
  });

  // -- Managers / Approvers (4) — one per department --
  const mgrIT = await prisma.user.create({
    data: {
      email: "manager@socgen.local",
      name: "Mark Manager",
      passwordHash: password,
      role: "APPROVER",
      departmentId: itDept.id,
    },
  });
  const mgrFinance = await prisma.user.create({
    data: {
      email: "finance.manager@socgen.local",
      name: "Priya Kulkarni",
      passwordHash: password,
      role: "APPROVER",
      departmentId: financeDept.id,
    },
  });
  const mgrHR = await prisma.user.create({
    data: {
      email: "hr.manager@socgen.local",
      name: "Karan Mehta",
      passwordHash: password,
      role: "APPROVER",
      departmentId: hrDept.id,
    },
  });
  const mgrSecurity = await prisma.user.create({
    data: {
      email: "security.manager@socgen.local",
      name: "Neha Desai",
      passwordHash: password,
      role: "APPROVER",
      departmentId: secDept.id,
    },
  });

  // -- Security Reviewers (3) --
  const sec1 = await prisma.user.create({
    data: {
      email: "security@socgen.local",
      name: "Sam Security",
      passwordHash: password,
      role: "SECURITY_REVIEWER",
      departmentId: secDept.id,
    },
  });
  const sec2 = await prisma.user.create({
    data: {
      email: "security2@socgen.local",
      name: "Arjun Nair",
      passwordHash: password,
      role: "SECURITY_REVIEWER",
      departmentId: secDept.id,
    },
  });
  const sec3 = await prisma.user.create({
    data: {
      email: "security3@socgen.local",
      name: "Divya Rao",
      passwordHash: password,
      role: "SECURITY_REVIEWER",
      departmentId: secDept.id,
    },
  });

  // -- Requesters (15) --
  const reqIT1 = await prisma.user.create({
    data: {
      email: "requester@socgen.local",
      name: "Riya Sharma",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: itDept.id,
    },
  });
  const reqIT2 = await prisma.user.create({
    data: {
      email: "req.it2@socgen.local",
      name: "Aman Verma",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: itDept.id,
    },
  });
  const reqIT3 = await prisma.user.create({
    data: {
      email: "req.it3@socgen.local",
      name: "Sara Khan",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: itDept.id,
    },
  });
  const reqIT4 = await prisma.user.create({
    data: {
      email: "req.it4@socgen.local",
      name: "Vikram Nair",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: itDept.id,
    },
  });
  const reqIT5 = await prisma.user.create({
    data: {
      email: "req.it5@socgen.local",
      name: "Pooja Iyer",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: itDept.id,
    },
  });

  const reqFIN1 = await prisma.user.create({
    data: {
      email: "req.fin1@socgen.local",
      name: "Rohit Gupta",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: financeDept.id,
    },
  });
  const reqFIN2 = await prisma.user.create({
    data: {
      email: "req.fin2@socgen.local",
      name: "Anjali Mehta",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: financeDept.id,
    },
  });
  const reqFIN3 = await prisma.user.create({
    data: {
      email: "req.fin3@socgen.local",
      name: "Suresh Reddy",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: financeDept.id,
    },
  });
  const reqFIN4 = await prisma.user.create({
    data: {
      email: "req.fin4@socgen.local",
      name: "Kavita Joshi",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: financeDept.id,
    },
  });

  const reqHR1 = await prisma.user.create({
    data: {
      email: "req.hr1@socgen.local",
      name: "Meera Pillai",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: hrDept.id,
    },
  });
  const reqHR2 = await prisma.user.create({
    data: {
      email: "req.hr2@socgen.local",
      name: "Rajesh Kumar",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: hrDept.id,
    },
  });
  const reqHR3 = await prisma.user.create({
    data: {
      email: "req.hr3@socgen.local",
      name: "Sneha Bansal",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: hrDept.id,
    },
  });

  const reqSEC1 = await prisma.user.create({
    data: {
      email: "req.sec1@socgen.local",
      name: "Arvind Rao",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: secDept.id,
    },
  });
  const reqSEC2 = await prisma.user.create({
    data: {
      email: "req.sec2@socgen.local",
      name: "Tanya Singh",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: secDept.id,
    },
  });
  const reqSEC3 = await prisma.user.create({
    data: {
      email: "req.sec3@socgen.local",
      name: "Karthik Subramaniam",
      passwordHash: password,
      role: "REQUESTER",
      departmentId: secDept.id,
    },
  });

  // ============= EXCEPTION TYPES (all 5 used across the dataset) =============
  const firewall = await prisma.exceptionType.create({
    data: {
      name: "Firewall Exception",
      baseRiskScore: 30,
      description: "Firewall rule bypass or exception",
    },
  });
  const adminAccess = await prisma.exceptionType.create({
    data: {
      name: "Admin Access",
      baseRiskScore: 50,
      description: "Elevated administrative access",
    },
  });
  const encryption = await prisma.exceptionType.create({
    data: {
      name: "Encryption Waiver",
      baseRiskScore: 70,
      description: "Waiver for encryption requirement",
    },
  });
  const dataAccess = await prisma.exceptionType.create({
    data: {
      name: "Data Access",
      baseRiskScore: 60,
      description: "Access to sensitive data sets",
    },
  });
  const devEnv = await prisma.exceptionType.create({
    data: {
      name: "Dev Environment",
      baseRiskScore: 10,
      description: "Development environment exception",
    },
  });

  // ============= POLICIES =============
  const policyFirewall = await prisma.policy.create({
    data: {
      policyCode: "SEC-001",
      title: "Firewall Policy",
      description: "All internet traffic must go through firewall",
      severity: "HIGH",
      ownerDepartmentId: secDept.id,
    },
  });
  const policyEncryption = await prisma.policy.create({
    data: {
      policyCode: "SEC-002",
      title: "Data Encryption Policy",
      description: "All sensitive data must be encrypted",
      severity: "HIGH",
      ownerDepartmentId: secDept.id,
    },
  });
  const policyAccess = await prisma.policy.create({
    data: {
      policyCode: "SEC-003",
      title: "Access Control Policy",
      description: "Admin access requires justification",
      severity: "MEDIUM",
      ownerDepartmentId: secDept.id,
    },
  });
  const policyFinance = await prisma.policy.create({
    data: {
      policyCode: "FIN-001",
      title: "Financial Data Access Policy",
      description: "Access to financial systems requires dual approval",
      severity: "HIGH",
      ownerDepartmentId: financeDept.id,
    },
  });
  const policyHR = await prisma.policy.create({
    data: {
      policyCode: "HR-001",
      title: "Employee Data Privacy Policy",
      description: "Employee PII access must be logged and time-boxed",
      severity: "MEDIUM",
      ownerDepartmentId: hrDept.id,
    },
  });

  // ============= COMPLIANCE FRAMEWORKS (mapped to all 5 exception types) =============
  const nist = await prisma.complianceFramework.create({
    data: {
      name: "NIST SP 800-53",
      controlCode: "NIST AC-2",
      description: "Account Management",
    },
  });
  const gdpr = await prisma.complianceFramework.create({
    data: {
      name: "GDPR",
      controlCode: "GDPR Article 25",
      description: "Data Protection by Design",
    },
  });
  const iso = await prisma.complianceFramework.create({
    data: {
      name: "ISO 27001",
      controlCode: "ISO 27001:A.9",
      description: "Access Control",
    },
  });

  await prisma.exceptionTypeCompliance.createMany({
    data: [
      { exceptionTypeId: adminAccess.id, frameworkId: nist.id },
      { exceptionTypeId: firewall.id, frameworkId: nist.id },
      { exceptionTypeId: encryption.id, frameworkId: gdpr.id },
      { exceptionTypeId: dataAccess.id, frameworkId: iso.id },
      { exceptionTypeId: devEnv.id, frameworkId: iso.id },
    ],
  });

  // ============= EXCEPTIONS =============
  // Builds Exception + RiskAssessment + Approval row(s) consistent with status,
  // using the REAL risk engine so scores match what the live app would compute.
  async function seedException({
    title,
    description,
    businessJustification,
    systemAffected,
    type,
    policy,
    department,
    requester,
    startDate,
    expiryDate,
    renewalCount = 0,
    status, // DRAFT | SUBMITTED | MANAGER_APPROVED | ACTIVE | EXPIRED | REJECTED
    managerApprover,
    managerDecision,
    managerComments,
    securityApprover,
    securityDecision,
    securityComments,
    createdAt,
    isCritical = false,
  }) {
    const managerApproved =
      ["MANAGER_APPROVED", "ACTIVE", "EXPIRED"].includes(status) &&
      managerDecision === "APPROVED";
    const securityApproved =
      ["ACTIVE", "EXPIRED"].includes(status) && securityDecision === "APPROVED";

    const risk = calculateRisk({
      baseRiskScore: type.baseRiskScore,
      startDate,
      expiryDate,
      renewalCount,
      managerApproved,
      securityApproved,
    });

    const exception = await prisma.exception.create({
      data: {
        title,
        description,
        businessJustification,
        systemAffected,
        exceptionTypeId: type.id,
        policyId: policy ? policy.id : null,
        departmentId: department.id,
        requesterId: requester.id,
        startDate: startDate || null,
        expiryDate: expiryDate || null,
        renewalCount,
        riskScore: risk.finalScore,
        riskLevel: risk.riskLevel,
        status,
        isCritical,
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
        assessmentNotes: "Seed data — calculated via riskEngine",
      },
    });

    if (status !== "DRAFT") {
      await prisma.approval.create({
        data: {
          exceptionId: exception.id,
          approvalRole: "MANAGER",
          decision: managerDecision || "PENDING",
          approverId: managerDecision ? managerApprover.id : null,
          comments: managerComments || null,
          approvedAt:
            managerDecision && managerDecision !== "PENDING"
              ? new Date()
              : null,
        },
      });
    }

    if (managerApproved) {
      await prisma.approval.create({
        data: {
          exceptionId: exception.id,
          approvalRole: "SECURITY_REVIEWER",
          decision: securityDecision || "PENDING",
          approverId: securityDecision ? securityApprover.id : null,
          comments: securityComments || null,
          approvedAt:
            securityDecision && securityDecision !== "PENDING"
              ? new Date()
              : null,
        },
      });
    }

    return exception;
  }

  // ---------- IT (7 exceptions — intentionally the "problem department" for the Governance Score demo) ----------
  await seedException({
    title: "Temporary admin access for Q3 DB migration",
    businessJustification:
      "Need elevated access to run the Q3 database migration safely outside business hours.",
    systemAffected: "Production DB Cluster",
    type: adminAccess,
    policy: policyAccess,
    department: itDept,
    requester: reqIT1,
    startDate: new Date("2026-03-27"),
    expiryDate: daysFromNow(4),
    status: "ACTIVE",
    managerApprover: mgrIT,
    managerDecision: "APPROVED",
    managerComments: "Justified, time-boxed window",
    securityApprover: sec1,
    securityDecision: "APPROVED",
    securityComments: "Approved with monitoring",
  });

  await seedException({
    title: "Encryption waiver for legacy reporting service",
    businessJustification:
      "Legacy reporting service cannot support the new encryption standard until the Q4 rewrite.",
    systemAffected: "Legacy Reporting Service",
    type: encryption,
    policy: policyEncryption,
    department: itDept,
    requester: reqIT2,
    startDate: daysFromNow(-6),
    expiryDate: daysFromNow(24),
    status: "SUBMITTED",
    isCritical: true,
  });

  await seedException({
    title: "Firewall rule for partner API integration",
    businessJustification:
      "Outbound access to Partner Ltd API required for the new integration.",
    systemAffected: "API Gateway",
    type: firewall,
    policy: policyFirewall,
    department: itDept,
    requester: reqIT3,
    startDate: daysFromNow(-5),
    expiryDate: daysFromNow(25),
    status: "MANAGER_APPROVED",
    managerApprover: mgrIT,
    managerDecision: "APPROVED",
    managerComments: "Approved pending security sign-off",
  });

  await seedException({
    title: "Sandbox access for new CI pipeline",
    businessJustification:
      "Developers need a sandboxed dev environment for the new CI/CD pipeline rollout.",
    systemAffected: "Dev/Staging Environment",
    type: devEnv,
    policy: null,
    department: itDept,
    requester: reqIT4,
    startDate: daysFromNow(-10),
    expiryDate: daysFromNow(20),
    status: "ACTIVE",
    managerApprover: mgrIT,
    managerDecision: "APPROVED",
    securityApprover: sec2,
    securityDecision: "APPROVED",
  });

  // Orphaned access — approved long ago, never revoked, expiry silently passed.
  // status stays ACTIVE on purpose -> triggers EXPIRED_BUT_ACTIVE anomaly flag.
  await seedException({
    title: "Vendor data export access (Project Atlas)",
    businessJustification:
      "One-off data export for the Project Atlas vendor handover.",
    systemAffected: "Customer Data Warehouse",
    type: dataAccess,
    policy: policyAccess,
    department: itDept,
    requester: reqIT5,
    startDate: new Date("2023-01-15"),
    expiryDate: new Date("2023-07-15"),
    renewalCount: 2,
    status: "ACTIVE",
    isCritical: true,
    managerApprover: mgrIT,
    managerDecision: "APPROVED",
    securityApprover: sec3,
    securityDecision: "APPROVED",
  });

  // Properly closed out, but only after 3 renewals -> EXCESSIVE_RENEWALS anomaly + drags down governance score.
  await seedException({
    title: "Admin access for build server maintenance",
    businessJustification:
      "Recurring admin access for monthly build server patching — repeatedly renewed instead of made permanent.",
    systemAffected: "CI Build Server",
    type: adminAccess,
    policy: policyAccess,
    department: itDept,
    requester: reqIT1,
    startDate: new Date("2025-06-01"),
    expiryDate: new Date("2025-12-01"),
    renewalCount: 3,
    status: "EXPIRED",
    isCritical: true,
    managerApprover: mgrIT,
    managerDecision: "APPROVED",
    securityApprover: sec1,
    securityDecision: "APPROVED",
  });

  await seedException({
    title: "Firewall exception for internal monitoring tool",
    businessJustification:
      "Draft — still gathering justification before submitting for review.",
    systemAffected: "Internal Monitoring Stack",
    type: firewall,
    policy: null,
    department: itDept,
    requester: reqIT4,
    startDate: daysFromNow(5),
    expiryDate: daysFromNow(35),
    status: "DRAFT",
  });

  // ---------- Finance (4 exceptions — clean department) ----------
  await seedException({
    title: "Read access to consolidated revenue dataset",
    businessJustification:
      "Quarter-end close requires temporary read access to the consolidated revenue dataset.",
    systemAffected: "Finance Data Warehouse",
    type: dataAccess,
    policy: policyFinance,
    department: financeDept,
    requester: reqFIN1,
    startDate: daysFromNow(-27),
    expiryDate: daysFromNow(3),
    status: "ACTIVE",
    managerApprover: mgrFinance,
    managerDecision: "APPROVED",
    securityApprover: sec2,
    securityDecision: "APPROVED",
  });

  await seedException({
    title: "Firewall rule for banking partner SFTP",
    businessJustification:
      "SFTP connectivity required to exchange reconciliation files with the banking partner.",
    systemAffected: "SFTP Gateway",
    type: firewall,
    policy: policyFirewall,
    department: financeDept,
    requester: reqFIN2,
    startDate: daysFromNow(10),
    expiryDate: daysFromNow(40),
    status: "SUBMITTED",
  });

  await seedException({
    title: "Sandbox access for budgeting tool POC",
    businessJustification:
      "Evaluating a new budgeting tool; needs an isolated sandbox for the proof of concept.",
    systemAffected: "Finance Sandbox",
    type: devEnv,
    policy: null,
    department: financeDept,
    requester: reqFIN3,
    startDate: daysFromNow(-11),
    expiryDate: daysFromNow(19),
    status: "ACTIVE",
    managerApprover: mgrFinance,
    managerDecision: "APPROVED",
    securityApprover: sec3,
    securityDecision: "APPROVED",
  });

  await seedException({
    title: "Admin access to payment gateway config",
    businessJustification:
      "Need temporary admin rights to update payment gateway configuration for the new card processor.",
    systemAffected: "Payment Gateway Console",
    type: adminAccess,
    policy: policyFinance,
    department: financeDept,
    requester: reqFIN4,
    startDate: daysFromNow(-16),
    expiryDate: daysFromNow(14),
    status: "MANAGER_APPROVED",
    managerApprover: mgrFinance,
    managerDecision: "APPROVED",
    managerComments: "Approved — escalating to security for final sign-off",
  });

  // ---------- HR (3 exceptions) ----------
  await seedException({
    title: "Encryption waiver for legacy HRIS export",
    businessJustification:
      "Legacy HRIS export job cannot be re-encrypted before the vendor migration completes.",
    systemAffected: "Legacy HRIS",
    type: encryption,
    policy: policyHR,
    department: hrDept,
    requester: reqHR1,
    startDate: daysFromNow(-20),
    expiryDate: daysFromNow(10),
    status: "REJECTED",
    isCritical: true,
    managerApprover: mgrHR,
    managerDecision: "REJECTED",
    managerComments:
      "Insufficient justification — encryption waivers require a remediation timeline before approval.",
  });

  await seedException({
    title: "Access to employee PII for compliance audit",
    businessJustification:
      "External compliance auditor requires temporary read access to employee PII fields.",
    systemAffected: "HRIS Core Database",
    type: dataAccess,
    policy: policyHR,
    department: hrDept,
    requester: reqHR2,
    startDate: daysFromNow(14),
    expiryDate: daysFromNow(44),
    status: "SUBMITTED",
  });

  await seedException({
    title: "Admin access for HRIS year-end processing",
    businessJustification:
      "Year-end payroll processing requires elevated access to the HRIS admin console.",
    systemAffected: "HRIS Admin Console",
    type: adminAccess,
    policy: policyHR,
    department: hrDept,
    requester: reqHR3,
    startDate: daysFromNow(-30),
    expiryDate: daysFromNow(60),
    status: "ACTIVE",
    managerApprover: mgrHR,
    managerDecision: "APPROVED",
    securityApprover: sec3,
    securityDecision: "APPROVED",
  });

  // ---------- Security (3 exceptions) ----------
  await seedException({
    title: "Firewall rule for SIEM log forwarding",
    businessJustification:
      "New SIEM tool requires an outbound rule to forward logs to the managed detection provider.",
    systemAffected: "SIEM Log Forwarder",
    type: firewall,
    policy: policyFirewall,
    department: secDept,
    requester: reqSEC1,
    startDate: daysFromNow(-15),
    expiryDate: daysFromNow(20),
    status: "ACTIVE",
    managerApprover: mgrSecurity,
    managerDecision: "APPROVED",
    securityApprover: sec1,
    securityDecision: "APPROVED",
  });

  await seedException({
    title: "Sandbox access for vulnerability scanner testing",
    businessJustification:
      "Need an isolated environment to test the new vulnerability scanner before production rollout.",
    systemAffected: "Security Sandbox",
    type: devEnv,
    policy: null,
    department: secDept,
    requester: reqSEC2,
    startDate: daysFromNow(2),
    expiryDate: daysFromNow(32),
    status: "MANAGER_APPROVED",
    managerApprover: mgrSecurity,
    managerDecision: "APPROVED",
    managerComments: "Approved — routine sandbox request",
  });

  await seedException({
    title: "Admin access for incident response (Project Falcon)",
    businessJustification:
      "Active incident response requires elevated access to isolate and investigate the affected host.",
    systemAffected: "EDR / Incident Response Console",
    type: adminAccess,
    policy: policyAccess,
    department: secDept,
    requester: reqSEC3,
    startDate: daysFromNow(-3),
    expiryDate: daysFromNow(6),
    status: "ACTIVE",
    managerApprover: mgrSecurity,
    managerDecision: "APPROVED",
    securityApprover: sec2,
    securityDecision: "APPROVED",
  });

  console.log("✅ Seed complete.");
  console.log(
    "   Departments: 4 | Requesters: 15 | Managers: 4 | Security Reviewers: 3 | Exceptions: 17"
  );
  console.log("   Demo login (password for all: password123):");
  console.log("   admin@socgen.local            (ADMIN)");
  console.log("   manager@socgen.local           (APPROVER — IT)");
  console.log("   finance.manager@socgen.local   (APPROVER — Finance)");
  console.log("   hr.manager@socgen.local        (APPROVER — HR)");
  console.log("   security.manager@socgen.local  (APPROVER — Security)");
  console.log("   security@socgen.local          (SECURITY_REVIEWER)");
  console.log("   security2@socgen.local         (SECURITY_REVIEWER)");
  console.log("   security3@socgen.local         (SECURITY_REVIEWER)");
  console.log("   auditor@socgen.local           (AUDITOR)");
  console.log(
    "   requester@socgen.local         (REQUESTER — IT)  ...+14 more req.*@socgen.local"
  );
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
