import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";
import { buildDirigeantDashboard } from "../../lib/dirigeants/dirigeantDashboard";
import { canViewDirigeantDashboard } from "../../lib/dirigeants/dirigeantPermissions";
import { DirigeantAlerts } from "./DirigeantAlerts";
import { DirigeantDocumentsValidation } from "./DirigeantDocumentsValidation";
import { DirigeantOrganisationPanel } from "./DirigeantOrganisationPanel";
import { DirigeantPlanningOverview } from "./DirigeantPlanningOverview";
import { DirigeantQualityPanel } from "./DirigeantQualityPanel";
import "../../styles/dirigeants.css";

const kpiLabels: Array<{ key: keyof ReturnType<typeof buildDirigeantDashboard>["kpi"]; label: string; detail: string }> = [
  { key: "activeTeams", label: "Équipes actives", detail: "Groupes suivis" },
  { key: "validatedPlannings", label: "Plans validés", detail: "Technique ou publié" },
  { key: "planningsToValidate", label: "Plans à valider", detail: "Commission" },
  { key: "teamsWithoutPlanning", label: "Sans planification", detail: "À créer" },
  { key: "publishedDocuments", label: "Documents publiés", detail: "Officiels BCVB" },
  { key: "documentsToCorrect", label: "Docs à corriger", detail: "Avant diffusion" },
  { key: "missingAttendances", label: "Présences non remplies", detail: "Suivi terrain" },
  { key: "missingEvaluations", label: "Évaluations manquantes", detail: "Suivi joueurs" },
  { key: "qualityAlerts", label: "Alertes qualité", detail: "Priorités" },
];

export function DirigeantDashboard() {
  const { profile } = useAuth();
  const dashboard = useMemo(() => buildDirigeantDashboard(), []);
  const authorized = canViewDirigeantDashboard(profile);

  if (!authorized) {
    return (
      <main className="dirigeant-page">
        <section className="dirigeant-hero">
          <p className="bcvb-eyebrow">Espace dirigeants</p>
          <h1>Accès réservé</h1>
          <span>Cette vue de pilotage est réservée aux dirigeants, à l’admin et au responsable technique.</span>
        </section>
      </main>
    );
  }

  return (
    <main className="dirigeant-page">
      <section className="dirigeant-hero">
        <div>
          <p className="bcvb-eyebrow">Espace dirigeants</p>
          <h1>Pilotage sportif BCVB</h1>
          <span>Vue synthétique des équipes, planifications, documents et alertes pour la commission sportive.</span>
        </div>
        <div className="dirigeant-hero__actions">
          <Link to="/club/planifications">Voir planifications</Link>
          <Link to="/documents-club">Documents club</Link>
          <a href="#qualite-documentaire">Qualité documentaire</a>
        </div>
      </section>

      <section className="dirigeant-block-map">
        {["Pilotage sportif", "Documents club", "Suivi planifications", "Organisation", "Qualité documentaire"].map((item) => (
          <article key={item}>
            <span>Bloc dirigeant</span>
            <strong>{item}</strong>
          </article>
        ))}
      </section>

      <section className="dirigeant-kpi-grid">
        {kpiLabels.map((item) => (
          <article key={item.key} className="dirigeant-kpi-card">
            <span>{item.label}</span>
            <strong>{dashboard.kpi[item.key]}</strong>
            <small>{item.detail}</small>
          </article>
        ))}
      </section>

      <section className="dirigeant-layout">
        <div className="dirigeant-main">
          <DirigeantPlanningOverview plannings={dashboard.plannings} />
          <DirigeantDocumentsValidation documents={dashboard.documents} />
          <DirigeantOrganisationPanel organisation={dashboard.organisation} />
          <DirigeantQualityPanel plannings={dashboard.plannings} documents={dashboard.documents} />
        </div>

        <aside className="dirigeant-sidebar">
          <DirigeantAlerts alerts={dashboard.qualityAlerts} />
          <section className="dirigeant-section">
            <div className="dirigeant-section__title">
              <span>Derniers documents publiés</span>
              <h2>Ressources officielles</h2>
            </div>
            <div className="dirigeant-document-mini-list">
              {dashboard.documents.filter((document) => document.status === "published").map((document) => (
                <Link key={document.id} to={document.route}>
                  <strong>{document.title}</strong>
                  <span>Document officiel BCVB · {document.qualityScore}/100</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

export default DirigeantDashboard;
