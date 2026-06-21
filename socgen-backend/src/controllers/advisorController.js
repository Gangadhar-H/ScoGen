const prisma = require("../prismaClient");
const asyncHandler = require("../utils/asyncHandler");
const { buildAdvisorSuggestion } = require("../utils/governanceAdvisor");
const { logAction } = require("../utils/auditLogger");

// POST /api/advisor/suggest
// body: { exceptionTypeId, title, businessJustification, systemAffected, startDate, expiryDate, renewalCount? }
const suggest = asyncHandler(async (req, res) => {
  const {
    exceptionTypeId,
    title,
    businessJustification,
    systemAffected,
    startDate,
    expiryDate,
    renewalCount,
  } = req.body;

  if (!exceptionTypeId) {
    return res.status(400).json({ error: "exceptionTypeId is required" });
  }

  const exceptionType = await prisma.exceptionType.findUnique({
    where: { id: exceptionTypeId },
  });
  if (!exceptionType)
    return res.status(400).json({ error: "Invalid exceptionTypeId" });

  let suggestion;
  try {
    suggestion = await buildAdvisorSuggestion({
      exceptionType,
      title,
      businessJustification,
      systemAffected,
      startDate: startDate || null,
      expiryDate: expiryDate || null,
      renewalCount: renewalCount || 0,
    });
  } catch (err) {
    console.error("Gemini advisor call failed:", err.message);
    // Fail soft — never block exception creation because the AI call failed
    return res.json({ hasSuggestion: false, error: "advisor_unavailable" });
  }

  if (suggestion.hasSuggestion) {
    await logAction({
      req,
      action: "ADVISOR_SUGGESTION_SHOWN",
      resourceType: "advisor",
      resourceId: exceptionTypeId,
      newValue: {
        alternative: suggestion.alternative.label,
        reduction: suggestion.alternative.riskReductionPercent,
      },
    });
  }

  res.json(suggestion);
});

module.exports = { suggest };
