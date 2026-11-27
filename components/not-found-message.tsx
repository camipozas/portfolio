export function NotFoundMessage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="text-lg font-medium">404 — Page not found</h1>
      <p className="text-muted text-sm">
        <a className="accent-link" href="/">
          camipg.com
        </a>{' '}
        ·{' '}
        <a className="accent-link" href="/es" lang="es">
          Página no encontrada — ir al inicio
        </a>
      </p>
    </main>
  );
}
