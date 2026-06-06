import { Link } from "react-router-dom";
import type { TutorialItem } from "../../types/tutorials";
import { tutorialCategoryLabels } from "../../lib/tutorials/tutorialData";

type TutorialDemoPanelProps = {
  tutorial: TutorialItem;
  completion: number;
};

function routeLabel(route: string) {
  return route.replace(/^\//, "") || "accueil";
}

export default function TutorialDemoPanel({ tutorial, completion }: TutorialDemoPanelProps) {
  return (
    <aside className="tutorial-demo-panel">
      <span className="tutorial-demo-panel__eyebrow">Mode opératoire</span>
      <h2>{tutorial.title}</h2>
      <p>{tutorial.subtitle}</p>

      <div className="tutorial-demo-progress" aria-label={`Progression du tutoriel ${completion}%`}>
        <span style={{ width: `${completion}%` }} />
      </div>
      <strong className="tutorial-demo-progress-label">{completion}% complété</strong>

      <dl className="tutorial-demo-facts">
        <div>
          <dt>Catégorie</dt>
          <dd>{tutorialCategoryLabels[tutorial.category]}</dd>
        </div>
        <div>
          <dt>Niveau</dt>
          <dd>{tutorial.level}</dd>
        </div>
        <div>
          <dt>Temps</dt>
          <dd>{tutorial.estimatedTime}</dd>
        </div>
        <div>
          <dt>Statut</dt>
          <dd>{tutorial.status}</dd>
        </div>
      </dl>

      <div className="tutorial-demo-copy">
        <h3>Pour quoi</h3>
        <p>{tutorial.forWhat}</p>
        <h3>Pourquoi</h3>
        <p>{tutorial.why}</p>
        <h3>Comment</h3>
        <p>{tutorial.how}</p>
      </div>

      <div className="tutorial-demo-routes">
        <h3>Routes liées</h3>
        {tutorial.relatedRoutes.map((route) => (
          <Link to={route} key={route}>
            {routeLabel(route)}
          </Link>
        ))}
      </div>

      <div className="tutorial-demo-note">
        <strong>Évolution possible</strong>
        <p>{tutorial.evolution}</p>
      </div>
    </aside>
  );
}
