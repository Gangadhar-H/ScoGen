const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

// Force structured JSON back from Gemini so the rest of the app never has
// to parse free-form text — the LLM can only fill in these exact fields.
const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    shouldSuggest: { type: SchemaType.BOOLEAN },
    alternativeLabel: { type: SchemaType.STRING },
    recommendedDurationDays: { type: SchemaType.INTEGER },
    rationale: { type: SchemaType.STRING },
  },
  required: [
    "shouldSuggest",
    "alternativeLabel",
    "recommendedDurationDays",
    "rationale",
  ],
};

async function getGeminiSuggestion({
  title,
  businessJustification,
  systemAffected,
  exceptionTypeName,
  baseRiskScore,
  durationDays,
  isPermanent,
  currentRiskScore,
  currentRiskLevel,
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0.4,
    },
  });

  // NOTE: businessJustification/title/systemAffected are raw user input.
  // We only ever read structured fields back out of the schema-constrained
  // response below — nothing the model writes is executed or trusted as
  // fact, it's advisory text only.
  const prompt = `
You are a security governance advisor embedded in a bank's policy exception
management system (SentinelGRC). A REQUESTER has asked for a policy exception.
Decide whether this request should be flagged with a safer, time-boxed
alternative, and if so, propose one.

Request details:
- Title: ${title || "(untitled request)"}
- Exception type: ${exceptionTypeName} (base risk score: ${baseRiskScore}/100)
- System affected: ${systemAffected || "(not provided yet)"}
- Business justification: ${businessJustification || "(not provided yet)"}
- Requested duration: ${
    isPermanent
      ? "No expiry set (effectively permanent/open-ended)"
      : `${durationDays} days`
  }
- Current computed risk score: ${currentRiskScore}/100 (${currentRiskLevel})

Rules:
- Only set shouldSuggest=true if the request is open-ended/permanent, runs
  longer than ~90 days, or the current risk level is HIGH or CRITICAL.
- If suggesting an alternative, recommend the SHORTEST duration that still
  plausibly satisfies the stated business justification — be specific and
  grounded in the justification text, not generic.
- alternativeLabel: a short, human-readable name for the safer access
  pattern (e.g. "Temporary Privileged Access", "Scoped Data Access with
  Masking").
- rationale: 1-2 sentences for a security reviewer, referencing this
  specific request — not a boilerplate template.
- Do NOT invent a risk score — that is calculated separately by the platform.
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

module.exports = { getGeminiSuggestion };
