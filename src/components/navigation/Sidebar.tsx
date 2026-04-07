import { NavLink } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import {
	canAccessAdmin,
	canAccessClub,
	canAccessProduction,
	canAccessReferentiel,
	isAdmin,
	isCoach,
	isDirigeant,
	isJoueur,
	isParent,
} from '../../features/auth/utils/roles'

function linkClass({ isActive }: { isActive: boolean }) {
	return `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
}

export function Sidebar() {
	const { user, profile } = useAuth()
	const role = profile?.role

	return (
		<aside className="sidebar">
			<div className="sidebar__brand">
				<img
					src="/logo-bcvb.png"
					alt="Logo BCVB"
					className="sidebar__logoImage"
					onError={(e) => {
						;(e.currentTarget as HTMLImageElement).style.display = 'none'
					}}
				/>
				<div>
					<h1 className="sidebar__title">BCVB Référentiel</h1>
					<p className="sidebar__subtitle">Plateforme technique, pédagogique et terrain</p>
				</div>
			</div>

			<nav className="sidebar__nav">
				<div className="sidebar__section">
					<p className="sidebar__sectionTitle">Général</p>
					<div className="sidebar__sectionLinks">
						<NavLink to="/" end className={linkClass}>
							Accueil
						</NavLink>

						{!user ? (
							<NavLink to="/connexion" className={linkClass}>
								Connexion
							</NavLink>
						) : (
							<NavLink to="/dashboard" className={linkClass}>
								Tableau de bord
							</NavLink>
						)}
					</div>
				</div>

				{user && canAccessReferentiel(role) && (
					<div className="sidebar__section">
						<p className="sidebar__sectionTitle">
							{isJoueur(role) ? 'Ma formation' : isParent(role) ? 'Vie club' : 'Référentiel'}
						</p>

						<div className="sidebar__sectionLinks">
							{(isAdmin(role) || isDirigeant(role) || isCoach(role)) && (
								<>
									<NavLink to="/categories" className={linkClass}>
										Catégories
									</NavLink>
									<NavLink to="/themes" className={linkClass}>
										Thèmes
									</NavLink>
									<NavLink to="/situations" className={linkClass}>
										Situations
									</NavLink>
									<NavLink to="/bibliotheque" className={linkClass}>
										Bibliothèque
									</NavLink>
								</>
							)}

														{isJoueur(role) && (
															<>
																<NavLink to="/joueur/contenus" className={linkClass}>
																	Mes contenus
																</NavLink>
																<NavLink to="/joueur/fondamentaux" className={linkClass}>
																	Fondamentaux
																</NavLink>
																<NavLink to="/joueur/progression" className={linkClass}>
																	Progression
																</NavLink>
																<NavLink to="/joueur/charte" className={linkClass}>
																	Charte club
																</NavLink>
																<NavLink to="/joueur/engagement" className={linkClass}>
																	Arbitrage & table
																</NavLink>
															</>
														)}

							{isParent(role) && (
								<>
									<NavLink to="/parent/charte" className={linkClass}>
										Charte parent
									</NavLink>
									<NavLink to="/parent/vie-club" className={linkClass}>
										Vie associative
									</NavLink>
									<NavLink to="/parent/roles" className={linkClass}>
										Tours de rôles
									</NavLink>
								</>
							)}
						</div>
					</div>
				)}

				{user && canAccessProduction(role) && (
					<div className="sidebar__section">
						<p className="sidebar__sectionTitle">Production</p>
						<div className="sidebar__sectionLinks">
							<NavLink to="/generateur" className={linkClass}>
								Générateur
							</NavLink>
							<NavLink to="/seances" className={linkClass}>
								Séances
							</NavLink>
						</div>
					</div>
				)}

				{user && canAccessClub(role) && (
					<div className="sidebar__section">
						<p className="sidebar__sectionTitle">Club</p>
						<div className="sidebar__sectionLinks">
							<NavLink to="/club" className={linkClass}>
								Projet club
							</NavLink>

							{(isAdmin(role) || isDirigeant(role)) && (
								<NavLink to="/club/pilotage" className={linkClass}>
									Pilotage
								</NavLink>
							)}

							{isParent(role) && (
								<>
									<NavLink to="/parent/referent" className={linkClass}>
										Parent référent
									</NavLink>
									<NavLink to="/parent/projet-club" className={linkClass}>
										Projet sportif
									</NavLink>
								</>
							)}
						</div>
					</div>
				)}

				{user && canAccessAdmin(role) && (
					<div className="sidebar__section">
						<p className="sidebar__sectionTitle">Administration</p>
						<div className="sidebar__sectionLinks">
							<NavLink to="/admin" className={linkClass}>
								Membres
							</NavLink>
							<NavLink to="/admin/plateforme" className={linkClass}>
								Plateforme
							</NavLink>
						</div>
					</div>
				)}
			</nav>

			<div className="sidebar__footer">
				<p className="sidebar__footerTitle">Cadre BCVB</p>
				<p className="sidebar__footerText">Défendre fort • Courir • Partager la balle</p>
			</div>
		</aside>
	)
}
