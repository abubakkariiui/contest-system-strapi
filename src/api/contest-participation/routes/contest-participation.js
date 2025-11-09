'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/me/contests/history',
      handler: 'contest-participation.history',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/me/contests/in-progress',
      handler: 'contest-participation.inProgress',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/me/prizes',
      handler: 'contest-participation.prizes',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
  ],
};
