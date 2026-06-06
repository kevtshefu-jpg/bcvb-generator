import { Link } from "react-router-dom";
import type { AdminPlatformConfig } from "../../types/admin";
import { SITE_CATEGORIES } from "../../config/siteCategories.js";

type PlatformSecurityPanelProps = {
  config: AdminPlatformConfig;
};

const guardrails = [
  {
    title: "Création documentaire",
    status: "Admin uniquement",
    text: "Studio éditorial, publication, OCR et contrôle qualité renforcé restent verrouillés.",
  },
  {
    title: "Coachs",
    status: "Terrain autorisé",
    text: "Séances, planifications, effectifs, présences et évaluations sont disponibles sans accès admin.",
  },
  {
    title: "Dirigeants",
    status: "Pilotage",
    text: "Documents cadres, équipes, indicateurs et commission sportive sans réglages sensibles.",
  },
  {
    title: "Parents référents",
    status: "Périmètre limité",
    text: "Logistique, communication, présences utiles, événements et aide organisationnelle.",
  },
];

export default function PlatformSecurityPanel({ config }: PlatformSecurityPanelProps) {
  const activeSeason = config.seasons.find((season) => season.active);
  const enabledReferentials = config.referentials.filter((referential) => referential.enabled).length;

  return (
    <section className="admin-settings-panel">
      <div className="admin-settings-panel__head">
        <div>
          <p>Critique</p>
          <h2>Sécurité plateforme et configuration centrale</h2>
          <span>Préparer les futures policies Supabase, les accès par équipe, catégorie, saison et module.</span>
        </div>
        <strong>{activeSeason?.label ?? "Saison non définie"}</strong>
      </div>

      <div className="admin-security-grid">
        {guardrails.map((guardrail) => (
          <article key={guardrail.title}>
            <span>{guardrail.status}</span>
            <h3>{guardrail.title}</h3>
            <p>{guardrail.text}</p>
          </article>
        ))}
      </div>

      <div className="admin-security-roadmap">
        <article>
          <h3>Accès fins à prévoir</h3>
          <ul>
            <li>team_id pour limiter les coachs à leurs équipes.</li>
            <li>category_id pour filtrer documents, séances, effectifs et planifications.</li>
            <li>season_id pour historiser les saisons sportives.</li>
            <li>Policies Supabase alignées sur les permissions déclarées.</li>
          </ul>
        </article>
        <article>
          <h3>État de configuration</h3>
          <p>
            {config.roles.length} rôles, {config.documentStandards.length} standards, {enabledReferentials} référentiels actifs,
            {` ${config.exports.length}`} profils d’export.
          </p>
        </article>
      </div>

      <div className="admin-module-table">
        <h3>Configuration centrale des modules</h3>
        <div>
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Route</th>
                <th>Rôles autorisés</th>
                <th>Section</th>
              </tr>
            </thead>
            <tbody>
              {SITE_CATEGORIES.map((category) => (
                <tr key={category.id}>
                  <td>
                    <Link to={category.path}>{category.label}</Link>
                    {category.adminOnly && <span>Admin</span>}
                  </td>
                  <td>{category.path}</td>
                  <td>{category.roles.join(", ")}</td>
                  <td>{category.group}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
