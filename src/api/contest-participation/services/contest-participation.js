'use strict';

const { factories } = require('@strapi/strapi');
const { normalizeAnswerValue, isAnswerCorrect } = require('../../../utils/contest');

const sanitizeAnswersArray = (payload) => {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .filter((entry) => entry && entry.questionId)
    .map((entry) => ({
      questionId: entry.questionId,
      value:
        entry.value !== undefined
          ? entry.value
          : entry.answer !== undefined
          ? entry.answer
          : entry.values !== undefined
          ? entry.values
          : entry.answers !== undefined
          ? entry.answers
          : null,
    }));
};

module.exports = factories.createCoreService('api::contest-participation.contest-participation', ({ strapi }) => ({
  async evaluateSubmission({ contest, user, participation, answers }) {
    const normalizedAnswers = sanitizeAnswersArray(answers);
    const answerMap = new Map();
    normalizedAnswers.forEach((entry) => {
      answerMap.set(Number(entry.questionId), entry.value);
    });

    const evaluation = [];
    let totalPoints = 0;
    let awardedPoints = 0;

    const orderedQuestions = Array.isArray(contest.questions)
      ? [...contest.questions].sort((a, b) => (a.order || 0) - (b.order || 0))
      : [];

    for (const question of orderedQuestions) {
      const points = question.points || 1;
      totalPoints += points;
      const rawValue = answerMap.has(question.id) ? answerMap.get(question.id) : null;
      const normalizedValue = normalizeAnswerValue(question.type, rawValue);
      const { correct, awardedPoints: pointsAwarded } = isAnswerCorrect(question, normalizedValue);
      if (correct) {
        awardedPoints += pointsAwarded;
      }

      evaluation.push({
        questionId: question.id,
        correct,
        awardedPoints: pointsAwarded,
        points,
        submittedAnswer: normalizedValue,
      });
    }

    const submittedAt = new Date();

    const updatedParticipation = await strapi.entityService.update(
      'api::contest-participation.contest-participation',
      participation.id,
      {
        data: {
          status: 'submitted',
          score: awardedPoints,
          totalPoints,
          submittedAt,
          responses: evaluation,
        },
        populate: {
          contest: {
            fields: ['id', 'name', 'slug', 'prizeTitle', 'prizeDescription'],
          },
        },
      }
    );

    await this.recalculatePrizes(contest.id);

    return updatedParticipation;
  },

  async recalculatePrizes(contestId) {
    const submissions = await strapi.entityService.findMany(
      'api::contest-participation.contest-participation',
      {
        filters: {
          contest: contestId,
          status: 'submitted',
        },
        sort: { score: 'desc', submittedAt: 'asc' },
      }
    );

    if (!submissions.length) {
      return;
    }

    const topScore = submissions[0].score;

    await Promise.all(
      submissions.map((entry) =>
        strapi.entityService.update(
          'api::contest-participation.contest-participation',
          entry.id,
          {
            data: {
              prizeAwarded: entry.score === topScore,
            },
          }
        )
      )
    );
  },

  async getLeaderboard(contestId) {
    const submissions = await strapi.entityService.findMany(
      'api::contest-participation.contest-participation',
      {
        filters: {
          contest: contestId,
          status: 'submitted',
        },
        sort: { score: 'desc', submittedAt: 'asc' },
        populate: {
          user: {
            fields: ['id', 'username', 'email'],
          },
        },
      }
    );

    return submissions.map((entry, index) => ({
      rank: index + 1,
      participationId: entry.id,
      score: entry.score,
      totalPoints: entry.totalPoints,
      submittedAt: entry.submittedAt,
      prizeAwarded: entry.prizeAwarded,
      user: entry.user
        ? {
            id: entry.user.id,
            username: entry.user.username,
            email: entry.user.email,
          }
        : null,
    }));
  },

  async getUserParticipations(userId, { status } = {}) {
    return strapi.entityService.findMany('api::contest-participation.contest-participation', {
      filters: {
        user: userId,
        ...(status ? { status } : {}),
      },
      populate: {
        contest: {
          fields: ['id', 'name', 'slug', 'startTime', 'endTime', 'prizeTitle', 'accessLevel'],
        },
      },
      sort: { createdAt: 'desc' },
    });
  },
}));
