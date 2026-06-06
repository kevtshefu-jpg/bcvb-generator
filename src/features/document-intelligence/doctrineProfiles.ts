import type { DoctrineId, DoctrineProfile } from './types';

export const DOCTRINE_PROFILES: Record<DoctrineId, DoctrineProfile> = {
  bcvb: {
    id: 'bcvb',
    label: 'Référentiel BCVB',
    description:
      "Identité club, philosophie de jeu, démarche pédagogique et exigences internes.",
    recommendedFor: [
      'U7', 'U9', 'U11', 'U13', 'U15', 'U18', 'U21', 'Seniors', 'General',
    ],
    promptInstruction: `
Le document doit être profondément ancré dans l'identité BCVB :
- Philosophie : Défendre Fort, Courir et Partager la Balle.
- Identité prioritaire : défense Homme à Homme.
- Valeurs : intensité, agressivité maîtrisée, maîtrise, jeu.
- Démarche pédagogique : je découvre / je m'exerce / je retranscris en match / je régule.
- Le rendu doit toujours être utile au terrain, à la formation des coachs et à la structuration club.
`,
  },

  ffbb: {
    id: 'ffbb',
    label: 'Cadre FFBB',
    description:
      'Repères français, catégories, pratiques fédérales, cohérence avec les logiques de formation nationales.',
    recommendedFor: ['U7', 'U9', 'U11', 'U13', 'U15', 'U18', 'General'],
    promptInstruction: `
Mobilise une lecture cohérente avec le cadre français de formation :
- Catégories d'âge ;
- pédagogie mini-basket et jeunes ;
- cohérence club / formation ;
- lisibilité pour des coachs bénévoles, salariés et responsables techniques ;
- vocabulaire compatible avec un document technique français.
`,
  },

  fiba: {
    id: 'fiba',
    label: 'Repères FIBA / internationaux',
    description:
      'Principes universels de jeu, standards d’enseignement, culture basket internationale.',
    recommendedFor: ['U11', 'U13', 'U15', 'U18', 'U21', 'Seniors', 'General'],
    promptInstruction: `
Intègre des repères internationaux utiles :
- fondamentaux universels ;
- lecture du jeu ;
- prise d'information ;
- enseignement progressif ;
- cohérence entre apprentissage technique et situations de jeu.
`,
  },

  europe: {
    id: 'europe',
    label: 'Formation européenne',
    description:
      'Développement du joueur complet, richesse tactique progressive, intelligence de jeu.',
    recommendedFor: ['U13', 'U15', 'U18', 'U21', 'Seniors'],
    promptInstruction: `
Ajoute une sensibilité issue des logiques européennes de formation :
- compréhension du jeu ;
- polyvalence ;
- lecture collective ;
- progression vers l'exigence tactique ;
- formation du joueur complet avant spécialisation excessive.
`,
  },

  usa: {
    id: 'usa',
    label: 'Formation américaine',
    description:
      'Player development, skills, séquences d’apprentissage, culture du détail et de la répétition.',
    recommendedFor: ['U9', 'U11', 'U13', 'U15', 'U18', 'U21', 'Seniors'],
    promptInstruction: `
Ajoute une approche orientée player development :
- précision des skills ;
- répétition de qualité ;
- progression des contraintes ;
- développement individuel utile au collectif ;
- situations très opérationnelles et directement coachables.
`,
  },

  canada: {
    id: 'canada',
    label: 'Approche canadienne / développement à long terme',
    description:
      'Progression par âge, maturation, polyvalence et développement moteur durable.',
    recommendedFor: ['U7', 'U9', 'U11', 'U13', 'U15'],
    promptInstruction: `
Ajoute une lecture centrée sur le développement à long terme :
- âge développemental ;
- motricité ;
- polyvalence ;
- rapport entre plaisir, sécurité et progression ;
- prévention de la spécialisation trop précoce ;
- adaptation des contenus à la maturation des jeunes.
`,
  },

  custom: {
    id: 'custom',
    label: 'Sources spécifiques sélectionnées',
    description:
      'Documents BCVB ou ressources internes choisies dans la bibliothèque.',
    recommendedFor: [
      'U7', 'U9', 'U11', 'U13', 'U15', 'U18', 'U21', 'Seniors', 'General',
    ],
    promptInstruction: `
Exploite les documents source sélectionnés comme références de fond, de style ou d'exigence.
Ne pas les citer mécaniquement : les utiliser pour enrichir la structure, les priorités et la qualité du document.
`,
  },
};
