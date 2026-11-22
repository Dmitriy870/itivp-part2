import { useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { getCourses } from '../api';
import RequestError from '../RequestError';
import { useSession } from '../sessionContext';
import { useDebounce } from '../useDebounce';
import { useResource } from '../useResource';
import { formatLabels, MAX_COMPARED_COURSES } from './courseFields';

export default function CatalogPage({ mine = false }: { mine?: boolean }) {
  const { user } = useSession();
  const { state: navigationState } = useLocation();
  const deletedTitle = navigationState?.deletedTitle;
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState('');
  const [page, setPage] = useState(1);
  const [compared, setCompared] = useState<string[]>([]);
  const debouncedSearch = useDebounce(search.trim());
  const load = useCallback((signal: AbortSignal) => (
    getCourses(debouncedSearch, format, { page, mine, signal })
  ), [debouncedSearch, format, mine, page]);
  const { state, reload } = useResource(load, debouncedSearch === search.trim());

  function toggleComparison(id: string) {
    setCompared((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return current.length < MAX_COMPARED_COURSES ? [...current, id] : current;
    });
  }

  return (
    <>
      <div className="section-heading route-heading">
        <div>
          <h1>{mine ? 'Мои курсы' : 'Каталог курсов'}</h1>
          {mine && <p>Опубликованные программы и черновики, которые вы создали.</p>}
        </div>
        {user && <Link className="primary-button" to="/courses/new">Создать курс</Link>}
      </div>
      {!mine && compared.length > 0 && (
        <section className="comparison-bar" aria-label="Выбор для сравнения">
          <p role="status">Выбрано {compared.length} из {MAX_COMPARED_COURSES}.{compared.length === 1 && ' Выберите ещё один курс.'}</p>
          {compared.length >= 2 && <Link className="primary-button" to={{
            pathname: '/courses/compare',
            search: new URLSearchParams(compared.map((id) => ['id', id])).toString(),
          }}>Сравнить курсы</Link>}
          <button className="secondary-button" type="button" onClick={() => setCompared([])}>Сбросить выбор</button>
        </section>
      )}
      {typeof deletedTitle === 'string' && <p className="operation-status" role="status">Курс «{deletedTitle}» удалён.</p>}
      <div className="filters catalog-filters" aria-label="Фильтры каталога">
        <label>
          <span>Поиск по названию</span>
          <input type="search" value={search} maxLength={160}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
        </label>
        <label>
          <span>Формат обучения</span>
          <select value={format} onChange={(event) => { setFormat(event.target.value); setPage(1); }}>
            <option value="">Все форматы</option>
            {Object.entries(formatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>
      {state.status === 'loading' && <p className="empty-state" role="status">Загружаем курсы…</p>}
      {state.status === 'error' && <RequestError message="Не удалось загрузить каталог." error={state.error} retry={reload} />}
      {state.status === 'ready' && (
        <>
          {state.data.data.length === 0 && (
            <p className="empty-state" role="status">
              {mine && !search.trim() && !format ? 'Вы ещё не создали ни одного курса.' : 'По этим условиям курсы не найдены.'}
            </p>
          )}
          <div className="course-grid">
            {state.data.data.map((course) => (
              <article className="course-card catalog-card" key={course.id}>
                <div className="course-meta"><span>{course.category}</span><span>{formatLabels[course.format]}</span></div>
                <h2><Link to={`/courses/${course.id}`}>{course.title}</Link></h2>
                <p>{course.description}</p>
                <div className="course-facts">
                  <span>{course.durationHours} ч.</span>
                  <span>{course.certificateIssued ? 'С сертификатом' : 'Без сертификата'}</span>
                  {!course.published && <span>Черновик</span>}
                </div>
                <div className="course-footer">
                  <strong>{course.price.toLocaleString('ru-RU')} BYN</strong>
                  <Link className="secondary-button" to={`/courses/${course.id}`} aria-label={`Подробнее: ${course.title}`}>Подробнее</Link>
                </div>
                {!mine && (
                  <button type="button" className="comparison-toggle text-button" aria-pressed={compared.includes(course.id)}
                    aria-label={`К сравнению: ${course.title}`}
                    disabled={compared.length >= MAX_COMPARED_COURSES && !compared.includes(course.id)}
                    onClick={() => toggleComparison(course.id)}>
                    {compared.includes(course.id) ? '✓ Добавлен к сравнению' : '+ Добавить к сравнению'}
                  </button>
                )}
              </article>
            ))}
          </div>
          {(page > 1 || state.data.pagination.pages > 1) && (
            <nav className="catalog-pagination" aria-label="Страницы каталога">
              <button className="secondary-button" type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Назад</button>
              <span>Страница {page} из {Math.max(1, state.data.pagination.pages)}</span>
              <button className="secondary-button" type="button" disabled={page >= state.data.pagination.pages} onClick={() => setPage(page + 1)}>Далее</button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
