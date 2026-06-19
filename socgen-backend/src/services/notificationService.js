const prisma = require('../prismaClient');

// Mock email service - logs to console (swap for Nodemailer/SES later)
function sendEmail(to, subject, body) {
  console.log(`📧 [MOCK EMAIL] To: ${to} | Subject: ${subject} | ${body}`);
}

async function notify(userId, exceptionId, type, message) {
  const notification = await prisma.notification.create({
    data: { userId, exceptionId, type, message },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user) sendEmail(user.email, type, message);

  return notification;
}

// Notify everyone with a given role (optionally scoped to a department)
async function notifyRole(role, departmentId, exceptionId, type, message) {
  const where = { role, isActive: true };
  if (departmentId) where.departmentId = departmentId;

  const users = await prisma.user.findMany({ where });
  for (const u of users) {
    await notify(u.id, exceptionId, type, message);
  }
  return users.length;
}

module.exports = { notify, notifyRole, sendEmail };
