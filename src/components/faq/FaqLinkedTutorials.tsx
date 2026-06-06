import { Link } from "react-router-dom";
import { tutorialItems } from "../../lib/tutorials/tutorialData";
import type { TutorialItem } from "../../types/tutorials";

type FaqLinkedTutorialsProps = {
  tutorialIds: string[];
};

export default function FaqLinkedTutorials({ tutorialIds }: FaqLinkedTutorialsProps) {
  const tutorials = tutorialIds
    .map((tutorialId) => tutorialItems.find((tutorial) => tutorial.id === tutorialId))
    .filter((tutorial): tutorial is TutorialItem => Boolean(tutorial));

  if (tutorials.length === 0) return null;

  return (
    <div className="faq-linked-tutorials">
      <strong>Tutoriels liés</strong>
      <div>
        {tutorials.map((tutorial) => (
          <Link to={`/tutoriels/plateforme?guide=${tutorial.id}`} key={tutorial.id}>
            {tutorial.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
