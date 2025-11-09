'use strict';

const ROLE_DEFINITIONS = [
  {
    type: 'normal',
    name: 'Normal User',
    description: 'Signed-in user with access to normal contests.',
  },
  {
    type: 'vip',
    name: 'VIP User',
    description: 'VIP user with access to normal and VIP contests.',
  },
];

const ACTIONS = {
  CONTEST_FIND: 'api::contest.contest.find',
  CONTEST_FIND_ONE: 'api::contest.contest.findOne',
  CONTEST_JOIN: 'api::contest.contest.join',
  CONTEST_SUBMIT: 'api::contest.contest.submit',
  CONTEST_LEADERBOARD: 'api::contest.contest.leaderboard',
  HISTORY: 'api::contest-participation.contest-participation.history',
  IN_PROGRESS: 'api::contest-participation.contest-participation.inProgress',
  PRIZES: 'api::contest-participation.contest-participation.prizes',
  USER_ME: 'plugin::users-permissions.user.me',
};

const SAMPLE_USERS = [
  {
    key: 'normalPlayer',
    username: 'normal_player',
    email: 'normal.player@example.com',
    password: 'Password123!',
    role: 'normal',
    displayName: 'Normal Player',
  },
  {
    key: 'casualPlayer',
    username: 'casual_player',
    email: 'casual.player@example.com',
    password: 'Password123!',
    role: 'normal',
    displayName: 'Casual Player',
  },
  {
    key: 'vipPlayer',
    username: 'vip_player',
    email: 'vip.player@example.com',
    password: 'Password123!',
    role: 'vip',
    displayName: 'VIP Player',
  },
  {
    key: 'vipChallenger',
    username: 'vip_challenger',
    email: 'vip.challenger@example.com',
    password: 'Password123!',
    role: 'vip',
    displayName: 'VIP Challenger',
  },
];

const ensurePermission = async (strapi, roleId, action) => {
  const existing = await strapi.db
    .query('plugin::users-permissions.permission')
    .findOne({ where: { action, role: roleId } });

  if (!existing) {
    await strapi.db.query('plugin::users-permissions.permission').create({
      data: {
        action,
        role: roleId,
      },
    });
  }
};

const ensureRolePermissions = async (strapi, role, actions) => {
  if (!role) {
    return;
  }
  for (const action of actions) {
    await ensurePermission(strapi, role.id, action);
  }
};

const ensureCoreRoles = async (strapi) => {
  const roleRepository = strapi.db.query('plugin::users-permissions.role');

  const ensuredRoles = {};

  for (const roleDef of ROLE_DEFINITIONS) {
    let role = await roleRepository.findOne({ where: { type: roleDef.type } });

    if (!role) {
      role = await roleRepository.create({
        data: {
          ...roleDef,
        },
      });
    } else {
      // Ensure role still matches definition (name/description may change)
      await roleRepository.update({
        where: { id: role.id },
        data: {
          name: roleDef.name,
          description: roleDef.description,
        },
      });
      role = await roleRepository.findOne({ where: { id: role.id } });
    }

    ensuredRoles[roleDef.type] = role;
  }

  const publicRole = await roleRepository.findOne({ where: { type: 'public' } });
  const authenticatedRole = await roleRepository.findOne({ where: { type: 'authenticated' } });

  if (publicRole) {
    await ensureRolePermissions(strapi, publicRole, [ACTIONS.CONTEST_FIND, ACTIONS.CONTEST_FIND_ONE]);
  }

  const sharedActions = [
    ACTIONS.CONTEST_FIND,
    ACTIONS.CONTEST_FIND_ONE,
    ACTIONS.CONTEST_JOIN,
    ACTIONS.CONTEST_SUBMIT,
    ACTIONS.CONTEST_LEADERBOARD,
    ACTIONS.HISTORY,
    ACTIONS.IN_PROGRESS,
    ACTIONS.PRIZES,
    ACTIONS.USER_ME,
  ];

  if (authenticatedRole) {
    await ensureRolePermissions(strapi, authenticatedRole, sharedActions);
  }

  const normalRole = ensuredRoles.normal;
  const vipRole = ensuredRoles.vip;

  if (normalRole) {
    await ensureRolePermissions(strapi, normalRole, sharedActions);
  }

  if (vipRole) {
    await ensureRolePermissions(strapi, vipRole, sharedActions);
  }

  return {
    ...ensuredRoles,
    public: publicRole,
    authenticated: authenticatedRole,
  };
};

const ensureContestWithQuestions = async (strapi, contestInput, questionsInput) => {
  const contestRepository = strapi.db.query('api::contest.contest');

  let contest = await contestRepository.findOne({ where: { slug: contestInput.slug } });

  if (!contest) {
    contest = await strapi.entityService.create('api::contest.contest', {
      data: contestInput,
    });
  } else {
    contest = await strapi.entityService.update('api::contest.contest', contest.id, {
      data: contestInput,
    });
  }

  for (const questionInput of questionsInput) {
    const questionRepository = strapi.db.query('api::question.question');
    let question = await questionRepository.findOne({
      where: {
        prompt: questionInput.prompt,
        contest: contest.id,
      },
    });

    if (!question) {
      await strapi.entityService.create('api::question.question', {
        data: {
          ...questionInput,
          contest: contest.id,
        },
      });
    } else {
      await strapi.entityService.update('api::question.question', question.id, {
        data: {
          ...questionInput,
          contest: contest.id,
        },
      });
    }
  }

  const hydratedContest = await strapi.entityService.findOne('api::contest.contest', contest.id, {
    populate: {
      questions: {
        fields: ['id', 'prompt', 'type', 'points', 'order'],
      },
    },
  });

  return hydratedContest;
};

const ensureSeedData = async (strapi) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const normalContest = await ensureContestWithQuestions(
    strapi,
    {
      name: 'General Knowledge Trivia',
      slug: 'general-trivia',
      accessLevel: 'normal',
      description: 'A fast-paced trivia contest covering history, science, and pop culture.',
      prizeTitle: 'Gift Voucher',
      prizeDescription: 'Top scorer wins a $50 digital gift card.',
      startTime: oneHourAgo,
      endTime: sevenDaysLater,
      metadata: {
        difficulty: 'easy',
      },
    },
    [
      {
        prompt: 'Which planet is known as the Red Planet?',
        type: 'single',
        choices: [
          { value: 'mercury', label: 'Mercury' },
          { value: 'venus', label: 'Venus' },
          { value: 'mars', label: 'Mars' },
          { value: 'jupiter', label: 'Jupiter' },
        ],
        correctAnswers: ['mars'],
        points: 1,
        order: 1,
      },
      {
        prompt: 'Select all prime numbers below 10.',
        type: 'multi',
        choices: [
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
          { value: '6', label: '6' },
          { value: '7', label: '7' },
          { value: '8', label: '8' },
          { value: '9', label: '9' },
        ],
        correctAnswers: ['2', '3', '5', '7'],
        points: 2,
        order: 2,
      },
      {
        prompt: 'The Great Wall of China is visible from the Moon.',
        type: 'boolean',
        correctAnswers: [false],
        points: 1,
        order: 3,
      },
    ]
  );

  const vipContest = await ensureContestWithQuestions(
    strapi,
    {
      name: 'VIP Championship',
      slug: 'vip-championship',
      accessLevel: 'vip',
      description: 'Exclusive contest for VIP members with advanced problem-solving tasks.',
      prizeTitle: 'VIP Trophy',
      prizeDescription: 'Custom VIP trophy plus $200 reward card.',
      startTime: oneHourAgo,
      endTime: sevenDaysLater,
      metadata: {
        difficulty: 'hard',
      },
    },
    [
      {
        prompt: 'What is the derivative of sin(x)?',
        type: 'single',
        choices: [
          { value: 'cosx', label: 'cos(x)' },
          { value: '-cosx', label: '-cos(x)' },
          { value: 'sinx', label: 'sin(x)' },
          { value: '-sinx', label: '-sin(x)' },
        ],
        correctAnswers: ['cosx'],
        points: 2,
        order: 1,
      },
      {
        prompt: 'Select all programming languages that are statically typed by default.',
        type: 'multi',
        choices: [
          { value: 'typescript', label: 'TypeScript' },
          { value: 'python', label: 'Python' },
          { value: 'go', label: 'Go' },
          { value: 'ruby', label: 'Ruby' },
          { value: 'rust', label: 'Rust' },
        ],
        correctAnswers: ['typescript', 'go', 'rust'],
        points: 3,
        order: 2,
      },
      {
        prompt: 'HTTP/2 allows multiple requests over a single TCP connection simultaneously.',
        type: 'boolean',
        correctAnswers: [true],
        points: 1,
        order: 3,
      },
    ]
  );

  return {
    normalContest,
    vipContest,
  };
};

const ensureSampleUsers = async (strapi) => {
  const users = {};
  const userRepository = strapi.db.query('plugin::users-permissions.user');
  const roleRepository = strapi.db.query('plugin::users-permissions.role');
  const userService = strapi.plugin('users-permissions').service('user');

  for (const sample of SAMPLE_USERS) {
    let user = await userRepository.findOne({ where: { email: sample.email } });

    if (!user) {
      const role = await roleRepository.findOne({ where: { type: sample.role } });
      if (!role) {
        throw new Error(`Role ${sample.role} not found when creating sample user ${sample.email}`);
      }

      user = await userService.add({
        username: sample.username,
        email: sample.email,
        password: sample.password,
        role: role.id,
        confirmed: true,
        blocked: false,
      });
    }

    users[sample.key] = user;
  }

  return users;
};

const buildResponsesForContest = (contest, correctQuestionIdsSet) => {
  return (contest.questions || []).map((question) => {
    const points = question.points || 1;
    const answeredCorrectly = correctQuestionIdsSet.has(question.id);
    return {
      questionId: question.id,
      correct: answeredCorrectly,
      awardedPoints: answeredCorrectly ? points : 0,
      points,
      submittedAnswer: answeredCorrectly ? 'sample-answer' : null,
    };
  });
};

const ensureParticipation = async (strapi, { contest, user, status, correctQuestionIndexes, submittedAt, startedAt }) => {
  const repositoryUID = 'api::contest-participation.contest-participation';

  const totalPoints = (contest.questions || []).reduce((acc, question) => acc + (question.points || 1), 0);

  let correctSet = new Set();
  if (status === 'submitted') {
    if (correctQuestionIndexes === 'all') {
      correctSet = new Set((contest.questions || []).map((question) => question.id));
    } else if (Array.isArray(correctQuestionIndexes)) {
      correctSet = new Set(
        correctQuestionIndexes
          .map((index) => contest.questions?.[index])
          .filter(Boolean)
          .map((question) => question.id)
      );
    }
  }

  const responses = status === 'submitted' ? buildResponsesForContest(contest, correctSet) : [];
  const score = responses.reduce((sum, response) => sum + (response.awardedPoints || 0), 0);

  const filters = {
    contest: contest.id,
    user: user.id,
    status,
  };

  const existing = await strapi.entityService.findMany(repositoryUID, {
    filters,
    populate: {},
    limit: 1,
  });

  const baseData = {
    contest: contest.id,
    user: user.id,
    status,
    totalPoints,
    startedAt: startedAt || new Date(),
    prizeAwarded: false,
  };

  if (status === 'submitted') {
    Object.assign(baseData, {
      score,
      responses,
      submittedAt: submittedAt || new Date(),
    });
  } else {
    Object.assign(baseData, {
      score: 0,
      responses: [],
      submittedAt: null,
    });
  }

  if (existing.length) {
    await strapi.entityService.update(repositoryUID, existing[0].id, {
      data: baseData,
    });
  } else {
    await strapi.entityService.create(repositoryUID, {
      data: baseData,
    });
  }
};

const ensureSampleParticipations = async (strapi, contests, users) => {
  const now = Date.now();

  const offsets = (minutes) => new Date(now - minutes * 60 * 1000);

  await ensureParticipation(strapi, {
    contest: contests.normalContest,
    user: users.normalPlayer,
    status: 'submitted',
    correctQuestionIndexes: 'all',
    submittedAt: offsets(90),
    startedAt: offsets(100),
  });

  await ensureParticipation(strapi, {
    contest: contests.normalContest,
    user: users.vipPlayer,
    status: 'submitted',
    correctQuestionIndexes: [0, 2],
    submittedAt: offsets(80),
    startedAt: offsets(95),
  });

  await ensureParticipation(strapi, {
    contest: contests.normalContest,
    user: users.casualPlayer,
    status: 'in_progress',
    correctQuestionIndexes: [],
    startedAt: offsets(30),
  });

  await ensureParticipation(strapi, {
    contest: contests.vipContest,
    user: users.vipPlayer,
    status: 'submitted',
    correctQuestionIndexes: 'all',
    submittedAt: offsets(70),
    startedAt: offsets(85),
  });

  await ensureParticipation(strapi, {
    contest: contests.vipContest,
    user: users.vipChallenger,
    status: 'submitted',
    correctQuestionIndexes: [0, 2],
    submittedAt: offsets(65),
    startedAt: offsets(80),
  });

  const participationService = strapi.service('api::contest-participation.contest-participation');

  await participationService.recalculatePrizes(contests.normalContest.id);
  await participationService.recalculatePrizes(contests.vipContest.id);
};

const seedAll = async (strapi) => {
  const roles = await ensureCoreRoles(strapi);
  const contests = await ensureSeedData(strapi);
  const users = await ensureSampleUsers(strapi);
  await ensureSampleParticipations(strapi, contests, users);

  return {
    roles,
    contests,
    users,
  };
};

module.exports = {
  seedAll,
  ensureCoreRoles,
  ensureSeedData,
  ensureSampleUsers,
  ensureSampleParticipations,
};
