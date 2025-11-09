'use strict';

const { createStrapi } = require('@strapi/strapi');

const run = async () => {
  const app = await createStrapi().load();
  try {
    const contests = await app.entityService.findMany('api::contest.contest', {
      populate: {
        questions: {
          fields: ['id', 'prompt', 'type', 'points'],
        },
      },
    });

    console.log(
      contests.map((contest) => ({
        id: contest.id,
        name: contest.name,
        questions: contest.questions?.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          type: q.type,
          points: q.points,
        })),
      }))
    );
  } catch (error) {
    console.error(error);
  } finally {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await app.destroy();
  }
};

run();
