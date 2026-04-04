import { FormEvent, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, availableDemoAccounts } = useAuth();
  const [email, setEmail] = useState("kevin@bcvb.local");
  const [password, setPassword] = useState("BCVB2026!");
  const [error, setError] = useState<string>("");

  const redirectTo = useMemo(() => {
    return (location.state as { from?: string } | null)?.from || "/espace";
  }, [location.state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = login(email, password);
    if (!result.ok) {
      setError(result.message || "Connexion impossible.");
      return;
    }
    navigate(redirectTo, { replace: true });
  }

  return (
    <div className="login-page">
      <section className="login-hero">
        <div className="login-hero__badge">BCVB · Plateforme membres</div>
        <h1>Un accès limité aux membres pour piloter le référentiel, les séances et la vie basket du club.</h1>
        <p>
          Cette V2 premium part de ton générateur actuel et l’étend avec un espace membre,
          des rôles et une navigation club plus claire.
        </p>

        <div className="login-hero__grid">
          <article>
            <strong>Coachs</strong>
            <span>Générateur, situations, trames de séance, contenus terrain.</span>
          </article>
          <article>
            <strong>Dirigeants</strong>
            <span>Organisation, documents partagés, pilotage et suivi.</span>
          </article>
          <article>
            <strong>Admins</strong>
            <span>Vue complète, gouvernance, publication et arbitrage d’accès.</span>
          </article>
        </div>
      </section>

      <section className="login-card">
        <div className="login-card__header">
          <h2>Connexion membre</h2>
          <p>Version premium locale prête à brancher ensuite sur Supabase ou Firebase.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>

          <label>
            <span>Mot de passe</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </label>

          {error ? <div className="login-error">{error}</div> : null}

          <button type="submit" className="primary-button wide">
            Entrer dans l’espace membre
          </button>
        </form>

        <div className="demo-accounts">
          <div className="demo-accounts__title">Accès de démonstration intégrés</div>
          {availableDemoAccounts.map((account) => (
            <div key={account.email} className="demo-account-row">
              <span>{account.role}</span>
              <code>{account.email}</code>
              <code>{account.password}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
