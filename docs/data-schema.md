# Data Schema

This document defines the exact Google Sheets storage structure for the research survey.

The questionnaire schema version is `1.0`.

## Spreadsheet Tabs

The Google Sheets workbook must contain two tabs:

- `Responses`
- `ScreenedOut`

`Responses` stores only completed eligible survey responses.

`ScreenedOut` stores only respondents terminated by eligibility screening.

Do not store IP address, location, browser fingerprint, device fingerprint, email address, respondent name, company name, cookies, analytics identifiers or tracker identifiers in either tab.

## Responses Tab

The `Responses` tab contains one row per completed eligible survey response.

Use this exact column order:

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

### Responses Field Definitions

| Field | Type in Google Sheets | Required | Permitted values / format |
| --- | --- | --- | --- |
| `submission_id` | String | Yes | Random server-generated identifier. Must not be derived from respondent characteristics or request metadata. |
| `submitted_at` | String | Yes | ISO 8601 timestamp generated at submission time. |
| `schema_version` | String | Yes | `1.0` |
| `A1` | String | Yes | `Yes` |
| `A2` | String | Yes | `Yes` or `Not sure` |
| `A3` | String | Yes | One or more selected values from the A3 permitted values, joined into one cell using ` \| `. |
| `AIP1` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `AIP2` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `AIP3` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `AIP4` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `PT1` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `PT2` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `PT3` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `PT4` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `TR1` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `TR2` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `TR3` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `TR4` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `CE1` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `CE2` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `CE3` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `CE4` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `CE5` | Integer | Yes | `1`, `2`, `3`, `4`, `5`, `6` or `7` |
| `F1` | String | Yes | One permitted F1 value. |
| `F2` | String | Yes | One permitted F2 value. |
| `F3` | String | Yes | One permitted F3 value. |
| `F4` | String | Yes | One permitted F4 value. |
| `F5` | String | Yes | One permitted F5 value. |
| `F6` | String | Yes | One or more selected values from the F6 permitted values, joined into one cell using ` \| `. |
| `F7` | String | Yes | One permitted F7 value. |

## Likert Storage

Likert variables are:

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

Store only integer values from `1` to `7`.

Do not store Likert labels such as `Agree`, `Strongly Agree` or any other scale text in Google Sheets.

## Multi-Select Storage

Multi-select variables are:

- `A3`
- `F6`

During browser submission and server-side validation, keep multi-select answers as arrays.

When writing to Google Sheets, convert each multi-select array into one string cell by joining selected values with:

```text
 | 
```

Example:

```text
Personalised emails or messages | AI-enabled chatbot or virtual assistant
```

Do not dynamically create extra columns for individual multi-select values.

## Permitted Values

### A1

- `Yes`
- `No`

Completed eligible responses in `Responses` must have `A1` as `Yes`.

### A2

- `Yes`
- `No`
- `Not sure`

Completed eligible responses in `Responses` may have `A2` as `Yes` or `Not sure`.

### A3

- `Personalised emails or messages`
- `Personalised product/service recommendations`
- `Customised website content`
- `AI-enabled chatbot or virtual assistant`
- `Personalised offers or proposals`
- `Account-specific marketing content`
- `Automated follow-up communication`
- `Personalised digital advertisements`
- `Other`
- `Not sure`

### Likert Variables

Permitted values for every Likert variable:

- `1`
- `2`
- `3`
- `4`
- `5`
- `6`
- `7`

### F1

- `Owner / Founder / Partner`
- `CXO / Director / Senior Leadership`
- `Senior Manager`
- `Manager`
- `Assistant / Deputy Manager`
- `Executive / Associate`
- `Consultant / Professional`
- `Other`

### F2

- `Procurement / Purchasing`
- `Information Technology`
- `Marketing`
- `Sales / Business Development`
- `Finance / Accounting`
- `Operations`
- `Human Resources`
- `Administration`
- `Strategy / General Management`
- `Other`

### F3

- `Less than 2 years`
- `2–5 years`
- `6–10 years`
- `11–15 years`
- `16–20 years`
- `More than 20 years`

### F4

- `Fewer than 10 employees`
- `10–49 employees`
- `50–249 employees`
- `250–999 employees`
- `1,000 or more employees`

### F5

- `Information Technology / Software / SaaS`
- `Banking / Financial Services / Insurance`
- `Manufacturing`
- `Professional / Business Services`
- `Retail / E-commerce`
- `Education`
- `Healthcare / Pharmaceuticals`
- `Telecommunications`
- `Logistics / Transportation`
- `Real Estate / Construction`
- `Media / Advertising`
- `Hospitality / Travel`
- `Government / Public Sector`
- `Other`

### F6

- `Identifying potential vendors`
- `Evaluating vendors`
- `Comparing products or services`
- `Recommending vendors`
- `Participating in purchase decisions`
- `Approving purchases`
- `Negotiating with vendors`
- `Using or evaluating purchased products/services`
- `Other`

### F7

- `Daily`
- `Several times a week`
- `Several times a month`
- `About once a month`
- `Less frequently`

## ScreenedOut Tab

The `ScreenedOut` tab contains one row per respondent terminated by eligibility screening.

Use this exact column order:

1. `screening_id`
2. `screened_at`
3. `schema_version`
4. `failed_at`
5. `A1`
6. `A2`

Do not store any unanswered main questionnaire fields for screened-out respondents.

### ScreenedOut Field Definitions

| Field | Type in Google Sheets | Required | Permitted values / format |
| --- | --- | --- | --- |
| `screening_id` | String | Yes | Random server-generated identifier. Must not be derived from respondent characteristics or request metadata. |
| `screened_at` | String | Yes | ISO 8601 timestamp generated when the respondent is screened out. |
| `schema_version` | String | Yes | `1.0` |
| `failed_at` | String | Yes | `A1` or `A2` |
| `A1` | String | Yes | `Yes` or `No` |
| `A2` | String | Conditional | Blank if screened out at `A1`; otherwise `No`. |

## ScreenedOut Rules

Screened-out rows must follow one of these patterns:

| failed_at | A1 | A2 |
| --- | --- | --- |
| `A1` | `No` | blank |
| `A2` | `Yes` | `No` |

No other screening conditions are defined.
