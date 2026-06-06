import { createCourtFrame, createMetric, createSession, createSituation, sessionCategories, type SessionCategory, type TrainingSessionV2 } from './sessionModels'

function templateCourtFrames(title: string) {
  const shortTitle = title.length > 22 ? 'Organisation terrain' : title
  return [
    createCourtFrame({ title: shortTitle, courtType: 'half-right', intent: 'Mise en place et espaces de départ' }),
    createCourtFrame({ title: 'Déclenchement', courtType: 'half-right', intent: 'Course, passe ou fixation principale' }),
    createCourtFrame({ title: 'Lecture / évolution', courtType: 'half-left', intent: 'Réponse défensive ou adaptation coach' }),
  ]
}

function situation(order: number, title: string, durationMinutes: number, objective: string, theme: string) {
  return createSituation({
    order,
    title,
    durationMinutes,
    theme,
    objective,
    organization: 'Groupes courts, rotations actives, consignes simples et feedback immédiat.',
    description: 'Mise en activité progressive avec contrainte BCVB et lecture du comportement joueur.',
    instructions: 'Intensité maîtrisée, communication, respect des espaces, recherche de transfert match.',
    evolutions: ['Ajouter opposition', 'Réduire le temps de décision'],
    regressions: ['Agrandir l’espace', 'Réduire la pression défensive'],
    variables: ['Espace', 'Temps', 'Nombre de dribbles', 'Type d’opposition'],
    equipment: ['Ballons', 'Plots', 'Chasubles'],
    playerCount: '8 à 12',
    oppositionType: 'Opposition progressive',
    bcvbLinks: {
      defendreFort: 'On cherche à gêner, orienter et reprendre vite une posture défensive.',
      courir: 'Chaque récupération déclenche une course utile vers l’avant.',
      partager: 'Le ballon circule vers le joueur le mieux placé.',
      hommeHomme: 'Chacun assume son joueur avant d’aider.',
      intensite: 'Rythme élevé avec rotations courtes.',
      agressiviteMaitrisee: 'Pression sans faute et contact contrôlé.',
      maitrise: 'Décider vite sans perdre le contrôle technique.',
      jeu: 'Transformer l’exercice en lecture de jeu.',
    },
    coachingPoints: 'Valoriser l’intention, corriger un point à la fois, maintenir le rythme.',
    expectedSuccessCriteria: 'Les joueurs comprennent la consigne et restent actifs.',
    observableCriteria: ['Posture', 'Communication', 'Vitesse de replacement', 'Choix de passe ou tir'],
    measurableCriteria: ['Objectif chiffré défini dans les critères'],
    evaluationNotes: 'Noter les joueurs autonomes et les points à reprendre.',
    metrics: [
      createMetric({ label: 'Actions réussies', type: 'count', target: '7', observed: '', unit: '/10' }),
      createMetric({ label: 'Intensité', type: 'rating', target: '4', observed: '', unit: '/5' }),
    ],
    courtFrames: templateCourtFrames(title),
  })
}

const templateData: Partial<Record<SessionCategory, Partial<TrainingSessionV2>>> = {
  U7: {
    title: 'U7 - Motricité, ballon et plaisir',
    category: 'U7',
    durationMinutes: 60,
    theme: 'Motricité et manipulation',
    intensityLevel: 'low',
    objectives: ['Manipuler', 'Se déplacer', 'Respecter un cadre simple'],
    keyFocus: ['Plaisir', 'Peu d’attente', 'Repères simples'],
    equipment: ['Ballons taille adaptée', 'Plots', 'Cercles'],
    expectedPlayers: 10,
    situations: [
      situation(1, 'Parcours ballon', 10, 'Découvrir les déplacements avec ballon.', 'Appuis'),
      situation(2, 'Jeux de poursuite', 12, 'Courir, éviter, changer de direction.', 'Courir'),
      situation(3, 'Tirs proches', 12, 'Marquer proche du cercle.', 'Tir'),
      situation(4, 'Mini-match guidé', 18, 'Jouer avec règles simples.', 'Jeu'),
    ],
  },
  U9: {
    title: 'U9 - Dribble, passe, tir proche',
    category: 'U9',
    durationMinutes: 75,
    theme: 'Fondamentaux et petits jeux',
    objectives: ['Dribbler sous contrôle', 'Passer', 'Tirer proche'],
    keyFocus: ['Petits jeux nombreux', 'Repères collectifs', 'Plaisir'],
    equipment: ['Ballons', 'Plots', 'Chasubles'],
    expectedPlayers: 12,
    situations: [
      situation(1, 'Activation dribble', 10, 'Garder la maîtrise du ballon.', 'Dribble'),
      situation(2, 'Passe et course', 15, 'Passer puis se déplacer.', 'Passe'),
      situation(3, 'Tir proche après dribble', 15, 'Finir près du cercle.', 'Tir'),
      situation(4, '2c2 jeu réduit', 25, 'Trouver un partenaire libre.', 'Partager la Balle'),
    ],
  },
  U11: {
    title: 'U11 - 1c1, espaces et transition',
    category: 'U11',
    durationMinutes: 90,
    theme: 'Fondamentaux et lecture simple',
    objectives: ['Attaquer le cercle', 'Occuper les espaces', 'Courir en transition'],
    keyFocus: ['1c1', 'Occupation espace', 'Transition'],
    equipment: ['Ballons', 'Plots', 'Chasubles', 'Chronomètre'],
    expectedPlayers: 12,
    situations: [
      situation(1, 'Appuis et départs', 12, 'Améliorer le premier appui.', 'Appuis'),
      situation(2, '1c1 couloir', 18, 'Attaquer avec intention.', '1 contre 1'),
      situation(3, '2c1 transition', 18, 'Courir et décider vite.', 'Transition offensive'),
      situation(4, '3c3 espaces', 25, 'Garder largeur et profondeur.', 'Lecture de jeu'),
    ],
  },
  U13: {
    title: 'Défense H-H, pression porteur et jeu rapide',
    category: 'U13',
    durationMinutes: 90,
    theme: 'Défense Homme à Homme et jeu rapide',
    cycle: 'Défendre Fort / Courir',
    objectives: ['Mettre de la pression contrôlée', 'Relancer vite après stop', 'Lire l’aide simple'],
    keyFocus: ['Homme à Homme', 'Défendre Fort', 'Courir', 'Agressivité maîtrisée'],
    equipment: ['Ballons', 'Plots', 'Chasubles', 'Chronomètre', 'Tableau'],
    expectedPlayers: 12,
    summary: 'Séance U13 complète pour installer pression porteur, aide simple et relance rapide.',
    situations: [
      situation(1, 'Accueil + activation', 8, 'Entrer vite dans l’intensité avec ballon.', 'Courir'),
      situation(2, 'Appuis défensifs + miroir', 12, 'Se placer, glisser, contenir.', 'Défendre Fort'),
      situation(3, '1c1 couloir contact contrôlé', 15, 'Mettre pression sans faute et orienter.', '1 contre 1'),
      situation(4, '2c2 aide simple côté ballon', 15, 'Aider puis reprendre son joueur.', 'Défense Homme à Homme'),
      situation(5, '3c3 stop + relance', 20, 'Enchaîner stop défensif et jeu rapide.', 'Transition offensive'),
      situation(6, 'Jeu dirigé contrainte défensive', 15, 'Transférer les règles en opposition.', 'Jeu'),
      situation(7, 'Bilan', 5, 'Verbaliser les acquis et le lien séance suivante.', 'Je régule'),
    ],
  },
  U15: {
    title: 'U15 - Intensité défensive et lecture collective',
    category: 'U15',
    durationMinutes: 100,
    theme: 'Agressivité défensive et jeu rapide',
    objectives: ['Augmenter l’intensité', 'Lire les aides', 'Jouer vite sans précipitation'],
    keyFocus: ['Intensité', 'Agressivité maîtrisée', 'Lecture collective'],
    equipment: ['Ballons', 'Chasubles', 'Plots', 'Chronomètre'],
    expectedPlayers: 12,
    situations: [
      situation(1, 'Activation haute intensité', 12, 'Mettre le rythme.', 'Intensité'),
      situation(2, '1c1 pression + contest', 18, 'Contenir et gêner le tir.', 'Défendre Fort'),
      situation(3, '3c3 rotations défensives', 22, 'Communiquer les aides.', 'Communication'),
      situation(4, '4c4 jeu rapide contrôlé', 30, 'Courir avec maîtrise.', 'Courir'),
    ],
  },
  U18: {
    title: 'U18 - Rythme, tactique et autonomie',
    category: 'U18',
    durationMinutes: 105,
    theme: 'Exigences tactiques et opposition',
    objectives: ['Tenir un rythme élevé', 'Adapter les choix', 'Responsabiliser le groupe'],
    keyFocus: ['Autonomie', 'Opposition', 'Précision tactique'],
    equipment: ['Ballons', 'Chasubles', 'Chronomètre', 'Tableau'],
    expectedPlayers: 12,
    situations: [
      situation(1, 'Activation compétitive', 12, 'Installer le niveau d’exigence.', 'Intensité'),
      situation(2, 'Situations spéciales', 20, 'Lire score et temps.', 'Lecture de jeu'),
      situation(3, '5c5 contraintes défensives', 35, 'Exécuter avec communication.', 'Tactique collective'),
      situation(4, 'Fin de match', 25, 'Décider sous pression.', 'Préparation match'),
    ],
  },
  Seniors: {
    title: 'Seniors - Préparation match et précision tactique',
    category: 'Seniors',
    durationMinutes: 110,
    theme: 'Performance et préparation match',
    objectives: ['Préparer le plan de match', 'Renforcer précision tactique', 'Contrôler l’intensité'],
    keyFocus: ['Performance', 'Préparation match', 'Intensité contrôlée'],
    equipment: ['Ballons', 'Chasubles', 'Tableau', 'Vidéo si disponible'],
    expectedPlayers: 12,
    situations: [
      situation(1, 'Échauffement spécifique', 12, 'Préparer les patterns du match.', 'Préparation match'),
      situation(2, 'Séquences tactiques', 28, 'Répéter les options clés.', 'Tactique collective'),
      situation(3, '5c5 scouting', 35, 'Jouer contre contraintes adverses.', 'Lecture de jeu'),
      situation(4, 'Fin de séance précision', 20, 'Stabiliser les détails.', 'Maîtrise'),
    ],
  },
}

export const SESSION_TEMPLATES = Object.values(templateData).map((template) =>
  createSession({
    ...template,
    teamLabel: '',
    coachName: '',
    location: '',
    date: '',
    season: '2025-2026',
    sessionType: 'development',
    status: 'draft',
  })
)

export function getSessionTemplate(category: SessionCategory, type = 'development') {
  const fallbackCategory = sessionCategories.includes(category) ? category : 'U13'
  const template = templateData[fallbackCategory] || templateData.U13 || {}

  return createSession({
    ...template,
    sessionType: type as TrainingSessionV2['sessionType'],
    season: '2025-2026',
    status: 'draft',
  })
}
