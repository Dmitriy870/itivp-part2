# Training Platform

Платформа курсов профессиональной переподготовки, вебинаров и сертификатов. Проект включает React-фронтенд, REST API на Node.js, PostgreSQL и production-инфраструктуру мониторинга.

## Облачный стенд КР №2

Ветка `kr22` разворачивается отдельно от стенда ИПР. Render запускает Express и PostgreSQL, Vercel собирает клиент.

1. Создайте Blueprint в Render из `render.yaml` на ветке `kr22`. Оба ресурса настроены на Free. Render свяжет базу с API, сгенерирует серверные секреты и заполнит пустую базу при первом запуске.
2. В Vercel создайте Hobby-проект из того же репозитория. Укажите `client` как Root Directory и `kr22` как Production Branch. Задайте `VITE_API_URL` равным HTTPS-адресу сервиса Render без пути.
3. Укажите точный HTTPS-адрес проекта Vercel в `CORS_ORIGINS` сервиса Render. Если Vercel ещё не назначил адрес, при создании Blueprint можно временно указать `https://placeholder.invalid`, затем заменить это значение.
4. Проверьте `/health` на Render и `/api/health` на Vercel. Запросы браузера идут через `/api` на домене сайта, поэтому refresh-cookie с `Secure` и `SameSite=Strict` остаётся доступной после перезагрузки.

## Стенд ИПР №2 на Contabo

- приложение и API: <http://207.180.199.246:8080>;
- health-check API: <http://207.180.199.246:8080/api/health>;
- Grafana: <http://207.180.199.246:3002> (дашборд `Training Platform — Production Overview`);
- Uptime Kuma: <http://207.180.199.246:3001>;
- публичная status page: <http://207.180.199.246:3001/status/training-platform>;
- Sentry: <https://training-platform-0x.sentry.io>;
- Dockhand: <https://207.180.199.246:9444>;
- Telegram-бот мониторинга: [@itivp_training_monitor_bot](https://t.me/itivp_training_monitor_bot) (`Training Platform Monitor`, ID `8766147731`).

Сервисы администрирования закрыты авторизацией. Пароли, DSN, SSH-ключи и токен Telegram-бота не хранятся в Git и передаются через локальный production-env и GitHub Actions Secrets.

## Возможности

- регистрация и аутентификация пользователей;
- access- и refresh-токены JWT;
- роли `user`, `moderator` и `admin`;
- создание курса любым аутентифицированным пользователем;
- изменение курса его автором или администратором;
- каталог с пагинацией, поиском и фильтром по формату;
- отдельные страницы курса, создания и редактирования, удаление курса администратором;
- кабинет автора с черновиками, публикация курса в каталоге;
- сравнение двух или трёх программ по стоимости, длительности, формату и сертификату;
- подробные карточки программ и демонстрационный каталог из девяти направлений;
- запись на курс, просмотр своих программ и отмена записи;
- учебная программа из упорядоченных занятий и сохранение прогресса слушателя;
- автоматическая выдача именного сертификата после завершения всех занятий;
- публичная проверка подлинности сертификата по уникальному номеру;
- планирование, перенос и отмена вебинаров автором курса или администратором;
- публичная комната вебинара, ссылка на эфир доступна за 10 минут до начала и до его завершения;
- валидация входных данных;
- ограничение частоты запросов;
- журналирование событий безопасности;
- защита HTTP-заголовков и контроль CORS;
- интеграционные тесты основных API-сценариев;
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
- GitHub Actions, Sentry, Uptime Kuma и Telegram Bot API.

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
npm ci --prefix client
npm run dev --prefix client
```

Интерфейс доступен на <http://localhost:5173>. По умолчанию Vite проксирует запросы `/api` на локальный Express. Для другого API задайте `VITE_API_URL` в `client/.env.local` перед сборкой или запуском клиента.

### Маршруты и оптимизации КР №2

- `/courses` — каталог, `/courses/:id` — детали, `/courses/new` и `/courses/:id/edit` — формы.
- `/courses/mine` — курсы автора и черновики, `/courses/:id/webinars` — управление расписанием.
- `/courses/compare` — таблица сравнения. Выбранные курсы передаются в URL.
- Поиск отправляет запрос после паузы в 300 мс и отменяет устаревшие запросы. Для проверки откройте Network с фильтром `courses?`, дождитесь первой загрузки, затем быстро введите слово.
- React Router загружает код каталога, формы и остальных страниц через `React.lazy` и `Suspense`. После `npm run build` Vite выводит список чанков. В Network видно, в какой момент браузер запрашивает каждый из них.

## Production-запуск

Для backend и frontend используются отдельные Dockerfile:

- [`Dockerfile`](./Dockerfile) — Node.js API;
- [`client/Dockerfile`](./client/Dockerfile) — сборка React и Nginx.

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

CI/CD реализован как последовательность независимых jobs: `lint` → `test` → `audit` → `build` → `deploy`. Job `notify` запускается всегда и отправляет в Telegram итоговый статус пайплайна. Деплой выполняется без ручного вмешательства: release архивируется, передаётся на Contabo VPS по SSH, разворачивается Docker Compose и принимается только после успешных health-check frontend и API.

## Наблюдаемость

- `/api/metrics` экспортирует Prometheus-метрики запросов, задержки, памяти и uptime процесса;
- Prometheus также собирает ресурсы VPS и контейнеров;
- Grafana автоматически получает dashboard `Training Platform — Production Overview` и правила оповещений;
- Alloy читает логи контейнеров через Docker API и отправляет их в Loki;
- Pino редактирует пароли, JWT, cookies и заголовки авторизации до записи логов;
- Sentry включается переменными `SENTRY_DSN` и `VITE_SENTRY_DSN`;
- защищённый `POST /api/debug/error` позволяет один раз подтвердить доставку тестовой ошибки в Sentry.

Uptime Kuma проверяет frontend, API и Grafana с интервалом 60 секунд. Grafana отображает доступность API, частоту запросов, p95 задержки, ошибки 5xx, CPU и память VPS, ресурсы контейнеров и централизованные логи. Правила Grafana отправляют критические события в Telegram.

## Почему выбран этот стек

- **Contabo VPS** уже доступен для проекта и позволяет развернуть frontend, backend, PostgreSQL и наблюдаемость в одной воспроизводимой Docker-инфраструктуре.
- **GitHub Actions** встроен в репозиторий и обеспечивает проверку, сборку и автоматический деплой при каждом push в `ipr22`.
- **Prometheus и Grafana** дают собственное хранение метрик, единый дашборд ресурсов и управляемые правила оповещений.
- **Loki и Alloy** централизуют Docker-логи без передачи журналов стороннему провайдеру.
- **Uptime Kuma** независимо проверяет внешнюю доступность сервисов и предоставляет публичную status page.
- **Sentry** связывает production-ошибки backend и frontend с релизом и контекстом выполнения.
- **Telegram Bot API** используется как единый канал уведомлений CI/CD и мониторинга.

## Ограничения production-стенда

Учебный стенд опубликован по внешнему IPv4 и нестандартным портам. Для коммерческой эксплуатации необходимо привязать домен, завершить TLS на reverse proxy, закрыть административные порты сетевым firewall/VPN, настроить резервное копирование PostgreSQL и вынести секреты в специализированное хранилище.

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
