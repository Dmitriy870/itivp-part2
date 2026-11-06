import { useEffect, useState } from 'react';
import {
  VerifiedCertificate,
  Webinar,
  getUpcomingWebinars,
  verifyCertificate,
} from './api';

function PublicHeader() {
  return (
    <header className="public-header">
      <a className="brand" href="/" aria-label="ПрофКурс — на главную">
        <span className="brand-mark">П</span>
        <span>ПрофКурс</span>
      </a>
      <a className="back-link" href="/">← Вернуться на платформу</a>
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
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [roomIsOpen, setRoomIsOpen] = useState(false);

  useEffect(() => {
    getUpcomingWebinars()
      .then((result) => {
        const found = result.data.find((item) => item.id === webinarId) || null;
        setWebinar(found);
        setStatus(found ? 'ready' : 'missing');
      })
      .catch(() => setStatus('missing'));
  }, [webinarId]);

  useEffect(() => {
    if (!webinar) return undefined;
    const opensAt = new Date(webinar.scheduledAt).getTime() - (10 * 60 * 1000);
    const updateRoomState = () => setRoomIsOpen(Date.now() >= opensAt);
    updateRoomState();
    const timer = window.setInterval(updateRoomState, 30_000);
    return () => window.clearInterval(timer);
  }, [webinar]);

  if (status === 'loading') {
    return <div className="public-page"><PublicHeader /><main className="verification-main"><p className="public-loading">Открываем комнату вебинара…</p></main></div>;
  }

  if (status === 'missing' || !webinar) {
    return (
      <div className="public-page">
        <PublicHeader />
        <main className="verification-main">
          <section className="verification-card invalid-card">
            <div className="verification-status"><span>×</span><strong>Вебинар не найден</strong></div>
            <h1>Событие недоступно</h1>
            <p className="verification-lead">Возможно, вебинар был перенесён или завершён.</p>
            <a className="primary-button" href="/#webinars">Посмотреть расписание</a>
          </section>
        </main>
      </div>
    );
  }

  const scheduledAt = new Date(webinar.scheduledAt);

  return (
    <div className="public-page webinar-room-page">
      <PublicHeader />
      <main className="webinar-room-main">
        <section className="webinar-room-hero">
          <div>
            <p className="eyebrow">Комната прямого эфира</p>
            <h1>{webinar.title}</h1>
            <p>{webinar.courseTitle}</p>
          </div>
          <div className="broadcast-state"><span />{roomIsOpen ? 'Комната открыта' : 'Запланирован'}</div>
        </section>
        <section className="webinar-stage">
          <div className="stage-placeholder">
            <span className="play-mark">▶</span>
            <h2>{roomIsOpen ? 'Эфир готов к запуску' : 'Эфир ещё не начался'}</h2>
            <p>{roomIsOpen ? 'Это демонстрационная комната вебинара.' : 'Комната откроется за 10 минут до начала.'}</p>
          </div>
          <aside className="webinar-sidebar">
            <p className="eyebrow">Когда</p>
            <strong>{scheduledAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
            <span>{scheduledAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} · {webinar.durationMinutes} минут</span>
            <hr />
            <p className="eyebrow">В программе</p>
            <ol>
              <li>Ключевые понятия и актуальные практики</li>
              <li>Разбор профессионального кейса</li>
              <li>Ответы на вопросы слушателей</li>
            </ol>
            <button className="primary-button" type="button" disabled={!roomIsOpen}>{roomIsOpen ? 'Подключиться к эфиру' : 'Ожидаем начало'}</button>
          </aside>
        </section>
      </main>
    </div>
  );
}
