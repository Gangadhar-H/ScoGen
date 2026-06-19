const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auditController');
const requireRole = require('../middleware/rbac');

router.get('/', requireRole('SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'), ctrl.listAuditLogs);
router.get('/:exceptionId', requireRole('SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'), ctrl.exceptionTimeline);

module.exports = router;
