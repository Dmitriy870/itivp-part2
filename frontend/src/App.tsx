import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  Course,
  Enrollment,
  User,
  cancelEnrollment,
  enrollInCourse,
  getCourses,
  getHealth,
  getMyEnrollments,
  login,
  logout,
  register,
  restoreSession,
} from './api';

const formatLabels = {
  online: 'Онлайн',
  webinar: 'Вебинар',
  mixed: 'Смешанный',
};

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [health, setHealth] = useState<'checking' | 'online' | 'offline'>('checking');
  const [uptime, setUptime] = useState(0);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [busyCourseId, setBusyCourseId] = useState('');

  useEffect(() => {
    getHealth()
      .then((result) => {
        setHealth(result.status === 'ok' ? 'online' : 'offline');
        setUptime(result.uptimeSeconds);
      })
      .catch(() => setHealth('offline'));
  }, []);

  useEffect(() => {
    restoreSession()
      .then(setUser)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    getMyEnrollments()
      .then((result) => setEnrollments(result.data))
      .catch(() => setMessage('Не удалось загрузить ваши программы'));
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoading(true);
      getCourses(search, format)
        .then((result) => {
          setCourses(result.data);
          setMessage('');
        })
        .catch((error: unknown) => {
          setMessage(error instanceof Error ? error.message : 'Не удалось загрузить курсы');
        })
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, format]);

  const totalHours = useMemo(
    () => courses.reduce((sum, course) => sum + course.durationHours, 0),
    [courses],
  );

  async function submitAuth(event: FormEvent) {
    event.preventDefault();
    setMessage('');
    try {
      if (authMode === 'register') {
        const passwordError = validatePassword(password);
        if (passwordError) {
          setMessage(passwordError);
          return;
        }
        await register(email, password);
        setAuthMode('login');
        setMessage('Регистрация завершена. Теперь войдите в аккаунт.');
      } else {
        const result = await login(email, password);
        setUser(result.data.user);
        setPassword('');
        setMessage(`Добро пожаловать, ${result.data.user.email}`);
      }
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Не удалось выполнить операцию');
    }
  }

  async function handleLogout() {
    await logout().catch(() => undefined);
    setUser(null);
    setEnrollments([]);
    setMessage('Вы вышли из аккаунта.');
  }

  async function toggleEnrollment(course: Course) {
    if (!user) {
      setMessage('Войдите в аккаунт, чтобы записаться на программу.');
      document.querySelector('#account')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    setBusyCourseId(course.id);
    setMessage('');
    const existing = enrollments.find((item) => item.courseId === course.id);
    try {
      if (existing) {
        await cancelEnrollment(course.id);
        setEnrollments((items) => items.filter((item) => item.courseId !== course.id));
        setMessage(`Запись на программу «${course.title}» отменена.`);
      } else {
        const result = await enrollInCourse(course.id);
        setEnrollments((items) => [result.data, ...items]);
        setMessage(`Вы записаны на программу «${course.title}».`);
      }
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Не удалось изменить запись');
    } finally {
      setBusyCourseId('');
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ПрофКурс — на главную">
          <span className="brand-mark">П</span>
          <span>ПрофКурс</span>
        </a>
        <nav className="topbar-nav" aria-label="Основная навигация">
          <a href="#catalog">Каталог</a>
          {user && <a href="#my-courses">Мои программы</a>}
          <a href="#monitoring">Состояние</a>
        </nav>
        {user ? (
          <div className="user-actions">
            <span className="user-pill">{user.email} · {user.role}</span>
            <button type="button" className="text-button" onClick={handleLogout}>Выйти</button>
          </div>
        ) : <div className="user-pill">Гостевой доступ</div>}
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Новая квалификация — в удобном формате</p>
            <h1>Курсы, вебинары и сертификаты для следующего шага в карьере</h1>
            <p className="hero-text">
              Выбирайте программы профессиональной переподготовки, проходите обучение
              онлайн или очно и подтверждайте компетенции официальным сертификатом.
            </p>
            <a className="primary-button" href="#catalog">Выбрать программу</a>
          </div>
          <div className="hero-card" aria-label="Показатели каталога">
            <span className="hero-card-label">Доступно сейчас</span>
            <strong>{courses.length}</strong>
            <span>программ · {totalHours} академических часов</span>
            <div className={`status-line status-${health}`}>
              <span className="status-dot" />
              API {health === 'online' ? 'работает' : health === 'offline' ? 'недоступен' : 'проверяется'}
            </div>
          </div>
        </section>

        {message && user && <p className="global-message" role="status">{message}</p>}

        <section className="catalog" id="catalog">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Каталог обучения</p>
              <h2>Программы переподготовки</h2>
            </div>
            <div className="filters">
              <label>
                <span className="sr-only">Поиск курса</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Поиск по названию"
                />
              </label>
              <label>
                <span className="sr-only">Формат обучения</span>
                <select value={format} onChange={(event) => setFormat(event.target.value)}>
                  <option value="">Все форматы</option>
                  <option value="online">Онлайн</option>
                  <option value="webinar">Вебинар</option>
                  <option value="mixed">Смешанный</option>
                </select>
              </label>
            </div>
          </div>

          {loading && <p className="empty-state">Загружаем программы…</p>}
          {!loading && courses.length === 0 && <p className="empty-state">Программы не найдены.</p>}
          <div className="course-grid">
            {courses.map((course) => (
              <article className="course-card" key={course.id}>
                <div className="course-meta">
                  <span>{course.category}</span>
                  <span>{formatLabels[course.format]}</span>
                </div>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-facts">
                  <span>{course.durationHours} ч.</span>
                  <span>{course.certificateIssued ? 'С сертификатом' : 'Без сертификата'}</span>
                </div>
                <div className="course-footer">
                  <strong>{course.price.toLocaleString('ru-RU')} BYN</strong>
                  {course.webinarUrl && <span className="webinar-badge">Вебинары</span>}
                </div>
                <div className="course-actions">
                  <button type="button" className="secondary-button" onClick={() => setSelectedCourse(course)}>Подробнее</button>
                  <button
                    type="button"
                    className="primary-button compact-button"
                    disabled={busyCourseId === course.id}
                    onClick={() => toggleEnrollment(course)}
                  >
                    {enrollments.some((item) => item.courseId === course.id) ? 'Отменить запись' : 'Записаться'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {user && (
          <section className="my-courses" id="my-courses">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Личный кабинет</p>
                <h2>Мои программы</h2>
              </div>
              <span className="enrollment-count">{enrollments.length} активных</span>
            </div>
            {enrollments.length === 0 ? (
              <p className="empty-state">Вы пока не записаны ни на одну программу.</p>
            ) : (
              <div className="enrollment-list">
                {enrollments.map((enrollment) => (
                  <article key={enrollment.id} className="enrollment-card">
                    <div>
                      <span>{enrollment.course.category}</span>
                      <h3>{enrollment.course.title}</h3>
                      <p>Запись от {new Date(enrollment.enrolledAt).toLocaleDateString('ru-RU')}</p>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => toggleEnrollment(enrollment.course)}>Отменить</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="service-grid" id="account">
          <div className="service-copy">
            <p className="eyebrow">Личный кабинет</p>
            <h2>{user ? 'Сессия активна' : 'Войдите или зарегистрируйтесь'}</h2>
            <p>
              Авторизация защищена JWT, пароли хешируются, а refresh-токен хранится
              в HttpOnly cookie. Состояние приложения контролируется круглосуточно.
            </p>
            <dl className="health-list">
              <div><dt>Backend</dt><dd>{health}</dd></div>
              <div><dt>Uptime процесса</dt><dd>{uptime} сек.</dd></div>
              <div><dt>Мониторинг</dt><dd>Prometheus + Grafana</dd></div>
            </dl>
          </div>

          {user ? (
            <div className="auth-card signed-in-card">
              <span className="profile-mark">{user.email.slice(0, 1).toUpperCase()}</span>
              <div>
                <p className="eyebrow">Профиль</p>
                <h3>{user.email}</h3>
                <p>Роль: {user.role} · активных программ: {enrollments.length}</p>
              </div>
              <a className="primary-button" href="#my-courses">Открыть мои программы</a>
              <button type="button" className="secondary-button" onClick={handleLogout}>Выйти</button>
            </div>
          ) : <form className="auth-card" onSubmit={submitAuth}>
            <div className="auth-tabs">
              <button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => setAuthMode('login')}>Вход</button>
              <button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => setAuthMode('register')}>Регистрация</button>
            </div>
            <label>
              Email
              <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              Пароль
              <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {authMode === 'register' && (
              <p className="password-hint">Минимум 8 символов: заглавная и строчная буквы, цифра и специальный символ.</p>
            )}
            <button className="primary-button" type="submit">
              {authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
            {message && <p className="form-message" role="status">{message}</p>}
          </form>}
        </section>

        <section className="monitoring-strip" id="monitoring">
          <span>Состояние платформы</span>
          <strong>API {health}</strong>
          <strong>Uptime {uptime} сек.</strong>
          <strong>Prometheus · Grafana · Loki</strong>
        </section>
      </main>

      {selectedCourse && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedCourse(null)}>
          <article className="course-modal" role="dialog" aria-modal="true" aria-labelledby="course-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" aria-label="Закрыть" onClick={() => setSelectedCourse(null)}>×</button>
            <p className="eyebrow">{selectedCourse.category}</p>
            <h2 id="course-title">{selectedCourse.title}</h2>
            <p>{selectedCourse.description}</p>
            <dl className="course-details">
              <div><dt>Формат</dt><dd>{formatLabels[selectedCourse.format]}</dd></div>
              <div><dt>Объём</dt><dd>{selectedCourse.durationHours} часов</dd></div>
              <div><dt>Документ</dt><dd>{selectedCourse.certificateIssued ? 'Сертификат' : 'Не предусмотрен'}</dd></div>
              <div><dt>Стоимость</dt><dd>{selectedCourse.price.toLocaleString('ru-RU')} BYN</dd></div>
            </dl>
            <button type="button" className="primary-button" onClick={() => { toggleEnrollment(selectedCourse); setSelectedCourse(null); }}>
              {enrollments.some((item) => item.courseId === selectedCourse.id) ? 'Отменить запись' : 'Записаться на программу'}
            </button>
          </article>
        </div>
      )}

      <footer>
        <span>ПрофКурс · платформа профессиональной переподготовки</span>
        <span>REST API · PostgreSQL · наблюдаемость 24/7</span>
      </footer>
    </div>
  );
}

export default App;

function validatePassword(value: string) {
  if (value.length < 8) return 'Пароль должен содержать минимум 8 символов.';
  if (!/[A-Z]/.test(value)) return 'Добавьте в пароль заглавную латинскую букву.';
  if (!/[a-z]/.test(value)) return 'Добавьте в пароль строчную латинскую букву.';
  if (!/[0-9]/.test(value)) return 'Добавьте в пароль цифру.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Добавьте в пароль специальный символ.';
  return '';
}
