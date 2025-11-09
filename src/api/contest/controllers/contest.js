'use strict';

const { factories } = require('@strapi/strapi');
const {
  pickContestFiltersForUser,
  canViewContest,
  canAccessContest,
  isAdmin,
} = require('../../../utils/access');
const { omitCorrectAnswers } = require('../../../utils/contest');

const toDate = (value) => (value ? new Date(value) : null);

const nowUtc = () => new Date();

module.exports = factories.createCoreController('api::contest.contest', ({ strapi }) => ({
  async find(ctx) {
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const { filters: queryFilters = {}, ...restQuery } = sanitizedQuery;
    const filters = {
      ...queryFilters,
      ...pickContestFiltersForUser(ctx.state.user),
    };

    const contests = await strapi.entityService.findMany('api::contest.contest', {
      ...restQuery,
      filters,
      populate: {},
      fields: [
        'name',
        'slug',
        'accessLevel',
        'startTime',
        'endTime',
        'prizeTitle',
        'prizeDescription',
        'maxParticipants',
        'metadata',
      ],
    });

    const sanitized = await this.sanitizeOutput(contests, ctx);
    return this.transformResponse(sanitized);
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const contest = await strapi.entityService.findOne('api::contest.contest', id, {
      populate: {
        questions: {
          fields: [
            'id',
            'prompt',
            'type',
            'choices',
            'points',
            'order',
            'correctAnswers',
          ],
        },
      },
    });

    if (!contest) {
      return ctx.notFound('Contest not found');
    }

    if (!canViewContest(contest.accessLevel, ctx.state.user)) {
      return ctx.forbidden('You do not have access to this contest');
    }

    const questions = Array.isArray(contest.questions) ? contest.questions : [];
    const sanitizedContest = await this.sanitizeOutput(contest, ctx);
    const sanitizedQuestions = await this.sanitizeOutput(questions, ctx);
    const hideSolutions = !isAdmin(ctx.state.user);
    const merged = {
      ...sanitizedContest,
      questions: sanitizedQuestions,
    };
    return this.transformResponse(omitCorrectAnswers(merged, !hideSolutions));
  },

  async join(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You need to sign in to join a contest');
    }

    const { id } = ctx.params;
    const contest = await strapi.entityService.findOne('api::contest.contest', id, {
      populate: {
        questions: {
          fields: ['id'],
        },
      },
    });

    if (!contest) {
      return ctx.notFound('Contest not found');
    }

    if (!canAccessContest(contest.accessLevel, user)) {
      return ctx.forbidden('You do not have the required role for this contest');
    }

    const now = nowUtc();
    const start = toDate(contest.startTime);
    const end = toDate(contest.endTime);

    if (start && now < start) {
      return ctx.badRequest('Contest has not started yet');
    }

    if (end && now > end) {
      return ctx.badRequest('Contest has already finished');
    }

    if (contest.maxParticipants) {
      const totalParticipants = await strapi.entityService.count(
        'api::contest-participation.contest-participation',
        {
          filters: {
            contest: contest.id,
          },
        }
      );

      if (totalParticipants >= contest.maxParticipants) {
        return ctx.badRequest('Contest has reached its participant capacity');
      }
    }

    const [existingParticipation] = await strapi.entityService.findMany(
      'api::contest-participation.contest-participation',
      {
        filters: {
          contest: contest.id,
          user: user.id,
        },
        sort: { createdAt: 'desc' },
      }
    );

    if (existingParticipation) {
      if (existingParticipation.status === 'submitted') {
        return ctx.badRequest('You have already completed this contest');
      }
      const sanitizedExisting = await this.sanitizeOutput(existingParticipation, ctx);
      return this.transformResponse(sanitizedExisting);
    }

    const participation = await strapi.entityService.create(
      'api::contest-participation.contest-participation',
      {
        data: {
          contest: contest.id,
          user: user.id,
          status: 'in_progress',
          startedAt: now,
          totalPoints: Array.isArray(contest.questions)
            ? contest.questions.reduce((acc, q) => acc + (q.points || 1), 0)
            : 0,
        },
        populate: {
          contest: {
            fields: ['id', 'name', 'slug'],
          },
        },
      }
    );

    const sanitizedParticipation = await this.sanitizeOutput(participation, ctx);
    return this.transformResponse(sanitizedParticipation);
  },

  async submit(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You need to sign in to submit answers');
    }

    const { id } = ctx.params;
    const { answers } = ctx.request.body || {};

    if (!Array.isArray(answers) || !answers.length) {
      return ctx.badRequest('Answers payload is required');
    }

    const contest = await strapi.entityService.findOne('api::contest.contest', id, {
      populate: {
        questions: {
          fields: [
            'id',
            'prompt',
            'type',
            'choices',
            'points',
            'order',
            'correctAnswers',
          ],
        },
      },
    });

    if (!contest) {
      return ctx.notFound('Contest not found');
    }

    if (!canAccessContest(contest.accessLevel, user)) {
      return ctx.forbidden('You do not have the required role for this contest');
    }

    const participation = await strapi.entityService.findMany(
      'api::contest-participation.contest-participation',
      {
        filters: {
          contest: contest.id,
          user: user.id,
        },
        populate: {},
        limit: 1,
      }
    );

    if (!participation.length) {
      return ctx.badRequest('You must join the contest before submitting answers');
    }

    const [currentParticipation] = participation;

    if (currentParticipation.status === 'submitted') {
      return ctx.badRequest('This contest attempt is already submitted');
    }

    const participationService = strapi.service(
      'api::contest-participation.contest-participation'
    );

    const result = await participationService.evaluateSubmission({
      contest,
      user,
      participation: currentParticipation,
      answers,
    });

    const sanitized = await this.sanitizeOutput(result, ctx);
    return this.transformResponse(sanitized);
  },

  async leaderboard(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const { id } = ctx.params;
    const contest = await strapi.entityService.findOne('api::contest.contest', id);
    if (!contest) {
      return ctx.notFound('Contest not found');
    }

    if (!canViewContest(contest.accessLevel, user)) {
      return ctx.forbidden('You do not have permission to view this leaderboard');
    }

    const participationService = strapi.service(
      'api::contest-participation.contest-participation'
    );
    const leaderboard = await participationService.getLeaderboard(contest.id);
    return this.transformResponse(leaderboard);
  },
}));
