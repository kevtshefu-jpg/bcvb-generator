import type { CategoryRecord } from "../types/referentiel";

export const categories: CategoryRecord[] = [
  {
    id: "U7",
    title: "U7",
    ageLabel: "Découverte",
    finality: "Donner le goût du jeu, de la balle et du panier.",
    profile: "Enfant actif, engagé, curieux, qui ose manipuler et jouer.",
    priorities: [
      "Motricité générale",
      "Aisance avec ballon",
      "Jeu et plaisir",
      "Premières intentions vers la cible"
    ],
    offensiveTargets: [
      "Avancer vers le panier",
      "Tirer proche du cercle",
      "Découvrir passe et dribble"
    ],
    defensiveTargets: [
      "Retrouver son joueur",
      "Se placer entre joueur et panier"
    ],
    coachingPoints: [
      "Consignes courtes",
      "Démonstration rapide",
      "Beaucoup de répétitions ludiques"
    ],
    nextStep: "Vers U9 : coordination avec ballon et jeu vers l’avant."
  },
  {
    id: "U9",
    title: "U9",
    ageLabel: "Fondations",
    finality: "Structurer les premiers fondamentaux dans le jeu.",
    profile: "Joueur vivant, mobile, plus à l’aise avec le ballon, capable de premières lectures.",
    priorities: [
      "Coordination avec ballon",
      "Jeu vers l’avant",
      "Tir proche",
      "Coopération simple"
    ],
    offensiveTargets: [
      "Lever la tête",
      "Prendre l’espace libre",
      "Finir vite"
    ],
    defensiveTargets: [
      "Voir ballon et joueur",
      "Revenir vite défendre"
    ],
    coachingPoints: [
      "Favoriser la lecture simple",
      "Garder une forte part de jeu",
      "Corriger juste et peu"
    ],
    nextStep: "Vers U11 : jeu rapide, intentions plus nettes, lecture renforcée."
  },
  {
    id: "U11",
    title: "U11",
    ageLabel: "Mini-basket avancé",
    finality: "Faire progresser le joueur dans les intentions, la vitesse et la lecture.",
    profile: "Joueur capable d’attaquer, lire l’espace et coopérer plus vite.",
    priorities: [
      "Jeu rapide",
      "1c1 offensif",
      "Tir en course",
      "Prise d’informations"
    ],
    offensiveTargets: [
      "Courir large et profond",
      "Fixer pour donner",
      "Attaquer le cercle"
    ],
    defensiveTargets: [
      "Pression sur porteur",
      "Retour rapide",
      "Premiers repères d’aide"
    ],
    coachingPoints: [
      "Faire verbaliser la lecture",
      "Chercher vitesse + justesse",
      "Sanctionner les temps morts"
    ],
    nextStep: "Vers U13 : duel, responsabilité défensive, lecture plus complexe."
  },
  {
    id: "U13",
    title: "U13",
    ageLabel: "Construction vers le basket à 5",
    finality: "Renforcer duel, lecture et responsabilité dans le jeu.",
    profile: "Joueur plus capable de gérer le duel, les aides simples et les responsabilités collectives.",
    priorities: [
      "1c1 offensif et défensif",
      "Défense sur porteur",
      "Défense non-porteur",
      "Jeu rapide structuré"
    ],
    offensiveTargets: [
      "Créer un avantage clair",
      "Mieux lire l’aide",
      "Jouer après fixation"
    ],
    defensiveTargets: [
      "Ralentir le porteur",
      "Protéger l’axe",
      "Replacements sprintés"
    ],
    coachingPoints: [
      "Responsabiliser le duel",
      "Refuser la passivité",
      "Installer des repères clairs"
    ],
    nextStep: "Vers U15 : défense plus collective, transition plus exigeante."
  },
  {
    id: "U15",
    title: "U15",
    ageLabel: "Pré-formation",
    finality: "Relier fondamentaux, lecture, intensité et exigences compétitives.",
    profile: "Joueur capable de répétition, rigueur et meilleure compréhension du jeu.",
    priorities: [
      "Transition",
      "Lecture du jeu",
      "Défense collective simple",
      "Qualité d’exécution"
    ],
    offensiveTargets: [
      "Jouer vite et juste",
      "Punir les aides",
      "Mieux gérer les temps du jeu"
    ],
    defensiveTargets: [
      "Repli structuré",
      "Aides et retours",
      "Communication"
    ],
    coachingPoints: [
      "Être exigeant",
      "Chercher transfert en match",
      "Monter l’intensité"
    ],
    nextStep: "Vers U18 : compréhension tactique plus élevée et identité forte."
  },
  {
    id: "U18",
    title: "U18",
    ageLabel: "Formation avancée",
    finality: "Préparer à la performance et au niveau senior.",
    profile: "Joueur capable d’intensité, lecture et responsabilité collective.",
    priorities: [
      "Lecture du jeu",
      "Transitions",
      "Défense collective",
      "Performance technique sous pression"
    ],
    offensiveTargets: [
      "Créer et punir l’avantage",
      "Maintenir rythme et spacing"
    ],
    defensiveTargets: [
      "Pression collective",
      "Aides coordonnées",
      "Communication continue"
    ],
    coachingPoints: [
      "Exigence forte",
      "Transfert match prioritaire",
      "Responsabiliser sur chaque séquence"
    ],
    nextStep: "Vers Seniors : stabilité, efficacité, constance."
  },
  {
    id: "SENIORS",
    title: "Seniors",
    ageLabel: "Performance",
    finality: "Exprimer pleinement l’identité BCVB dans le jeu et la compétition.",
    profile: "Joueur performant, fiable et capable de répétition au service du collectif.",
    priorities: [
      "Identité de jeu",
      "Transitions",
      "Efficacité",
      "Discipline collective"
    ],
    offensiveTargets: [
      "Courir",
      "Partager la balle",
      "Sanctionner vite"
    ],
    defensiveTargets: [
      "Défendre fort",
      "Protéger la peinture",
      "Enchaîner les efforts"
    ],
    coachingPoints: [
      "Clarté",
      "Exigence",
      "Responsabilisation"
    ],
    nextStep: "Maintenir et optimiser la performance."
  }
];
