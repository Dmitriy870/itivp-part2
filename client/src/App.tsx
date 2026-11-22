import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation, useParams } from 'react-router';
import HomePage from './HomePage';
import SessionProvider from './SessionProvider';
import { useSession } from './sessionContext';

const CatalogPage = lazy(() => import('./courses/CatalogPage'));
const CourseDetailsPage = lazy(() => import('./courses/CourseDetailsPage'));
const CourseEditPage = lazy(() => import('./courses/CourseEditPage'));
const CourseComparisonPage = lazy(() => import('./courses/CourseComparisonPage'));
const WebinarSchedulePage = lazy(() => import('./webinars/WebinarSchedulePage'));
const WebinarRoomPage = lazy(() => import('./PublicPages').then(({ WebinarRoomPage }) => ({ default: WebinarRoomPage })));
const CertificateVerificationPage = lazy(() => import('./PublicPages')
  .then(({ CertificateVerificationPage }) => ({ default: CertificateVerificationPage })));

function RouteScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

function CourseLayout() {
  const { user } = useSession();
  return (
    <div className="page-shell">
      <header className="topbar">
        <Link className="brand" to="/"><span className="brand-mark">П</span>ПрофКурс</Link>
        <nav className="topbar-nav" aria-label="Основная навигация">
          <Link to="/courses">Каталог</Link>
          {user && <Link to="/courses/mine">Мои курсы</Link>}
          {user && <Link to="/#my-courses">Моё обучение</Link>}
        </nav>
        {user
          ? <Link className="user-pill" to="/#account">{user.email}</Link>
          : <Link className="user-pill" to="/#account">Войти</Link>}
      </header>
      <main className="route-main">
        <Suspense fallback={<p className="empty-state" role="status">Загружаем страницу…</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function RequireSession() {
  const { user, checking } = useSession();
  if (checking) return <p className="empty-state" role="status">Проверяем сессию…</p>;
  if (user) return <Outlet />;
  return (
    <section className="empty-state">
      <h1>Требуется вход</h1>
      <p>Управление курсами доступно после входа в аккаунт.</p>
      <Link className="primary-button" to="/#account">Войти</Link>
    </section>
  );
}

function CertificateRoute() {
  const { number = '' } = useParams();
  return <CertificateVerificationPage key={number} number={number} />;
}

function WebinarRoute() {
  const { id = '' } = useParams();
  return <WebinarRoomPage key={id} webinarId={id} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <RouteScroll />
        <Suspense fallback={<p className="empty-state" role="status">Загружаем страницу…</p>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/webinars/:id" element={<WebinarRoute />} />
            <Route path="/certificates/verify/:number" element={<CertificateRoute />} />
            <Route element={<CourseLayout />}>
              <Route path="/courses" element={<CatalogPage key="catalog" />} />
              <Route path="/courses/compare" element={<CourseComparisonPage />} />
              <Route path="/courses/:id" element={<CourseDetailsPage />} />
              <Route element={<RequireSession />}>
                <Route path="/courses/mine" element={<CatalogPage key="mine" mine />} />
                <Route path="/courses/new" element={<CourseEditPage />} />
                <Route path="/courses/:id/edit" element={<CourseEditPage />} />
                <Route path="/courses/:id/webinars" element={<WebinarSchedulePage />} />
              </Route>
              <Route path="*" element={<section className="empty-state"><h1>Страница не найдена</h1><Link to="/">На главную</Link></section>} />
            </Route>
          </Routes>
        </Suspense>
      </SessionProvider>
    </BrowserRouter>
  );
}
