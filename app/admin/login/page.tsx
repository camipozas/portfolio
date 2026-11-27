import { login } from '../actions';

export default async function LoginPage({
  searchParams,
}: PageProps<'/admin/login'>) {
  const { error } = await searchParams;
  return (
    <form action={login} className="mx-auto mt-24 flex max-w-xs flex-col gap-3">
      <h1 className="text-xl font-semibold">Backoffice</h1>
      <input
        autoComplete="username"
        className="border-border bg-background rounded-md border px-3 py-2"
        name="username"
        placeholder="Username"
        required
      />
      <input
        autoComplete="current-password"
        className="border-border bg-background rounded-md border px-3 py-2"
        name="password"
        placeholder="Password"
        required
        type="password"
      />
      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error === 'locked'
            ? 'Too many failed attempts. Try again in 15 minutes.'
            : 'Wrong username or password.'}
        </p>
      )}
      <button
        className="bg-foreground text-background rounded-md px-3 py-2"
        type="submit"
      >
        Sign in
      </button>
    </form>
  );
}
