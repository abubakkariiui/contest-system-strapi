'use strict';

const ROLE_CODES = {
  ADMIN: 'admin',
  VIP: 'vip',
  NORMAL: 'normal',
  AUTHENTICATED: 'authenticated',
  PUBLIC: 'public',
};

const ACCESS_LEVELS = {
  NORMAL: 'normal',
  VIP: 'vip',
};

const isAdmin = (user) => {
  if (!user) {
    return false;
  }
  const { role } = user;
  if (!role) {
    return false;
  }
  const { type = '', code = '' } = role;
  return type === ROLE_CODES.ADMIN || code === ROLE_CODES.ADMIN;
};

const resolveRoleCode = (user) => {
  if (!user) {
    return ROLE_CODES.PUBLIC;
  }
  const { role } = user;
  if (!role) {
    return ROLE_CODES.AUTHENTICATED;
  }
  return role.code || role.type || ROLE_CODES.AUTHENTICATED;
};

const canAccessContest = (contestAccessLevel, user) => {
  if (contestAccessLevel === ACCESS_LEVELS.NORMAL) {
    return Boolean(user);
  }
  if (contestAccessLevel === ACCESS_LEVELS.VIP) {
    return isAdmin(user) || resolveRoleCode(user) === ROLE_CODES.VIP;
  }
  return false;
};

const canViewContest = (contestAccessLevel, user) => {
  if (contestAccessLevel === ACCESS_LEVELS.NORMAL) {
    return true;
  }
  return canAccessContest(contestAccessLevel, user);
};

const pickContestFiltersForUser = (user) => {
  const roleCode = resolveRoleCode(user);
  if (isAdmin(user) || roleCode === ROLE_CODES.VIP) {
    return {};
  }
  if (roleCode === ROLE_CODES.NORMAL || roleCode === ROLE_CODES.AUTHENTICATED) {
    return { accessLevel: ACCESS_LEVELS.NORMAL };
  }
  return { accessLevel: ACCESS_LEVELS.NORMAL };
};

module.exports = {
  ROLE_CODES,
  ACCESS_LEVELS,
  isAdmin,
  resolveRoleCode,
  canAccessContest,
  canViewContest,
  pickContestFiltersForUser,
};
