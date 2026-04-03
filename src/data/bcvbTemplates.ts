import type { OverlayAction, OverlayElement } from "../diagram/fibaOverlaySvg";

export interface BCVBSessionTemplate {
  id: string;
  title: string;
  category: string;
  theme: string;
  tags: string[];
  objective: string;
  instructions: string[];
  coachingPoints: string[];
  variables: string[];
  successCriteria: string[];
  elements: OverlayElement[];
  actions: OverlayAction[];
}

export const BCVB_TEMPLATES: BCVBSessionTemplate[] = [
  {
    id: "zone-23-overload",
    title: "Battre zone 2-3 : overload + high post",
    category: "U15",
    theme: "Battre zone 2-3",
    tags: ["high post", "short corner", "overload"],
    objective:
      "Occuper les brèches d’une 2-3, fixer depuis le high post et créer une finition ou un tir ouvert côté surcharge.",
    instructions: [
      "Organisation en 1-3-1 offensif",
      "Mettre le meilleur passeur au high post",
      "Faire flotter le joueur baseline entre les short corners",
      "Attaquer la brèche dès réception",
      "Jouer rebond offensif côté faible",
    ],
    coachingPoints: [
      "Décider vite au high post",
      "Fixer avant de ressortir",
      "Ne pas rester statique sur le périmètre",
      "Lire l’effondrement de la zone",
    ],
    variables: [
      "Autoriser 1 dribble max au high post",
      "Obligation de toucher short corner avant tir",
      "Bonus si 2e chance marquee",
    ],
    successCriteria: [
      "Ballon touché high post ou short corner",
      "Défense déplacée latéralement",
      "Tir ouvert ou finition près du cercle",
    ],
    elements: [
      { id: "pg", type: "attacker", x: 5.5, y: 7.5, label: "1" },
      { id: "w1", type: "attacker", x: 9.2, y: 3.0, label: "2" },
      { id: "hp", type: "attacker", x: 14.0, y: 7.5, label: "3" },
      { id: "w2", type: "attacker", x: 9.2, y: 12.0, label: "4" },
      { id: "base", type: "attacker", x: 24.8, y: 11.5, label: "5" },
      {
        id: "z1",
        type: "zone",
        x: 23.2,
        y: 11.5,
        width: 3.6,
        height: 2.3,
        label: "short corner",
        color: "rgba(37,99,235,0.18)",
      },
      {
        id: "z2",
        type: "zone",
        x: 14.8,
        y: 7.5,
        width: 2.8,
        height: 2.2,
        label: "high post",
        color: "rgba(16,185,129,0.18)",
      },
    ],
    actions: [
      {
        id: "a1",
        type: "pass",
        from: { x: 5.5, y: 7.5 },
        to: { x: 14.0, y: 7.5 },
        label: "high post",
        order: 1,
      },
      {
        id: "a2",
        type: "pass",
        from: { x: 14.0, y: 7.5 },
        to: { x: 24.8, y: 11.5 },
        label: "short corner",
        order: 2,
      },
    ],
  },

  {
    id: "zone-131-overload",
    title: "Battre zone 1-3-1 : overload côté fort",
    category: "U15",
    theme: "Battre zone 1-3-1",
    tags: ["overload", "skip pass", "high post"],
    objective:
      "Déplacer le chasseur, entrer au poste haut, surcharger un côté et exploiter le retard du warrior.",
    instructions: [
      "Front pair 2-1-2",
      "Meilleur playmaker au poste haut",
      "Déplacer la défense avant l’attaque de brèche",
      "Surcharge de 4 joueurs côté fort",
      "Chercher corner ou short corner après collapse",
    ],
    coachingPoints: [
      "Lire avant réception",
      "Jouer les passes sautées si la défense charge le ballon",
      "Sanctionner le warrior en retard",
    ],
    variables: [
      "Piège obligatoire dans le coin",
      "Tir interdit sans passage poste haut",
    ],
    successCriteria: [
      "Défense déplacée d’un côté à l’autre",
      "Ballon entré au poste haut",
      "Tir créé après surcharge",
    ],
    elements: [
      { id: "1", type: "attacker", x: 6.0, y: 5.0, label: "1" },
      { id: "2", type: "attacker", x: 6.0, y: 10.0, label: "2" },
      { id: "3", type: "attacker", x: 13.8, y: 7.5, label: "3" },
      { id: "4", type: "attacker", x: 22.5, y: 4.0, label: "4" },
      { id: "5", type: "attacker", x: 23.8, y: 11.3, label: "5" },
    ],
    actions: [
      {
        id: "a1",
        type: "pass",
        from: { x: 6.0, y: 5.0 },
        to: { x: 13.8, y: 7.5 },
        label: "poste haut",
        order: 1,
      },
      {
        id: "a2",
        type: "pass",
        from: { x: 13.8, y: 7.5 },
        to: { x: 22.5, y: 4.0 },
        label: "overload",
        order: 2,
      },
      {
        id: "a3",
        type: "pass",
        from: { x: 22.5, y: 4.0 },
        to: { x: 23.8, y: 11.3 },
        label: "skip / corner",
        order: 3,
      },
    ],
  },

  {
    id: "press-break-14",
    title: "Attaque de presse 1-4",
    category: "U13",
    theme: "Attaque de presse",
    tags: ["press break", "retreat dribble"],
    objective:
      "Gérer la pression tout-terrain avec un alignement 1-4 et trouver axe, ligne de touche ou inversion.",
    instructions: [
      "Monter les 4 receveurs",
      "Prévoir ligne de touche / axe / inversion",
      "Jouer dribble de recul si trappe",
      "Screens et seals contre le déni",
      "Attaquer pour marquer une fois la pression battue",
    ],
    coachingPoints: [
      "Yeux levés",
      "Créer l’espace avant la passe",
      "Ne pas subir le piège",
    ],
    variables: [
      "Defense homme ou zone",
      "Déni intégral",
      "Changement automatique sur écran",
    ],
    successCriteria: [
      "Ballon inversé ou axe trouvé",
      "Pression cassée sans perte",
      "Situation de marque créée",
    ],
    elements: [
      { id: "i", type: "coach", x: 1.6, y: 7.5, label: "IN" },
      { id: "1", type: "attacker", x: 6.8, y: 7.5, label: "1" },
      { id: "2", type: "attacker", x: 9.5, y: 3.5, label: "2" },
      { id: "3", type: "attacker", x: 9.5, y: 11.5, label: "3" },
      { id: "4", type: "attacker", x: 12.0, y: 5.6, label: "4" },
      { id: "5", type: "attacker", x: 12.0, y: 9.4, label: "5" },
    ],
    actions: [
      {
        id: "p1",
        type: "pass",
        from: { x: 1.6, y: 7.5 },
        to: { x: 6.8, y: 7.5 },
        label: "entrée",
        order: 1,
      },
      {
        id: "p2",
        type: "dribble",
        from: { x: 6.8, y: 7.5 },
        to: { x: 5.4, y: 7.5 },
        label: "retreat",
        order: 2,
      },
      {
        id: "p3",
        type: "pass",
        from: { x: 5.4, y: 7.5 },
        to: { x: 12.0, y: 5.6 },
        label: "axe",
        order: 3,
      },
    ],
  },

  {
    id: "pnr-drop-short-roll",
    title: "PnR : lecture vs drop",
    category: "U18",
    theme: "Pick and Roll",
    tags: ["drop", "short roll", "spacing"],
    objective:
      "Créer l’avantage sur pick and roll, empêcher le défenseur de passer dessous et punir la défense drop par spacing 2/3 et short roll.",
    instructions: [
      "Poser un angle screen",
      "Le porteur attaque l’opposé de l’écran",
      "Le poseur lit short roll / dive / pop",
      "Les extérieurs s’adaptent au spacing autour du PnR",
      "Interdire deux passages dessous",
    ],
    coachingPoints: [
      "Jouer avec vitesse sur l’ouverture",
      "Créer l’incertitude : posé / feinté / inversé",
      "Décider sur la réaction du défenseur intérieur",
    ],
    variables: [
      "Vs Drop",
      "Vs Ice",
      "Vs Switch",
      "Vs Hard hedge",
    ],
    successCriteria: [
      "Avantage créé sur le premier écran",
      "Défense intérieure déplacée ou désaxée",
      "Lecture juste short roll / kick-out / finition",
    ],
    elements: [
      { id: "1", type: "attacker", x: 8.0, y: 7.5, label: "1" },
      { id: "5", type: "attacker", x: 11.6, y: 7.5, label: "5" },
      { id: "2", type: "attacker", x: 21.8, y: 3.0, label: "2" },
      { id: "3", type: "attacker", x: 24.2, y: 7.5, label: "3" },
      { id: "4", type: "attacker", x: 21.8, y: 12.0, label: "4" },
      {
        id: "z-pnr",
        type: "zone",
        x: 15.4,
        y: 7.5,
        width: 3.4,
        height: 2.8,
        label: "short roll",
        color: "rgba(16,185,129,0.18)",
      },
    ],
    actions: [
      {
        id: "1",
        type: "screen",
        from: { x: 11.2, y: 7.5 },
        to: { x: 12.8, y: 7.5 },
        label: "angle",
        order: 1,
      },
      {
        id: "2",
        type: "dribble",
        from: { x: 8.0, y: 7.5 },
        to: { x: 14.5, y: 5.8 },
        label: "attaque opposé",
        order: 2,
      },
      {
        id: "3",
        type: "pass",
        from: { x: 14.5, y: 5.8 },
        to: { x: 15.4, y: 7.5 },
        label: "short roll",
        order: 3,
      },
    ],
  },

  {
    id: "read-react-layer1",
    title: "Read & React : Pass & Cut",
    category: "U13",
    theme: "Lire et réagir",
    tags: ["backdoor", "read and react"],
    objective:
      "Installer la couche 1 du Read & React : pass & cut fort, finition au cercle, remplacement au-dessus.",
    instructions: [
      "Après chaque passe vers le périmètre : cut marquant",
      "Finir la coupe au cercle",
      "Le joueur au-dessus remplit l’espace vide",
    ],
    coachingPoints: [
      "Coupe pour marquer",
      "Timing du fill",
      "Pas de stationnement",
    ],
    variables: [
      "Ajouter dribble-at backdoor",
      "Ajouter reverse circle",
    ],
    successCriteria: [
      "Coupe finie au cercle",
      "Spot libre immédiatement remplacé",
      "Continuité de jeu sans arrêt",
    ],
    elements: [
      { id: "1", type: "attacker", x: 7.2, y: 7.5, label: "1" },
      { id: "2", type: "attacker", x: 14.0, y: 4.0, label: "2" },
      { id: "3", type: "attacker", x: 14.0, y: 11.0, label: "3" },
      { id: "4", type: "attacker", x: 22.0, y: 4.0, label: "4" },
      { id: "5", type: "attacker", x: 22.0, y: 11.0, label: "5" },
    ],
    actions: [
      {
        id: "rr1",
        type: "pass",
        from: { x: 7.2, y: 7.5 },
        to: { x: 14.0, y: 4.0 },
        label: "pass",
        order: 1,
      },
      {
        id: "rr2",
        type: "cut",
        from: { x: 7.2, y: 7.5 },
        to: { x: 24.2, y: 7.5 },
        label: "cut marquant",
        order: 2,
      },
      {
        id: "rr3",
        type: "move",
        from: { x: 14.0, y: 11.0 },
        to: { x: 7.2, y: 7.5 },
        label: "fill",
        order: 3,
      },
    ],
  },

  {
    id: "swing-ucla-flex",
    title: "Swing : UCLA + Flex",
    category: "U18",
    theme: "Swing offense",
    tags: ["ucla", "flex"],
    objective:
      "Installer les actions principales Swing : UCLA screen, weak side exchange et flex screen.",
    instructions: [
      "Passer à l’aile = UCLA depuis le poste bas",
      "Échange weak side après la passe aile",
      "Passage slot-to-slot = flex screen du poste bas",
      "Chercher la peinture en priorité",
    ],
    coachingPoints: [
      "Coupes en V sur l’aile",
      "Angle des écrans",
      "Regard intérieur immédiat",
    ],
    variables: [
      "Ajouter post entry",
      "Ajouter baseline drive reaction",
    ],
    successCriteria: [
      "Ballon entré dans la peinture",
      "UCLA et flex enchaînés proprement",
      "Défense obligée de garder deux actions de suite",
    ],
    elements: [
      { id: "1", type: "attacker", x: 8.0, y: 4.0, label: "1" },
      { id: "4", type: "attacker", x: 8.0, y: 11.0, label: "4" },
      { id: "2", type: "attacker", x: 15.0, y: 3.2, label: "2" },
      { id: "3", type: "attacker", x: 15.0, y: 11.8, label: "3" },
      { id: "5", type: "attacker", x: 23.8, y: 10.8, label: "5" },
    ],
    actions: [
      {
        id: "s1",
        type: "pass",
        from: { x: 8.0, y: 4.0 },
        to: { x: 15.0, y: 3.2 },
        label: "wing entry",
        order: 1,
      },
      {
        id: "s2",
        type: "screen",
        from: { x: 23.8, y: 10.8 },
        to: { x: 18.5, y: 6.0 },
        label: "UCLA",
        order: 2,
      },
      {
        id: "s3",
        type: "cut",
        from: { x: 8.0, y: 4.0 },
        to: { x: 23.4, y: 6.6 },
        label: "cut",
        order: 3,
      },
    ],
  },

  {
    id: "shooting-drive-kick",
    title: "Tir : drive and kick corner",
    category: "U15",
    theme: "Tir",
    tags: ["drive and kick", "shooting"],
    objective:
      "Créer un tir ouvert après pénétration et ressortie vers le corner, avec lecture et rythme de tir.",
    instructions: [
      "Attaquer la brèche en 2 dribbles agressifs",
      "Fixer avant ressortie",
      "Corner prêt sur les appuis",
    ],
    coachingPoints: [
      "Passer dans le tir",
      "Sortie d’appuis équilibrée",
      "Shot fake + drive en evolution",
    ],
    variables: [
      "Ajouter 1 closeout",
      "Corner 3 pts ou mi-distance selon âge",
    ],
    successCriteria: [
      "Pénétration déclenche aide",
      "Passe ressortie dans le timing",
      "Tir pris en équilibre",
    ],
    elements: [
      { id: "5", type: "coach", x: 2.2, y: 7.5, label: "R" },
      { id: "3", type: "attacker", x: 7.0, y: 12.0, label: "3" },
      { id: "2", type: "attacker", x: 13.5, y: 7.5, label: "2" },
      { id: "4", type: "attacker", x: 22.5, y: 12.0, label: "4" },
    ],
    actions: [
      {
        id: "dk1",
        type: "dribble",
        from: { x: 7.0, y: 12.0 },
        to: { x: 14.8, y: 8.7 },
        label: "drive",
        order: 1,
      },
      {
        id: "dk2",
        type: "pass",
        from: { x: 14.8, y: 8.7 },
        to: { x: 22.5, y: 12.0 },
        label: "kick",
        order: 2,
      },
      {
        id: "dk3",
        type: "shot",
        from: { x: 22.5, y: 12.0 },
        to: { x: 27.1, y: 7.5 },
        label: "3 pts",
        order: 3,
      },
    ],
  },

  {
    id: "layup-russian",
    title: "Lay-up : russian layups",
    category: "U13",
    theme: "Lay-up / finition",
    tags: ["layup", "transition"],
    objective:
      "Finir à pleine vitesse après longue passe et sprint, avec coordination, communication et endurance spécifique.",
    instructions: [
      "Longue passe devant",
      "Sprint plein terrain",
      "Reception en course",
      "Finir proprement sans ralentir excessivement",
    ],
    coachingPoints: [
      "Longs pas sur lay-up",
      "Appeler la balle",
      "Passe tendue et plate",
    ],
    variables: [
      "Main forte / main faible",
      "Sans dribble avant la longue passe",
    ],
    successCriteria: [
      "Passe précise",
      "Réception dans le timing",
      "Finition réussie à pleine vitesse",
    ],
    elements: [
      { id: "1", type: "attacker", x: 4.2, y: 12.0, label: "1" },
      { id: "2", type: "attacker", x: 14.0, y: 7.5, label: "2" },
      { id: "3", type: "attacker", x: 23.0, y: 4.0, label: "3" },
    ],
    actions: [
      {
        id: "rl1",
        type: "pass",
        from: { x: 4.2, y: 12.0 },
        to: { x: 14.0, y: 7.5 },
        label: "longue passe",
        order: 1,
      },
      {
        id: "rl2",
        type: "move",
        from: { x: 4.2, y: 12.0 },
        to: { x: 23.0, y: 4.0 },
        label: "sprint",
        order: 2,
      },
      {
        id: "rl3",
        type: "pass",
        from: { x: 14.0, y: 7.5 },
        to: { x: 23.0, y: 4.0 },
        label: "remise",
        order: 3,
      },
      {
        id: "rl4",
        type: "shot",
        from: { x: 23.0, y: 4.0 },
        to: { x: 27.1, y: 7.5 },
        label: "lay-up",
        order: 4,
      },
    ],
  },
];
