// Governance Credit Score — pure calculation, no DB calls.
// score range 0-100 per department; lower = worse governance hygiene.

const SEVERITY_WEIGHT = { CRITICAL: 6, WARNING: 3, INFO: 1 };

function gradeFor(score) {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

/**
 * @param {object} input
 * @param {Array} input.exceptions   - exceptions belonging to one department
 * @param {Array} input.approvals    - approval rows tied to those exceptions
 * @param {Array} input.anomalyFlags - live (unresolved) anomaly flags tied to those exceptions
 */
function computeGovernanceScore({ exceptions, approvals, anomalyFlags }) {
  const total = exceptions.length;
  const breakdown = {};
  let score = 100;

  // Factor 1: Expired exceptions (orphaned access)
  const expiredCount = exceptions.filter((e) => e.status === "EXPIRED").length;
  const expiredRatio = total ? expiredCount / total : 0;
  const expiredPenalty = total
    ? Math.min(30, Math.round(expiredRatio * 100 * 0.5))
    : 0;
  score -= expiredPenalty;
  breakdown.expiredExceptions = {
    count: expiredCount,
    total,
    penalty: expiredPenalty,
  };

  // Factor 2: Late renewals (2+ renewals = "temporary" exception turning permanent)
  const lateRenewalCount = exceptions.filter((e) => e.renewalCount >= 2).length;
  const lateRenewalPenalty = Math.min(20, lateRenewalCount * 4);
  score -= lateRenewalPenalty;
  breakdown.lateRenewals = {
    count: lateRenewalCount,
    penalty: lateRenewalPenalty,
  };

  // Factor 3: Approval quality (rejections + rework requests)
  const decided = approvals.filter((a) => a.decision !== "PENDING");
  const reworkCount = approvals.filter((a) =>
    ["REJECTED", "MORE_INFO"].includes(a.decision)
  ).length;
  const reworkRatio = decided.length ? reworkCount / decided.length : 0;
  const approvalPenalty = decided.length
    ? Math.min(25, Math.round(reworkRatio * 100 * 0.35))
    : 0;
  score -= approvalPenalty;
  breakdown.approvalQuality = {
    reworkCount,
    decidedCount: decided.length,
    penalty: approvalPenalty,
  };

  // Factor 4: Audit findings (open anomaly flags, severity-weighted)
  const findingsPenalty = Math.min(
    25,
    anomalyFlags.reduce((sum, f) => sum + (SEVERITY_WEIGHT[f.severity] || 1), 0)
  );
  score -= findingsPenalty;
  breakdown.auditFindings = {
    count: anomalyFlags.length,
    penalty: findingsPenalty,
  };

  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, grade: gradeFor(score), breakdown };
}

module.exports = { computeGovernanceScore, gradeFor };
