import { useCallback, useEffect, useState } from 'react';

type Loader<T> = (signal: AbortSignal) => Promise<T>;
type Result<T> = { status: 'ready'; data: T } | { status: 'error'; error: unknown };

export function useResource<T>(load: Loader<T>, enabled = true, scope?: string) {
  const [version, setVersion] = useState(0);
  const [settled, setSettled] = useState<{ load: Loader<T>; version: number; scope?: string; result: Result<T> }>();

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setSettled({ load, version, scope, result: { status: 'ready', data } }); },
      (error: unknown) => { if (!controller.signal.aborted) setSettled({ load, version, scope, result: { status: 'error', error } }); },
    );
    return () => controller.abort();
  }, [load, version, enabled, scope]);

  const state = enabled && settled?.load === load && settled.version === version && settled.scope === scope
    ? settled.result
    : { status: 'loading' as const };
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { state, reload };
}
