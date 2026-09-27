# Architecture

## Purpose

This project is a lightweight academic research survey website for the study titled:

**Responsible AI-Driven Personalisation in B2B Marketing: The Role of Transparency and Trust in Customer Engagement**

The questionnaire in `docs/questionnaire.md` is the authoritative source for all participant-facing wording, section order, question order, answer options, Likert scale labels, screening logic and thank-you text. Application code should represent that content as structured data without rewriting or paraphrasing it.

## Technical Stack

- Frontend: Cloudflare Pages, vanilla HTML, vanilla CSS and vanilla JavaScript.
- Backend entry point: Cloudflare Pages Function at `/api/submit`.
- Storage bridge: Google Apps Script Web App.
- Storage destination: Google Sheets.

No client-side framework, analytics, cookies, browser storage, fingerprinting, external database or respondent identity collection is required.

## Project Structure

```text
public/
  index.html
  css/
    styles.css
  js/
    questionnaire.js
    app.js
    validation.js

functions/
  api/
    submit.js

google-apps-script/
  Code.gs

docs/
  questionnaire.md
  architecture.md
  security.md

README.md
```

## Questionnaire Model

The frontend should load a structured questionnaire definition from `public/js/questionnaire.js`. That file should preserve the exact wording and ordering from `docs/questionnaire.md`.

Expected question types:

- `single_choice`: one answer from fixed options.
- `multi_select`: zero or more answers from fixed options, subject to validation rules.
- `likert_7`: one answer from the 7-point agreement scale.
- `instruction`: non-answer content shown before the main questionnaire.
- `terminal`: end-of-survey content for screened-out respondents and completed respondents.

## Questionnaire Sections

1. Section A: Eligibility
2. Instructions for the Main Questionnaire
3. Section B: AI-Driven Personalisation
4. Section C: Perceived Transparency
5. Section D: Trust
6. Section E: Customer Engagement
7. Section F: Professional Profile
8. Thank You

For reporting purposes, the six answer-bearing questionnaire sections are Sections A-F.

## Question Inventory

| ID | Section | Type | Required | Notes |
| --- | --- | --- | --- | --- |
| A1 | Section A: Eligibility | single_choice | Yes | Screening question |
| A2 | Section A: Eligibility | single_choice | Yes | Screening question |
| A3 | Section A: Eligibility | multi_select | Yes | Exposure types encountered |
| AIP1 | Section B: AI-Driven Personalisation | likert_7 | Yes | Main questionnaire item |
| AIP2 | Section B: AI-Driven Personalisation | likert_7 | Yes | Main questionnaire item |
| AIP3 | Section B: AI-Driven Personalisation | likert_7 | Yes | Main questionnaire item |
| AIP4 | Section B: AI-Driven Personalisation | likert_7 | Yes | Main questionnaire item |
| PT1 | Section C: Perceived Transparency | likert_7 | Yes | Main questionnaire item |
| PT2 | Section C: Perceived Transparency | likert_7 | Yes | Main questionnaire item |
| PT3 | Section C: Perceived Transparency | likert_7 | Yes | Main questionnaire item |
| PT4 | Section C: Perceived Transparency | likert_7 | Yes | Main questionnaire item |
| TR1 | Section D: Trust | likert_7 | Yes | Main questionnaire item |
| TR2 | Section D: Trust | likert_7 | Yes | Main questionnaire item |
| TR3 | Section D: Trust | likert_7 | Yes | Main questionnaire item |
| TR4 | Section D: Trust | likert_7 | Yes | Main questionnaire item |
| CE1 | Section E: Customer Engagement | likert_7 | Yes | Main questionnaire item |
| CE2 | Section E: Customer Engagement | likert_7 | Yes | Main questionnaire item |
| CE3 | Section E: Customer Engagement | likert_7 | Yes | Main questionnaire item |
| CE4 | Section E: Customer Engagement | likert_7 | Yes | Main questionnaire item |
| CE5 | Section E: Customer Engagement | likert_7 | Yes | Main questionnaire item |
| F1 | Section F: Professional Profile | single_choice | Yes | Professional profile |
| F2 | Section F: Professional Profile | single_choice | Yes | Professional profile |
| F3 | Section F: Professional Profile | single_choice | Yes | Professional profile |
| F4 | Section F: Professional Profile | single_choice | Yes | Professional profile |
| F5 | Section F: Professional Profile | single_choice | Yes | Professional profile |
| F6 | Section F: Professional Profile | multi_select | Yes | Professional profile |
| F7 | Section F: Professional Profile | single_choice | Yes | Professional profile |

## Screening Logic

The survey should apply screening before showing the main questionnaire.

- A1: If the participant selects `No`, end the survey.
- A2: If the participant selects `No`, end the survey.
- A2: If the participant selects `Not sure`, continue unless future research requirements state otherwise.
- A3: No screen-out rule is specified. The participant continues after answering.

Screened-out responses may be submitted to Google Sheets with `completion_status` set to `screened_out`, including answers collected up to the screening point and a `screen_out_reason`.

## Likert Scale

All Section B-E items use the same 7-point agreement scale:

| Value | Label |
| --- | --- |
| 1 | Strongly Disagree |
| 2 | Disagree |
| 3 | Somewhat Disagree |
| 4 | Neither Agree nor Disagree |
| 5 | Somewhat Agree |
| 6 | Agree |
| 7 | Strongly Agree |

Likert question IDs:

- AIP1
- AIP2
- AIP3
- AIP4
- PT1
- PT2
- PT3
- PT4
- TR1
- TR2
- TR3
- TR4
- CE1
- CE2
- CE3
- CE4
- CE5

## Multi-Select Questions

- A3: Which of the following have you encountered from B2B vendors?
- F6: How are you involved in B2B vendor decisions?

Multi-select values should be submitted as arrays from the browser to the Pages Function. The Pages Function can forward arrays to Google Apps Script as JSON strings or delimiter-joined text. JSON strings are preferred because they preserve option text exactly and avoid delimiter ambiguity.

## Data Flow

1. The participant opens the Cloudflare Pages site.
2. `index.html` loads static CSS and JavaScript from `public/`.
3. `questionnaire.js` provides the questionnaire schema derived from `docs/questionnaire.md`.
4. `app.js` renders the current section, keeps answers in JavaScript memory only and applies the screening flow.
5. `validation.js` validates required answers, permitted options and Likert values before navigation and submission.
6. On submission, the browser sends a `POST` request to `/api/submit`.
7. The Cloudflare Pages Function validates the request body server-side.
8. The Pages Function forwards accepted submissions to the Google Apps Script Web App using a server-side request.
9. Google Apps Script appends the response to Google Sheets.
10. The browser displays the questionnaire thank-you text or the appropriate end-of-survey message.

## Privacy Constraints

The application must not collect or store:

- IP address
- Location
- Browser fingerprint
- Device fingerprint
- Email address
- Respondent name
- Company name
- Cookies
- Analytics or tracker identifiers

The frontend must not use:

- `localStorage`
- `sessionStorage`
- Cookies

Survey answers should remain only in JavaScript memory until the participant submits or is screened out.

Cloudflare and Google infrastructure may process network metadata operationally, but the application should not intentionally read, transform, forward or store that metadata.

## Submission Payload

The browser should submit a JSON payload shaped like:

```json
{
  "schema_version": "1.0.0",
  "submitted_at": "2026-09-27T00:00:00.000Z",
  "completion_status": "complete",
  "screen_out_reason": "",
  "answers": {
    "A1": "Yes",
    "A2": "Yes",
    "A3": ["Personalised emails or messages"],
    "AIP1": 1
  }
}
```

`submitted_at` should be generated at submission time and should not be used to infer participant identity.

## Proposed Google Sheets Fields

Recommended columns:

- submission_id
- schema_version
- submitted_at
- completion_status
- screen_out_reason
- A1
- A2
- A3
- AIP1
- AIP2
- AIP3
- AIP4
- PT1
- PT2
- PT3
- PT4
- TR1
- TR2
- TR3
- TR4
- CE1
- CE2
- CE3
- CE4
- CE5
- F1
- F2
- F3
- F4
- F5
- F6
- F7

`submission_id` should be a random server-generated identifier used only for row tracking and duplicate troubleshooting. It should not be derived from respondent characteristics or request metadata.

## Validation Rules

Frontend and backend validation should both enforce:

- Required answered questions for the participant's current path.
- Single-choice answers must match one of the exact options in `docs/questionnaire.md`.
- Multi-select answers must be arrays containing only exact options from `docs/questionnaire.md`.
- Likert answers must be integers from 1 to 7.
- Completed submissions must include A1-A3, AIP1-AIP4, PT1-PT4, TR1-TR4, CE1-CE5 and F1-F7.
- Screened-out submissions must include the screening answers collected before termination and a `screen_out_reason`.

## Deployment Configuration

Cloudflare Pages should serve the static frontend from `public/`.

The Pages Function at `functions/api/submit.js` should read the Google Apps Script Web App URL from an environment variable, for example:

```text
GOOGLE_APPS_SCRIPT_URL
```

No secret values should be committed to the repository.
