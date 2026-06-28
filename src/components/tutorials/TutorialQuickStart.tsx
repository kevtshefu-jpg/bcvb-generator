import { Link } from "react-router-dom";

const quickStartActions = [
  {
    title: "Créer un document",
    text: "Cadrage, source, plan, IA, qualité et export.",
    path: "/tutoriels/createur-document",
    role: "Admin",
  },
  {
    title: "Créer une séance",
    text: "Préparer une fiche terrain avec schéma et export.",
    path: "/coach/seances",
    role: "Coach",
  },
  {
    title: "Importer un effectif",
    text: "CSV/Excel, mapping, prévisualisation et affectation.",
    path: "/effectifs/import",
    role: "Admin · Coach",
  },
  {
    title: "Faire l’appel",
    text: "Présences, absences, retards et motifs utiles.",
    path: "/presences",
    role: "Coach",
  },
  {
    title: "FAQ plateforme",
    text: "Droits, accès, exports et blocages courants.",
    path: "/faq",
    role: "Tous",
  },
  {
    title: "Bibliothèque documentaire",
    text: "Retrouver les ressources publiées et les documents club.",
    path: "/bibliotheque",
    role: "Tous",
  },
];

export default function TutorialQuickStart() {
  return (
    <section className="tutorial-quickstart" aria-label="Accès rapides tutoriels">
      {quickStartActions.map((action) => (
        <Link className="tutorial-quickstart-card" to={action.path} key={action.title}>
          <span>{action.role}</span>
          <strong>{action.title}</strong>
          <p>{action.text}</p>
        </Link>
      ))}
    </section>
  );
}
