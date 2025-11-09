'use strict';

const { isAdmin } = require('../../utils/access');

const sanitizeUserOutput = async (strapi, user) => {
  const service = strapi.plugin('users-permissions').service('user');
  return service.sanitizeOutput(user);
};

module.exports = (plugin) => {
  const setRole = async (ctx) => {
    const actingUser = ctx.state.user;
    if (!actingUser || !isAdmin(actingUser)) {
      return ctx.forbidden('Administrator access required');
    }

    const { id } = ctx.params;
    const { role } = ctx.request.body || {};

    if (!role || typeof role !== 'string') {
      return ctx.badRequest('Role code is required');
    }

    const normalizedRole = role.trim().toLowerCase();

    const roleRepository = strapi.db.query('plugin::users-permissions.role');
    const targetRole = await roleRepository.findOne({
      where: { type: normalizedRole },
    });

    if (!targetRole) {
      return ctx.badRequest('Unknown role code');
    }

    const userRepository = strapi.db.query('plugin::users-permissions.user');
    const existingUser = await userRepository.findOne({
      where: { id },
      populate: { role: true },
    });

    if (!existingUser) {
      return ctx.notFound('User not found');
    }

    await userRepository.update({
      where: { id },
      data: {
        role: targetRole.id,
      },
    });

    const updatedUser = await userRepository.findOne({
      where: { id },
      populate: { role: true },
    });

    const sanitized = await sanitizeUserOutput(strapi, updatedUser);
    ctx.body = sanitized;
  };

  plugin.controllers.user.setRole = setRole;

  plugin.routes['content-api'].routes.push({
    method: 'POST',
    path: '/users/:id/role',
    handler: 'user.setRole',
    config: {
      policies: ['global::ensure-authenticated', 'global::ensure-admin'],
    },
  });

  return plugin;
};
