'use client';

import {
  Check,
  CloudUpload,
  LoaderCircle,
  LogOut,
  TriangleAlert,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import { logout, publish } from '@/app/admin/actions';
import type { SaveStatus } from './use-autosave';

interface PublishBarProps {
  title: React.ReactNode;
  pending: boolean;
  publishedAt?: string;
  saveStatus: SaveStatus;
  onPublished: () => void;
}

function since(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  const format = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  if (minutes < 60) {
    return format.format(-minutes, 'minute');
  }
  if (minutes < 60 * 24) {
    return format.format(-Math.round(minutes / 60), 'hour');
  }
  return format.format(-Math.round(minutes / 1440), 'day');
}

function publishState(pending: boolean, publishedAt?: string): string {
  if (pending) {
    return 'Hay cambios sin publicar';
  }
  if (publishedAt) {
    return `Publicado ${since(publishedAt)}`;
  }
  return 'Aún no hay nada publicado';
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Guardando…',
  saved: 'Cambios guardados',
  error: 'No se pudo guardar, reintenta',
};

export function PublishBar({
  title,
  pending,
  publishedAt,
  saveStatus,
  onPublished,
}: PublishBarProps) {
  const [publishing, startPublishing] = useTransition();
  const [message, setMessage] = useState('');

  const run = () =>
    startPublishing(async () => {
      try {
        const result = await publish();
        setMessage(
          `${result.photos} fotos en ${result.albums} álbumes publicadas${result.refreshed ? ', ya visibles en camipg.com/pictures' : '; el sitio las mostrará en menos de una hora'}`
        );
        onPublished();
      } catch (error) {
        setMessage(`No se pudo publicar: ${(error as Error).message}`);
      }
    });

  return (
    <header className="border-border bg-background/90 sticky top-0 z-20 -mx-6 mb-8 flex flex-wrap items-center gap-3 border-b px-6 py-3 backdrop-blur">
      <div className="mr-auto min-w-0">{title}</div>
      <p className="text-muted flex items-center gap-1 text-xs" role="status">
        {saveStatus === 'saving' && (
          <LoaderCircle className="animate-spin" size={14} />
        )}
        {saveStatus === 'saved' && <Check size={14} />}
        {saveStatus === 'error' && (
          <TriangleAlert className="text-red-500" size={14} />
        )}
        {SAVE_LABEL[saveStatus]}
      </p>
      <p className="text-muted text-xs">
        {message || publishState(pending, publishedAt)}
      </p>
      <button
        className="bg-accent flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
        disabled={!pending || publishing || saveStatus === 'saving'}
        onClick={run}
        type="button"
      >
        {publishing ? (
          <LoaderCircle className="animate-spin" size={16} />
        ) : (
          <CloudUpload size={16} />
        )}
        {publishing ? 'Publicando…' : 'Publicar'}
      </button>
      <form action={logout}>
        <button
          aria-label="Cerrar sesión"
          className="text-muted hover:bg-border hover:text-foreground rounded-full p-2"
          title="Cerrar sesión"
          type="submit"
        >
          <LogOut size={16} />
        </button>
      </form>
    </header>
  );
}
