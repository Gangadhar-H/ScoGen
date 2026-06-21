const { calculateRisk } = require("./riskEngine");
const { getGeminiSuggestion } = require("../services/geminiAdvisorService");

// "Permanent" requests (no expiry chosen yet) are scored against a 365-day
// worst case so the advisor doesn't understate risk just because the form
// is still incomplete.
function resolveCurrentWindow(startDate, expiryDate) {
  if (startDate && expiryDate) {
    return { startDate: new Date(startDate), expiryDate: new Date(expiryDate) };
  }
  const start = startDate ? new Date(startDate) : new Date();
  const expiry = new Date(start.getTime() + 365 * 86400000);
  return { startDate: start, expiryDate: expiry, assumed: true };
}

async function buildAdvisorSuggestion({
  exceptionType,
  title,
  businessJustification,
  systemAffected,
  startDate,
  expiryDate,
  renewalCount = 0,
}) {
  const window = resolveCurrentWindow(startDate, expiryDate);

  // Risk score is ALWAYS computed by our own deterministic engine —
  // Gemini only decides whether to suggest an alternative and what it
  // should look like.
  const current = calculateRisk({
    baseRiskScore: exceptionType.baseRiskScore,
    startDate: window.startDate,
    expiryDate: window.expiryDate,
    renewalCount,
  });

  const durationDays = Math.ceil(
    (window.expiryDate - window.startDate) / 86400000
  );

  const gemini = await getGeminiSuggestion({
    title,
    businessJustification,
    systemAffected,
    exceptionTypeName: exceptionType.name,
    baseRiskScore: exceptionType.baseRiskScore,
    durationDays,
    isPermanent: !!window.assumed,
    currentRiskScore: current.finalScore,
    currentRiskLevel: current.riskLevel,
  });

  if (!gemini.shouldSuggest) {
    return { hasSuggestion: false, current };
  }

  // Defensive clamp — never let raw LLM output drive the risk engine
  // unconstrained, even though the schema already restricts the shape.
  const safeDuration = Math.max(
    1,
    Math.min(180, gemini.recommendedDurationDays || 14)
  );

  const altStart = startDate ? new Date(startDate) : new Date();
  const altExpiry = new Date(altStart.getTime() + safeDuration * 86400000);

  const alternative = calculateRisk({
    baseRiskScore: exceptionType.baseRiskScore,
    startDate: altStart,
    expiryDate: altExpiry,
    renewalCount: 0,
  });

  const riskReductionPercent =
    current.finalScore > 0
      ? Math.max(
          0,
          Math.round(
            ((current.finalScore - alternative.finalScore) /
              current.finalScore) *
              100
          )
        )
      : 0;

  return {
    hasSuggestion: true,
    current,
    alternative: {
      label: gemini.alternativeLabel,
      durationDays: safeDuration,
      startDate: altStart,
      expiryDate: altExpiry,
      riskScore: alternative.finalScore,
      riskLevel: alternative.riskLevel,
      riskReductionPercent,
      rationale: gemini.rationale,
    },
  };
}

module.exports = { buildAdvisorSuggestion };
