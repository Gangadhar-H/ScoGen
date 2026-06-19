const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lookupController');

router.get('/departments', ctrl.listDepartments);
router.get('/exception-types', ctrl.listExceptionTypes);
router.get('/policies', ctrl.listPolicies);
router.get('/compliance-frameworks', ctrl.listComplianceFrameworks);

module.exports = router;
