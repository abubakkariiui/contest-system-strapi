'use strict';

const { seedAll } = require('./utils/seed-data');

const shouldSeedOnBootstrap = process.env.SKIP_BOOTSTRAP_SEED !== 'true';

module.exports = {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    if (shouldSeedOnBootstrap) {
      await seedAll(strapi);
    }
  },
};
