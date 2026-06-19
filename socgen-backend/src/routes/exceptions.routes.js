const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/exceptionController');
const requireRole = require('../middleware/rbac');

router.post('/', requireRole('REQUESTER', 'ADMIN'), ctrl.createException);
router.get('/', ctrl.listExceptions); // scoping handled inside controller
router.get('/:id', ctrl.getException); // access check handled inside controller
router.put('/:id', ctrl.updateException);
router.delete('/:id', ctrl.deleteException);
router.post('/:id/submit', ctrl.submitException);
router.post('/:id/renew', ctrl.renewException);
router.post('/:id/revoke', ctrl.revokeException);

module.exports = router;
