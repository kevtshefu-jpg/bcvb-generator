import { useMemo, useRef, useState } from 'react'

import {
  MobileModuleGrid,
  MobilePageHero,
  MobilePageShell,
  MobileQuickActions,
  MobileSectionTabs,
  type MobileModuleCard,
} from '../../../components/mobile'

export type LibraryMobileDocument = {
  id: string
  title: string
  description?: string | null
  family?: string | null
  mainCategory?: string | null
  subCategory?: string | null
  theme?: string | null
  audience?: string | null
  type?: string | null
  status?: string | null
  publicationLevel?: string | null
  updatedAt?: string | null
  createdAt?: string | null
  to?: string
  locked?: boolean
  canPreview?: boolean
  canDownload?: boolean
  canTransform?: boolean
}

type LibraryMobileExperienceProps = {
  documents?: LibraryMobileDocument[]
  isAdmin?: boolean
  isCoach?: boolean
  isLoading?: boolean
  error?: string | null
  onPreviewDocument?: (documentId: string) => void
  onDownloadDocument?: (documentId: string) => void
  onTransformDocument?: (documentId: string) => void
}

const fallbackDocuments: LibraryMobileDocument[] = [
  {
    id: 'cadre-coach',
    title: 'Le cadre du coach BCVB',
    description: 'Repères communs, posture coach et exigences club.',
    family: 'Cadre club',
    mainCategory: 'Coach',
    theme: 'Identité BCVB',
    audience: 'Tous coachs',
    type: 'PDF',
    status: 'Publié',
    updatedAt: 'Référence club',
    canPreview: true,
  },
  {
    id: 'cahier-u15',
    title: 'Cahier technique U15',
    description: 'Défense H-H, intensité, agressivité, maîtrise et jeu.',
    family: 'Technique',
    mainCategory: 'Formation joueur',
    subCategory: 'U15',
    theme: 'Défense Homme à Homme',
    audience: 'Coachs',
    type: 'Document',
    status: 'Publié',
    updatedAt: 'Saison 2025-2026',
    canPreview: true,
  },
  {
    id: 'referentiel-mini',
    title: 'Référentiel mini-basket',
    description: 'Repères U7, U9, U11 et progression pédagogique.',
    family: 'Mini-basket',
    mainCategory: 'Formation joueur',
    subCategory: 'U7-U11',
    theme: 'Apprentissage',
    audience: 'Coachs jeunes',
    type: 'Document',
    status: 'Publié',
    updatedAt: 'À consulter',
    canPreview: true,
  },
  {
    id: 'faq-platform',
    title: 'FAQ plateforme BCVB',
    description: 'Connexion, droits, documents, exports et résolution rapide.',
    family: 'Aide',
    mainCategory: 'Support',
    theme: 'Plateforme',
    audience: 'Tous',
    type: 'Aide',
    status: 'Publié',
    updatedAt: 'Support',
    to: '/faq',
    canPreview: true,
  },
]

const tabs = [
  { id: 'all', label: 'Tous', icon: '📚' },
  { id: 'coach', label: 'Coachs', icon: '🏀' },
  { id: 'formation', label: 'Formation', icon: '🎯' },
  { id: 'admin', label: 'Admin', icon: '⚙️' },
  { id: 'aide', label: 'Aide', icon: '❔' },
]

function normalize(value?: string | null) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function formatDocumentDate(value?: string | null) {
  if (!value) return undefined

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function buildSearchText(document: LibraryMobileDocument) {
  return normalize(
    [
      document.title,
      document.description,
      document.family,
      document.mainCategory,
      document.subCategory,
      document.theme,
      document.audience,
      document.type,
      document.status,
      document.publicationLevel,
    ]
      .filter(Boolean)
      .join(' '),
  )
}

function getDocumentIcon(document: LibraryMobileDocument) {
  const searchText = buildSearchText(document)

  if (searchText.includes('pdf')) return '📄'
  if (searchText.includes('coach')) return '🏀'
  if (searchText.includes('u7') || searchText.includes('u9') || searchText.includes('u11')) return '👶'
  if (searchText.includes('u13') || searchText.includes('u15') || searchText.includes('u18')) return '🎯'
  if (searchText.includes('admin') || searchText.includes('qualite') || searchText.includes('publication')) return '⚙️'
  if (searchText.includes('faq') || searchText.includes('aide') || searchText.includes('support')) return '❔'
  if (searchText.includes('planning') || searchText.includes('planification')) return '🗓️'
  if (searchText.includes('charte') || searchText.includes('cadre')) return '🛡️'

  return '📚'
}

function getDocumentBadge(document: LibraryMobileDocument) {
  return (
    document.subCategory ||
    document.mainCategory ||
    document.family ||
    document.type ||
    'Document'
  )
}

function getDocumentMeta(document: LibraryMobileDocument) {
  const updatedAt = formatDocumentDate(document.updatedAt)

  return [
    document.audience,
    document.type,
    updatedAt,
  ]
    .filter(Boolean)
    .join(' · ')
}

function matchActiveTab(document: LibraryMobileDocument, activeTab: string) {
  const searchText = buildSearchText(document)

  if (activeTab === 'all') return true

  if (activeTab === 'coach') {
    return (
      searchText.includes('coach') ||
      searchText.includes('terrain') ||
      searchText.includes('seance') ||
      searchText.includes('technique')
    )
  }

  if (activeTab === 'formation') {
    return (
      searchText.includes('formation') ||
      searchText.includes('u7') ||
      searchText.includes('u9') ||
      searchText.includes('u11') ||
      searchText.includes('u13') ||
      searchText.includes('u15') ||
      searchText.includes('u18') ||
      searchText.includes('joueur')
    )
  }

  if (activeTab === 'admin') {
    return (
      searchText.includes('admin') ||
      searchText.includes('qualite') ||
      searchText.includes('publication') ||
      searchText.includes('import') ||
      searchText.includes('export')
    )
  }

  if (activeTab === 'aide') {
    return (
      searchText.includes('faq') ||
      searchText.includes('aide') ||
      searchText.includes('support') ||
      searchText.includes('connexion')
    )
  }

  return true
}

function documentToCard(
  document: LibraryMobileDocument,
  actions: {
    onPreviewDocument?: (documentId: string) => void
    onDownloadDocument?: (documentId: string) => void
    onTransformDocument?: (documentId: string) => void
  },
): MobileModuleCard {
  const canUsePreviewAction = Boolean(actions.onPreviewDocument && document.canPreview !== false)

  return {
    title: document.title,
    description: document.description || 'Document disponible dans la bibliothèque BCVB.',
    to: canUsePreviewAction ? undefined : document.to,
    icon: getDocumentIcon(document),
    badge: getDocumentBadge(document),
    meta: getDocumentMeta(document),
    locked: document.locked,
    onClick: canUsePreviewAction
      ? () => actions.onPreviewDocument?.(document.id)
      : undefined,
  }
}

export default function LibraryMobileExperience({
  documents,
  isAdmin = false,
  isCoach = false,
  isLoading = false,
  error = null,
  onPreviewDocument,
  onDownloadDocument,
  onTransformDocument,
}: LibraryMobileExperienceProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const sourceDocuments = documents?.length ? documents : fallbackDocuments

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = normalize(search.trim())

    return sourceDocuments.filter((document) => {
      const searchText = buildSearchText(document)
      const matchSearch = normalizedSearch ? searchText.includes(normalizedSearch) : true
      const matchTab = matchActiveTab(document, activeTab)

      return matchSearch && matchTab
    })
  }, [activeTab, search, sourceDocuments])

  const priorityCards: MobileModuleCard[] = [
    {
      title: 'Documents récents',
      description: 'Reprendre les dernières ressources ouvertes ou mises à jour.',
      to: '/bibliotheque',
      icon: '🕘',
      badge: 'Rapide',
    },
    {
      title: 'FAQ plateforme',
      description: 'Débloquer une question de connexion, droits ou export.',
      to: '/faq',
      icon: '❔',
      badge: 'Aide',
    },
  ]

  if (isCoach) {
    priorityCards.unshift({
      title: 'Ressources coachs',
      description: 'Cahiers techniques, situations, repères terrain et progression.',
      to: '/bibliotheque',
      icon: '🏀',
      badge: 'Coach',
    })
  }

  if (isAdmin) {
    priorityCards.push(
      {
        title: 'Contrôle qualité',
        description: 'Vérifier les documents avant publication.',
        to: '/admin/qualite-exports',
        icon: '🧪',
        badge: 'Admin',
      },
      {
        title: 'Importer une source',
        description: 'Ajouter un fichier ou une pièce jointe à transformer.',
        to: '/admin/ocr-pieces-jointes',
        icon: '📥',
        badge: 'Admin',
      },
    )
  }

  const documentCards = filteredDocuments.map((document) =>
    documentToCard(document, {
      onPreviewDocument,
      onDownloadDocument,
      onTransformDocument,
    }),
  )

  return (
    <div className="library-mobile-first">
      <MobilePageShell className="library-mobile-shell">
        <MobilePageHero
          eyebrow="Documents"
          title="Bibliothèque"
          description="Trouver, ouvrir et exploiter rapidement les ressources du club."
          icon="📚"
          badge={isAdmin ? 'Admin' : isCoach ? 'Coach' : 'Membre'}
          variant="light"
        />

        <MobileQuickActions
          actions={[
            {
              label: 'Rechercher',
              icon: '🔎',
              variant: 'primary',
              onClick: () => searchInputRef.current?.focus(),
            },
            {
              label: 'FAQ',
              to: '/faq',
              icon: '❔',
              variant: 'ghost',
            },
            ...(isAdmin
              ? [
                  {
                    label: 'Importer',
                    to: '/admin/ocr-pieces-jointes',
                    icon: '📥',
                    variant: 'secondary' as const,
                  },
                ]
              : []),
          ]}
        />

        <section className="library-mobile-search-card">
          <label htmlFor="library-mobile-search">Rechercher une ressource</label>

          <div className="library-mobile-search-card__field">
            <span aria-hidden="true">🔎</span>

            <input
              ref={searchInputRef}
              id="library-mobile-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cahier U15, cadre coach, FAQ..."
            />

            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Effacer la recherche"
              >
                Effacer
              </button>
            ) : null}
          </div>
        </section>

        <MobileSectionTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {error ? (
          <section className="library-mobile-empty">
            <span aria-hidden="true">⚠️</span>
            <h2>Bibliothèque indisponible</h2>
            <p>Les documents ne peuvent pas être chargés pour le moment. Réessaie depuis la bibliothèque ou contacte un administrateur si le problème persiste.</p>
          </section>
        ) : null}

        {isLoading ? (
          <section className="library-mobile-empty">
            <span aria-hidden="true">⏳</span>
            <h2>Chargement</h2>
            <p>Récupération des documents disponibles.</p>
          </section>
        ) : null}

        {!isLoading && !error ? (
          <>
            <MobileModuleGrid title="Accès prioritaires" cards={priorityCards} />

            <MobileModuleGrid
              title={search ? `Résultats pour “${search}”` : 'Documents disponibles'}
              cards={documentCards}
            />

            {filteredDocuments.length === 0 ? (
              <section className="library-mobile-empty">
                <span aria-hidden="true">🔎</span>
                <h2>Aucun document trouvé</h2>
                <p>
                  Essaie avec un mot plus court, change de catégorie ou efface la recherche pour retrouver les ressources disponibles.
                </p>
              </section>
            ) : null}

            {isAdmin || isCoach ? (
              <section className="library-mobile-admin-actions">
                <h2>Actions documentaires</h2>

                <div className="library-mobile-admin-actions__grid">
                  {isAdmin ? (
                    <>
                      <button type="button" onClick={() => window.location.assign('/admin/studio-editorial')}>
                        ✍️ Studio éditorial
                      </button>

                      <button type="button" onClick={() => window.location.assign('/admin/qualite-exports')}>
                        🧪 Qualité
                      </button>
                    </>
                  ) : null}

                  {isCoach ? (
                    <button type="button" onClick={() => window.location.assign('/coach/seances')}>
                      🏀 Créer une séance
                    </button>
                  ) : null}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </MobilePageShell>
    </div>
  )
}
