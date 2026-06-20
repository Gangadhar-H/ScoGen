const prisma = require("../prismaClient");
const nodemailer = require("nodemailer");
const { buildExceptionEmailHtml } = require("../utils/emailTemplates");

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Types where the recipient is an approver/reviewer -> link should go to the approval queue
const APPROVAL_QUEUE_TYPES = ["APPROVAL_REQUIRED", "RENEWAL_REQUIRED"];

function resolveActionUrl(exceptionId, type) {
  if (!exceptionId) return null;
  if (APPROVAL_QUEUE_TYPES.includes(type)) {
    return `${FRONTEND_URL}/approvals`;
  }
  return `${FRONTEND_URL}/exceptions/${exceptionId}`;
}

function resolveActionLabel(type) {
  if (APPROVAL_QUEUE_TYPES.includes(type)) return "Review in Approval Queue";
  if (type === "INFO_REQUESTED") return "Update Exception";
  return "View Exception";
}

async function sendEmail({
  to,
  type,
  message,
  exception,
  actionUrl,
  actionLabel,
}) {
  if (!transporter) {
    console.log(
      `📧 [MOCK EMAIL — no SMTP configured] To: ${to} | Type: ${type} | ${message} | Link: ${actionUrl}`
    );
    return;
  }
  try {
    const html = buildExceptionEmailHtml({
      type,
      message,
      exception,
      actionUrl,
      actionLabel,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `SentinelGRC — ${type.replace(/_/g, " ")}${
        exception ? `: ${exception.title}` : ""
      }`,
      text: `${message}\n\nView: ${actionUrl || ""}`,
      html,
    });
  } catch (err) {
    console.error(
      "Email send failed, falling back to console log:",
      err.message
    );
    console.log(`📧 [MOCK EMAIL] To: ${to} | Type: ${type} | ${message}`);
  }
}

async function notify(userId, exceptionId, type, message) {
  const notification = await prisma.notification.create({
    data: { userId, exceptionId, type, message },
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return notification;

  const exception = exceptionId
    ? await prisma.exception.findUnique({
        where: { id: exceptionId },
        include: { department: true, requester: { select: { name: true } } },
      })
    : null;

  await sendEmail({
    to: user.email,
    type,
    message,
    exception,
    actionUrl: resolveActionUrl(exceptionId, type),
    actionLabel: resolveActionLabel(type),
  });

  return notification;
}

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
