const cron = require('node-cron');
const prisma = require('../prismaClient');
const { notify } = require('../services/notificationService');
const { runAndPersist } = require('../utils/anomalyDetector');

const DAY_MS = 24 * 60 * 60 * 1000;

// Job 1: mark ACTIVE exceptions past their expiry date as EXPIRED
async function checkExpiry() {
  const result = await prisma.exception.updateMany({
    where: { status: 'ACTIVE', expiryDate: { lte: new Date() } },
    data: { status: 'EXPIRED' },
  });
  console.log(`[scheduler] expiry check: ${result.count} exception(s) expired`);
}

// Job 2: send 7-day / 3-day / overdue notifications
async function sendExpiryNotifications() {
  await sendWarningsFor(7);
  await sendWarningsFor(3);
  await sendOverdueReminders();
}

async function sendWarningsFor(daysOut) {
  const target = new Date(Date.now() + daysOut * DAY_MS);
  const windowStart = new Date(target.getTime() - DAY_MS / 2);
  const windowEnd = new Date(target.getTime() + DAY_MS / 2);

  const exceptions = await prisma.exception.findMany({
    where: { status: 'ACTIVE', expiryDate: { gte: windowStart, lt: windowEnd } },
  });

  for (const e of exceptions) {
    await notify(e.requesterId, e.id, 'EXPIRY_WARNING', `Your exception "${e.title}" expires in ${daysOut} days`);
  }
  console.log(`[scheduler] ${daysOut}-day warnings sent: ${exceptions.length}`);
}

async function sendOverdueReminders() {
  const overdue = await prisma.exception.findMany({ where: { status: 'EXPIRED' } });
  for (const e of overdue) {
    await notify(e.requesterId, e.id, 'OVERDUE', `Your exception "${e.title}" has expired and needs renewal or closure`);
  }
  console.log(`[scheduler] overdue reminders sent: ${overdue.length}`);
}

// Job 3: anomaly detection
async function runAnomalyDetection() {
  const flags = await runAndPersist();
  const critical = flags.filter((f) => f.severity === 'CRITICAL');
  for (const f of critical) {
    const securityReviewers = await prisma.user.findMany({ where: { role: 'SECURITY_REVIEWER', isActive: true } });
    for (const r of securityReviewers) {
      await notify(r.id, f.exceptionId, 'EXPIRY_WARNING', `CRITICAL anomaly: ${f.description}`);
    }
  }
  console.log(`[scheduler] anomaly detection: ${flags.length} flag(s) found`);
}

function initializeSchedulers() {
  // Daily expiry check - midnight UTC
  cron.schedule('0 0 * * *', () => checkExpiry().catch((e) => console.error('expiry job failed', e)));

  // Daily notifications - 6 AM UTC
  cron.schedule('0 6 * * *', () => sendExpiryNotifications().catch((e) => console.error('notification job failed', e)));

  // Hourly anomaly detection
  cron.schedule('0 * * * *', () => runAnomalyDetection().catch((e) => console.error('anomaly job failed', e)));

  console.log('✅ Schedulers initialized (expiry: daily 00:00, notifications: daily 06:00, anomalies: hourly)');
}

module.exports = { initializeSchedulers, checkExpiry, sendExpiryNotifications, runAnomalyDetection };
