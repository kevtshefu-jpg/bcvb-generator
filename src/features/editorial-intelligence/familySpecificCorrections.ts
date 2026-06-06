import type { DocumentFamily } from './documentIntentEngine'

export function getFamilySpecificCorrections(family: DocumentFamily, issues: string[]): string[] {
  const shared = issues.length > 0 ? issues : ['Renforcer les éléments faibles détectés par le contrôle qualité.']

  const corrections: Record<DocumentFamily, string[]> = {
    guide_coach: [
      'Renforcer rôle du coach.',
      'Ajouter posture attendue.',
      'Ajouter relation familles.',
      'Ajouter séance type.',
      'Créer encarts coach.',
      'Améliorer planification annuelle.',
    ],
    cahier_technique: [
      'Ajouter situations numérotées.',
      'Ajouter diagrammes terrain.',
      'Structurer progression technique.',
      'Créer critères de réussite.',
      'Créer erreurs fréquentes / corrections.',
    ],
    seance_entrainement: [
      'Réduire à une lecture rapide.',
      'Renforcer timing.',
      'Rendre le terrain visible.',
      'Clarifier rotations.',
      'Ajouter consignes courtes.',
    ],
    plan_formation: [
      'Ajouter indicateurs.',
      'Ajouter timeline.',
      'Ajouter matrice compétences.',
      'Ajouter pilotage.',
      'Ajouter vision pluriannuelle.',
    ],
    ruban_pedagogique: [
      'Renforcer la progression horizontale.',
      'Clarifier objectifs par séance.',
      'Ajouter critères observables.',
      'Compactifier la lecture.',
    ],
    fiche_theme: [
      'Clarifier la définition du thème.',
      'Ajouter erreurs fréquentes.',
      'Ajouter points coach.',
      'Ajouter déclinaisons par catégorie.',
      'Ajouter transfert match.',
    ],
  }

  return [...corrections[family], ...shared]
}
