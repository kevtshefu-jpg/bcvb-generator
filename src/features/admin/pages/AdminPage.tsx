import { useAuth } from "../../auth/context/AuthContext";

export function AdminPage() {
  const { availableDemoAccounts } = useAuth();

  return (
    <div className="member-page-stack">
      <section className="page-intro-card">
        <h2>Administration</h2>
        <p>
          Vue de pilotage pour les accès, les rôles et la future connexion à une base membre réelle.
        </p>
      </section>

      <section className="content-grid two">
        <article className="content-card">
          <h3>Accès intégrés à cette V2</h3>
          <div className="admin-table">
            <div className="admin-table__head">
              <span>Rôle</span>
              <span>Email</span>
              <span>Mot de passe</span>
            </div>
            {availableDemoAccounts.map((account) => (
              <div key={account.email} className="admin-table__row">
                <span>{account.role}</span>
                <code>{account.email}</code>
                <code>{account.password}</code>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card accent">
          <h3>Pour passer en prod réelle</h3>
          <ol>
            <li>Créer une base membre authentifiée.</li>
            <li>Stocker les rôles dans une table profils.</li>
            <li>Protéger les routes côté front et les données côté backend.</li>
            <li>Connecter la bibliothèque et les séances à la base cloud.</li>
          </ol>
        </article>
      </section>
    </div>
  );
}
