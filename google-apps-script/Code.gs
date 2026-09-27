/**
 * Google Apps Script Web App endpoint for the research survey.
 *
 * Deployment notes:
 * 1. Create a Google Sheet for survey storage.
 * 2. Open Apps Script and paste this file into Code.gs.
 * 3. In Project Settings > Script Properties, add:
 *    - SPREADSHEET_ID: the destination Google Sheet ID
 *    - SURVEY_SECRET: a strong shared secret used only by the Cloudflare Pages Function
 * 4. Run setupSurveySheets() once from the Apps Script editor and grant permissions.
 * 5. Deploy as a Web App.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Store the Web App URL and SURVEY_SECRET only in Cloudflare environment variables.
 *
 * The browser must not call this Web App directly. It should submit only to the
 * Cloudflare Pages Function, which forwards validated requests to this endpoint.
 */

var SCHEMA_VERSION = "1.0";
var MULTI_SELECT_DELIMITER = " | ";
var MAX_STRING_LENGTH = 500;
var MAX_MULTI_SELECT_ITEMS = 20;
var LOCK_WAIT_MS = 10000;

var RESPONSES_SHEET = "Responses";
var SCREENED_OUT_SHEET = "ScreenedOut";

var RESPONSE_HEADERS = [
  "submission_id",
  "submitted_at",
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

var SCREENED_OUT_HEADERS = [
  "screening_id",
  "screened_at",
  "schema_version",
  "failed_at",
  "A1",
  "A2",
];

var LIKERT_FIELDS = [
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

var COMPLETED_SINGLE_CHOICE_OPTIONS = {
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

var MULTI_CHOICE_OPTIONS = {
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

function doPost(e) {
  try {
    var payload = parseJsonRequest(e);
    var properties = getRequiredProperties();

    if (!payload.secret || payload.secret !== properties.surveySecret) {
      return errorResponse();
    }

    if (payload.responseType === "completed") {
      return handleCompleted(payload.submission, properties.spreadsheetId);
    }

    if (payload.responseType === "screened_out") {
      return handleScreenedOut(payload.submission, properties.spreadsheetId);
    }

    return errorResponse();
  } catch (error) {
    return errorResponse();
  }
}

function handleCompleted(submission, spreadsheetId) {
  var validation = validateCompletedSubmission(submission);
  if (!validation.valid) {
    return errorResponse();
  }

  var now = new Date().toISOString();
  var submissionId = Utilities.getUuid();
  var row = buildCompletedRow(submission, submissionId, now);
  appendLockedRow(spreadsheetId, RESPONSES_SHEET, RESPONSE_HEADERS, row);

  return jsonResponse({
    success: true,
    submission_id: submissionId,
  });
}

function handleScreenedOut(submission, spreadsheetId) {
  var validation = validateScreenedOutSubmission(submission);
  if (!validation.valid) {
    return errorResponse();
  }

  var now = new Date().toISOString();
  var screeningId = Utilities.getUuid();
  var row = buildScreenedOutRow(submission, screeningId, now);
  appendLockedRow(spreadsheetId, SCREENED_OUT_SHEET, SCREENED_OUT_HEADERS, row);

  return jsonResponse({
    success: true,
    screened_out: true,
  });
}

function parseJsonRequest(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("missing_body");
  }

  return JSON.parse(e.postData.contents);
}

function getRequiredProperties() {
  var props = PropertiesService.getScriptProperties();
  var spreadsheetId = props.getProperty("SPREADSHEET_ID");
  var surveySecret = props.getProperty("SURVEY_SECRET");

  if (!spreadsheetId || !surveySecret) {
    throw new Error("missing_script_properties");
  }

  return {
    spreadsheetId: spreadsheetId,
    surveySecret: surveySecret,
  };
}

function validateCompletedSubmission(submission) {
  if (!isPlainObject(submission)) {
    return invalid("invalid_submission");
  }

  if (submission.schema_version !== SCHEMA_VERSION) {
    return invalid("invalid_schema_version");
  }

  var expectedKeys = RESPONSE_HEADERS.slice(3);
  var unexpected = Object.keys(submission).some(function (key) {
    return key !== "schema_version" && expectedKeys.indexOf(key) === -1;
  });

  if (unexpected) {
    return invalid("unexpected_field");
  }

  for (var singleField in COMPLETED_SINGLE_CHOICE_OPTIONS) {
    if (!validateSingleChoice(submission, singleField, COMPLETED_SINGLE_CHOICE_OPTIONS[singleField])) {
      return invalid("invalid_" + singleField);
    }
  }

  if (!validateMultiChoice(submission, "A3", MULTI_CHOICE_OPTIONS.A3)) {
    return invalid("invalid_A3");
  }

  if (!validateMultiChoice(submission, "F6", MULTI_CHOICE_OPTIONS.F6)) {
    return invalid("invalid_F6");
  }

  for (var i = 0; i < LIKERT_FIELDS.length; i += 1) {
    if (!validateLikert(submission, LIKERT_FIELDS[i])) {
      return invalid("invalid_" + LIKERT_FIELDS[i]);
    }
  }

  if (submission.A1 !== "Yes" || submission.A2 === "No") {
    return invalid("ineligible_completed_response");
  }

  return { valid: true };
}

function validateScreenedOutSubmission(submission) {
  if (!isPlainObject(submission)) {
    return invalid("invalid_submission");
  }

  if (submission.schema_version !== SCHEMA_VERSION) {
    return invalid("invalid_schema_version");
  }

  var allowedKeys = ["schema_version", "failed_at", "A1", "A2"];
  var unexpected = Object.keys(submission).some(function (key) {
    return allowedKeys.indexOf(key) === -1;
  });

  if (unexpected) {
    return invalid("unexpected_field");
  }

  if (submission.failed_at === "A1") {
    if (submission.A1 !== "No") {
      return invalid("invalid_screening_failure");
    }

    if (submission.A2 !== undefined && submission.A2 !== "") {
      return invalid("unexpected_screened_out_value");
    }

    return { valid: true };
  }

  if (submission.failed_at === "A2") {
    if (submission.A1 !== "Yes" || submission.A2 !== "No") {
      return invalid("invalid_screening_failure");
    }

    return { valid: true };
  }

  return invalid("invalid_failed_at");
}

function validateSingleChoice(submission, field, permittedValues) {
  if (!isReasonableString(submission[field])) {
    return false;
  }

  return permittedValues.indexOf(submission[field]) !== -1;
}

function validateMultiChoice(submission, field, permittedValues) {
  var values = submission[field];
  if (!Array.isArray(values) || values.length === 0 || values.length > MAX_MULTI_SELECT_ITEMS) {
    return false;
  }

  for (var i = 0; i < values.length; i += 1) {
    if (!isReasonableString(values[i]) || permittedValues.indexOf(values[i]) === -1) {
      return false;
    }
  }

  return true;
}

function validateLikert(submission, field) {
  var value = submission[field];
  return typeof value === "number" && isFinite(value) && Math.floor(value) === value && value >= 1 && value <= 7;
}

function buildCompletedRow(submission, submissionId, submittedAt) {
  return RESPONSE_HEADERS.map(function (field) {
    if (field === "submission_id") {
      return submissionId;
    }

    if (field === "submitted_at") {
      return submittedAt;
    }

    if (field === "schema_version") {
      return SCHEMA_VERSION;
    }

    if (field === "A3" || field === "F6") {
      return escapeForSheet(submission[field].join(MULTI_SELECT_DELIMITER));
    }

    if (LIKERT_FIELDS.indexOf(field) !== -1) {
      return submission[field];
    }

    return escapeForSheet(submission[field]);
  });
}

function buildScreenedOutRow(submission, screeningId, screenedAt) {
  return SCREENED_OUT_HEADERS.map(function (field) {
    if (field === "screening_id") {
      return screeningId;
    }

    if (field === "screened_at") {
      return screenedAt;
    }

    if (field === "schema_version") {
      return SCHEMA_VERSION;
    }

    if (field === "failed_at") {
      return escapeForSheet(submission.failed_at);
    }

    if (field === "A1") {
      return escapeForSheet(submission.A1);
    }

    if (field === "A2") {
      return submission.A2 ? escapeForSheet(submission.A2) : "";
    }

    return "";
  });
}

function appendLockedRow(spreadsheetId, sheetName, headers, row) {
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);

  try {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ensureSheetWithHeaders(spreadsheet, sheetName, headers);
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

function ensureSheetWithHeaders(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }

  var existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var hasAnyHeader = existingHeaders.some(function (value) {
    return value !== "";
  });

  if (!hasAnyHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return sheet;
  }

  if (!headersMatch(existingHeaders, headers)) {
    throw new Error("header_mismatch_" + sheetName);
  }

  return sheet;
}

function headersMatch(existingHeaders, expectedHeaders) {
  if (existingHeaders.length < expectedHeaders.length) {
    return false;
  }

  for (var i = 0; i < expectedHeaders.length; i += 1) {
    if (existingHeaders[i] !== expectedHeaders[i]) {
      return false;
    }
  }

  return true;
}

function setupSurveySheets() {
  var properties = getRequiredProperties();
  var lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);

  try {
    var spreadsheet = SpreadsheetApp.openById(properties.spreadsheetId);
    ensureSheetWithHeaders(spreadsheet, RESPONSES_SHEET, RESPONSE_HEADERS);
    ensureSheetWithHeaders(spreadsheet, SCREENED_OUT_SHEET, SCREENED_OUT_HEADERS);
  } finally {
    lock.releaseLock();
  }
}

function escapeForSheet(value) {
  if (value === null || value === undefined) {
    return "";
  }

  var text = String(value);
  if (/^[=+\-@]/.test(text)) {
    return "'" + text;
  }

  return text;
}

function isReasonableString(value) {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_STRING_LENGTH;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function invalid(errorCode) {
  return {
    valid: false,
    error: errorCode,
  };
}

function jsonResponse(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse() {
  return jsonResponse({
    success: false,
    error: "generic_error_code",
  });
}
