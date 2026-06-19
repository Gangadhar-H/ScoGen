const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const requireRole = require('../middleware/rbac');

router.use(requireRole('ADMIN'));

router.get('/users', ctrl.listUsers);
router.post('/users', ctrl.createUser);
router.put('/users/:id', ctrl.updateUser);
router.post('/exception-types', ctrl.createExceptionType);
router.post('/policies', ctrl.createPolicy);
router.get('/metrics', ctrl.systemMetrics);

module.exports = router;
