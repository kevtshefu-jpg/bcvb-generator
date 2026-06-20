import type { DocumentWorkflowMode } from './documentWorkflow'

type DocumentWorkflowGuideProps = {
  mode: DocumentWorkflowMode
}

const guideContent: Record<DocumentWorkflowMode, { title: string; text: string; checklist: string[] }> = {
  creation: {
    title: 'Créer un document BCVB',
    text: 'Suis les étapes dans l’ordre : source, classement, structure, production, aperçu, qualité puis export. Ne commence pas par l’export tant que le contenu et le classement ne sont pas propres.',
    checklist: [
      'Source ajoutée ou rédigée',
      'Famille documentaire choisie',
      'Catégorie et audience renseignées',
      'Structure claire',
      'Contenu final présent',
      'Score qualité vérifié',
      'Export prêt',
    ],
  },
  edition: {
    title: 'Modifier un document existant',
    text: 'Commence par identifier ce qui doit changer. Modifie ensuite uniquement les parties utiles, puis vérifie le rendu avant de valider une nouvelle version.',
    checklist: [
      'Objectif de modification clair',
      'Contenu corrigé',
      'Métadonnées vérifiées',
      'Aperçu relu',
      'Nouvelle version validée',
    ],
  },
  improvement: {
    title: 'Améliorer un document',
    text: 'Analyse d’abord les faiblesses, puis améliore par priorité. Une amélioration utile doit rendre le document plus clair, plus conforme à l’identité BCVB et plus exploitable.',
    checklist: [
      'Faiblesses identifiées',
      'Priorité choisie',
      'Correction effectuée',
      'Score qualité relancé',
      'Export vérifié',
    ],
  },
  validation: {
    title: 'Valider un document',
    text: 'La validation confirme que le document est utilisable par le club. Vérifie la cohérence, les droits, le niveau de publication et l’identité BCVB.',
    checklist: [
      'Contenu relu',
      'Rôle / audience cohérents',
      'Niveau de publication correct',
      'Qualité suffisante',
      'Version stable',
    ],
  },
  export: {
    title: 'Exporter ou publier',
    text: 'Avant d’exporter, vérifie que le document contient une source exploitable, un titre propre, une version et un contenu final.',
    checklist: [
      'Source disponible',
      'PDF ou Markdown possible',
      'Nom de fichier propre',
      'Version indiquée',
      'Publication assumée',
    ],
  },
}

export function DocumentWorkflowGuide({ mode }: DocumentWorkflowGuideProps) {
  const content = guideContent[mode]

  return (
    <aside className="document-workflow-guide bcvb-card-safe" aria-label="Guide du workflow documentaire">
      <p className="document-workflow-guide__eyebrow">Guide d’utilisation</p>
      <h2 className="document-workflow-guide__title bcvb-text-clamp-2">{content.title}</h2>
      <p className="document-workflow-guide__text">{content.text}</p>
      <ul className="document-workflow-guide__list">
        {content.checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  )
}
