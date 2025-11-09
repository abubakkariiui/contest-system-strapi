'use strict';

const omitCorrectAnswers = (contest, revealSolutions = false) => {
  if (!contest || revealSolutions) {
    return contest;
  }

  const cloneQuestions = (questions = []) =>
    questions.map((question) => {
      if (!question) {
        return question;
      }
      const { correctAnswers, ...rest } = question;
      return {
        ...rest,
        correctAnswers: undefined,
      };
    });

  if (Array.isArray(contest)) {
    return contest.map((entry) => omitCorrectAnswers(entry, revealSolutions));
  }

  if (contest.questions) {
    return {
      ...contest,
      questions: cloneQuestions(contest.questions),
    };
  }

  return contest;
};

const normalizeAnswerValue = (questionType, rawValue) => {
  if (questionType === 'boolean') {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return null;
    }
    if (typeof rawValue === 'string') {
      const lowered = rawValue.trim().toLowerCase();
      if (lowered === 'true') {
        return true;
      }
      if (lowered === 'false') {
        return false;
      }
    }
    return Boolean(rawValue);
  }

  if (Array.isArray(rawValue)) {
    return rawValue;
  }

  if (rawValue === null || rawValue === undefined) {
    return [];
  }

  return [rawValue];
};

const isAnswerCorrect = (question, normalizedAnswer) => {
  const { type, correctAnswers = [], points = 1 } = question;

  if (type === 'boolean') {
    if (!correctAnswers.length) {
      return { correct: false, awardedPoints: 0 };
    }
    if (normalizedAnswer === null || normalizedAnswer === undefined) {
      return { correct: false, awardedPoints: 0 };
    }
    const expected =
      typeof correctAnswers[0] === 'string'
        ? correctAnswers[0].toLowerCase() === 'true'
        : Boolean(correctAnswers[0]);
    const provided = Boolean(normalizedAnswer);
    return {
      correct: expected === provided,
      awardedPoints: expected === provided ? points : 0,
    };
  }

  const expectedSet = new Set((correctAnswers || []).map(String));
  const providedSet = new Set((normalizedAnswer || []).map(String));

  if (!expectedSet.size && !providedSet.size) {
    return { correct: false, awardedPoints: 0 };
  }

  if (expectedSet.size !== providedSet.size) {
    return { correct: false, awardedPoints: 0 };
  }

  for (const value of expectedSet) {
    if (!providedSet.has(value)) {
      return { correct: false, awardedPoints: 0 };
    }
  }

  return { correct: true, awardedPoints: points };
};

module.exports = {
  omitCorrectAnswers,
  normalizeAnswerValue,
  isAnswerCorrect,
};
