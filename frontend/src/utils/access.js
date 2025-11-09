export const ROLE_CODES = {
  ADMIN: 'admin',
  VIP: 'vip',
  NORMAL: 'normal',
  AUTHENTICATED: 'authenticated',
  PUBLIC: 'public',
};

export const ACCESS_LEVELS = {
  NORMAL: 'normal',
  VIP: 'vip',
};

export const resolveRoleCode = (user) => {
  if (!user) {
    return ROLE_CODES.PUBLIC;
  }

  const { role } = user;
  if (!role) {
    return ROLE_CODES.AUTHENTICATED;
  }

  return role.code || role.type || ROLE_CODES.AUTHENTICATED;
};

export const isAdmin = (user) => {
  const roleCode = resolveRoleCode(user);
  return roleCode === ROLE_CODES.ADMIN;
};

export const canAccessContest = (contestAccessLevel, user) => {
  if (contestAccessLevel === ACCESS_LEVELS.NORMAL) {
    return Boolean(user);
  }
  if (contestAccessLevel === ACCESS_LEVELS.VIP) {
    return isAdmin(user) || resolveRoleCode(user) === ROLE_CODES.VIP;
  }
  return false;
};

export const canViewContest = (contestAccessLevel, user) => {
  if (contestAccessLevel === ACCESS_LEVELS.NORMAL) {
    return true;
  }
  return canAccessContest(contestAccessLevel, user);
};
