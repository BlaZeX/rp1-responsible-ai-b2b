const MAX_BODY_BYTES = 32 * 1024;
const GOOGLE_TIMEOUT_MS = 10000;
const MIN_SUBMISSION_SECONDS = 1;
const MAX_STARTED_AT_AGE_DAYS = 2;
const SCHEMA_VERSION = "1.0";

const COMPLETED_FIELDS = [
  "schema_version",
  "A1",
  "A2",
  "A3",
  "AIP1",
  "AIP2",
  "AIP3",
  "AIP4",
  "PT1",
  "PT2",
  "PT3",
  "PT4",
  "TR1",
  "TR2",
  "TR3",
  "TR4",
  "CE1",
  "CE2",
  "CE3",
  "CE4",
  "CE5",
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
];

const SCREENED_OUT_FIELDS = ["schema_version", "failed_at", "A1", "A2"];

const LIKERT_FIELDS = [
  "AIP1",
  "AIP2",
  "AIP3",
  "AIP4",
  "PT1",
  "PT2",
  "PT3",
  "PT4",
  "TR1",
  "TR2",
  "TR3",
  "TR4",
  "CE1",
  "CE2",
  "CE3",
  "CE4",
  "CE5",
];

const SINGLE_CHOICE_OPTIONS = {
  A1: ["Yes"],
  A2: ["Yes", "Not sure"],
  F1: [
    "Owner / Founder / Partner",
    "CXO / Director / Senior Leadership",
    "Senior Manager",
    "Manager",
    "Assistant / Deputy Manager",
    "Executive / Associate",
    "Consultant / Professional",
    "Other",
  ],
  F2: [
    "Procurement / Purchasing",
    "Information Technology",
    "Marketing",
    "Sales / Business Development",
    "Finance / Accounting",
    "Operations",
    "Human Resources",
    "Administration",
    "Strategy / General Management",
    "Other",
  ],
  F3: [
    "Less than 2 years",
    "2–5 years",
    "6–10 years",
    "11–15 years",
    "16–20 years",
    "More than 20 years",
  ],
  F4: [
    "Fewer than 10 employees",
    "10–49 employees",
    "50–249 employees",
    "250–999 employees",
    "1,000 or more employees",
  ],
  F5: [
    "Information Technology / Software / SaaS",
    "Banking / Financial Services / Insurance",
    "Manufacturing",
    "Professional / Business Services",
    "Retail / E-commerce",
    "Education",
    "Healthcare / Pharmaceuticals",
    "Telecommunications",
    "Logistics / Transportation",
    "Real Estate / Construction",
    "Media / Advertising",
    "Hospitality / Travel",
    "Government / Public Sector",
    "Other",
  ],
  F7: [
    "Daily",
    "Several times a week",
    "Several times a month",
    "About once a month",
    "Less frequently",
  ],
};

const MULTI_CHOICE_OPTIONS = {
  A3: [
    "Personalised emails or messages",
    "Personalised product/service recommendations",
    "Customised website content",
    "AI-enabled chatbot or virtual assistant",
    "Personalised offers or proposals",
    "Account-specific marketing content",
    "Automated follow-up communication",
    "Personalised digital advertisements",
    "Other",
    "Not sure",
  ],
  F6: [
    "Identifying potential vendors",
    "Evaluating vendors",
    "Comparing products or services",
    "Recommending vendors",
    "Participating in purchase decisions",
    "Approving purchases",
    "Negotiating with vendors",
    "Using or evaluating purchased products/services",
    "Other",
  ],
};

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return jsonResponse({ success: false, error: "method_not_allowed" }, 405, {
      Allow: "POST",
    });
  }

  if (!env.GOOGLE_SCRIPT_URL || !env.SURVEY_SECRET) {
    console.error("Survey submit configuration missing.");
    return genericError(503);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ success: false, error: "request_too_large" }, 413);
  }

  let payload;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    if (error.message === "request_too_large") {
      return jsonResponse({ success: false, error: "request_too_large" }, 413);
    }

    return jsonResponse({ success: false, error: "invalid_json" }, 400);
  }

  if (!isPlainObject(payload)) {
    return jsonResponse({ success: false, error: "invalid_submission" }, 400);
  }

  if (isHoneypotFilled(payload)) {
    return jsonResponse({ success: true }, 200);
  }

  if (!isTimingPlausible(payload.survey_started_at)) {
    return jsonResponse({ success: false, error: "invalid_submission" }, 400);
  }

  const validation = validatePayload(payload);
  if (!validation.valid) {
    return jsonResponse({ success: false, error: "invalid_submission" }, 400);
  }

  const googlePayload = buildGooglePayload(payload, env.SURVEY_SECRET);

  try {
    const googleResponse = await postToGoogle(env.GOOGLE_SCRIPT_URL, googlePayload);
    return normalizeGoogleResponse(googleResponse, payload.responseType);
  } catch (error) {
    console.error("Survey submit forwarding failed.");
    return genericError(502);
  }
}

async function readJsonBody(request) {
  const reader = request.body && request.body.getReader ? request.body.getReader() : null;
  if (!reader) {
    const body = await request.text();
    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
      throw new Error("request_too_large");
    }

    return JSON.parse(body);
  }

  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      throw new Error("request_too_large");
    }

    chunks.push(value);
  }

  const bodyBytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes));
}

function validatePayload(payload) {
  if (!isPlainObject(payload)) {
    return invalid();
  }

  if (payload.schema_version !== SCHEMA_VERSION) {
    return invalid();
  }

  if (payload.responseType === "completed") {
    const allowedTopLevel = ["responseType", "schema_version", "survey_started_at", "website", "answers"];
    if (Object.keys(payload).some((key) => !allowedTopLevel.includes(key))) {
      return invalid();
    }

    return validateCompletedAnswers(payload.answers);
  }

  if (payload.responseType === "screened_out") {
    const allowedTopLevel = ["responseType", "schema_version", "survey_started_at", "website", "answers", "failed_at"];
    if (Object.keys(payload).some((key) => !allowedTopLevel.includes(key))) {
      return invalid();
    }

    return validateScreenedOutAnswers(payload);
  }

  return invalid();
}

function validateCompletedAnswers(answers) {
  const expectedAnswerFields = COMPLETED_FIELDS.filter((field) => field !== "schema_version");

  if (!isPlainObject(answers) || hasUnexpectedKeys(answers, expectedAnswerFields)) {
    return invalid();
  }

  for (const field of expectedAnswerFields) {
    if (!Object.prototype.hasOwnProperty.call(answers, field)) {
      return invalid();
    }
  }

  for (const [field, options] of Object.entries(SINGLE_CHOICE_OPTIONS)) {
    if (!isStringOption(answers[field], options)) {
      return invalid();
    }
  }

  if (!isMultiChoice(answers.A3, MULTI_CHOICE_OPTIONS.A3)) {
    return invalid();
  }

  if (!isMultiChoice(answers.F6, MULTI_CHOICE_OPTIONS.F6)) {
    return invalid();
  }

  for (const field of LIKERT_FIELDS) {
    if (!isLikertValue(answers[field])) {
      return invalid();
    }
  }

  if (answers.A1 !== "Yes" || answers.A2 === "No") {
    return invalid();
  }

  return { valid: true };
}

function validateScreenedOutAnswers(payload) {
  if (!isPlainObject(payload.answers)) {
    return invalid();
  }

  if (payload.failed_at === "A1") {
    const allowedKeys = ["A1"];
    return !hasUnexpectedKeys(payload.answers, allowedKeys) && payload.answers.A1 === "No"
      ? { valid: true }
      : invalid();
  }

  if (payload.failed_at === "A2") {
    const allowedKeys = ["A1", "A2"];
    return !hasUnexpectedKeys(payload.answers, allowedKeys) &&
      payload.answers.A1 === "Yes" &&
      payload.answers.A2 === "No"
      ? { valid: true }
      : invalid();
  }

  return invalid();
}

function buildGooglePayload(payload, secret) {
  const submission = {
    schema_version: payload.schema_version,
    ...payload.answers,
  };

  if (payload.responseType === "screened_out") {
    submission.failed_at = payload.failed_at;
    if (!Object.prototype.hasOwnProperty.call(submission, "A2")) {
      submission.A2 = "";
    }
  }

  return {
    secret,
    responseType: payload.responseType,
    submission,
  };
}

function validateCompletedSubmission(submission) {
  if (!isPlainObject(submission) || hasUnexpectedKeys(submission, COMPLETED_FIELDS)) {
    return invalid();
  }

  if (submission.schema_version !== SCHEMA_VERSION) {
    return invalid();
  }

  const answers = { ...submission };
  delete answers.schema_version;
  return validateCompletedAnswers(answers);
}

function validateScreenedOutSubmission(submission) {
  if (!isPlainObject(submission) || hasUnexpectedKeys(submission, SCREENED_OUT_FIELDS)) {
    return invalid();
  }

  if (submission.failed_at === "A1") {
    const a2Blank = submission.A2 === undefined || submission.A2 === "";
    return submission.A1 === "No" && a2Blank ? { valid: true } : invalid();
  }

  if (submission.failed_at === "A2") {
    return submission.A1 === "Yes" && submission.A2 === "No" ? { valid: true } : invalid();
  }

  return invalid();
}

function hasUnexpectedKeys(object, allowedKeys) {
  return Object.keys(object).some((key) => !allowedKeys.includes(key));
}

function isStringOption(value, permittedValues) {
  return typeof value === "string" && value.length <= 500 && permittedValues.includes(value);
}

function isMultiChoice(values, permittedValues) {
  if (!Array.isArray(values) || values.length === 0 || values.length > 20) {
    return false;
  }

  return values.every(
    (value) => typeof value === "string" && value.length <= 500 && permittedValues.includes(value),
  );
}

function isLikertValue(value) {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

function isHoneypotFilled(payload) {
  return isPlainObject(payload) && typeof payload.website === "string" && payload.website.trim() !== "";
}

function isTimingPlausible(startedAt) {
  if (startedAt === undefined || startedAt === null || startedAt === "") {
    return true;
  }

  if (typeof startedAt !== "string") {
    return false;
  }

  const startedTime = Date.parse(startedAt);
  if (!Number.isFinite(startedTime)) {
    return false;
  }

  const now = Date.now();
  const elapsedMs = now - startedTime;
  const maxAgeMs = MAX_STARTED_AT_AGE_DAYS * 24 * 60 * 60 * 1000;

  if (elapsedMs < MIN_SUBMISSION_SECONDS * 1000) {
    return false;
  }

  if (elapsedMs > maxAgeMs) {
    return false;
  }

  return true;
}

async function postToGoogle(url, payload) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GOOGLE_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function normalizeGoogleResponse(response, responseType) {
  if (!response.ok) {
    console.error("Survey submit upstream returned non-OK status.");
    return genericError(502);
  }

  let body;
  try {
    body = await response.json();
  } catch (error) {
    console.error("Survey submit upstream returned invalid JSON.");
    return genericError(502);
  }

  if (!isPlainObject(body) || body.success !== true) {
    return genericError(502);
  }

  if (responseType === "completed" && typeof body.submission_id === "string") {
    return jsonResponse({ success: true, submission_id: body.submission_id }, 200);
  }

  if (responseType === "screened_out" && body.screened_out === true) {
    return jsonResponse({ success: true, screened_out: true }, 200);
  }

  return genericError(502);
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function invalid() {
  return { valid: false };
}

function genericError(status) {
  return jsonResponse({ success: false, error: "generic_error_code" }, status);
}

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...jsonHeaders,
      ...extraHeaders,
    },
  });
}
