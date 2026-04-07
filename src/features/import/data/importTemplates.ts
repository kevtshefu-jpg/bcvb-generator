export type ImportTemplateType =
  | 'joueurs'
  | 'inscriptions'
  | 'progression'

export type TemplateColumn = {
  key: string
  label: string
  required?: boolean
  example?: string
}

export type ImportTemplate = {
  type: ImportTemplateType
  title: string
  description: string
  columns: TemplateColumn[]
}

export const importTemplates: ImportTemplate[] = [
  {
    type: 'joueurs',
    title: 'Modèle joueurs',
    description: 'Import initial ou mise à jour d’un effectif joueur.',
    columns: [
      { key: 'prenom', label: 'Prénom', required: true, example: 'Léo' },
      { key: 'nom', label: 'Nom', required: true, example: 'Martin' },
      { key: 'email', label: 'Email', example: 'leo.martin@email.com' },
      { key: 'telephone', label: 'Téléphone', example: '0612345678' },
      { key: 'annee_naissance', label: 'Année de naissance', example: '2012' },
      { key: 'categorie', label: 'Catégorie', required: true, example: 'U13' },
      { key: 'equipe', label: 'Équipe', example: 'U13M2' },
      { key: 'numero_licence', label: 'N° licence', example: 'VT123456' },
    ],
  },
  {
    type: 'inscriptions',
    title: 'Modèle inscriptions',
    description: 'Demandes d’inscription ou pré-inscriptions visiteurs.',
    columns: [
      { key: 'prenom', label: 'Prénom', required: true, example: 'Emma' },
      { key: 'nom', label: 'Nom', required: true, example: 'Bernard' },
      { key: 'email', label: 'Email', required: true, example: 'emma@email.com' },
      { key: 'telephone', label: 'Téléphone', example: '0611223344' },
      { key: 'annee_naissance', label: 'Année de naissance', example: '2015' },
      { key: 'categorie_demandee', label: 'Catégorie demandée', required: true, example: 'U11' },
      { key: 'notes', label: 'Notes', example: 'Découverte basket' },
    ],
  },
  {
    type: 'progression',
    title: 'Modèle progression fondamentaux',
    description: 'Import ou export de suivi individuel des fondamentaux.',
    columns: [
      { key: 'player_id', label: 'ID joueur', required: true, example: 'uuid...' },
      { key: 'prenom', label: 'Prénom', example: 'Noah' },
      { key: 'nom', label: 'Nom', example: 'Dupont' },
      { key: 'fundamental_key', label: 'Code fondamental', required: true, example: 'dribble_main_faible' },
      { key: 'mastery_level', label: 'Niveau 0-4', required: true, example: '3' },
      { key: 'note', label: 'Note coach', example: 'Plus constant sous pression' },
    ],
  },
]