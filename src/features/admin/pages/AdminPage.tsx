import { useAuth } from "../../auth/context/AuthContext";

export default function AdminPage() {
  const { profile } = useAuth();

  return (
    <div className="member-page-stack">
      <section className="page-intro-card">
        <h2>Administration</h2>
        <p>
          Vue de pilotage pour les accès, les rôles et la gestion des comptes Supabase.
        </p>
      </section>

      <section className="content-grid two">
        <article className="content-card">
          <h3>Profil courant</h3>
          <div className="admin-info">
            <p><strong>Email:</strong> {profile?.email}</p>
            <p><strong>Nom:</strong> {profile?.full_name || 'Non renseigné'}</p>
            <p><strong>Rôle:</strong> {profile?.role}</p>
            <p><strong>Statut:</strong> {profile?.is_active ? 'Actif' : 'Inactif'}</p>
          </div>
        </article>

        <article className="content-card accent">
          <h3>Pour passer en prod réelle</h3>
          <ol>
            <li>Créer une base membre authentifiée via Supabase.</li>
            <li>Stocker les rôles dans une table profils.</li>
            <li>Protéger les routes côté front et les données côté backend.</li>
            <li>Connecter la bibliothèque et les séances à la base cloud.</li>
          </ol>
        </article>
      </section>
    </div>
  );
}
