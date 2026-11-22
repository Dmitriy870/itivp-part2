import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  VerifiedCertificate,
  ApiError,
  getWebinar,
  verifyCertificate,
} from './api';
import RequestError from './RequestError';
import { useResource } from './useResource';
import { formatWebinarDate, webinarWindow } from './webinars/webinarTime';

function PublicHeader() {
  return (
    <header className="public-header">
      <Link className="brand" to="/" aria-label="ПрофКурс — на главную">
        <span className="brand-mark">П</span>
        <span>ПрофКурс</span>
      </Link>
      <Link className="back-link" to="/">← Вернуться на платформу</Link>
    </header>
  );
}

export function CertificateVerificationPage({ number }: { number: string }) {
  const [certificate, setCertificate] = useState<VerifiedCertificate | null>(null);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

  useEffect(() => {
    verifyCertificate(number)
      .then((result) => {
        setCertificate(result.data);
        setStatus('valid');
      })
      .catch(() => setStatus('invalid'));
  }, [number]);

  return (
    <div className="public-page">
      <PublicHeader />
      <main className="verification-main">
        {status === 'loading' && <p className="public-loading">Проверяем сертификат…</p>}
        {status === 'valid' && certificate && (
          <section className="verification-card valid-card">
            <div className="verification-status"><span>✓</span><strong>Сертификат действителен</strong></div>
            <p className="eyebrow">Официальное подтверждение квалификации</p>
            <h1>{certificate.courseTitle}</h1>
            <p className="verification-lead">
              Платформа «ПрофКурс» подтверждает успешное завершение программы профессиональной переподготовки.
            </p>
            <dl className="verification-details">
              <div><dt>Слушатель</dt><dd>{certificate.studentEmail}</dd></div>
              <div><dt>Номер сертификата</dt><dd>{certificate.number}</dd></div>
              <div><dt>Дата выдачи</dt><dd>{new Date(certificate.issuedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
              <div><dt>Статус</dt><dd>Действителен</dd></div>
            </dl>
            <p className="verification-note">Данные получены непосредственно из реестра сертификатов платформы.</p>
          </section>
        )}
        {status === 'invalid' && (
          <section className="verification-card invalid-card">
            <div className="verification-status"><span>×</span><strong>Сертификат не найден</strong></div>
            <h1>Не удалось подтвердить подлинность</h1>
            <p className="verification-lead">Проверьте номер сертификата или запросите корректную ссылку у владельца.</p>
            <code>{number}</code>
            <a className="primary-button" href="/">Вернуться на платформу</a>
          </section>
        )}
      </main>
    </div>
  );
}

export function WebinarRoomPage({ webinarId }: { webinarId: string }) {
  const load = useCallback((signal: AbortSignal) => getWebinar(webinarId, signal), [webinarId]);
  const { state, reload } = useResource(load);
  const [now, setNow] = useState(Date.now);
  const webinar = state.status === 'ready' ? state.data.data : undefined;
  const timing = webinar && webinarWindow(webinar.scheduledAt, webinar.durationMinutes);
  const opensAt = timing?.opensAt;
  const endsAt = timing?.endsAt;
  const hasMeetingLink = Boolean(webinar?.meetingUrl);

  useEffect(() => {
    if (opensAt === undefined || endsAt === undefined) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (!hasMeetingLink && current >= opensAt && current < endsAt) reload();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [opensAt, endsAt, hasMeetingLink, reload]);

  if (!webinar || !timing) {
    const missing = state.status === 'error' && state.error instanceof ApiError && [400, 404].includes(state.error.status);
    return <div className="public-page"><PublicHeader /><main className="verification-main">
      {state.status === 'loading' && <p className="public-loading" role="status">Открываем комнату вебинара…</p>}
      {missing && <section className="verification-card invalid-card">
        <h1>Вебинар не найден</h1>
        <p className="verification-lead">Возможно, вебинар отменён.</p>
        <Link className="primary-button" to="/#webinars">Посмотреть расписание</Link>
      </section>}
      {state.status === 'error' && !missing && <RequestError error={state.error} message="Не удалось открыть вебинар." retry={reload} />}
    </main></div>;
  }

  const joinUrl = webinar.meetingUrl?.startsWith('https://') && now < timing.endsAt ? webinar.meetingUrl : null;
  const ended = now >= timing.endsAt;
  const stageTitle = ended ? 'Эфир завершён' : joinUrl ? 'Можно подключиться' : 'Эфир ещё не начался';

  return (
    <div className="public-page webinar-room-page">
      <PublicHeader />
      <main className="webinar-room-main">
        <section className="webinar-room-hero">
          <div>
            <p className="eyebrow">Комната прямого эфира</p>
            <h1>{webinar.title}</h1>
            <p><Link to={`/courses/${webinar.courseId}`}>{webinar.courseTitle}</Link></p>
          </div>
          <div className="broadcast-state"><span />{ended ? 'Завершён' : joinUrl ? 'Комната открыта' : 'Запланирован'}</div>
        </section>
        <section className="webinar-stage">
          <div className="stage-placeholder">
            <span className="play-mark">▶</span>
            <h2>{stageTitle}</h2>
            {joinUrl && <p>Эфир откроется на площадке организатора.</p>}
            {!joinUrl && !ended && <p>Ссылка откроется за 10 минут до начала.</p>}
          </div>
          <aside className="webinar-sidebar">
            <p className="eyebrow">Когда</p>
            <strong>{formatWebinarDate(webinar.scheduledAt)}</strong>
            <span>{webinar.durationMinutes} минут</span>
            {joinUrl && <a className="primary-button" href={joinUrl} target="_blank" rel="noreferrer">Подключиться к эфиру</a>}
            {!joinUrl && !ended && <button className="secondary-button" type="button" onClick={reload}>Обновить статус</button>}
          </aside>
        </section>
      </main>
    </div>
  );
}
