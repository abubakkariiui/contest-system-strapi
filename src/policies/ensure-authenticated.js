'use strict';

module.exports = async (ctx, config, { strapi }) => {
  if (!ctx.state.user) {
    return ctx.unauthorized('Authentication required');
  }
  return true;
};
