Серверное приложение для платформы курсов профессиональной переподготовки, вебинаров и сертификатов. Проект предоставляет REST API для работы с пользователями и учебными курсами.

## Возможности

- регистрация и аутентификация пользователей;
- access- и refresh-токены JWT;
- роли `user`, `moderator` и `admin`;
- создание, просмотр, изменение и удаление курсов;
- валидация входных данных;
- ограничение частоты запросов;
- журналирование событий безопасности;
- защита HTTP-заголовков и контроль CORS;
- интеграционные тесты основных API-сценариев.

## Технологии

- Node.js и Express;
- PostgreSQL и Sequelize;
- JWT и bcrypt;
- Joi, Helmet и express-rate-limit;
- Docker Compose;
- Postman и `node:test`.

## Быстрый запуск

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:seed
npm run dev
```

API: <http://localhost:3000>. Проверка состояния: <http://localhost:3000/health>.

## Команды

```bash
npm start        # обычный запуск
npm run dev      # запуск с встроенным Node.js watch mode
npm run db:seed  # создание демонстрационных данных
npm test         # запуск тестов
```

Postman-коллекция находится в каталоге [`postman`](./postman).

## Структура проекта

```text
src/
├── domain/          # предметные правила
├── application/     # сервисы приложения и DTO
├── infrastructure/  # база данных, токены и журналирование
├── presentation/    # HTTP-маршруты, контроллеры и middleware
├── shared/          # общие абстракции
└── main/            # конфигурация и запуск приложения
```
