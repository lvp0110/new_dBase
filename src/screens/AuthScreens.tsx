import { useState, type FormEvent, type ReactNode } from "react";
import { loginUser, type SessionUser } from "../lib/auth.ts";

type LoginProps = {
  onLoggedIn: (user: SessionUser) => void;
};

export function LoginScreen({ onLoggedIn }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    const result = await loginUser({ email, password });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onLoggedIn(result.user);
  }

  return (
    <AuthLayout title="Вход" lead="Войдите, чтобы открыть портал">
      <form className="form" onSubmit={onSubmit} data-testid="login-form">
        <label>
          Почта
          <span className="field">
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </span>
        </label>
        <label>
          Пароль
          <span className="field">
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </span>
        </label>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="primary" disabled={pending}>
          {pending ? "Вход…" : "Войти"}
        </button>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main className="auth">
      <section className="auth-intro">
        <h1 className="auth-title">
          <span
            className="portal-tip"
            tabIndex={0}
            data-hint="разрыв в пространстве-времени, искусственного или естественного происхождения, позволяющий информации мгновенно перемещаться между двумя точками пространства или времени"
          >
            Портал dBase
          </span>
        </h1>
        <p>{lead}</p>
      </section>
      <section className="card">
        <h2>{title}</h2>
        {children}
      </section>
    </main>
  );
}
