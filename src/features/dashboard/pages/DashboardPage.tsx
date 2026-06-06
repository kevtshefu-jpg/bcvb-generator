import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { useStableSession } from '../../../hooks/useStableSession'
import { useSafeLoading } from '../../../hooks/useSafeLoading'
import { PRESENTATION_MODE } from '../../../config/presentationMode'
import { buildDirectorSpaceModel } from '../../../lib/directors/directorDashboard'
import {
  formatRole,
  isAdmin,
  isCoach,
  isDirigeant,
  isJoueur,
  isParent,
} from '../../auth/utils/roles'

type DashboardAction = {
  label: string
  path: string
  detail: string
  roles: string[]
}

type DashboardItem = {
  title: string
  value?: string
  text: string
  tone?: 'red' | 'green' | 'blue' | 'dark'
}

const clubMetrics: DashboardItem[] = [
  { title: 'Documents publiés', value: '42', text: 'Ressources validées dans la bibliothèque.', tone: 'dark' },
  { title: 'Séances créées', value: '128', text: 'Fiches terrain prêtes ou archivées.', tone: 'red' },
  { title: 'Taux de présence', value: '86%', text: 'Moyenne des feuilles d’appel récentes.', tone: 'green' },
  { title: 'Évaluations à jour', value: '74%', text: 'Joueurs avec suivi récent.', tone: 'blue' },
  { title: 'Équipes actives', value: '12', text: 'Groupes suivis sur la saison.', tone: 'dark' },
  { title: 'Exports récents', value: '9', text: 'PDF générés pour diffusion ou commission.', tone: 'red' },
]

const qualityAlerts: DashboardItem[] = [
  { title: 'Documents non publiables', value: '3', text: 'Score inférieur au seuil ou blocs obligatoires absents.', tone: 'red' },
  { title: 'Documents à corriger', value: '8', text: 'Corrections éditoriales ou terrain à finaliser.', tone: 'blue' },
  { title: 'Documents prêts à publier', value: '6', text: 'Contrôle qualité validé, publication possible.', tone: 'green' },
  { title: 'Priorités de correction', value: '2', text: 'Projet sportif et charte coach à traiter en premier.', tone: 'dark' },
]

const workResume: DashboardAction[] = [
  { label: 'Dernier document ouvert', path: '/bibliotheque', detail: 'Référentiel U13 - Défendre fort', roles: ['admin', 'coach', 'dirigeant', 'parent_referent', 'team_staff', 'member', 'membre', 'parent', 'joueur'] },
  { label: 'Dernière séance créée', path: '/coach/seances', detail: 'U15 - Transition offensive', roles: ['admin', 'coach'] },
  { label: 'Dernière planification modifiée', path: '/planifications', detail: 'Cycle U11 - Juin 2026', roles: ['admin', 'coach'] },
  { label: 'Dernier effectif importé', path: '/effectifs', detail: 'U13 Région - 18 joueurs validés', roles: ['admin', 'coach'] },
]

const quickActions: DashboardAction[] = [
  { label: 'Créer une séance', path: '/coach/seances', detail: 'Préparer une fiche complète.', roles: ['admin', 'coach'] },
  { label: 'Faire l’appel', path: '/presences', detail: 'Présences, absences et retards.', roles: ['admin', 'coach'] },
  { label: 'Importer un effectif', path: '/effectifs', detail: 'CSV ou Excel avec mapping.', roles: ['admin', 'coach'] },
  { label: 'Ouvrir la bibliothèque', path: '/bibliotheque', detail: 'Documents et ressources club.', roles: ['admin', 'coach', 'dirigeant', 'parent_referent', 'team_staff', 'member', 'membre', 'parent', 'joueur'] },
  { label: 'Créer une évaluation', path: '/evaluations', detail: 'Suivi joueur et axes de progrès.', roles: ['admin', 'coach'] },
  { label: 'Accéder aux planifications', path: '/planifications', detail: 'Cycles sportifs par équipe.', roles: ['admin', 'coach'] },
]

function normalizeDashboardRole(role?: string | null) {
  if (role === 'membre') return 'member'
  return role || 'member'
}

function canShowForRole(item: DashboardAction, role?: string | null) {
  return item.roles.includes(normalizeDashboardRole(role))
}

function DashboardMetricCard({ item }: { item: DashboardItem }) {
  return (
    <article className={`bcvb-dashboard-metric bcvb-dashboard-metric--${item.tone || 'dark'}`}>
      <span>{item.title}</span>
      {item.value && <strong>{item.value}</strong>}
      <p>{item.text}</p>
    </article>
  )
}

function DashboardPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bcvb-dashboard-panel">
      <header className="bcvb-dashboard-panel__header">
        <p className="bcvb-eyebrow">Tableau de bord</p>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  )
}

function DashboardList({ items }: { items: DashboardItem[] }) {
  return (
    <div className="bcvb-dashboard-list">
      {items.map((item) => (
        <article className="bcvb-dashboard-list__item" key={item.title}>
          <div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </div>
          {item.value && <strong>{item.value}</strong>}
        </article>
      ))}
    </div>
  )
}

function DashboardActionGrid({ actions, role }: { actions: DashboardAction[]; role?: string | null }) {
  const visibleActions = actions.filter((action) => canShowForRole(action, role))

  return (
    <div className="bcvb-dashboard-actions">
      {visibleActions.map((action) => (
        <Link to={action.path} className="bcvb-dashboard-action" key={action.label}>
          <h3>{action.label}</h3>
          <p>{action.detail}</p>
        </Link>
      ))}
    </div>
  )
}

function BcvbDashboardOverview({ role }: { role?: string | null }) {
  const isAdminRole = isAdmin(role)
  const isCoachRole = isCoach(role)
  const isDirigeantRole = isDirigeant(role)
  const isDirectorRole = isAdminRole || isDirigeantRole || role === 'responsable_technique'
  const isParentReferentRole = role === 'parent_referent' || role === 'team_staff'
  const directorModel = isDirectorRole ? buildDirectorSpaceModel({ role }) : null

  const overviewItems: DashboardItem[] = [
    { title: 'Documents récents', value: isAdminRole ? '12' : '5', text: isAdminRole ? 'Documents modifiés ou prêts à contrôler.' : 'Ressources accessibles pour ton rôle.', tone: 'dark' },
    { title: 'Équipes suivies', value: isCoachRole ? '3' : isDirigeantRole ? '12' : isParentReferentRole ? '1' : '—', text: isCoachRole ? 'Groupes coachés cette saison.' : isDirigeantRole ? 'Vue club consolidée.' : isParentReferentRole ? 'Équipe référente.' : 'Accès limité selon profil.', tone: 'blue' },
    { title: 'Prochaines séances', value: isCoachRole ? '4' : '—', text: isCoachRole ? 'Séances à préparer ou finaliser.' : 'Visible pour les profils coach.', tone: 'green' },
    { title: 'Alertes importantes', value: isAdminRole ? '6' : isCoachRole ? '3' : '1', text: isAdminRole ? 'Qualité, exports et accès à surveiller.' : isCoachRole ? 'Présences et évaluations à reprendre.' : 'Informations club et documents utiles.', tone: 'red' },
  ]

  return (
    <>
      <DashboardPanel title="Vue synthétique">
        <div className="bcvb-dashboard-metrics">
          {overviewItems.map((item) => (
            <DashboardMetricCard item={item} key={item.title} />
          ))}
        </div>
      </DashboardPanel>

      {isAdminRole && (
        <DashboardPanel title="Alertes qualité">
          <DashboardList items={qualityAlerts} />
        </DashboardPanel>
      )}

      <DashboardPanel title="Reprise de travail">
        <DashboardActionGrid actions={workResume} role={role} />
      </DashboardPanel>

      <DashboardPanel title="Accès rapide">
        <DashboardActionGrid actions={quickActions} role={role} />
      </DashboardPanel>

      {(isAdminRole || isCoachRole || isDirigeantRole) && (
        <DashboardPanel title="Indicateurs club">
          <div className="bcvb-dashboard-metrics bcvb-dashboard-metrics--wide">
            {clubMetrics.map((item) => (
              <DashboardMetricCard item={item} key={item.title} />
            ))}
          </div>
        </DashboardPanel>
      )}

      {directorModel && (
        <DashboardPanel title="Pilotage dirigeants">
          <div className="bcvb-dashboard-metrics bcvb-dashboard-metrics--wide">
            {directorModel.indicators
              .filter((item) => ['documents-to-validate', 'teams-without-planning', 'sport-alerts', 'average-quality'].includes(item.id))
              .map((item) => (
                <DashboardMetricCard
                  key={item.id}
                  item={{
                    title: item.label,
                    value: String(item.value),
                    text: item.description || 'Indicateur dirigeant.',
                    tone: item.status === 'critical' ? 'red' : item.status === 'warning' ? 'blue' : 'dark',
                  }}
                />
              ))}
          </div>
          <div className="bcvb-dashboard-actions">
            <Link to="/dirigeants" className="bcvb-dashboard-action">
              <h3>Ouvrir l’espace dirigeants</h3>
              <p>Pilotage sportif, documentaire et organisationnel du BCVB.</p>
            </Link>
          </div>
        </DashboardPanel>
      )}
    </>
  )
}

function CoachDashboard() {
  return (
    <div className="role-dashboard-grid">
      <Link to="/generateur" className="role-dashboard-card">
        <h3>Créer une séance</h3>
        <p>Préparer rapidement un contenu terrain clair et structuré.</p>
      </Link>

      <Link to="/situations" className="role-dashboard-card">
        <h3>Banque de situations</h3>
        <p>Retrouver les situations utiles pour les catégories et les thèmes.</p>
      </Link>

      <Link to="/seances" className="role-dashboard-card">
        <h3>Mes séances</h3>
        <p>Consulter et enrichir les séances déjà créées.</p>
      </Link>

      <article className="role-dashboard-card">
        <h3>Focus BCVB</h3>
        <p>Transmettre une identité commune et structurer la progression.</p>
      </article>
    </div>
  )
}

function JoueurDashboard() {
  return (
    <div className="role-dashboard-grid">
      <Link to="/joueur/contenus" className="role-dashboard-card">
        <h3>Mes contenus</h3>
        <p>Accéder aux contenus de ma catégorie et aux éléments débloqués.</p>
      </Link>

      <Link to="/joueur/charte" className="role-dashboard-card">
        <h3>Charte du club</h3>
        <p>Lire et accepter la charte du BCVB.</p>
      </Link>

      <Link to="/joueur/engagement" className="role-dashboard-card">
        <h3>Arbitrage & table</h3>
        <p>Renseigner mon niveau sur l’arbitrage, la table, le chrono 24 et l’e-marque.</p>
      </Link>

      <article className="role-dashboard-card">
        <h3>Engagement club</h3>
        <p>Comprendre mes responsabilités dans la vie collective du BCVB.</p>
      </article>
    </div>
  )
}

function ParentDashboard() {
  return (
    <div className="role-dashboard-grid">
      <Link to="/parent/charte" className="role-dashboard-card">
        <h3>Charte parent</h3>
        <p>Lire et signer la charte du club.</p>
      </Link>

      <Link to="/parent/vie-club" className="role-dashboard-card">
        <h3>Vie associative</h3>
        <p>Comprendre le fonctionnement du BCVB et ses valeurs.</p>
      </Link>

      <Link to="/parent/roles" className="role-dashboard-card">
        <h3>Tours de rôles</h3>
        <p>Comprendre les désignations et leur utilité dans le club.</p>
      </Link>

      <Link to="/parent/projet-club" className="role-dashboard-card">
        <h3>Projet sportif et éducatif</h3>
        <p>Découvrir le projet global du club et la logique éducative.</p>
      </Link>
    </div>
  )
}

function ParentReferentDashboard() {
  return (
    <div className="role-dashboard-grid">
      <Link to="/parents-referents" className="role-dashboard-card">
        <h3>Espace parents référents</h3>
        <p>Accéder à la logistique, aux événements et à l’aide à l’organisation.</p>
      </Link>

      <Link to="/presences" className="role-dashboard-card">
        <h3>Présences utiles</h3>
        <p>Consulter les informations nécessaires pour organiser l’équipe.</p>
      </Link>

      <Link to="/documents-utiles" className="role-dashboard-card">
        <h3>Documents utiles</h3>
        <p>Retrouver chartes, consignes et documents partagés avec les familles.</p>
      </Link>

      <Link to="/faq" className="role-dashboard-card">
        <h3>FAQ plateforme</h3>
        <p>Trouver rapidement les réponses aux questions courantes.</p>
      </Link>
    </div>
  )
}

function DirigeantDashboard() {
  return (
    <div className="role-dashboard-grid">
      <Link to="/dirigeants" className="role-dashboard-card">
        <h3>Espace dirigeants</h3>
        <p>Documents cadres, suivi des équipes et éléments de pilotage.</p>
      </Link>

      <Link to="/bibliotheque" className="role-dashboard-card">
        <h3>Bibliothèque</h3>
        <p>Consulter les contenus disponibles et la mémoire technique du club.</p>
      </Link>

      <Link to="/club/pilotage" className="role-dashboard-card">
        <h3>Pilotage</h3>
        <p>Base de suivi pour l’organisation et l’harmonisation club.</p>
      </Link>

      <Link to="/club/equipes" className="role-dashboard-card">
        <h3>Gestion des équipes</h3>
        <p>Suivre les groupes, staffs, effectifs et alertes sportives.</p>
      </Link>
    </div>
  )
}

function AdminDashboard() {
  return (
    <div className="role-dashboard-grid">
      <Link to="/admin" className="role-dashboard-card">
        <h3>Gestion des membres</h3>
        <p>Contrôler les profils, les rôles et l’activation des accès.</p>
      </Link>

      <Link to="/admin/plateforme" className="role-dashboard-card">
        <h3>Administration plateforme</h3>
        <p>Piloter les futurs modules, validations et accès différenciés.</p>
      </Link>

      <Link to="/admin/inscriptions" className="role-dashboard-card">
        <h3>Demandes d’inscription</h3>
        <p>Traiter les demandes visiteurs et créer les comptes validés.</p>
      </Link>

      <Link to="/admin/import-joueurs" className="role-dashboard-card">
        <h3>Import joueurs</h3>
        <p>Importer, structurer et préparer les profils joueurs du club.</p>
      </Link>

      <Link to="/admin/import-export" className="role-dashboard-card">
        <h3>Import / Export</h3>
        <p>Centraliser les échanges et les opérations de données.</p>
      </Link>

      <Link to="/admin/qualite-exports" className="role-dashboard-card">
        <h3>Qualité documentaire</h3>
        <p>Contrôler les documents et préparer les exports de publication.</p>
      </Link>

      <Link to="/admin/ocr-pieces-jointes" className="role-dashboard-card">
        <h3>OCR & pièces jointes</h3>
        <p>Préparer les sources scannées et fichiers avant transformation.</p>
      </Link>
    </div>
  )
}

function MemberDashboard() {
  return (
    <div className="role-dashboard-grid">
      <article className="role-dashboard-card">
        <h3>Espace membre</h3>
        <p>Connexion active, avec accès limité selon le rôle attribué.</p>
      </article>

      <Link to="/" className="role-dashboard-card">
        <h3>Retour à l’accueil</h3>
        <p>Revenir sur la page d’accueil du référentiel BCVB.</p>
      </Link>
    </div>
  )
}

function PresentationDashboard({ role }: { role?: string | null }) {
  const adminCards = [
    ['Studio éditorial', '/admin/studio-editorial', 'Créer, transformer, contrôler et publier les documents club.'],
    ['Transformer un document', '/admin/documents/transformer', 'Convertir une source brute en document BCVB structuré.'],
    ['Contrôle qualité', '/admin/controle-qualite', 'Vérifier le niveau de publication et les blocs essentiels.'],
    ['Bibliothèque', '/bibliotheque', 'Centraliser les ressources techniques et pédagogiques du club.'],
    ['Gestion utilisateurs', '/admin/utilisateurs', 'Piloter les profils et les accès.'],
  ]
  const coachCards = [
    ['Mes séances', '/coach/seances', 'Préparer et exporter mes entraînements.'],
    ['Mes planifications', '/coach/planifications', 'Organiser les objectifs par semaine et par période.'],
    ['Présences / absences', '/coach/presences', 'Suivre l’assiduité du groupe.'],
    ['Évaluations joueurs', '/coach/evaluations', 'Observer, noter et fixer les objectifs individuels.'],
    ['Bibliothèque club', '/bibliotheque', 'Consulter les ressources utiles aux coachs.'],
  ]
  const memberCards = [
    ['Bibliothèque club', '/bibliotheque', 'Consulter les documents disponibles.'],
    ['Documents disponibles', '/bibliotheque', 'Retrouver les ressources partagées par le club.'],
    ['Ressources publiques', '/', 'Revenir aux contenus accessibles depuis l’accueil.'],
  ]
  const dirigeantCards = [
    ['Espace dirigeants', '/dirigeants', 'Consulter les documents cadres et le pilotage.'],
    ['Gestion des équipes', '/equipes', 'Suivre les équipes, staffs et effectifs.'],
    ['Indicateurs', '/club/indicateurs', 'Lire les éléments de pilotage sportif.'],
  ]
  const parentReferentCards = [
    ['Espace parents référents', '/parents-referents', 'Organiser la logistique et les événements.'],
    ['Présences utiles', '/presences', 'Consulter les réponses nécessaires à l’organisation.'],
    ['Documents utiles', '/documents-utiles', 'Retrouver les informations partagées.'],
  ]
  const cards = isAdmin(role)
    ? adminCards
    : isCoach(role)
      ? coachCards
      : isDirigeant(role)
        ? dirigeantCards
        : role === 'parent_referent' || role === 'team_staff'
          ? parentReferentCards
          : memberCards

  return (
    <>
      <div className="bcvb-grid-4">
        {cards.map(([title, path, text]) => (
          <Link to={path} className="bcvb-card" key={path}>
            <h3>{title}</h3>
            <p>{text}</p>
          </Link>
        ))}
      </div>

      <article className="bcvb-card commission-demo-impact">
        <p className="bcvb-eyebrow">Vision BCVB</p>
        <h2>Défendre fort, courir et partager la balle</h2>
        <div className="commission-demo-pills">
          {[
            'Défense Homme à Homme',
            'Intensité',
            'Agressivité maîtrisée',
            'Maîtrise',
            'Jeu',
            'Je découvre',
            'Je m’exerce',
            'Je retranscris en match',
            'Je régule',
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </article>
    </>
  )
}

export default function DashboardPage() {
  const { user: authUser, profile, loading: profileLoading } = useAuth()
  const {
    loading: sessionLoading,
    user: sessionUser,
    error: sessionError,
  } = useStableSession()
  const user = authUser ?? sessionUser
  const role = profile?.role ?? 'member'
  const displayName = profile?.full_name || user?.email || 'Membre'
  const { safeLoading, hasTimedOut } = useSafeLoading(sessionLoading || profileLoading, 2500)

  if (safeLoading) {
    return (
      <section className="dashboard-page">
        <div className="dashboard-page__hero">
          <div>
            <p className="dashboard-page__eyebrow">Tableau de bord</p>
            <h2 className="dashboard-page__title">Chargement du tableau de bord</h2>
            <p className="dashboard-page__text">
              Récupération de votre profil et des accès associés.
            </p>
          </div>

          <div className="dashboard-page__badge">
            <span className="dashboard-page__badgeLabel">Statut</span>
            <strong>Chargement...</strong>
          </div>
        </div>
      </section>
    )
  }

  if (hasTimedOut && PRESENTATION_MODE) {
    return (
      <section className="dashboard-page bcvb-page">
        <div className="bcvb-demo-fallback">
          <p className="bcvb-eyebrow">Mode présentation</p>
          <h2>Contenu prêt à être affiché</h2>
          <p>Le chargement distant est temporairement indisponible, mais l’espace reste consultable en mode démonstration.</p>
        </div>
        <PresentationDashboard role={role} />
      </section>
    )
  }

  if (sessionError && !user) {
    return (
      <section className="bcvb-empty-state">
        <p className="bcvb-eyebrow">Session indisponible</p>
        <h2>Chargement bloqué</h2>
        <p>{sessionError}</p>
        <a className="bcvb-button" href="/connexion">Se reconnecter</a>
      </section>
    )
  }

	  return (
	    <section className="dashboard-page bcvb-page">
	      <div className="bcvb-dashboard-hero">
	        <div>
	          <p className="bcvb-eyebrow">Tableau de bord</p>
	          <h2 className="bcvb-title-xl">Bienvenue dans ton espace BCVB</h2>
	          <p className="bcvb-subtitle">
	            Bonjour {displayName}. Retrouve ici les accès utiles selon ton rôle dans la plateforme.
	          </p>
	        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Profil actif</span>
          <strong>{formatRole(role)}</strong>
        </div>
      </div>

	      {PRESENTATION_MODE && <PresentationDashboard role={role} />}
	      {!PRESENTATION_MODE && <BcvbDashboardOverview role={role} />}
	      {!PRESENTATION_MODE && isAdmin(role) && <AdminDashboard />}
	      {!PRESENTATION_MODE && isDirigeant(role) && <DirigeantDashboard />}
	      {!PRESENTATION_MODE && isCoach(role) && <CoachDashboard />}
	      {!PRESENTATION_MODE && (role === 'parent_referent' || role === 'team_staff') && <ParentReferentDashboard />}
	      {!PRESENTATION_MODE && isJoueur(role) && <JoueurDashboard />}
	      {!PRESENTATION_MODE && isParent(role) && <ParentDashboard />}
	      {!PRESENTATION_MODE && role === 'member' && <MemberDashboard />}
	    </section>
	  )
}
