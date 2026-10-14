import { useState, type FormEvent, type ReactNode } from "react";
import { listRoles, loginUser, registerUser } from "../lib/storage.ts";

type RegisterProps = {
  onRegistered: () => void;
  onShowLogin: () => void;
};

export function RegisterScreen({
  onRegistered,
  onShowLogin,
}: RegisterProps) {
  const roles = listRoles();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const selected = roles.find((role) => role.id === roleId);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== passwordAgain) {
      setError("Пароли не совпадают.");
      return;
    }
    setPending(true);
    const result = await registerUser({ name, email, password, roleId });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onRegistered();
  }

  return (
    <AuthLayout
      title="Регистрация"
      lead="Сначала создайте учётную запись и выберите роль. После этого войдите."
    >
      <form className="form" onSubmit={onSubmit} data-testid="register-form">
        <label>
          Имя
          <input
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
            />
          </span>
        </label>
        <label>
          Пароль ещё раз
          <span className="field">
            <input
              name="passwordAgain"
              type="password"
              autoComplete="new-password"
              value={passwordAgain}
              onChange={(event) => setPasswordAgain(event.target.value)}
              required
              minLength={6}
            />
          </span>
        </label>
        <label>
          Роль
          <span className="field">
            <select
              name="role"
              value={roleId}
              onChange={(event) => setRoleId(event.target.value)}
              required
            >
              <option value="">Выберите роль</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.title}
                </option>
              ))}
            </select>
          </span>
        </label>
        {selected ? <p className="hint">{selected.summary}</p> : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="primary" disabled={pending}>
          Создать учётную запись
        </button>
        <button type="button" className="text-button" onClick={onShowLogin}>
          Уже есть учётная запись? Войти
        </button>
      </form>
    </AuthLayout>
  );
}

type LoginProps = {
  notice: string;
  onLoggedIn: () => void;
  onShowRegister: () => void;
};

export function LoginScreen({
  notice,
  onLoggedIn,
  onShowRegister,
}: LoginProps) {
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
    onLoggedIn();
  }

  return (
    <AuthLayout
      title="Вход"
      lead="Войдите, чтобы открыть приложения"
    >
      <form className="form" onSubmit={onSubmit} data-testid="login-form">
        {notice ? <p className="notice">{notice}</p> : null}
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
          Войти
        </button>
        <button type="button" className="text-button" onClick={onShowRegister}>
          Нет учётной записи? Регистрация
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
        <h1>Портал приложений dBase</h1>
        <p>{lead}</p>
      </section>
      <section className="card">
        <h2>{title}</h2>
        {children}
      </section>
    </main>
  );
}
