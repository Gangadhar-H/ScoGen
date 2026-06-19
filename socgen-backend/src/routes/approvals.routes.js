const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/approvalController');
const requireRole = require('../middleware/rbac');

router.get('/', requireRole('APPROVER', 'SECURITY_REVIEWER', 'AUDITOR', 'ADMIN'), ctrl.listApprovals);
router.post('/:exceptionId/approve', requireRole('APPROVER', 'SECURITY_REVIEWER', 'ADMIN'), ctrl.approve);
router.post('/:exceptionId/reject', requireRole('APPROVER', 'SECURITY_REVIEWER', 'ADMIN'), ctrl.reject);
router.post('/:exceptionId/request-info', requireRole('APPROVER', 'SECURITY_REVIEWER', 'ADMIN'), ctrl.requestInfo);

module.exports = router;
