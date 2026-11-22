import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  ApiError, cancelEnrollment, deleteCourse, enrollInCourse, getCourse, getMyEnrollments, getUpcomingWebinars,
} from '../api';
import type { Course, Enrollment } from '../api';
import RequestError from '../RequestError';
import { useSession } from '../sessionContext';
import { useResource } from '../useResource';
import { formatWebinarDate } from '../webinars/webinarTime';
import { canManageCourse, formatLabels } from './courseFields';

function EnrollmentAction({ id }: { id: string }) {
  const load = useCallback(async (signal: AbortSignal) => (
    (await getMyEnrollments(signal)).data.find((item) => item.courseId === id) ?? null
  ), [id]);
  const { state, reload } = useResource(load);
  const [saved, setSaved] = useState<Enrollment | null>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();

  if (state.status === 'loading') return <p role="status">Проверяем запись…</p>;
  if (state.status === 'error') return <RequestError message="Не удалось проверить запись." error={state.error} retry={reload} />;
  const enrollment = saved === undefined ? state.data : saved;

  async function changeEnrollment() {
    setBusy(true);
    setError(undefined);
    try {
      if (enrollment?.status === 'active') {
        await cancelEnrollment(id);
        setSaved(null);
      } else {
        const result = await enrollInCourse(id);
        setSaved(result.data);
      }
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  if (enrollment?.status === 'completed') return <Link className="secondary-button" to="/#my-courses">Курс завершён · Моё обучение</Link>;
  return (
    <div className="enrollment-detail">
      <button type="button" className="primary-button" disabled={busy} onClick={changeEnrollment}>
        {busy ? 'Сохраняем…' : enrollment?.status === 'active' ? 'Отменить запись' : 'Записаться на курс'}
      </button>
      {enrollment?.status === 'active' && <Link className="secondary-button" to="/#my-courses">Перейти к обучению</Link>}
      {error !== undefined && <RequestError error={error} message="Не удалось изменить запись." />}
    </div>
  );
}

function ScheduledWebinars({ courseId }: { courseId: string }) {
  const load = useCallback((signal: AbortSignal) => getUpcomingWebinars(courseId, signal), [courseId]);
  const { state, reload } = useResource(load);
  return (
    <section className="route-section">
      <h2>Ближайшие вебинары курса</h2>
      {state.status === 'loading' && <p role="status">Загружаем расписание…</p>}
      {state.status === 'error' && <RequestError message="Не удалось загрузить расписание." error={state.error} retry={reload} />}
      {state.status === 'ready' && (state.data.data.length ? (
        <ul className="schedule-list">
          {state.data.data.map((webinar) => (
            <li key={webinar.id}>
              <div><Link to={`/webinars/${webinar.id}`}>{webinar.title}</Link>
                <span>{formatWebinarDate(webinar.scheduledAt)} · {webinar.durationMinutes} мин.</span></div>
            </li>
          ))}
        </ul>
      ) : <p className="empty-state">Ближайшие вебинары пока не запланированы.</p>)}
    </section>
  );
}

function CourseDetails({ course }: { course: Course }) {
  const { user, checking } = useSession();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<unknown>();

  async function remove() {
    setDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteCourse(course.id);
      navigate('/courses', { replace: true, state: { deletedTitle: course.title } });
    } catch (failure) {
      setDeleteError(failure);
      setDeleting(false);
    }
  }

  return (
    <>
      <Link className="back-link" to={course.published ? '/courses' : '/courses/mine'}>← К списку курсов</Link>
      <article className="course-detail">
        <p className="eyebrow">{course.category}{!course.published && ' · Черновик'}</p>
        <h1>{course.title}</h1>
        <p className="course-description">{course.description}</p>
        <dl className="course-details">
          <div><dt>Формат</dt><dd>{formatLabels[course.format]}</dd></div>
          <div><dt>Длительность</dt><dd>{course.durationHours} ч.</dd></div>
          <div><dt>Сертификат</dt><dd>{course.certificateIssued ? 'Предусмотрен' : 'Не предусмотрен'}</dd></div>
          <div><dt>Стоимость</dt><dd>{course.price.toLocaleString('ru-RU')} BYN</dd></div>
        </dl>
        {course.published && !checking && (user ? <EnrollmentAction key={user.id} id={course.id} />
          : <Link className="primary-button" to="/#account">Войти, чтобы записаться</Link>)}
        {canManageCourse(course, user) && (
          <div className="editor-actions">
            <Link className="secondary-button" to={`/courses/${course.id}/edit`}>Редактировать</Link>
            <Link className="secondary-button" to={`/courses/${course.id}/webinars`}>Управлять вебинарами</Link>
            {user?.role === 'admin' && !confirming && (
              <button type="button" className="danger-button" onClick={() => setConfirming(true)}>Удалить курс</button>
            )}
          </div>
        )}
        {user?.role === 'admin' && confirming && (
          <section className="delete-confirmation" aria-label="Подтверждение удаления">
            <p>Удалить курс вместе со связанными записями, занятиями, сертификатами и вебинарами?</p>
            {deleteError !== undefined && <RequestError error={deleteError} message="Не удалось удалить курс." />}
            <div className="editor-actions">
              <button type="button" className="danger-button" disabled={deleting} onClick={remove}>
                {deleting ? 'Удаляем…' : 'Да, удалить курс'}
              </button>
              <button type="button" className="secondary-button" disabled={deleting}
                onClick={() => { setConfirming(false); setDeleteError(undefined); }}>Отмена</button>
            </div>
          </section>
        )}
      </article>
      {course.published && <ScheduledWebinars courseId={course.id} />}
    </>
  );
}

export default function CourseDetailsPage() {
  const { id = '' } = useParams();
  const { user, checking } = useSession();
  const viewer = user?.id ?? 'guest';
  const load = useCallback((signal: AbortSignal) => getCourse(id, signal), [id]);
  const { state, reload } = useResource(load, !checking, viewer);
  if (state.status === 'loading') return <p className="empty-state" role="status">Загружаем курс…</p>;
  if (state.status === 'error') {
    const unavailable = state.error instanceof ApiError && [400, 404].includes(state.error.status);
    return (
      <>
        <Link className="back-link" to="/courses">← К каталогу</Link>
        {unavailable ? <h1 className="route-title">Курс не найден</h1>
          : <RequestError message="Не удалось загрузить курс." error={state.error} retry={reload} />}
      </>
    );
  }
  return <CourseDetails key={id} course={state.data.data} />;
}
