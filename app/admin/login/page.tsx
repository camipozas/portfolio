import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const { error } = await searchParams;
  return (
    <form action={login} className="mx-auto mt-24 flex max-w-xs flex-col gap-3">
      <h1 className="text-xl font-semibold">Backoffice</h1>
      <input
        name="username"
        autoComplete="username"
        placeholder="Username"
        required
        className="rounded-md border border-border bg-background px-3 py-2"
      />
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        required
        className="rounded-md border border-border bg-background px-3 py-2"
      />
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error === "locked"
            ? "Too many failed attempts. Try again in 15 minutes."
            : "Wrong username or password."}
        </p>
      )}
      <button
        type="submit"
        className="rounded-md bg-foreground px-3 py-2 text-background"
      >
        Sign in
      </button>
    </form>
  );
}
