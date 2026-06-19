const prisma = require('../prismaClient');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/notifications?isRead=false&limit=10
const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const where = { userId: req.user.id };
  if (req.query.isRead !== undefined) where.isRead = req.query.isRead === 'true';

  const [data, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } }),
  ]);

  res.json({ data, unreadCount });
});

// PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ success: true });
});

// PUT /api/notifications/mark-all-read
const markAllRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ success: true });
});

// DELETE /api/notifications/:id
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  await prisma.notification.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = { listNotifications, markRead, markAllRead, deleteNotification };
