'use strict';

const { isAdmin } = require('../utils/access');

module.exports = async (ctx) => {
  if (!ctx.state.user || !isAdmin(ctx.state.user)) {
    return ctx.forbidden('Administrator access required');
  }
  return true;
};
