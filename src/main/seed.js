require('dotenv').config({ quiet: true });
const { sequelize, User, Course } = require('../infrastructure/database/models');
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

  const count = await Course.count();
  if (count === 0) {
    await Course.bulkCreate([
      {
        title: 'Веб-разработка на Node.js',
        description: 'Программа профессиональной переподготовки по серверной веб-разработке.',
        category: 'Информационные технологии',
        format: 'online',
        durationHours: 520,
        price: 1850,
        certificateIssued: true,
        published: true,
        createdBy: admin.id,
      },
      {
        title: 'Управление образовательными проектами',
        description: 'Практический курс для руководителей программ дополнительного образования.',
        category: 'Менеджмент',
        format: 'mixed',
        durationHours: 360,
        price: 1290,
        certificateIssued: true,
        published: true,
        createdBy: admin.id,
      },
    ]);
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
