// Risk scoring engine
// FINAL_SCORE = typeRisk + durationRisk + renewalRisk - approvalBonus  (clamped 0-100)

function getDurationRisk(startDate, expiryDate) {
  if (!startDate || !expiryDate) return 0;
  const days = Math.ceil((new Date(expiryDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  if (days <= 30) return 10;
  if (days <= 90) return 25;
  if (days <= 180) return 40;
  return 50;
}

function getRenewalRisk(renewalCount) {
  if (renewalCount <= 0) return 0;
  if (renewalCount === 1) return 5;
  if (renewalCount === 2) return 10;
  return 15; // 3rd+ renewal, capped
}

function getApprovalBonus({ managerApproved, securityApproved }) {
  let bonus = 0;
  if (managerApproved) bonus += 2;
  if (securityApproved) bonus += 5;
  return Math.min(bonus, 10);
}

function getRiskLevel(score) {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MEDIUM';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Calculates risk for an exception.
 * @param {object} params
 * @param {number} params.baseRiskScore - from the ExceptionType
 * @param {Date|string} params.startDate
 * @param {Date|string} params.expiryDate
 * @param {number} params.renewalCount
 * @param {boolean} [params.managerApproved]
 * @param {boolean} [params.securityApproved]
 * @param {number} [params.overrideScore] - security reviewer manual override
 */
function calculateRisk(params) {
  const {
    baseRiskScore,
    startDate,
    expiryDate,
    renewalCount = 0,
    managerApproved = false,
    securityApproved = false,
    overrideScore = null,
  } = params;

  const typeRisk = baseRiskScore;
  const durationRisk = getDurationRisk(startDate, expiryDate);
  const renewalRisk = getRenewalRisk(renewalCount);
  const approvalBonus = getApprovalBonus({ managerApproved, securityApproved });

  let finalScore = typeRisk + durationRisk + renewalRisk - approvalBonus;
  finalScore = Math.min(100, Math.max(0, finalScore));

  if (overrideScore !== null && overrideScore !== undefined) {
    finalScore = Math.min(100, Math.max(0, overrideScore));
  }

  return {
    typeRisk,
    durationRisk,
    renewalRisk,
    approvalBonus,
    finalScore,
    riskLevel: getRiskLevel(finalScore),
  };
}

module.exports = { calculateRisk, getRiskLevel };
