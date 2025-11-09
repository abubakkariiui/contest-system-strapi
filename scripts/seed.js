'use strict';

process.env.SKIP_BOOTSTRAP_SEED = 'true';

const { createStrapi } = require('@strapi/strapi');
const { seedAll } = require('../src/utils/seed-data');

const bootstrap = async () => {
  const app = await createStrapi().load();

  try {
    await seedAll(app);
    console.log('✅ Seed data applied successfully.');
  } catch (error) {
    console.error('❌ Failed to seed data.');
    console.error(error);
    process.exitCode = 1;
  } finally {
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      await app.destroy();
    } catch (destroyError) {
      if (!destroyError || destroyError.message !== 'aborted') {
        console.error('⚠️  Failed to gracefully shut down Strapi.');
        console.error(destroyError);
        process.exitCode = process.exitCode || 1;
      }
    }
  }
};

bootstrap();
