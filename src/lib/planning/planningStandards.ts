import type { CoachProfile, PlanningCategory, PlanningLevel, PlanningObjective } from "../../types/planning";

export const planningCategories: PlanningCategory[] = ["U7", "U9", "U11", "U13", "U15", "U18", "U21", "Seniors", "Général BCVB"];
export const planningLevels: PlanningLevel[] = ["Découverte", "Départemental", "Région", "Pré-région", "Performance", "Loisir", "Section sportive"];
export const coachProfiles: CoachProfile[] = ["Débutant", "Intermédiaire", "Confirmé", "Responsable technique"];

export const BCVB_IDENTITY_LINKS = [
  "Défendre Fort",
  "Courir",
  "Partager la balle",
  "Homme à Homme",
  "Intensité maîtrisée",
  "Progression mesurable",
] as const;

export type CategoryStandard = {
  dominantThemes: string[];
  cycleThemes: string[];
  ageFocus: string;
  warning: string;
  defaultObjectives: Array<Omit<PlanningObjective, "id">>;
};

export const CATEGORY_STANDARDS: Record<PlanningCategory, CategoryStandard> = {
  U7: {
    dominantThemes: ["Motricité", "Manipulation ballon", "Jeu et plaisir", "Repères collectifs simples"],
    cycleThemes: ["Découvrir le ballon", "Courir et s’arrêter", "Coopérer", "Jouer sans peur"],
    ageFocus: "Sécurité, plaisir, coordination, consignes très courtes.",
    warning: "Limiter la charge tactique et privilégier la réussite visible.",
    defaultObjectives: [
      objective("Manipuler le ballon avec plaisir", "Observer aisance, équilibre, sourire et engagement.", "Partager la balle"),
      objective("Construire les premiers appuis", "Mesurer arrêts, changements de direction et équilibre.", "Courir"),
    ],
  },
  U9: {
    dominantThemes: ["Fondamentaux simples", "1 contre 1", "Coopération", "Occupation de l’espace"],
    cycleThemes: ["Dribbler et protéger", "Passer et se démarquer", "Défendre son joueur", "Jouer vite"],
    ageFocus: "Répétitions courtes, règles simples, intensité ludique.",
    warning: "Éviter les systèmes figés.",
    defaultObjectives: [
      objective("Avancer vers la cible", "Repérer les courses utiles et les choix de tir simples.", "Courir"),
      objective("Découvrir la défense individuelle", "Observer placement entre joueur et panier.", "Homme à Homme"),
    ],
  },
  U11: {
    dominantThemes: ["Fondamentaux individuels", "Premières lectures", "Défense H-H", "Transition"],
    cycleThemes: ["Appuis et finitions", "Passe et va", "Aide défensive", "Relance rapide"],
    ageFocus: "Installer les habitudes techniques et les premières lectures collectives.",
    warning: "Garder une majorité de situations avec décision.",
    defaultObjectives: [
      objective("Fixer-passer-courir", "Compter les passes après avantage créé.", "Partager la balle"),
      objective("Installer pression et aide", "Observer pression porteur et aide côté faible.", "Défendre Fort"),
    ],
  },
  U13: {
    dominantThemes: ["Intensité", "1 contre 1", "Agressivité maîtrisée", "Aide défensive simple"],
    cycleThemes: ["Gagner son duel", "Défendre fort", "Courir et remplir les couloirs", "Partager après fixation"],
    ageFocus: "Construire la culture BCVB : défendre, courir, partager.",
    warning: "Relier chaque thème à des critères match.",
    defaultObjectives: [
      objective("Créer un avantage en 1c1", "Mesurer le nombre d’avantages créés et bien exploités.", "Courir"),
      objective("Aider et reprendre", "Observer communication, aide et reprise sans abandonner son joueur.", "Défendre Fort"),
    ],
  },
  U15: {
    dominantThemes: ["Lecture du jeu", "Spacing", "Écrans simples", "Transition organisée"],
    cycleThemes: ["Lire l’avantage", "Spacing et timing", "Écrans porteur/non porteur", "Repli et match-up"],
    ageFocus: "Passer de l’exécution à la lecture.",
    warning: "Ne pas empiler les systèmes sans critères observables.",
    defaultObjectives: [
      objective("Lire l’aide défensive", "Identifier passe, tir ou drive selon réaction défensive.", "Partager la balle"),
      objective("Structurer le repli", "Mesurer les stops après perte ou tir manqué.", "Défendre Fort"),
    ],
  },
  U18: {
    dominantThemes: ["Principes collectifs", "Autonomie", "Lecture avancée", "Intensité tactique"],
    cycleThemes: ["Rôles et responsabilités", "Pression défensive", "Avantages collectifs", "Préparation match"],
    ageFocus: "Responsabiliser et individualiser davantage.",
    warning: "Garder un lien fort entre progression individuelle et projet collectif.",
    defaultObjectives: [
      objective("Stabiliser les rôles", "Observer responsabilité dans l’effort, l’espace et les choix.", "Progression mesurable"),
      objective("Préparer un plan match", "Relier scouting simple et adaptation en séance.", "Défendre Fort"),
    ],
  },
  U21: {
    dominantThemes: ["Performance collective", "Rythme", "Scouting simple", "Détails tactiques"],
    cycleThemes: ["Détails défensifs", "Rythme offensif", "Lecture scouting", "Gestion des temps faibles"],
    ageFocus: "Préparer la passerelle seniors et la performance.",
    warning: "Équilibrer exigence tactique et développement du joueur.",
    defaultObjectives: [
      objective("Gérer le rythme", "Mesurer décisions rapides, pertes de balle et qualité du tir.", "Courir"),
      objective("Adapter les couvertures", "Observer communication et exécution des choix défensifs.", "Défendre Fort"),
    ],
  },
  Seniors: {
    dominantThemes: ["Performance collective", "Scouting", "Rôles", "Gestion des temps faibles"],
    cycleThemes: ["Préparation match", "Exécution offensive", "Détails défensifs", "Playoffs / objectifs classement"],
    ageFocus: "Optimiser la performance sans perdre l’identité club.",
    warning: "Séparer ce qui relève du plan match et de la progression annuelle.",
    defaultObjectives: [
      objective("Aligner rôles et efficacité", "Mesurer qualité des tirs, turnovers et stops défensifs.", "Progression mesurable"),
      objective("Construire un plan match stable", "Observer adaptation aux forces/faiblesses adverses.", "Défendre Fort"),
    ],
  },
  "Général BCVB": {
    dominantThemes: ["Culture club", "Formation coachs", "Progression commune", "Référentiel technique"],
    cycleThemes: ["Identité BCVB", "Fondamentaux communs", "Critères observables", "Transmission coachs"],
    ageFocus: "Créer une ligne commune entre catégories.",
    warning: "Adapter ensuite à chaque âge avant publication.",
    defaultObjectives: [
      objective("Partager une culture commune", "Aligner vocabulaire, critères et priorités club.", "Partager la balle"),
      objective("Piloter par critères", "Associer chaque cycle à un indicateur observable.", "Progression mesurable"),
    ],
  },
};

export function getLevelFocus(level: PlanningLevel) {
  if (level === "Découverte" || level === "Loisir") return "plaisir, sécurité, volume de touches, confiance";
  if (level === "Départemental") return "fondamentaux solides, intensité stable, repères simples";
  if (level === "Pré-région" || level === "Région") return "lecture, vitesse de décision, exigence défensive";
  if (level === "Section sportive") return "charge planifiée, individualisation, double projet";
  return "performance, détails tactiques, autonomie collective";
}

export function getCoachAdjustment(profile: CoachProfile) {
  if (profile === "Débutant") return "consignes simples, cycles lisibles, critères courts, peu de dispersion";
  if (profile === "Intermédiaire") return "variantes guidées, corrections fréquentes, liens match explicites";
  if (profile === "Confirmé") return "régulations, différenciation, scénarios d’adaptation";
  return "cohérence club, validation technique, indicateurs et suivi inter-équipes";
}

function objective(label: string, description: string, bcvbLink: string): Omit<PlanningObjective, "id"> {
  return {
    label,
    description,
    priority: "haute",
    observableCriteria: ["Comportement visible en séance", "Transfert identifiable en match"],
    quantifiableCriteria: ["Taux de réussite cible 70%", "Au moins 2 observations coach par semaine"],
    bcvbLink,
  };
}
