import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { deleteWebinar, getCourse, getManagedWebinars, saveWebinar } from '../api';
import type { Webinar } from '../api';
import RequestError from '../RequestError';
import { useResource } from '../useResource';
import { formatWebinarDate, toLocalDateTime } from './webinarTime';

function WebinarEditor({ courseId, webinar, close, onSaved }: {
  courseId: string; webinar?: Webinar; close: () => void; onSaved: () => void;
}) {
  const [title, setTitle] = useState(webinar?.title ?? '');
  const [scheduledAt, setScheduledAt] = useState(webinar ? toLocalDateTime(webinar.scheduledAt) : '');
  const [duration, setDuration] = useState(webinar?.durationMinutes ?? 60);
  const [url, setUrl] = useState(webinar?.meetingUrl ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const date = webinar && scheduledAt === toLocalDateTime(webinar.scheduledAt)
        ? webinar.scheduledAt
        : new Date(scheduledAt).toISOString();
      await saveWebinar(courseId, {
        title: title.trim(), scheduledAt: date, durationMinutes: duration, meetingUrl: url.trim(),
      }, webinar?.id);
      onSaved();
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="editor" onSubmit={submit}>
      <h2>{webinar ? 'Изменить вебинар' : 'Новый вебинар'}</h2>
      <fieldset className="editor-fields" disabled={busy}>
        <label className="full-field">Название
          <input required minLength={3} maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>День и время начала
          <input type="datetime-local" required value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
          <small>Часовой пояс: {Intl.DateTimeFormat().resolvedOptions().timeZone}</small>
        </label>
        <label>Длительность, мин.
          <input type="number" required min={15} max={480} value={duration || ''}
            onChange={(event) => setDuration(event.target.valueAsNumber)} />
        </label>
        <label className="full-field">Ссылка на эфир (HTTPS)
          <input type="url" required pattern="https://.+" maxLength={500} value={url} onChange={(event) => setUrl(event.target.value)} />
        </label>
      </fieldset>
      {error !== undefined && <RequestError error={error} message="Не удалось сохранить вебинар." />}
      <div className="editor-actions">
        <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить вебинар'}</button>
        <button type="button" className="secondary-button" disabled={busy} onClick={close}>Отмена</button>
      </div>
    </form>
  );
}

function WebinarSchedule({ id }: { id: string }) {
  const load = useCallback((signal: AbortSignal) => Promise.all([
    getManagedWebinars(id, signal), getCourse(id, signal),
  ]), [id]);
  const { state, reload } = useResource(load);
  const [editing, setEditing] = useState<Webinar | 'new' | null>(null);
  const [cancelling, setCancelling] = useState<string>();
  const [cancelPending, setCancelPending] = useState(false);
  const [cancelError, setCancelError] = useState<unknown>();
  const [notice, setNotice] = useState('');

  async function remove(webinar: Webinar) {
    setCancelPending(true);
    setCancelError(undefined);
    try {
      await deleteWebinar(id, webinar.id);
      setNotice(`Вебинар «${webinar.title}» отменён.`);
      setCancelling(undefined);
      reload();
    } catch (failure) {
      setCancelError(failure);
    } finally {
      setCancelPending(false);
    }
  }

  return (
    <>
      <Link className="back-link" to={`/courses/${id}`}>← К курсу</Link>
      <div className="section-heading route-heading">
        <div>
          <h1>Расписание вебинаров</h1>
          {state.status === 'ready' && <p>{state.data[1].data.title}</p>}
        </div>
        {state.status === 'ready' && !editing && <button type="button" className="primary-button"
          disabled={Boolean(cancelling)} onClick={() => { setNotice(''); setEditing('new'); }}>Запланировать вебинар</button>}
      </div>
      {notice && <p className="operation-status" role="status">{notice}</p>}
      {state.status === 'loading' && <p className="empty-state" role="status">Загружаем расписание…</p>}
      {state.status === 'error' && <RequestError message="Не удалось открыть расписание." error={state.error} retry={reload} />}
      {state.status === 'ready' && editing && (
        <WebinarEditor key={editing === 'new' ? 'new' : editing.id} courseId={id}
          webinar={editing === 'new' ? undefined : editing} close={() => setEditing(null)}
          onSaved={() => { setEditing(null); setNotice('Вебинар сохранён.'); reload(); }} />
      )}
      {state.status === 'ready' && (
        state.data[0].data.length ? (
          <ul className="schedule-list">
            {state.data[0].data.map((webinar) => (
              <li key={webinar.id}>
                <div>
                  <strong>{webinar.title}</strong>
                  <span>{formatWebinarDate(webinar.scheduledAt)} · {webinar.durationMinutes} мин.</span>
                  {state.data[1].data.published && <Link to={`/webinars/${webinar.id}`}>Открыть комнату</Link>}
                </div>
                {cancelling === webinar.id ? (
                  <div className="webinar-confirm">
                    <p>Отменить этот вебинар?</p>
                    {cancelError !== undefined && <RequestError error={cancelError} message="Не удалось отменить вебинар." />}
                    <div className="editor-actions">
                      <button type="button" className="danger-button" disabled={cancelPending}
                        onClick={() => remove(webinar)}>{cancelPending ? 'Отменяем…' : 'Да, отменить вебинар'}</button>
                      <button type="button" className="secondary-button" disabled={cancelPending}
                        onClick={() => { setCancelling(undefined); setCancelError(undefined); }}>Назад</button>
                    </div>
                  </div>
                ) : (
                  <div className="editor-actions">
                    <button type="button" className="secondary-button" disabled={Boolean(editing || cancelling)}
                      onClick={() => { setNotice(''); setEditing(webinar); }}>Редактировать</button>
                    <button type="button" className="danger-button" disabled={Boolean(editing || cancelling)}
                      onClick={() => { setNotice(''); setCancelling(webinar.id); }}>Отменить вебинар</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : <p className="empty-state">У курса пока нет вебинаров.</p>
      )}
    </>
  );
}

export default function WebinarSchedulePage() {
  const { id = '' } = useParams();
  return <WebinarSchedule key={id} id={id} />;
}
