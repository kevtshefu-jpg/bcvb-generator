import type { EditorialStudioModeOption, EditorialStudioWorkflowItem } from '../types/editorialStudioTypes'

export const editorialStudioModeOptions: EditorialStudioModeOption[] = [
  {
    id: 'creation',
    title: 'Créer un document',
    description: 'Partir d’une intention claire pour générer une première version structurée.',
    recommendation: 'Idéal pour un guide coach, une fiche séance ou un support familles.',
  },
  {
    id: 'edition',
    title: 'Transformer un texte',
    description: 'Reprendre une source brute, OCR ou note admin pour la rendre exploitable.',
    recommendation: 'À utiliser après import PDF, image, DOCX ou copier-coller.',
  },
  {
    id: 'improvement',
    title: 'Améliorer',
    description: 'Retravailler un contenu existant : clarté, structure, style, précision.',
    recommendation: 'Utile quand le document existe déjà mais n’est pas encore publiable.',
  },
  {
    id: 'validation',
    title: 'Contrôler la qualité',
    description: 'Vérifier les oublis, les incohérences et la conformité BCVB.',
    recommendation: 'À lancer avant diffusion, export ou validation commission sportive.',
  },
  {
    id: 'export',
    title: 'Exporter',
    description: 'Préparer une version finale partageable et archivable.',
    recommendation: 'À utiliser quand le contenu, la qualité et la prévisualisation sont prêts.',
  },
]

export const editorialStudioWorkflowItems: EditorialStudioWorkflowItem[] = [
  {
    label: 'Intention',
    help: 'Définir le besoin réel du document.',
  },
  {
    label: 'Contenu',
    help: 'Rédiger ou importer la matière de départ.',
  },
  {
    label: 'Amélioration',
    help: 'Structurer, clarifier, enrichir.',
  },
  {
    label: 'Contrôle qualité',
    help: 'Vérifier la cohérence et l’utilité.',
  },
  {
    label: 'Export',
    help: 'Produire une version partageable.',
  },
]

export const editorialPromptShortcuts = [
  'Rendre plus structuré',
  'Rendre plus opérationnel',
  'Adapter pour jeunes coachs',
  'Adapter au style BCVB',
  'Créer une version synthétique',
  'Créer une version complète',
]
