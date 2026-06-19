const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Departments
  const itDept = await prisma.department.create({ data: { name: 'IT' } });
  const secDept = await prisma.department.create({ data: { name: 'Security' } });
  const financeDept = await prisma.department.create({ data: { name: 'Finance' } });

  // Users (password for all demo users below)
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: { email: 'admin@socgen.local', name: 'Admin User', passwordHash: password, role: 'ADMIN', departmentId: itDept.id },
  });
  const requester = await prisma.user.create({
    data: { email: 'requester@socgen.local', name: 'Riya Requester', passwordHash: password, role: 'REQUESTER', departmentId: itDept.id },
  });
  const manager = await prisma.user.create({
    data: { email: 'manager@socgen.local', name: 'Mark Manager', passwordHash: password, role: 'APPROVER', departmentId: itDept.id },
  });
  const security = await prisma.user.create({
    data: { email: 'security@socgen.local', name: 'Sam Security', passwordHash: password, role: 'SECURITY_REVIEWER', departmentId: secDept.id },
  });
  const auditor = await prisma.user.create({
    data: { email: 'auditor@socgen.local', name: 'Avery Auditor', passwordHash: password, role: 'AUDITOR', departmentId: secDept.id },
  });

  // Exception types (base risk scores from the design doc)
  const firewall = await prisma.exceptionType.create({
    data: { name: 'Firewall Exception', baseRiskScore: 30, description: 'Firewall rule bypass or exception' },
  });
  const adminAccess = await prisma.exceptionType.create({
    data: { name: 'Admin Access', baseRiskScore: 50, description: 'Elevated administrative access' },
  });
  const encryption = await prisma.exceptionType.create({
    data: { name: 'Encryption Waiver', baseRiskScore: 70, description: 'Waiver for encryption requirement' },
  });
  const dataAccess = await prisma.exceptionType.create({
    data: { name: 'Data Access', baseRiskScore: 60, description: 'Access to sensitive data sets' },
  });
  const devEnv = await prisma.exceptionType.create({
    data: { name: 'Dev Environment', baseRiskScore: 10, description: 'Development environment exception' },
  });

  // Policies
  const policy1 = await prisma.policy.create({
    data: { policyCode: 'SEC-001', title: 'Firewall Policy', description: 'All internet traffic must go through firewall', severity: 'HIGH', ownerDepartmentId: secDept.id },
  });
  const policy2 = await prisma.policy.create({
    data: { policyCode: 'SEC-002', title: 'Data Encryption Policy', description: 'All sensitive data must be encrypted', severity: 'HIGH', ownerDepartmentId: secDept.id },
  });
  const policy3 = await prisma.policy.create({
    data: { policyCode: 'SEC-003', title: 'Access Control Policy', description: 'Admin access requires justification', severity: 'MEDIUM', ownerDepartmentId: secDept.id },
  });

  // Compliance frameworks
  const nist = await prisma.complianceFramework.create({ data: { name: 'NIST SP 800-53', controlCode: 'NIST AC-2', description: 'Account Management' } });
  const gdpr = await prisma.complianceFramework.create({ data: { name: 'GDPR', controlCode: 'GDPR Article 25', description: 'Data Protection by Design' } });
  const iso = await prisma.complianceFramework.create({ data: { name: 'ISO 27001', controlCode: 'ISO 27001:A.9', description: 'Access Control' } });

  // Exception type <-> compliance framework mapping (from design doc examples)
  await prisma.exceptionTypeCompliance.createMany({
    data: [
      { exceptionTypeId: adminAccess.id, frameworkId: nist.id },
      { exceptionTypeId: encryption.id, frameworkId: gdpr.id },
      { exceptionTypeId: dataAccess.id, frameworkId: iso.id },
    ],
  });

  // A sample exception so reports/dashboards aren't empty on first run
  await prisma.exception.create({
    data: {
      title: 'Temporary admin access for migration',
      businessJustification: 'Need elevated access to run the Q3 database migration',
      systemAffected: 'Production DB Cluster',
      exceptionTypeId: adminAccess.id,
      policyId: policy3.id,
      requesterId: requester.id,
      departmentId: itDept.id,
      startDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      riskScore: 60,
      riskLevel: 'HIGH',
      status: 'DRAFT',
    },
  });

  console.log('✅ Seed complete. Demo login (password for all: password123):');
  console.log('  admin@socgen.local       (ADMIN)');
  console.log('  requester@socgen.local   (REQUESTER)');
  console.log('  manager@socgen.local     (APPROVER)');
  console.log('  security@socgen.local    (SECURITY_REVIEWER)');
  console.log('  auditor@socgen.local     (AUDITOR)');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
