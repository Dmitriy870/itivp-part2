require('dotenv').config({ quiet: true });
const {
  sequelize,
  User,
  Course,
  Lesson,
  Webinar,
  Enrollment,
  Certificate,
} = require('../infrastructure/database/models');
const passwordHasher = require('../infrastructure/security/passwordHasher');
const { ROLES } = require('../domain/user/roles');
const { validateEnvironment } = require('../infrastructure/config/environment');

async function seed() {
  validateEnvironment();
  await sequelize.authenticate();
  await sequelize.sync();

  const admin = await upsertUser(
    process.env.ADMIN_EMAIL || 'admin@example.com',
    process.env.ADMIN_PASSWORD || 'Admin123!',
    ROLES.ADMIN,
  );
  await upsertUser(
    process.env.MODERATOR_EMAIL || 'moderator@example.com',
    process.env.MODERATOR_PASSWORD || 'Moderator123!',
    ROLES.MODERATOR,
  );

  const courses = [
    {
      title: 'Веб-разработка на Node.js',
      description: 'Серверная разработка, REST API, PostgreSQL, тестирование и контейнеризация приложений.',
      category: 'Информационные технологии',
      format: 'online',
      durationHours: 520,
      price: 1850,
      webinarUrl: null,
    },
    {
      title: 'Управление образовательными проектами',
      description: 'Планирование программ обучения, управление командой, бюджетом и качеством образования.',
      category: 'Менеджмент',
      format: 'mixed',
      durationHours: 360,
      price: 1290,
      webinarUrl: 'https://webinar.example.com/education-management',
    },
    {
      title: 'Аналитик данных: SQL, Python и BI',
      description: 'Сбор и очистка данных, статистический анализ, дашборды и принятие решений на основе метрик.',
      category: 'Аналитика данных',
      format: 'online',
      durationHours: 480,
      price: 2100,
      webinarUrl: null,
    },
    {
      title: 'Специалист по кибербезопасности',
      description: 'Защита инфраструктуры, управление уязвимостями, расследование инцидентов и основы DevSecOps.',
      category: 'Информационная безопасность',
      format: 'mixed',
      durationHours: 620,
      price: 2450,
      webinarUrl: 'https://webinar.example.com/cybersecurity',
    },
    {
      title: 'Управление персоналом и HR-аналитика',
      description: 'Подбор, адаптация и развитие сотрудников, HR-метрики и цифровые инструменты руководителя.',
      category: 'Управление персоналом',
      format: 'webinar',
      durationHours: 320,
      price: 1180,
      webinarUrl: 'https://webinar.example.com/hr-analytics',
    },
    {
      title: 'Финансовый менеджмент организации',
      description: 'Управленческий учёт, бюджетирование, оценка инвестиций и контроль финансовых рисков.',
      category: 'Финансы',
      format: 'online',
      durationHours: 410,
      price: 1540,
      webinarUrl: null,
    },
    {
      title: 'Методист онлайн-обучения',
      description: 'Проектирование образовательного опыта, разработка программ, оценивание и работа с LMS.',
      category: 'Образование',
      format: 'mixed',
      durationHours: 380,
      price: 1360,
      webinarUrl: 'https://webinar.example.com/instructional-design',
    },
    {
      title: 'Руководитель проектов: Agile и Scrum',
      description: 'Управление требованиями, сроками и рисками, гибкие методологии и практика командной работы.',
      category: 'Управление проектами',
      format: 'webinar',
      durationHours: 290,
      price: 1120,
      webinarUrl: 'https://webinar.example.com/project-management',
    },
    {
      title: 'Промышленная безопасность и охрана труда',
      description: 'Организация безопасного производства, аудит рисков и подготовка обязательной документации.',
      category: 'Безопасность труда',
      format: 'online',
      durationHours: 256,
      price: 890,
      webinarUrl: null,
    },
  ];

  const persistedCourses = [];
  for (const course of courses) {
    const defaults = {
      ...course,
      certificateIssued: true,
      published: true,
      createdBy: admin.id,
    };
    const existing = await Course.findOne({ where: { title: course.title } });
    if (existing) {
      await existing.update(defaults);
      persistedCourses.push(existing);
    } else {
      persistedCourses.push(await Course.create(defaults));
    }
  }

  const lessonTemplates = [
    ['Вводный модуль и постановка целей', 45],
    ['Основные инструменты и практический кейс', 90],
    ['Итоговый проект и оценка компетенций', 120],
  ];
  for (const course of persistedCourses) {
    for (const [index, template] of lessonTemplates.entries()) {
      const [title, durationMinutes] = template;
      await Lesson.findOrCreate({
        where: { courseId: course.id, position: index + 1 },
        defaults: { title, durationMinutes },
      });
    }
  }

  const webinarCourses = persistedCourses.filter((course) => course.webinarUrl).slice(0, 4);
  for (const [index, course] of webinarCourses.entries()) {
    await Webinar.findOrCreate({
      where: { courseId: course.id, title: `Открытый вебинар: ${course.title}` },
      defaults: {
        scheduledAt: new Date(Date.UTC(2026, 11, 8 + (index * 7), 16, 0, 0)),
        durationMinutes: 90,
        meetingUrl: course.webinarUrl,
      },
    });
  }

  const issuedCertificates = await Certificate.findAll({ attributes: ['userId', 'courseId'] });
  for (const certificate of issuedCertificates) {
    await Enrollment.update(
      { status: 'completed' },
      { where: { userId: certificate.userId, courseId: certificate.courseId } },
    );
  }

  console.log('Тестовые пользователи и курсы созданы.');
  await sequelize.close();
}

async function upsertUser(email, password, role) {
  const passwordHash = await passwordHasher.hash(password);
  const [user] = await User.scope('withSecrets').findOrCreate({
    where: { email: email.toLowerCase() },
    defaults: { passwordHash, role },
  });
  if (user.role !== role) await user.update({ role });
  return user;
}

seed().catch(async (error) => {
  console.error('Ошибка заполнения БД:', error.message);
  await sequelize.close();
  process.exit(1);
});
