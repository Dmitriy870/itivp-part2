import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  Course,
  User,
  getCourses,
  getHealth,
  login,
  register,
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

  useEffect(() => {
    getHealth()
      .then((result) => {
        setHealth(result.status === 'ok' ? 'online' : 'offline');
        setUptime(result.uptimeSeconds);
      })
      .catch(() => setHealth('offline'));
  }, []);

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

  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ПрофКурс — на главную">
          <span className="brand-mark">П</span>
          <span>ПрофКурс</span>
        </a>
        <nav className="topbar-nav" aria-label="Основная навигация">
          <a href="#catalog">Каталог</a>
          <a href="#monitoring">Состояние</a>
        </nav>
        <div className="user-pill">
          {user ? `${user.email} · ${user.role}` : 'Гостевой доступ'}
        </div>
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
              </article>
            ))}
          </div>
        </section>

        <section className="service-grid" id="monitoring">
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

          <form className="auth-card" onSubmit={submitAuth}>
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
            <button className="primary-button" type="submit">
              {authMode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
            {message && <p className="form-message" role="status">{message}</p>}
          </form>
        </section>
      </main>

      <footer>
        <span>ПрофКурс · платформа профессиональной переподготовки</span>
        <span>REST API · PostgreSQL · наблюдаемость 24/7</span>
      </footer>
    </div>
  );
}

export default App;
