import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { getCourse, saveCourse } from '../api';
import type { CourseInput } from '../api';
import RequestError from '../RequestError';
import { useSession } from '../sessionContext';
import { useResource } from '../useResource';
import { canManageCourse, formatLabels } from './courseFields';

const blankCourse: CourseInput = {
  title: '', description: '', category: '', format: 'online', durationHours: 1, price: 0,
  certificateIssued: true, webinarUrl: null, published: false,
};

function CourseForm({ id, initial = blankCourse }: { id?: string; initial?: CourseInput }) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const returnTo = id ? `/courses/${id}` : '/courses/mine';

  function setField<K extends keyof CourseInput>(field: K, value: CourseInput[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const result = await saveCourse({
        title: draft.title.trim(), description: draft.description.trim(), category: draft.category.trim(),
        format: draft.format, durationHours: draft.durationHours, price: draft.price,
        certificateIssued: draft.certificateIssued, webinarUrl: draft.webinarUrl?.trim() || null,
        published: draft.published,
      }, id);
      navigate(`/courses/${result.data.id}`, { replace: true });
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Link className="back-link" to={returnTo}>{id ? '← К курсу' : '← Мои курсы'}</Link>
      <h1 className="route-title">{id ? 'Редактирование курса' : 'Создание курса'}</h1>
      <form className="editor" onSubmit={submit}>
        <fieldset disabled={busy} className="editor-fields">
          <label className="full-field">Название
            <input required minLength={3} maxLength={160} value={draft.title}
              onChange={(event) => setField('title', event.target.value)} />
          </label>
          <label className="full-field">Описание
            <textarea required minLength={10} maxLength={5000} rows={6} value={draft.description}
              onChange={(event) => setField('description', event.target.value)} />
          </label>
          <label>Категория
            <input required minLength={2} maxLength={80} value={draft.category}
              onChange={(event) => setField('category', event.target.value)} />
          </label>
          <label>Формат
            <select value={draft.format} onChange={(event) => setField('format', event.target.value as CourseInput['format'])}>
              {Object.entries(formatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label>Длительность, ч.
            <input type="number" required min={1} max={10000} value={draft.durationHours || ''}
              onChange={(event) => setField('durationHours', event.target.valueAsNumber)} />
          </label>
          <label>Цена, BYN
            <input type="number" required min={0} max={99999999} step=".01"
              value={Number.isNaN(draft.price) ? '' : draft.price}
              onChange={(event) => setField('price', event.target.valueAsNumber)} />
          </label>
          <label className="full-field">Страница вебинаров курса (HTTPS, необязательное поле)
            <input type="url" pattern="https://.+" maxLength={500} value={draft.webinarUrl ?? ''}
              onChange={(event) => setField('webinarUrl', event.target.value || null)} />
          </label>
          <label className="editor-check"><input type="checkbox" checked={draft.certificateIssued}
            onChange={(event) => setField('certificateIssued', event.target.checked)} /> Выдавать сертификат</label>
          <label className="editor-check"><input type="checkbox" checked={draft.published}
            onChange={(event) => setField('published', event.target.checked)} /> Опубликовать в каталоге</label>
        </fieldset>
        {error !== undefined && <RequestError error={error} message="Не удалось сохранить курс." />}
        <div className="editor-actions">
          <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить курс'}</button>
          <Link className="secondary-button" to={returnTo}>Отмена</Link>
        </div>
      </form>
    </>
  );
}

function EditExistingCourse({ id }: { id: string }) {
  const { user } = useSession();
  const load = useCallback((signal: AbortSignal) => getCourse(id, signal), [id]);
  const { state, reload } = useResource(load);
  if (state.status === 'loading') return <p className="empty-state" role="status">Загружаем курс…</p>;
  if (state.status === 'error') return <RequestError error={state.error} message="Не удалось загрузить курс." retry={reload} />;
  if (!canManageCourse(state.data.data, user)) {
    return <p className="empty-state" role="alert">Редактировать курс может только автор или администратор.</p>;
  }
  return <CourseForm id={id} initial={state.data.data} />;
}

export default function CourseEditPage() {
  const { id } = useParams();
  return id ? <EditExistingCourse key={id} id={id} /> : <CourseForm />;
}
