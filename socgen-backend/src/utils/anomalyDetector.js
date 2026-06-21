const prisma = require("../prismaClient");

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Runs all 5 anomaly detection rules and returns an array of flag objects
 * (not yet persisted). Caller decides whether to persist/replace them.
 */
async function detectAnomalies() {
  const flags = [];
  const now = Date.now();

  // ONE query instead of groupBy + per-group findMany (was N+1)
  const exceptions = await prisma.exception.findMany({
    select: {
      id: true,
      status: true,
      expiryDate: true,
      startDate: true,
      createdAt: true,
      renewalCount: true,
      requesterId: true,
      exceptionTypeId: true,
      departmentId: true,
      systemAffected: true,
      riskLevel: true,
      riskScore: true,
    },
  });

  // Rule 1: Expired but still ACTIVE
  for (const e of exceptions) {
    if (e.status === "ACTIVE" && e.expiryDate && e.expiryDate.getTime() < now) {
      flags.push({
        exceptionId: e.id,
        anomalyType: "EXPIRED_BUT_ACTIVE",
        severity: "CRITICAL",
        description: `Exception expired on ${e.expiryDate
          .toISOString()
          .slice(0, 10)} but is still marked ACTIVE`,
      });
    }
  }

  // Rule 2: Stalled in review (SUBMITTED > 30 days)
  for (const e of exceptions) {
    if (e.status === "SUBMITTED" && now - e.createdAt.getTime() > 30 * DAY_MS) {
      const days = Math.floor((now - e.createdAt.getTime()) / DAY_MS);
      flags.push({
        exceptionId: e.id,
        anomalyType: "STALLED_REVIEW",
        severity: "WARNING",
        description: `Pending approval for ${days} days`,
      });
    }
  }

  // Rule 3: Long running (duration > 180 days) while ACTIVE
  for (const e of exceptions) {
    if (e.status === "ACTIVE" && e.startDate && e.expiryDate) {
      const days = Math.ceil((e.expiryDate - e.startDate) / DAY_MS);
      if (days > 180) {
        flags.push({
          exceptionId: e.id,
          anomalyType: "LONG_RUNNING",
          severity: "WARNING",
          description: `Exception duration is ${days} days (>180). Consider a permanent policy change.`,
        });
      }
    }
  }

  // Rule 4: 3+ simultaneous ACTIVE exceptions per requester
  const activeByRequester = {};
  for (const e of exceptions)
    if (e.status === "ACTIVE")
      (activeByRequester[e.requesterId] ||= []).push(e);
  for (const list of Object.values(activeByRequester)) {
    if (list.length >= 3) {
      for (const e of list) {
        flags.push({
          exceptionId: e.id,
          anomalyType: "MULTIPLE_PER_USER",
          severity: "WARNING",
          description: `Requester has ${list.length} active exceptions simultaneously`,
        });
      }
    }
  }

  // Rule 5: Excessive renewals (3+)
  for (const e of exceptions) {
    if (e.renewalCount >= 3) {
      flags.push({
        exceptionId: e.id,
        anomalyType: "EXCESSIVE_RENEWALS",
        severity: "WARNING",
        description: `Renewed ${e.renewalCount} times. Consider converting to a permanent policy change.`,
      });
    }
  }

  // Rule 6: Repeated exception pattern (same type+dept+system, 3+ times)
  const repeatedGroups = {};
  for (const e of exceptions) {
    const key = `${e.exceptionTypeId}|${e.departmentId}|${e.systemAffected}`;
    (repeatedGroups[key] ||= []).push(e);
  }
  for (const group of Object.values(repeatedGroups)) {
    if (group.length >= 3) {
      const mostRecent = group.reduce((a, b) =>
        a.createdAt > b.createdAt ? a : b
      );
      flags.push({
        exceptionId: mostRecent.id,
        anomalyType: "REPEATED_EXCEPTION",
        severity: "WARNING",
        description: `This exception type has been requested ${group.length} times for the same system ("${mostRecent.systemAffected}"). Consider a permanent policy change instead of repeated exceptions.`,
      });
    }
  }

  // Rule 7: HIGH-risk exception that's been active long-term — risk is
  // accumulating without anyone re-reviewing it.
  for (const e of exceptions) {
    if (
      e.status === "ACTIVE" &&
      e.riskLevel === "HIGH" &&
      e.startDate &&
      e.expiryDate
    ) {
      const days = Math.ceil((e.expiryDate - e.startDate) / DAY_MS);
      if (days > 180) {
        flags.push({
          exceptionId: e.id,
          anomalyType: "HIGH_RISK_LONG_EXCEPTION",
          severity: "WARNING",
          description: `HIGH risk exception (score ${e.riskScore}) has been active for a ${days}-day window without re-review.`,
        });
      }
    }
  }

  // Rule 8: CRITICAL-risk exception currently ACTIVE — immediate escalation,
  // regardless of how long it's been open.
  for (const e of exceptions) {
    if (e.status === "ACTIVE" && e.riskLevel === "CRITICAL") {
      flags.push({
        exceptionId: e.id,
        anomalyType: "CRITICAL_RISK_EXCEPTION",
        severity: "CRITICAL",
        description: `Exception carries CRITICAL risk (score ${e.riskScore}) while ACTIVE — requires immediate security review.`,
      });
    }
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
