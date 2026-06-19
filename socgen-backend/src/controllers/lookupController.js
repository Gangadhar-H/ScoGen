const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');

const listDepartments = asyncHandler(async (req, res) => {
  res.json(await prisma.department.findMany({ orderBy: { name: 'asc' } }));
});

const listExceptionTypes = asyncHandler(async (req, res) => {
  res.json(await prisma.exceptionType.findMany({ orderBy: { name: 'asc' } }));
});

const listPolicies = asyncHandler(async (req, res) => {
  res.json(await prisma.policy.findMany({ orderBy: { policyCode: 'asc' } }));
});

const listComplianceFrameworks = asyncHandler(async (req, res) => {
  res.json(await prisma.complianceFramework.findMany({ orderBy: { name: 'asc' } }));
});

module.exports = { listDepartments, listExceptionTypes, listPolicies, listComplianceFrameworks };
