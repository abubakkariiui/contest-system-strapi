'use strict';

const { factories } = require('@strapi/strapi');

module.exports = factories.createCoreController(
  'api::contest-participation.contest-participation',
  ({ strapi }) => ({
    async history(ctx) {
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const participations = await strapi
        .service('api::contest-participation.contest-participation')
        .getUserParticipations(ctx.state.user.id, { status: 'submitted' });

      const sanitized = await this.sanitizeOutput(participations, ctx);
      return this.transformResponse(sanitized);
    },

    async inProgress(ctx) {
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const participations = await strapi
        .service('api::contest-participation.contest-participation')
        .getUserParticipations(ctx.state.user.id, { status: 'in_progress' });

      const sanitized = await this.sanitizeOutput(participations, ctx);
      return this.transformResponse(sanitized);
    },

    async prizes(ctx) {
      if (!ctx.state.user) {
        return ctx.unauthorized('Authentication required');
      }

      const participations = await strapi.entityService.findMany(
        'api::contest-participation.contest-participation',
        {
          filters: {
            user: ctx.state.user.id,
            prizeAwarded: true,
          },
          populate: {
            contest: {
              fields: ['id', 'name', 'slug', 'prizeTitle', 'prizeDescription'],
            },
          },
          sort: { submittedAt: 'desc' },
        }
      );

      const sanitized = await this.sanitizeOutput(participations, ctx);
      return this.transformResponse(sanitized);
    },
  })
);
