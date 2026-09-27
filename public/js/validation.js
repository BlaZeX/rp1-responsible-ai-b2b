(function () {
  function getAnswer(answers, questionId) {
    return Object.prototype.hasOwnProperty.call(answers, questionId)
      ? answers[questionId]
      : undefined;
  }

  function isValidOption(question, value) {
    return question.options.some((option) => {
      if (typeof option === "object") {
        return String(option.value) === String(value);
      }

      return option === value;
    });
  }

  function validateQuestion(question, answers) {
    const answer = getAnswer(answers, question.id);

    if (!question.required && (answer === undefined || answer === "")) {
      return { valid: true };
    }

    if (question.type === "multi-choice") {
      if (!Array.isArray(answer) || answer.length === 0) {
        return {
          valid: false,
          questionId: question.id,
          message: "Please select at least one answer.",
        };
      }

      const invalidSelection = answer.some((value) => !isValidOption(question, value));
      if (invalidSelection) {
        return {
          valid: false,
          questionId: question.id,
          message: "Please select only the listed answer choices.",
        };
      }

      return { valid: true };
    }

    if (answer === undefined || answer === "") {
      return {
        valid: false,
        questionId: question.id,
        message: "Please select an answer.",
      };
    }

    if (question.type === "likert-7") {
      const numericAnswer = Number(answer);
      if (!Number.isInteger(numericAnswer) || numericAnswer < 1 || numericAnswer > 7) {
        return {
          valid: false,
          questionId: question.id,
          message: "Please select a value from 1 to 7.",
        };
      }

      return { valid: true };
    }

    if (question.type === "single-choice" && !isValidOption(question, answer)) {
      return {
        valid: false,
        questionId: question.id,
        message: "Please select one of the listed answer choices.",
      };
    }

    return { valid: true };
  }

  function validateQuestions(questions, answers) {
    for (const question of questions) {
      const result = validateQuestion(question, answers);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true };
  }

  function isSectionComplete(section, answers) {
    return validateQuestions(section.questions || [], answers).valid;
  }

  window.SurveyValidation = {
    validateQuestion,
    validateQuestions,
    isSectionComplete,
  };
})();
