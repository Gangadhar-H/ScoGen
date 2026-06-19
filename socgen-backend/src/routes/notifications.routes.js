const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');

router.get('/', ctrl.listNotifications);
router.put('/mark-all-read', ctrl.markAllRead);
router.put('/:id/read', ctrl.markRead);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
