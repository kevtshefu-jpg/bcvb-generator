import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import {
  formatRole,
  isAdmin,
  isCoach,
  isDirigeant,
  isJoueur,
  isParent,
} from '../../auth/utils/roles'

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

function DirigeantDashboard() {
  return (
    <div className="role-dashboard-grid">
      <Link to="/club" className="role-dashboard-card">
        <h3>Projet club</h3>
        <p>Retrouver la structuration sportive et éducative du BCVB.</p>
      </Link>
      <Link to="/bibliotheque" className="role-dashboard-card">
        <h3>Bibliothèque</h3>
        <p>Consulter les contenus disponibles et la mémoire technique du club.</p>
      </Link>
      <Link to="/club/pilotage" className="role-dashboard-card">
        <h3>Pilotage</h3>
        <p>Base de suivi pour l’organisation et l’harmonisation club.</p>
      </Link>
      <article className="role-dashboard-card">
        <h3>Vision</h3>
        <p>Structurer un cadre lisible pour les différents acteurs du BCVB.</p>
      </article>
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
      <Link to="/club" className="role-dashboard-card">
        <h3>Projet BCVB</h3>
        <p>Accéder au cœur du projet sportif, éducatif et structurel du club.</p>
      </Link>
      <Link to="/generateur" className="role-dashboard-card">
        <h3>Outils coach</h3>
        <p>Accès complet aux outils de production terrain.</p>
      </Link>
    </div>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const role = profile?.role

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Tableau de bord</p>
          <h2 className="dashboard-page__title">Bienvenue dans ton espace BCVB</h2>
          <p className="dashboard-page__text">
            Un tableau de bord pensé selon ton rôle pour accéder rapidement aux contenus utiles.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Profil actif</span>
          <strong>{formatRole(role)}</strong>
        </div>
      </div>

      {isAdmin(role) && <AdminDashboard />}
      {isDirigeant(role) && <DirigeantDashboard />}
      {isCoach(role) && <CoachDashboard />}
      {isJoueur(role) && <JoueurDashboard />}
      {isParent(role) && <ParentDashboard />}
      {(!role || role === 'member') && (
        <div className="role-dashboard-grid">
          <article className="role-dashboard-card">
            <h3>Espace membre</h3>
            <p>Connexion active, avec accès limité selon le rôle attribué.</p>
          </article>
        </div>
      )}
    </section>
  )
}