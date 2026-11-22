import { ApiError } from './api';

export default function RequestError({ error, message, retry }: {
  error: unknown; message: string; retry?: () => void;
}) {
  return (
    <div className="request-error" role="alert">
      <p>{error instanceof ApiError ? error.message : message}</p>
      {error instanceof ApiError && error.details.length > 0 && (
        <ul>{error.details.map(({ field, message }, index) => <li key={`${field}-${index}`}>{message}</li>)}</ul>
      )}
      {retry && <button className="secondary-button" type="button" onClick={retry}>Повторить</button>}
    </div>
  );
}
