const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const requireRole = require('../middleware/rbac');

router.get('/active-exceptions', requireRole('SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'), ctrl.activeExceptions);
router.get('/expired-exceptions', requireRole('SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'), ctrl.expiredExceptions);
router.get('/critical-exceptions', requireRole('SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'), ctrl.criticalExceptions);
router.get('/department-wise', requireRole('SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'), ctrl.departmentWise);
router.get('/compliance-impact', requireRole('SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'), ctrl.complianceImpact);
router.get('/dashboard', requireRole('APPROVER', 'SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'), ctrl.dashboard);

module.exports = router;
