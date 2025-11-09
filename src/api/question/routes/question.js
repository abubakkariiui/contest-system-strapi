'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/questions',
      handler: 'question.find',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
  ],
};
