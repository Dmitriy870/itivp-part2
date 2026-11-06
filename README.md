# Training Platform

Платформа курсов профессиональной переподготовки, вебинаров и сертификатов. Проект включает React-фронтенд, REST API на Node.js, PostgreSQL и production-инфраструктуру мониторинга.

## Production

- приложение и API: <http://207.180.199.246:8080>;
- health-check API: <http://207.180.199.246:8080/api/health>;
- Grafana: <http://207.180.199.246:3002>;
- Uptime Kuma: <http://207.180.199.246:3001>;
- публичная status page: <http://207.180.199.246:3001/status/training-platform>;
- Dockhand: <https://207.180.199.246:9444>.

UptimeRobot и Sentry подключаются как внешние сервисы; их публичные ссылки добавляются после создания проектов и status page.

## Возможности

- регистрация и аутентификация пользователей;
- access- и refresh-токены JWT;
- роли `user`, `moderator` и `admin`;
- создание курса любым аутентифицированным пользователем;
- изменение курса его автором или администратором;
- просмотр, поиск, фильтрация и удаление курсов;
- подробные карточки программ и демонстрационный каталог из девяти направлений;
- запись на курс, просмотр своих программ и отмена записи;
- валидация входных данных;
- ограничение частоты запросов;
- журналирование событий безопасности;
- защита HTTP-заголовков и контроль CORS;
- интеграционные тесты основных API-сценариев.
- React-интерфейс каталога, аутентификации и личного кабинета;
- метрики Prometheus, дашборд и алерты Grafana;
- централизованные Docker-логи в Loki через Grafana Alloy;
- независимый мониторинг доступности в Uptime Kuma;
- интеграция Sentry для backend и frontend;
- автоматический CI/CD из ветки `ipr22`.

## Технологии

- Node.js и Express;
- PostgreSQL и Sequelize;
- JWT и bcrypt;
- Joi, Helmet и express-rate-limit;
- Docker Compose;
- Postman и `node:test`.
- React, TypeScript и Vite;
- Prometheus, Grafana, Loki, Alloy, cAdvisor и node-exporter;
- GitHub Actions, Sentry и UptimeRobot.

## Быстрый запуск

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:seed
npm run dev
```

API: <http://localhost:3000>. Проверка состояния: <http://localhost:3000/health>.

Frontend для локальной разработки:

```bash
npm install --prefix frontend
npm run dev --prefix frontend
```

## Production-запуск

Для backend и frontend используются отдельные Dockerfile:

- [`Dockerfile`](./Dockerfile) — Node.js API;
- [`frontend/Dockerfile`](./frontend/Dockerfile) — сборка React и Nginx.

PostgreSQL и весь стек наблюдаемости описаны в [`compose.prod.yml`](./compose.prod.yml). На сервере создайте `/opt/training-platform/shared/.env.production` по шаблону [`.env.production.example`](./.env.production.example), затем выполните:

```bash
docker compose --env-file /opt/training-platform/shared/.env.production -f compose.prod.yml up -d --build
```

Из внешней сети открыты frontend/API на порту `8080`, Uptime Kuma на `3001` и Grafana на `3002`. PostgreSQL, Prometheus, Loki и экспортёры доступны только во внутренних Docker-сетях.

## CI/CD

Workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) запускается при push в `ipr22` и выполняет:

1. установку зависимостей и ESLint для двух частей приложения;
2. интеграционные тесты API и production-сборку frontend;
3. аудит production-зависимостей;
4. сборку отдельных Docker-образов backend и frontend;
5. загрузку release на VPS, запуск Compose и проверку `/frontend-health` и `/api/health`;
6. Telegram-уведомление об успехе или ошибке.

Необходимые GitHub Secrets: `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

## Наблюдаемость

- `/api/metrics` экспортирует Prometheus-метрики запросов, задержки, памяти и uptime процесса;
- Prometheus также собирает ресурсы VPS и контейнеров;
- Grafana автоматически получает dashboard `Training Platform — Production Overview` и правила оповещений;
- Alloy читает логи контейнеров через Docker API и отправляет их в Loki;
- Pino редактирует пароли, JWT, cookies и заголовки авторизации до записи логов;
- Sentry включается переменными `SENTRY_DSN` и `VITE_SENTRY_DSN`;
- защищённый `POST /api/debug/error` позволяет один раз подтвердить доставку тестовой ошибки в Sentry.

## Команды

```bash
npm start        # обычный запуск
npm run dev      # запуск с встроенным Node.js watch mode
npm run db:seed  # создание демонстрационных данных
npm test         # запуск тестов
```

Описание маршрутов и примеры запросов находятся в [`API.md`](./API.md). Postman-коллекция находится в каталоге [`postman`](./postman).

## Права доступа к курсам

| Операция | Доступ |
| --- | --- |
| Просмотр списка и отдельного курса | публичный |
| Создание курса | любой аутентифицированный пользователь |
| Изменение курса | автор курса или `admin` |
| Удаление курса | только `admin` |

Поиск выполняется запросом `GET /courses?search=Node.js`. Также поддерживаются фильтры `category`, `format`, `published` и пагинация.

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
