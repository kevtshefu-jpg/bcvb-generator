export type ManualPromptInput = {
  generationType: string
  sourceTitle?: string
  sourceContent?: string
  userInstruction?: string
  useBcvbIdentity?: boolean
  useFfbbFrame?: boolean
  useEuropeanTrends?: boolean
  useUsCanadaApproach?: boolean
  useOperationalApproach?: boolean
}

export function buildManualPrompt(input: ManualPromptInput) {
  const {
    generationType,
    sourceTitle,
    sourceContent,
    userInstruction,
    useBcvbIdentity,
    useFfbbFrame,
    useEuropeanTrends,
    useUsCanadaApproach,
    useOperationalApproach,
  } = input

  return `
Tu es un assistant expert en basket-ball, formation de coachs, pédagogie sportive et structuration de documents techniques pour un club.

Tu dois créer un document complet, propre, structuré et directement exploitable pour le BCVB.

CONTEXTE CLUB :
- Club : BCVB
- Philosophie : Défendre Fort, Courir et Partager la Balle
- Identité prioritaire : défense Homme à Homme
- Valeurs fortes : intensité, agressivité, maîtrise, jeu
- Démarche pédagogique : je découvre / je m’exerce / je retranscris en match / je régule
- Public cible : coachs, joueurs, responsables techniques ou dirigeants selon le document demandé
- Style attendu : clair, humain, structuré, terrain, concret, sans blabla inutile

TYPE DE DOCUMENT À PRODUIRE :
${generationType || 'Document technique structuré'}

OPTIONS À INTÉGRER :
${useBcvbIdentity ? '- Intégrer fortement l’identité BCVB.\n' : ''}
${useFfbbFrame ? '- Ajouter une lecture cohérente avec les repères FFBB / DTN / directives nationales.\n' : ''}
${useEuropeanTrends ? '- Ajouter une lecture inspirée des tendances européennes modernes.\n' : ''}
${useUsCanadaApproach ? '- Ajouter une approche inspirée du développement individuel et collectif US / Canada.\n' : ''}
${useOperationalApproach ? '- Rendre le document très opérationnel, utilisable immédiatement sur le terrain.\n' : ''}

TITRE OU THÈME SOURCE :
${sourceTitle || 'Non renseigné'}

CONSIGNE SPÉCIFIQUE :
${userInstruction || 'Aucune consigne spécifique supplémentaire.'}

CONTENU SOURCE :
${sourceContent || 'Aucun contenu source fourni.'}

STRUCTURE ATTENDUE :
1. Titre clair
2. Introduction courte
3. Objectifs du document
4. Public concerné
5. Principes clés
6. Organisation détaillée
7. Contenus opérationnels
8. Points de vigilance
9. Critères de réussite
10. Tableau de synthèse
11. Conclusion directement exploitable

EXIGENCE DE RÉDACTION :
- Écris en français.
- Utilise des titres clairs.
- Utilise des tableaux quand c’est pertinent.
- Donne des exemples concrets.
- Le document doit pouvoir être copié dans un cahier technique, une fiche coach ou une bibliothèque de club.
- Ne réponds pas comme une IA. Rédige comme un responsable technique expérimenté qui prépare un vrai document club.
`.trim()
}