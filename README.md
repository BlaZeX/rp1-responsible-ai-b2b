# Responsible AI-Driven Personalisation B2B Survey

## 1. Project Overview

This project is a lightweight research survey for collecting production responses into Google Sheets.

Production flow:

```text
Respondent
-> Cloudflare Pages frontend
-> /api/submit
-> Cloudflare Pages Function
-> Google Apps Script Web App
-> Google Sheets
```

The respondent only interacts with the Cloudflare Pages site. The browser submits responses to `/api/submit`. The Cloudflare Pages Function validates the submission, adds the shared server-side secret, and forwards it to Google Apps Script. Google Apps Script writes valid records into Google Sheets.

The browser must not call Google Apps Script directly.

## 2. Create Google Spreadsheet

1. Open Google Sheets.
2. Create a new spreadsheet for the survey data.
3. Rename it clearly, for example `Responsible AI B2B Survey Responses`.
4. Copy the spreadsheet ID from the URL.

The spreadsheet must contain these tabs:

- `Responses`
- `ScreenedOut`

You can create the tabs manually, or let the Apps Script setup function create the required tabs and headers for you.

## 3. Google Apps Script

1. Open the Google Spreadsheet.
2. Go to `Extensions` -> `Apps Script`.
3. Delete any starter code in the editor.
4. Copy the contents of `google-apps-script/Code.gs`.
5. Paste it into the Apps Script editor.
6. Save the project.

Next, configure Script Properties:

1. In Apps Script, open `Project Settings`.
2. Scroll to `Script Properties`.
3. Add these properties:

| Property | Value |
| --- | --- |
| `SPREADSHEET_ID` | The ID of your Google Spreadsheet |
| `SURVEY_SECRET` | A strong random shared secret |

Generate a strong `SURVEY_SECRET` with a password manager or a terminal command such as:

```bash
openssl rand -base64 32
```

Do not commit the secret to GitHub. Do not place it in frontend JavaScript. The same value must be configured later in Cloudflare Pages.

## 4. Run Setup

Run the setup function once before collecting data:

1. In Apps Script, select the function `setupSurveySheets`.
2. Click `Run`.
3. Review the Google permissions prompt.
4. Allow the script to access the spreadsheet.

Expected permissions include access to the spreadsheet so Apps Script can create or update the `Responses` and `ScreenedOut` headers.

After setup, confirm:

- The `Responses` tab exists.
- The `ScreenedOut` tab exists.
- Header rows are present.

## 5. Deploy Apps Script Web App

1. In Apps Script, click `Deploy`.
2. Choose `New deployment`.
3. Select deployment type `Web app`.
4. Set `Execute as` to the Google account that owns or can edit the spreadsheet.
5. Set access so server-to-server requests from Cloudflare can reach the Web App. For most deployments, use `Anyone`.
6. Click `Deploy`.
7. Copy the Web App URL.

This URL is the value for `GOOGLE_SCRIPT_URL` in Cloudflare Pages.

Keep the Apps Script URL private. It is protected by `SURVEY_SECRET`, but respondents should still only submit through Cloudflare Pages.

## 6. Cloudflare Pages

1. Push this repository to GitHub.
2. Open Cloudflare Dashboard.
3. Go to `Workers & Pages`.
4. Create a Pages project.
5. Connect the Git repository.
6. Use the repository root as the project root.
7. Set the build command to blank unless Cloudflare requires a value.
8. Set the build output directory to:

```text
public
```

Cloudflare Pages will serve the static files in `public/` and the Pages Function in `functions/api/submit.js`.

Configure these Cloudflare Pages environment variables:

| Variable | Value |
| --- | --- |
| `GOOGLE_SCRIPT_URL` | The Apps Script Web App URL |
| `SURVEY_SECRET` | The same secret configured in Apps Script |

These must remain server-side environment variables. Do not add them to `public/`, `index.html`, or any frontend JavaScript file.

## 7. Deployment

1. Commit and push the repository to GitHub.
2. Cloudflare Pages will start a deployment.
3. Wait for the deployment to finish successfully.
4. Open the Cloudflare Pages URL.
5. Confirm the survey loads.

For production, use the latest successful Cloudflare Pages deployment connected to the correct environment variables.

## 8. Testing

Before launch, run these checks using the deployed Cloudflare Pages URL.

### Submit One Valid Response

1. Open the survey.
2. Answer `A1` as `Yes`.
3. Answer `A2` as `Yes` or `Not sure`.
4. Complete every required question.
5. Submit the survey.
6. Confirm the thank-you screen appears.
7. Open Google Sheets and verify a new row appears in `Responses`.

### Test A1 Rejection

1. Open the survey in a new browser session.
2. Answer `A1` as `No`.
3. Continue.
4. Confirm the survey ends.
5. Verify a new row appears in `ScreenedOut`.
6. Confirm `failed_at` is `A1`.

### Test A2 Rejection

1. Open the survey in a new browser session.
2. Answer `A1` as `Yes`.
3. Answer `A2` as `No`.
4. Continue.
5. Confirm the survey ends.
6. Verify a new row appears in `ScreenedOut`.
7. Confirm `failed_at` is `A2`.

### Test Mobile Layout

1. Open the deployed survey on a phone.
2. Complete at least one full test response.
3. Confirm all buttons, choices, and 1-7 scale controls are usable.
4. Confirm text does not overlap or run off screen.

### Simulate Network Error

Practical options:

- Temporarily set `GOOGLE_SCRIPT_URL` to an invalid URL in a Cloudflare preview environment, then submit a test response.
- Temporarily disable network access in browser developer tools before submitting.

Expected result: the survey shows a submission error and does not show the final thank-you or screened-out completion screen until submission succeeds.

## 9. Pre-Launch Checklist

- [ ] Questionnaire wording verified
- [ ] Google Sheet working
- [ ] Apps Script deployed
- [ ] Cloudflare environment variables configured
- [ ] Mobile tested
- [ ] Eligibility tested
- [ ] Data mapping checked
- [ ] Formula injection protection verified
- [ ] No analytics enabled
- [ ] No personal data collected

## 10. Exporting Research Data

To export from Google Sheets:

### CSV

1. Open the `Responses` tab.
2. Go to `File` -> `Download`.
3. Choose `Comma-separated values (.csv)`.

CSV is useful for Excel, SPSS, SmartPLS, R, and Python.

### XLSX

1. Open the spreadsheet.
2. Go to `File` -> `Download`.
3. Choose `Microsoft Excel (.xlsx)`.

XLSX is useful for Excel and can also be imported into SPSS, SmartPLS, R, and Python.

Likert variables are stored numerically from `1` through `7`. Multi-select answers are stored in one cell, joined with ` | `.

## 11. Changing Questionnaire Content

Once production data collection starts, do not casually change questionnaire wording, answer options, question order, or screening logic. Even small wording changes can affect how responses should be interpreted.

If the questionnaire must change:

1. Update `docs/questionnaire.md`.
2. Update `public/js/questionnaire.js` to match.
3. Increment `schemaVersion`, for example:

```text
1.0 -> 1.1
```

4. Update backend validation and spreadsheet documentation if fields or permitted values changed.
5. Keep old exported data separate from data collected under the new schema version.
