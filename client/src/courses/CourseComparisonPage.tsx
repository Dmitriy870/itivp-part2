import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ApiError, getCourse } from '../api';
import type { Course } from '../api';
import RequestError from '../RequestError';
import { useResource } from '../useResource';
import { formatLabels, MAX_COMPARED_COURSES } from './courseFields';

const rows: Array<{ label: string; text: (course: Course) => string }> = [
  { label: 'Категория', text: (course) => course.category },
  { label: 'Формат', text: (course) => formatLabels[course.format] },
  { label: 'Длительность', text: (course) => `${course.durationHours} ч.` },
  { label: 'Стоимость', text: (course) => `${course.price.toLocaleString('ru-RU')} BYN` },
  { label: 'Сертификат', text: (course) => course.certificateIssued ? 'Предусмотрен' : 'Не предусмотрен' },
];

export default function CourseComparisonPage() {
  const [params] = useSearchParams();
  const ids = params.getAll('id').filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  const selection = [...new Set(ids)].slice(0, MAX_COMPARED_COURSES).join(',');
  const enoughCourses = selection.includes(',');
  const load = useCallback(async (signal: AbortSignal) => {
    const results = await Promise.all(selection.split(',').map(async (id) => {
      try {
        const { data } = await getCourse(id, signal);
        return data.published ? data : null;
      } catch (error) {
        if (error instanceof ApiError && [400, 404].includes(error.status)) return null;
        throw error;
      }
    }));
    return results.filter((course): course is Course => course !== null);
  }, [selection]);
  const { state, reload } = useResource(load, enoughCourses);

  return (
    <>
      <Link className="back-link" to="/courses">← К каталогу</Link>
      <h1 className="route-title">Сравнение курсов</h1>
      {!enoughCourses && <p className="empty-state">Выберите два или три курса в каталоге.</p>}
      {enoughCourses && state.status === 'loading' && <p className="empty-state" role="status">Загружаем курсы…</p>}
      {state.status === 'error' && <RequestError error={state.error} message="Не удалось загрузить сравнение." retry={reload} />}
      {state.status === 'ready' && (state.data.length < 2 ? (
        <p className="empty-state">Некоторые курсы больше недоступны. Выберите другие в каталоге.</p>
      ) : (
        <div className="comparison-table-wrap" tabIndex={0} role="region" aria-label="Сравнение характеристик">
          <table className="comparison-table">
            <thead>
              <tr><th scope="col">Характеристика</th>{state.data.map((course) => (
                <th scope="col" key={course.id}><Link to={`/courses/${course.id}`}>{course.title}</Link></th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map(({ label, text }) => <tr key={label}>
                <th scope="row">{label}</th>{state.data.map((course) => <td key={course.id}>{text(course)}</td>)}
              </tr>)}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
