# Data Integrity Audit

Authoritative source: `docs/questionnaire.md`

Compared files:

- `public/js/questionnaire.js`
- `public/js/app.js`
- `public/js/validation.js`
- `docs/data-schema.md`
- `google-apps-script/Code.gs`

Audit result: **Pass**

No implementation errors were found. `docs/questionnaire.md` was not changed.

## Summary Checks

| Check | Result |
| --- | --- |
| Every questionnaire question exists in `questionnaire.js` | Pass |
| No extra research question invented | Pass |
| Question IDs match authoritative questionnaire | Pass |
| Question wording matches authoritative questionnaire | Pass |
| Answer options match authoritative questionnaire | Pass |
| Question order is correct | Pass |
| Section order is correct | Pass |
| A1 screening ends survey only when answer is `No` | Pass |
| A2 screening ends survey only when answer is `No` | Pass |
| A3 supports multiple responses | Pass |
| F6 supports multiple responses | Pass |
| Exactly 17 Likert questions | Pass |
| Likert values are restricted to integers `1` through `7` | Pass |
| Likert responses cannot become `0` | Pass |
| Unanswered responses cannot accidentally become `0` | Pass |
| Every required field is validated on frontend and backend | Pass |
| Frontend fields map to correct API fields | Pass |
| Backend fields map to correct Google Sheets columns | Pass |
| No completed response field is silently dropped | Pass |
| `PT1`-`PT4` map correctly | Pass |
| `AIP1`-`AIP4` map correctly | Pass |
| `TR1`-`TR4` map correctly | Pass |
| `CE1`-`CE5` map correctly | Pass |
| `F1`-`F7` map correctly | Pass |
| `schema_version` is included | Pass |

## Section Order

The implemented section order matches `docs/questionnaire.md`:

1. Section A: Eligibility
2. Instructions for the Main Questionnaire
3. Section B: AI-Driven Personalisation
4. Section C: Perceived Transparency
5. Section D: Trust
6. Section E: Customer Engagement
7. Section F: Professional Profile
8. Thank You

The application also includes a non-question review screen before final submission. This does not add research questions or change questionnaire content.

## Question-Level Mapping

| Question ID | Question Type | Frontend Field | API Field | Spreadsheet Column | Validation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `A1` | `single-choice` | `answers.A1` | `answers.A1` then Apps Script `submission.A1` | `Responses!A1`; `ScreenedOut!A1` when screened out | Required; exact option match; completed response must be `Yes`; `No` triggers screen-out at `A1` | Pass |
| `A2` | `single-choice` | `answers.A2` | `answers.A2` then Apps Script `submission.A2` | `Responses!A2`; `ScreenedOut!A2` when screened out at `A2` | Required; exact option match; completed response may be `Yes` or `Not sure`; `No` triggers screen-out at `A2` | Pass |
| `A3` | `multi-choice` | `answers.A3` | `answers.A3` then Apps Script `submission.A3` | `Responses!A3` | Required array; one or more values; every selected value must match an authoritative option; stored as one cell joined with ` \| ` | Pass |
| `AIP1` | `likert-7` | `answers.AIP1` | `answers.AIP1` then Apps Script `submission.AIP1` | `Responses!AIP1` | Required integer; `1` through `7` only; no labels stored | Pass |
| `AIP2` | `likert-7` | `answers.AIP2` | `answers.AIP2` then Apps Script `submission.AIP2` | `Responses!AIP2` | Required integer; `1` through `7` only; no labels stored | Pass |
| `AIP3` | `likert-7` | `answers.AIP3` | `answers.AIP3` then Apps Script `submission.AIP3` | `Responses!AIP3` | Required integer; `1` through `7` only; no labels stored | Pass |
| `AIP4` | `likert-7` | `answers.AIP4` | `answers.AIP4` then Apps Script `submission.AIP4` | `Responses!AIP4` | Required integer; `1` through `7` only; no labels stored | Pass |
| `PT1` | `likert-7` | `answers.PT1` | `answers.PT1` then Apps Script `submission.PT1` | `Responses!PT1` | Required integer; `1` through `7` only; no labels stored | Pass |
| `PT2` | `likert-7` | `answers.PT2` | `answers.PT2` then Apps Script `submission.PT2` | `Responses!PT2` | Required integer; `1` through `7` only; no labels stored | Pass |
| `PT3` | `likert-7` | `answers.PT3` | `answers.PT3` then Apps Script `submission.PT3` | `Responses!PT3` | Required integer; `1` through `7` only; no labels stored | Pass |
| `PT4` | `likert-7` | `answers.PT4` | `answers.PT4` then Apps Script `submission.PT4` | `Responses!PT4` | Required integer; `1` through `7` only; no labels stored | Pass |
| `TR1` | `likert-7` | `answers.TR1` | `answers.TR1` then Apps Script `submission.TR1` | `Responses!TR1` | Required integer; `1` through `7` only; no labels stored | Pass |
| `TR2` | `likert-7` | `answers.TR2` | `answers.TR2` then Apps Script `submission.TR2` | `Responses!TR2` | Required integer; `1` through `7` only; no labels stored | Pass |
| `TR3` | `likert-7` | `answers.TR3` | `answers.TR3` then Apps Script `submission.TR3` | `Responses!TR3` | Required integer; `1` through `7` only; no labels stored | Pass |
| `TR4` | `likert-7` | `answers.TR4` | `answers.TR4` then Apps Script `submission.TR4` | `Responses!TR4` | Required integer; `1` through `7` only; no labels stored | Pass |
| `CE1` | `likert-7` | `answers.CE1` | `answers.CE1` then Apps Script `submission.CE1` | `Responses!CE1` | Required integer; `1` through `7` only; no labels stored | Pass |
| `CE2` | `likert-7` | `answers.CE2` | `answers.CE2` then Apps Script `submission.CE2` | `Responses!CE2` | Required integer; `1` through `7` only; no labels stored | Pass |
| `CE3` | `likert-7` | `answers.CE3` | `answers.CE3` then Apps Script `submission.CE3` | `Responses!CE3` | Required integer; `1` through `7` only; no labels stored | Pass |
| `CE4` | `likert-7` | `answers.CE4` | `answers.CE4` then Apps Script `submission.CE4` | `Responses!CE4` | Required integer; `1` through `7` only; no labels stored | Pass |
| `CE5` | `likert-7` | `answers.CE5` | `answers.CE5` then Apps Script `submission.CE5` | `Responses!CE5` | Required integer; `1` through `7` only; no labels stored | Pass |
| `F1` | `single-choice` | `answers.F1` | `answers.F1` then Apps Script `submission.F1` | `Responses!F1` | Required; exact option match | Pass |
| `F2` | `single-choice` | `answers.F2` | `answers.F2` then Apps Script `submission.F2` | `Responses!F2` | Required; exact option match | Pass |
| `F3` | `single-choice` | `answers.F3` | `answers.F3` then Apps Script `submission.F3` | `Responses!F3` | Required; exact option match | Pass |
| `F4` | `single-choice` | `answers.F4` | `answers.F4` then Apps Script `submission.F4` | `Responses!F4` | Required; exact option match | Pass |
| `F5` | `single-choice` | `answers.F5` | `answers.F5` then Apps Script `submission.F5` | `Responses!F5` | Required; exact option match | Pass |
| `F6` | `multi-choice` | `answers.F6` | `answers.F6` then Apps Script `submission.F6` | `Responses!F6` | Required array; one or more values; every selected value must match an authoritative option; stored as one cell joined with ` \| ` | Pass |
| `F7` | `single-choice` | `answers.F7` | `answers.F7` then Apps Script `submission.F7` | `Responses!F7` | Required; exact option match | Pass |

## Wording and Option Integrity

All question wording and answer options in `public/js/questionnaire.js` match `docs/questionnaire.md`.

The visible survey renderer in `public/js/app.js` reads question text, IDs, types and options from `window.SURVEY_QUESTIONNAIRE`; it does not duplicate research question wording.

The backend validation option sets in `functions/api/submit.js` and `google-apps-script/Code.gs` match the permitted values from the authoritative questionnaire and `docs/data-schema.md`.

## Likert Integrity

Likert question IDs:

- `AIP1`
- `AIP2`
- `AIP3`
- `AIP4`
- `PT1`
- `PT2`
- `PT3`
- `PT4`
- `TR1`
- `TR2`
- `TR3`
- `TR4`
- `CE1`
- `CE2`
- `CE3`
- `CE4`
- `CE5`

Total Likert questions: **17**

Likert controls use radio inputs with values `1` through `7`. `public/js/app.js` stores checked Likert answers with `Number(checked.value)`, and only checked inputs are converted. Missing answers remain `undefined`; they are not converted to `0`.

Frontend validation in `public/js/validation.js` requires Likert answers to be integers from `1` through `7`.

Cloudflare validation in `functions/api/submit.js` requires `Number.isInteger(value)` and `value >= 1 && value <= 7`.

Google Apps Script validation in `google-apps-script/Code.gs` requires a finite integer `>= 1` and `<= 7`.

No Likert labels are stored in the completed response spreadsheet columns.

## Screening Integrity

Screening rules in `public/js/questionnaire.js`:

- `A1 = No` -> end survey
- `A2 = No` -> end survey

No other termination condition is implemented.

Frontend behavior:

- If `A1` is `No`, `public/js/app.js` submits a `screened_out` payload with `failed_at: "A1"` and only `A1`.
- If `A2` is `No`, `public/js/app.js` submits a `screened_out` payload with `failed_at: "A2"` and only `A1`, `A2`.
- `A3` has no screening rule.
- Screened-out submission is guarded by `screenedOutSubmitted` during the active page session.

Backend behavior:

- `functions/api/submit.js` accepts screened-out answers only for the two valid patterns.
- `google-apps-script/Code.gs` writes screened-out records only to `ScreenedOut`.
- Screened-out records do not include unanswered main questionnaire fields.

## Field Mapping Chain

Completed response path:

1. Frontend in-memory state: `state.answers.<question_id>`
2. Browser request: `answers.<question_id>`
3. Cloudflare Pages Function: validates `answers.<question_id>`
4. Cloudflare-to-Apps-Script request: `submission.<question_id>`
5. Apps Script row builder: `RESPONSE_HEADERS`
6. Google Sheets tab: `Responses`

Screened-out response path:

1. Frontend in-memory state: `state.answers.A1`, optionally `state.answers.A2`
2. Browser request: `answers.A1`, optionally `answers.A2`, plus `failed_at`
3. Cloudflare Pages Function: validates screened-out pattern
4. Cloudflare-to-Apps-Script request: `submission.schema_version`, `submission.failed_at`, `submission.A1`, `submission.A2`
5. Apps Script row builder: `SCREENED_OUT_HEADERS`
6. Google Sheets tab: `ScreenedOut`

`schema_version` is included in browser payloads, checked by the Cloudflare Function, forwarded to Apps Script as `submission.schema_version`, checked again by Apps Script, and written to Google Sheets.

## Spreadsheet Column Integrity

`Responses` column order in `docs/data-schema.md` and `google-apps-script/Code.gs`:

1. `submission_id`
2. `submitted_at`
3. `schema_version`
4. `A1`
5. `A2`
6. `A3`
7. `AIP1`
8. `AIP2`
9. `AIP3`
10. `AIP4`
11. `PT1`
12. `PT2`
13. `PT3`
14. `PT4`
15. `TR1`
16. `TR2`
17. `TR3`
18. `TR4`
19. `CE1`
20. `CE2`
21. `CE3`
22. `CE4`
23. `CE5`
24. `F1`
25. `F2`
26. `F3`
27. `F4`
28. `F5`
29. `F6`
30. `F7`

`ScreenedOut` column order in `docs/data-schema.md` and `google-apps-script/Code.gs`:

1. `screening_id`
2. `screened_at`
3. `schema_version`
4. `failed_at`
5. `A1`
6. `A2`

No completed questionnaire field is silently dropped. Multi-select fields `A3` and `F6` are intentionally stored as single spreadsheet cells joined with ` | `, as defined in `docs/data-schema.md`.

## Notes

The instruction text in `questionnaire.js` preserves the wording from `docs/questionnaire.md`; markdown emphasis is represented as plain text in the JavaScript schema because the field stores text, not markdown.

The application adds a small reminder during Likert sections: "Please continue answering with the same B2B vendor or service provider in mind." This is not a research question, has no field ID, and is not submitted or stored.
