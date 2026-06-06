import type { FaqCategory } from "../../types/faq";

type QuickAccessItem = {
  title: string;
  text: string;
  category: FaqCategory;
  query: string;
};

type FaqQuickAccessProps = {
  onSelect: (category: FaqCategory, query: string) => void;
};

const quickAccessItems: QuickAccessItem[] = [
  {
    title: "Droits & accès",
    text: "Qui peut créer, modifier, consulter ou télécharger.",
    category: "acces",
    query: "droits roles",
  },
  {
    title: "Score qualité",
    text: "Document non publiable, seuil, corrections et QA.",
    category: "documents",
    query: "score qualité publiable",
  },
  {
    title: "Export bloqué",
    text: "PDF, Markdown, PNG, SVG, source absente ou droit insuffisant.",
    category: "exports",
    query: "export PDF SVG",
  },
  {
    title: "Import effectif",
    text: "CSV, Excel, mapping, doublons et erreurs de prévisualisation.",
    category: "effectifs",
    query: "import colonnes doublons",
  },
  {
    title: "Terrain séance",
    text: "Schéma invisible, SVG terrain, logo, export écran.",
    category: "seances",
    query: "terrain schéma SVG",
  },
  {
    title: "Brouillon perdu",
    text: "Autosave, reprise de travail, restauration et tableau de bord.",
    category: "sauvegarde",
    query: "brouillon sauvegarde",
  },
];

export default function FaqQuickAccess({ onSelect }: FaqQuickAccessProps) {
  return (
    <section className="faq-quick-access" aria-label="Accès rapides FAQ">
      {quickAccessItems.map((item) => (
        <button type="button" key={item.title} onClick={() => onSelect(item.category, item.query)}>
          <span>{item.title}</span>
          <p>{item.text}</p>
        </button>
      ))}
    </section>
  );
}
