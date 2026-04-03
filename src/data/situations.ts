import type { SituationRecord } from "../types/referentiel";

export const situations: SituationRecord[] = [
  {
    id: "u7-dribble-couleurs",
    title: "Dribble et couleurs",
    categoryIds: ["U7", "U9"],
    themeIds: ["mini-basket", "aisance-ballon"],
    pedagogicStep: "Je découvre",
    level: "Débutant",
    durationMin: 8,
    playersMin: 6,
    playersMax: 16,
    courtType: "Demi-terrain",
    materials: ["Ballons", "Cônes"],
    objective: "Manipuler le ballon et lever les yeux.",
    setup: "Tous les joueurs avec un ballon dans un espace délimité. Cônes de couleurs aux coins.",
    instructions:
      "Les joueurs dribblent librement. Au signal du coach, ils attaquent une couleur annoncée sans arrêter le ballon.",
    successCriteria: [
      "Ballon contrôlé",
      "Regard relevé",
      "Réactivité au signal"
    ],
    variables: [
      "Changer de main avant d’attaquer la couleur",
      "Changer de rythme",
      "Ajouter une feinte"
    ],
    coachingPoints: [
      "Rester bas",
      "Utiliser les deux mains",
      "Ne pas fixer le ballon"
    ],
    tags: ["aisance", "mini-basket", "regard", "dribble"]
  },
  {
    id: "u11-jeu-rapide-3-couloirs",
    title: "Jeu rapide 3 couloirs",
    categoryIds: ["U11", "U13"],
    themeIds: ["jeu-rapide"],
    pedagogicStep: "Je retranscris",
    level: "Intermédiaire",
    durationMin: 12,
    playersMin: 6,
    playersMax: 12,
    courtType: "Plein terrain",
    materials: ["Ballons", "Cônes", "Chasubles"],
    objective: "Attaquer vite en occupant les couloirs et en fixant pour donner.",
    setup:
      "Trois couloirs matérialisés. Départ à 3 joueurs. Un ballon sur le porteur central ou latéral.",
    instructions:
      "À la récupération ou au départ du coach, les joueurs remplissent les couloirs. Le porteur avance, fixe et donne au bon moment.",
    successCriteria: [
      "Couloirs occupés",
      "Ballon qui avance vite",
      "Finition en avantage"
    ],
    variables: [
      "Ajouter un défenseur retard",
      "Limiter les dribbles du porteur",
      "Imposer une passe avant la finition"
    ],
    coachingPoints: [
      "Courir large et profond",
      "Voir devant tôt",
      "Pas de dribbles de confort"
    ],
    tags: ["jeu rapide", "projection", "couloirs", "fixer pour donner"]
  },
  {
    id: "u13-1c1-defensif-aile",
    title: "1c1 défensif aile",
    categoryIds: ["U13", "U15"],
    themeIds: ["defense-jeune-joueur"],
    pedagogicStep: "Je m'exerce",
    level: "Intermédiaire",
    durationMin: 10,
    playersMin: 4,
    playersMax: 10,
    courtType: "Demi-terrain",
    materials: ["Ballons", "Cônes"],
    objective: "Gagner le duel et ralentir le porteur sur l’aile.",
    setup:
      "Un attaquant sur l’aile, un défenseur en position, une file de chaque côté.",
    instructions:
      "Sur la passe ou le signal, l’attaquant joue le 1c1. Le défenseur doit contenir, orienter et protéger l’axe.",
    successCriteria: [
      "Pas d’attaque directe plein axe",
      "Défenseur entre joueur et panier",
      "Contestation réelle"
    ],
    variables: [
      "Départ plus proche du panier",
      "Nombre de dribbles limité",
      "Ajouter un closeout"
    ],
    coachingPoints: [
      "Pieds actifs",
      "Bras vivants",
      "Recul contrôlé sans subir"
    ],
    tags: ["1c1", "défense", "porteur", "duel"]
  }
];
