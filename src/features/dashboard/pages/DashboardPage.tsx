import { MetricCard } from "../../shared/components/MetricCard";
import { useAuth } from "../../auth/context/AuthContext";

const priorities = [
  "Structurer une base commune pour les coachs du club.",
  "Produire des séances lisibles rapidement sur le terrain.",
  "Centraliser le référentiel, les situations et les documents utiles.",
  "Donner un accès différencié selon les besoins des membres."
];

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="member-page-stack">
      <section className="premium-hero">
        <div>
          <div className="premium-hero__eyebrow">V2 premium</div>
          <h2>Bonjour {user?.fullName}, ton site BCVB évolue en vraie plateforme membres.</h2>
          <p>
            Cette version repose sur ton générateur actuel, avec une couche club plus claire,
            une navigation métier et une porte d’entrée limitée aux membres autorisés.
          </p>
        </div>
        <div className="premium-hero__panel">
          <div className="premium-hero__panel-title">Priorités BCVB</div>
          <ul>
            {priorities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Référentiel" value="Centralisé" hint="catégories, thèmes et situations" />
        <MetricCard label="Générateur" value="Actif" hint="diagrammes et fiches terrain" />
        <MetricCard label="Accès" value="Protégé" hint="connexion requise pour l’espace membre" />
        <MetricCard label="Rôle courant" value={user?.role || "membre"} hint="vue adaptée au profil" />
      </section>

      <section className="content-grid two">
        <article className="content-card">
          <h3>Ce que cette V2 apporte</h3>
          <ul>
            <li>Accueil public et espace membre distincts.</li>
            <li>Connexion locale prête à être reliée à un vrai backend.</li>
            <li>Navigation premium pour le générateur, la bibliothèque et le club.</li>
            <li>Base de travail cohérente pour une future version coach / admin / parent.</li>
          </ul>
        </article>

        <article className="content-card accent">
          <h3>Étapes suivantes recommandées</h3>
          <ul>
            <li>Brancher Supabase Auth et une vraie table des membres.</li>
            <li>Rendre la bibliothèque réellement alimentée par tes PDF et contenus BCVB.</li>
            <li>Connecter les séances à une base cloud partagée.</li>
            <li>Ajouter un panneau administration des accès.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
