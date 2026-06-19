const prisma = require('../prismaClient');

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Runs all 5 anomaly detection rules and returns an array of flag objects
 * (not yet persisted). Caller decides whether to persist/replace them.
 */
async function detectAnomalies() {
  const flags = [];

  // Rule 1: Expired but still marked ACTIVE
  const expiredActive = await prisma.exception.findMany({
    where: { status: 'ACTIVE', expiryDate: { lt: new Date() } },
  });
  for (const e of expiredActive) {
    flags.push({
      exceptionId: e.id,
      anomalyType: 'EXPIRED_BUT_ACTIVE',
      severity: 'CRITICAL',
      description: `Exception expired on ${e.expiryDate.toISOString().slice(0, 10)} but is still marked ACTIVE`,
    });
  }

  // Rule 2: Stalled in review (SUBMITTED > 30 days)
  const stalled = await prisma.exception.findMany({
    where: { status: 'SUBMITTED', createdAt: { lt: new Date(Date.now() - 30 * DAY_MS) } },
  });
  for (const e of stalled) {
    const days = Math.floor((Date.now() - e.createdAt.getTime()) / DAY_MS);
    flags.push({
      exceptionId: e.id,
      anomalyType: 'STALLED_REVIEW',
      severity: 'WARNING',
      description: `Pending approval for ${days} days`,
    });
  }

  // Rule 3: Long running (duration > 180 days) while ACTIVE
  const longRunning = await prisma.exception.findMany({
    where: { status: 'ACTIVE', startDate: { not: null }, expiryDate: { not: null } },
  });
  for (const e of longRunning) {
    const days = Math.ceil((e.expiryDate - e.startDate) / DAY_MS);
    if (days > 180) {
      flags.push({
        exceptionId: e.id,
        anomalyType: 'LONG_RUNNING',
        severity: 'WARNING',
        description: `Exception duration is ${days} days (>180). Consider a permanent policy change.`,
      });
    }
  }

  // Rule 4: 3+ simultaneous ACTIVE exceptions for the same requester
  const grouped = await prisma.exception.groupBy({
    by: ['requesterId'],
    where: { status: 'ACTIVE' },
    _count: { id: true },
  });
  for (const g of grouped) {
    if (g._count.id >= 3) {
      const userExceptions = await prisma.exception.findMany({
        where: { requesterId: g.requesterId, status: 'ACTIVE' },
      });
      for (const e of userExceptions) {
        flags.push({
          exceptionId: e.id,
          anomalyType: 'MULTIPLE_PER_USER',
          severity: 'WARNING',
          description: `Requester has ${g._count.id} active exceptions simultaneously`,
        });
      }
    }
  }

  // Rule 5: Excessive renewals (3+)
  const excessiveRenewals = await prisma.exception.findMany({
    where: { renewalCount: { gte: 3 } },
  });
  for (const e of excessiveRenewals) {
    flags.push({
      exceptionId: e.id,
      anomalyType: 'EXCESSIVE_RENEWALS',
      severity: 'WARNING',
      description: `Renewed ${e.renewalCount} times. Consider converting to a permanent policy change.`,
    });
  }

  return flags;
}

/**
 * Runs detection and persists the results, replacing unresolved flags.
 */
async function runAndPersist() {
  const flags = await detectAnomalies();

  await prisma.anomalyFlag.deleteMany({ where: { isResolved: false } });
  if (flags.length > 0) {
    await prisma.anomalyFlag.createMany({ data: flags });
  }

  return flags;
}

module.exports = { detectAnomalies, runAndPersist };
