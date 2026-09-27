(function () {
  const questionnaire = window.SURVEY_QUESTIONNAIRE;
  const validation = window.SurveyValidation;
  const root = document.getElementById("survey-content");
  const title = document.getElementById("survey-title");

  document.title = questionnaire.title;
  title.textContent = questionnaire.title;

  const state = {
    screenIndex: 0,
    answers: {},
    submitted: false,
    submitting: false,
    submissionError: "",
    screenedOutSubmitted: false,
    surveyStartedAt: new Date().toISOString(),
    website: "",
    consentGiven: false,
  };

  const sectionById = new Map(questionnaire.sections.map((section) => [section.id, section]));
  const questionnaireScreens = [
    { type: "section", sectionId: "section-a" },
    { type: "instruction", sectionId: "main-questionnaire-instructions" },
    { type: "section", sectionId: "section-b" },
    { type: "section", sectionId: "section-c" },
    { type: "section", sectionId: "section-d" },
    { type: "section", sectionId: "section-e" },
    { type: "section", sectionId: "section-f" },
    { type: "review" },
  ];

  const screens = [{ type: "intro" }, ...questionnaireScreens, { type: "thank-you" }];
  const firstQuestionnaireIndex = 1;
  const reviewIndex = screens.findIndex((screen) => screen.type === "review");
  const thankYouIndex = screens.findIndex((screen) => screen.type === "thank-you");
  const sameVendorReminder =
    "Please continue answering with the same B2B vendor or service provider in mind.";

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    const screen = screens[state.screenIndex];

    if (screen.type === "intro") {
      renderIntro();
    } else if (screen.type === "instruction") {
      renderInstruction(screen);
    } else if (screen.type === "section") {
      renderSection(screen);
    } else if (screen.type === "review") {
      renderReview();
    } else if (screen.type === "screened-out") {
      renderScreenedOut();
    } else {
      renderThankYou();
    }

    root.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function renderIntro() {
    root.innerHTML = `
      <section class="intro-panel" aria-labelledby="about-study-heading">
        <h2 id="about-study-heading">About the Study</h2>
        <div class="prose">
          ${questionnaire.studyDescription.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </div>
        <div class="participant-info" aria-labelledby="researcher-info-heading">
          <h3 id="researcher-info-heading">Researcher Information</h3>
          <p><strong>Researcher:</strong> Shashank Tiwari <a href="https://www.linkedin.com/in/ishashankt" target="_blank" title="Shashank Tiwari's LinkedIn Profile"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAACDUlEQVR4nO2YO0sDQRDHVyxsxUqwVVs/gZWdGiz9EqI5xdwWYqEE7FJY2FlYWlvYxIjmiagkuxGNwSKFEsTEPIzvjOyteWhynHfC3R7sH4bjdpa5+e3MLsciJCUlJSW21PQMUukhwrSKMAWbrIowDSGVeP6XPCYbNiYNOua3vvLOJw/cyLQFAK1tBEieAlLpgQUAUhGoAmXzAHrBfElAShzQQoQ/2bsdEKalk/zoegKOrotQff2A42wRRtYS9kCYVrcgSlxLul2HmSKvhCsAFiLayrer8vLB28kVAIrbK+Dje4BBsEqEMgUYdtUewG4/hbwxQPPhTmPjRn41BWjppDXH+70Ay2fsnLcJYP4YuomNG/mHVuIQOMhB+rYKz2+f8Fh711pxbvcK+pZixpV0EmDMn4B8+RX0dJorw+BKnFdJRIDsfQ2MFMoUoEeJignwV01upfRbyUmAz3pd6/+JzSTMbqcheFnoOm8nccc3umgAq3s3PDHW474k9C7GYP/ioWPeVf6pdaKJBDCAoz+PSl8SxgPnHfNKz+/6vyVOAdTrbf6mEehXYzpzw2IBcH/YfCwsAagEaEgCYAlAJQCSAGbVLYg3yj/w29j4X/xmYuH/Aoh0taiSknkAdj/vdOK4YSRopQIecSqQmjIPwKvgdzx5TNetJd+EINPa/byde0Jl3yJB6ysvJSUlhWzSF9z1VFjYNi3YAAAAAElFTkSuQmCC" alt="linkedin" style="height: 1.4rem; vertical-align: middle;"></a></p>
          <p><strong>Affiliation:</strong> Alkesh Dinesh Mody Institute for Financial &amp; Management Studies, University of Mumbai</p>
          <p>This survey is being conducted solely for academic research purposes.</p>
          <h3>Participation &amp; Confidentiality</h3>
          <p>Participation in this study is voluntary. The survey will take approximately <strong>2 - 3 minutes</strong> to complete.</p>
          <p>Please answer the questions based on your professional experience and perceptions. You may discontinue the survey at any time before submitting your response.</p>
          <p>By proceeding with the survey, you confirm that you have read the information above and voluntarily agree to participate in this study.</p>
        </div>
        ${renderHoneypotField()}
        <label class="consent-control">
          <input type="checkbox" id="consent-confirmation"${state.consentGiven ? " checked" : ""}>
          <span>I have read the information above and voluntarily agree to participate in this study.</span>
        </label>
        <div class="form-actions">
          <button class="button button-primary" type="button" data-action="continue"${state.consentGiven ? "" : " disabled"}>Start Survey</button>
        </div>
      </section>
    `;
  }

  function renderProgress() {
    if (state.screenIndex < firstQuestionnaireIndex || state.screenIndex >= thankYouIndex) {
      return "";
    }

    const currentStep = Math.min(state.screenIndex, reviewIndex);
    const totalSteps = reviewIndex;
    const percent = Math.round((currentStep / totalSteps) * 100);
    const currentLabel = screens[state.screenIndex].type === "review"
      ? "Review"
      : getCurrentTitle(screens[state.screenIndex]);

    return `
      <div class="progress-block" aria-label="Survey progress">
        <div class="progress-meta">
          <span>Step ${currentStep} of ${totalSteps}</span>
          <span>${escapeHtml(currentLabel)}</span>
        </div>
        <div class="progress-track" aria-hidden="true">
          <span class="progress-fill" style="width: ${percent}%"></span>
        </div>
      </div>
    `;
  }

  function getCurrentTitle(screen) {
    if (screen.type === "instruction") {
      return sectionById.get(screen.sectionId).title;
    }

    if (screen.type === "section") {
      return sectionById.get(screen.sectionId).title;
    }

    return "Review";
  }

  function renderInstruction(screen) {
    const section = sectionById.get(screen.sectionId);
    root.innerHTML = `
      <section class="survey-panel" aria-labelledby="current-section-title">
        ${renderProgress()}
        <div class="section-heading">
          <p class="section-label">Main questionnaire</p>
          <h2 id="current-section-title">${escapeHtml(section.title)}</h2>
        </div>
        <div class="instruction-box">
          ${section.instructions.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
          ${renderLikertScaleGuide()}
        </div>
        ${renderActions({ showBack: true, primaryLabel: "Continue" })}
      </section>
    `;
  }

  function renderLikertScaleGuide() {
    return `
      <div class="scale-guide" aria-label="Seven-point agreement scale">
        ${questionnaire.likertScale
          .map((item) => `<div><strong>${item.value}</strong> ${escapeHtml(item.label)}</div>`)
          .join("")}
      </div>
    `;
  }

  function renderSection(screen) {
    const section = sectionById.get(screen.sectionId);
    const sectionParts = splitSectionTitle(section.title);
    const isLikertSection = section.questions.some((question) => question.type === "likert-7");

    root.innerHTML = `
      <section class="survey-panel" aria-labelledby="current-section-title">
        ${renderProgress()}
        <div class="section-heading">
          <p class="section-label">${escapeHtml(sectionParts.label)}</p>
          <h2 id="current-section-title">${escapeHtml(sectionParts.heading)}</h2>
        </div>
        <p class="required-note">All questions in this section are required.</p>
        ${isLikertSection ? `<p class="vendor-reminder">${escapeHtml(sameVendorReminder)}</p>` : ""}
        <form class="survey-form" action="#" method="post" novalidate>
          ${section.questions.map(renderQuestion).join("")}
          ${state.submissionError ? `<p class="validation-message submit-error" role="alert">${escapeHtml(state.submissionError)}</p>` : ""}
          ${renderActions({
            showBack: state.screenIndex > 0,
            primaryLabel: "Continue",
            includeSubmit: false,
          })}
        </form>
      </section>
    `;
  }

  function splitSectionTitle(title) {
    const parts = title.split(": ");
    if (parts.length < 2) {
      return { label: title, heading: title };
    }

    return { label: parts[0], heading: parts.slice(1).join(": ") };
  }

  function renderQuestion(question) {
    const describedBy = question.instruction ? ` aria-describedby="${question.id}-instruction"` : "";
    const invalid = "";

    return `
      <fieldset class="question-block" id="question-${question.id}" data-question-id="${question.id}" data-base-describedby="${question.instruction ? `${question.id}-instruction` : ""}"${describedBy}${invalid}>
        <legend>
          <span class="question-id">${escapeHtml(question.id)}</span>
          <span class="question-text">${escapeHtml(question.text)}</span>
        </legend>
        ${question.instruction ? `<p id="${question.id}-instruction" class="field-instruction">${escapeHtml(question.instruction)}</p>` : ""}
        ${renderQuestionControl(question)}
        <p class="validation-message field-error" id="${question.id}-error" role="alert" tabindex="-1" hidden></p>
      </fieldset>
    `;
  }

  function renderQuestionControl(question) {
    if (question.type === "likert-7") {
      return renderLikertQuestion(question);
    }

    const inputType = question.type === "multi-choice" ? "checkbox" : "radio";
    return `
      <div class="choice-list">
        ${question.options
          .map((option) => {
            const checked = isChecked(question, option) ? " checked" : "";
            return `
              <label class="choice-control">
                <input type="${inputType}" name="${question.id}" value="${escapeHtml(option)}"${checked}>
                <span>${escapeHtml(option)}</span>
              </label>
            `;
          })
          .join("")}
      </div>
    `;
  }

  function renderLikertQuestion(question) {
    return `
      <div class="likert-scale">
        <div class="likert-anchors" aria-hidden="true">
          <span>${escapeHtml(questionnaire.likertScale[0].label)}</span>
          <span>${escapeHtml(questionnaire.likertScale[questionnaire.likertScale.length - 1].label)}</span>
        </div>
        <div class="likert-options">
          ${questionnaire.likertScale
            .map((option) => {
              const checked = Number(state.answers[question.id]) === option.value ? " checked" : "";
              return `
                <label class="likert-option">
                  <input type="radio" name="${question.id}" value="${option.value}" aria-label="${option.value}: ${escapeHtml(option.label)}"${checked}>
                  <span>${option.value}</span>
                </label>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function isChecked(question, option) {
    const answer = state.answers[question.id];
    if (question.type === "multi-choice") {
      return Array.isArray(answer) && answer.includes(option);
    }

    return answer === option;
  }

  function renderActions({ showBack, primaryLabel, includeSubmit = false }) {
    const disabled = state.submitting ? " disabled" : "";
    const submitLabel = state.submitting ? "Submitting…" : "Submit";

    return `
      <div class="form-actions">
        ${showBack ? `<button class="button button-secondary" type="button" data-action="back"${disabled}>Back</button>` : ""}
        ${
          includeSubmit
            ? `<button class="button button-primary" type="button" data-action="submit"${disabled}>${submitLabel}</button>`
            : `<button class="button button-primary" type="button" data-action="continue"${disabled}>${escapeHtml(primaryLabel)}</button>`
        }
      </div>
    `;
  }

  function renderReview() {
    const reviewSections = questionnaireScreens
      .filter((screen) => screen.type === "section")
      .map((screen) => sectionById.get(screen.sectionId));

    root.innerHTML = `
      <section class="survey-panel" aria-labelledby="current-section-title">
        ${renderProgress()}
        <div class="section-heading">
          <p class="section-label">Review</p>
          <h2 id="current-section-title">Review your responses</h2>
        </div>
        <p class="review-intro">Review each section status before submitting. You can go back to edit your answers.</p>
        <div class="review-list">
          ${reviewSections
            .map((section) => {
              const complete = validation.isSectionComplete(section, state.answers);
              return `
                <div class="review-item">
                  <div>
                    <h3>${escapeHtml(section.title)}</h3>
                    <p>${complete ? "Complete" : "Incomplete"}</p>
                  </div>
                  <button class="button button-secondary" type="button" data-action="jump" data-section-id="${section.id}">Edit</button>
                </div>
              `;
            })
            .join("")}
        </div>
        ${state.submissionError ? `<p class="validation-message submit-error" role="alert">${escapeHtml(state.submissionError)}</p>` : ""}
        ${renderActions({ showBack: true, includeSubmit: true })}
      </section>
    `;
  }

  function renderScreenedOut() {
    root.innerHTML = `
      <section class="message-panel" aria-labelledby="screened-out-title">
        <p class="section-label">Survey ended</p>
        <h2 id="screened-out-title">Thank you for your interest.</h2>
        <p>Based on your response, you are not eligible to continue with this survey.</p>
      </section>
    `;
  }

  function renderThankYou() {
    const section = sectionById.get("thank-you");
    root.innerHTML = `
      <section class="message-panel" aria-labelledby="thank-you-title">
        <p class="section-label">Survey complete</p>
        <h2 id="thank-you-title">${escapeHtml(section.title)}</h2>
        <p>${escapeHtml(section.text)}</p>
      </section>
    `;
  }

  function saveCurrentAnswers() {
    const form = root.querySelector("form");
    if (!form) {
      return;
    }

    const screen = screens[state.screenIndex];
    if (screen.type !== "section") {
      return;
    }

    const section = sectionById.get(screen.sectionId);
    section.questions.forEach((question) => {
      const fieldInputs = getQuestionInputs(form, question.id);

      if (question.type === "multi-choice") {
        state.answers[question.id] = fieldInputs
          .filter((input) => input.checked)
          .map((input) => input.value);
        return;
      }

      const checked = fieldInputs.find((input) => input.checked);
      if (checked) {
        state.answers[question.id] = question.type === "likert-7" ? Number(checked.value) : checked.value;
      }
    });
  }

  function getQuestionInputs(form, questionId) {
    return Array.from(form.querySelectorAll(`[name="${CSS.escape(questionId)}"]`));
  }

  function getCurrentSection() {
    const screen = screens[state.screenIndex];
    return screen.type === "section" ? sectionById.get(screen.sectionId) : null;
  }

  async function continueSurvey() {
    if (state.submitting) {
      return;
    }

    if (state.screenIndex === 0 && !state.consentGiven) {
      return;
    }

    saveCurrentAnswers();
    state.submissionError = "";
    const section = getCurrentSection();

    if (section) {
      if (await applyScreeningRules()) {
        return;
      }

      const result = validation.validateQuestions(section.questions, state.answers);
      if (!result.valid) {
        showValidationError(result);
        return;
      }
    }

    state.screenIndex = Math.min(state.screenIndex + 1, screens.length - 1);
    render();
  }

  async function applyScreeningRules() {
    const matchedRule = questionnaire.screeningRules.find((rule) => state.answers[rule.questionId] === rule.answer);
    if (!matchedRule) {
      return false;
    }

    const section = getCurrentSection();
    const matchedQuestionIndex = section.questions.findIndex((question) => question.id === matchedRule.questionId);
    const precedingQuestions = section.questions.slice(0, matchedQuestionIndex);
    const precedingValidation = validation.validateQuestions(precedingQuestions, state.answers);

    if (!precedingValidation.valid) {
      showValidationError(precedingValidation);
      return true;
    }

    state.submitting = true;
    render();

    try {
      await submitScreenedOutOnce(matchedRule.questionId);
    } catch (error) {
      state.submitting = false;
      state.submissionError = submitFailureMessage();
      render();
      return true;
    }

    clearAnswersFromMemory();
    state.screenIndex = screens.length;
    screens[state.screenIndex] = { type: "screened-out", rule: matchedRule };
    render();
    return true;
  }

  function showValidationError(result) {
    root.querySelectorAll(".field-error").forEach((error) => {
      error.hidden = true;
      error.textContent = "";
    });
    root.querySelectorAll(".question-block").forEach((block) => {
      block.classList.remove("question-error");
      block.removeAttribute("aria-invalid");
      if (block.dataset.baseDescribedby) {
        block.setAttribute("aria-describedby", block.dataset.baseDescribedby);
      } else {
        block.removeAttribute("aria-describedby");
      }
    });

    const questionBlock = document.getElementById(`question-${result.questionId}`);
    const error = document.getElementById(`${result.questionId}-error`);
    if (!questionBlock || !error) {
      return;
    }

    questionBlock.classList.add("question-error");
    questionBlock.setAttribute("aria-invalid", "true");
    const baseDescription = questionBlock.dataset.baseDescribedby;
    questionBlock.setAttribute(
      "aria-describedby",
      baseDescription ? `${baseDescription} ${result.questionId}-error` : `${result.questionId}-error`,
    );
    error.textContent = result.message;
    error.hidden = false;
    questionBlock.scrollIntoView({ block: "center", behavior: "smooth" });

    const firstInput = questionBlock.querySelector("input");
    if (firstInput) {
      firstInput.focus({ preventScroll: true });
    } else {
      error.focus({ preventScroll: true });
    }
  }

  function goBack() {
    if (state.submitting) {
      return;
    }

    state.submissionError = "";
    saveCurrentAnswers();
    state.screenIndex = Math.max(state.screenIndex - 1, 0);
    render();
  }

  async function submitSurvey() {
    if (state.submitting || state.submitted) {
      return;
    }

    const completeSections = questionnaireScreens
      .filter((screen) => screen.type === "section")
      .map((screen) => sectionById.get(screen.sectionId));

    for (const section of completeSections) {
      const result = validation.validateQuestions(section.questions, state.answers);
      if (!result.valid) {
        state.screenIndex = screens.findIndex((screen) => screen.sectionId === section.id);
        render();
        showValidationError(result);
        return;
      }
    }

    state.submitting = true;
    state.submissionError = "";
    render();

    try {
      const response = await postSurveyPayload(buildCompletedPayload());
      if (!response.success) {
        throw new Error("submission_failed");
      }

      clearAnswersFromMemory();
      state.submitted = true;
      state.screenIndex = thankYouIndex;
      render();
    } catch (error) {
      state.submitting = false;
      state.submissionError = submitFailureMessage();
      render();
    }
  }

  function jumpToSection(sectionId) {
    if (state.submitting) {
      return;
    }

    state.submissionError = "";
    saveCurrentAnswers();
    const targetIndex = screens.findIndex((screen) => screen.sectionId === sectionId);
    if (targetIndex >= 0) {
      state.screenIndex = targetIndex;
      render();
    }
  }

  async function submitScreenedOutOnce(failedAt) {
    if (state.screenedOutSubmitted) {
      return;
    }

    state.screenedOutSubmitted = true;

    try {
      await postSurveyPayload(buildScreenedOutPayload(failedAt));
    } catch (error) {
      state.screenedOutSubmitted = false;
      throw error;
    }
  }

  function buildCompletedPayload() {
    return {
      responseType: "completed",
      schema_version: questionnaire.schemaVersion,
      survey_started_at: state.surveyStartedAt,
      website: getHoneypotValue(),
      answers: buildCompletedAnswers(),
    };
  }

  function buildScreenedOutPayload(failedAt) {
    const answers = { A1: state.answers.A1 };

    if (failedAt === "A2") {
      answers.A2 = state.answers.A2;
    }

    return {
      responseType: "screened_out",
      schema_version: questionnaire.schemaVersion,
      survey_started_at: state.surveyStartedAt,
      website: getHoneypotValue(),
      answers,
      failed_at: failedAt,
    };
  }

  function buildCompletedAnswers() {
    const answers = {};
    questionnaireScreens
      .filter((screen) => screen.type === "section")
      .map((screen) => sectionById.get(screen.sectionId))
      .forEach((section) => {
        section.questions.forEach((question) => {
          answers[question.id] = state.answers[question.id];
        });
      });

    return answers;
  }

  async function postSurveyPayload(payload) {
    const response = await fetch("/api/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("submission_failed");
    }

    const body = await response.json();
    if (!body || body.success !== true) {
      throw new Error("submission_failed");
    }

    return body;
  }

  function clearAnswersFromMemory() {
    Object.keys(state.answers).forEach((key) => {
      delete state.answers[key];
    });
    state.submitting = false;
    state.submissionError = "";
  }

  function renderHoneypotField() {
    return `
      <div class="hp-field" aria-hidden="true">
        <label for="website">Website</label>
        <input id="website" name="website" type="text" tabindex="-1" autocomplete="off">
      </div>
    `;
  }

  function getHoneypotValue() {
    const honeypot = document.getElementById("website");
    return honeypot ? honeypot.value : state.website;
  }

  function submitFailureMessage() {
    return "We couldn't submit your response. Please check your connection and try again.";
  }

  root.addEventListener("change", (event) => {
    if (event.target.matches("#consent-confirmation")) {
      state.consentGiven = event.target.checked;
      const startButton = root.querySelector("[data-action='continue']");
      if (startButton) {
        startButton.disabled = !state.consentGiven;
      }
      return;
    }

    if (event.target.matches("input[type='radio'], input[type='checkbox']")) {
      saveCurrentAnswers();
    }
  });

  root.addEventListener("input", (event) => {
    if (event.target.matches("#website")) {
      state.website = event.target.value;
    }
  });

  root.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target.matches("input")) {
      event.preventDefault();
    }
  });

  root.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  root.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) {
      return;
    }

    const action = actionTarget.dataset.action;
    if (action === "continue") {
      continueSurvey();
    } else if (action === "back") {
      goBack();
    } else if (action === "submit") {
      submitSurvey();
    } else if (action === "jump") {
      jumpToSection(actionTarget.dataset.sectionId);
    }
  });

  render();
})();
