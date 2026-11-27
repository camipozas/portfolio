'use client';

import { useEffect, useRef, useState } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Saves `value` 600 ms after it stops changing, only when it differs from what was saved. */
export function useAutosave<T>(
  value: T,
  save: (value: T) => Promise<void>,
  onSaved: () => void
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const saved = useRef(JSON.stringify(value));
  const latest = useRef({ save, onSaved });
  latest.current = { save, onSaved };

  useEffect(() => {
    const snapshot = JSON.stringify(value);
    if (snapshot === saved.current) {
      return;
    }
    setStatus('saving');
    const timer = setTimeout(() => {
      latest.current
        .save(value)
        .then(() => {
          saved.current = snapshot;
          setStatus('saved');
          latest.current.onSaved();
        })
        .catch(() => setStatus('error'));
    }, 600);
    return () => clearTimeout(timer);
  }, [value]);

  useEffect(() => {
    if (status !== 'saving') {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);

  return status;
}
