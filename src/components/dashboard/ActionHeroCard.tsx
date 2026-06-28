import { Link } from 'react-router-dom'
import {
  isAdmin,
  isCoach,
  isDirigeant,
} from '../../features/auth/utils/roles'

export interface ActionHeroCardProps {
  role?: string | null
}

interface HeroAction {
  label: string
  description: string
  path: string
  cta: string
  icon: string
}

function getHeroActionForRole(role?: string | null): HeroAction | null {
  if (isAdmin(role)) {
    return {
      label: 'Studio éditorial',
      description: 'Créer, transformer et contrôler la qualité des documents BCVB.',
      path: '/admin/studio-editorial',
      cta: 'Accéder au studio',
      icon: '✨',
    }
  }

  if (isCoach(role)) {
    return {
      label: 'Créer une séance',
      description: 'Préparer une fiche complète : terrains, situations, consignes, critères observables.',
      path: '/coach/seances',
      cta: 'Commencer une séance',
      icon: '⚡',
    }
  }

  if (isDirigeant(role)) {
    return {
      label: 'Piloter l\'équipe',
      description: 'Suivre les indicateurs, coordonner les coachs, accéder aux documents cadres.',
      path: '/dirigeants',
      cta: 'Ouvrir le pilotage',
      icon: '🎯',
    }
  }

  if (role === 'parent_referent' || role === 'team_staff') {
    return {
      label: 'Gérer l\'équipe',
      description: 'Informations logistiques, présences, communication et organisation.',
      path: '/parents-referents',
      cta: 'Accéder à l\'espace',
      icon: '👥',
    }
  }

  return {
    label: 'Découvrir les ressources',
    description: 'Accéder à la bibliothèque documentaire du club BCVB.',
    path: '/bibliotheque',
    cta: 'Ouvrir la bibliothèque',
    icon: '📚',
  }
}

export default function ActionHeroCard({ role }: ActionHeroCardProps) {
  const heroAction = getHeroActionForRole(role)

  if (!heroAction) return null

  return (
    <Link to={heroAction.path} className="action-hero-card">
      <div className="action-hero-card__icon" aria-label={heroAction.label} role="img">{heroAction.icon}</div>

      <div className="action-hero-card__content">
        <h2 className="action-hero-card__title">{heroAction.label}</h2>
        <p className="action-hero-card__description">{heroAction.description}</p>
      </div>

      <span className="action-hero-card__button">
        {heroAction.cta}
        <span className="action-hero-card__arrow" aria-label="Aller">→</span>
      </span>
    </Link>
  )
}
