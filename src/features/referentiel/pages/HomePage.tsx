import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/context/AuthContext'
import {
	isAdmin,
	isCoach,
	isDirigeant,
	isJoueur,
	isParent,
} from '../../auth/utils/roles'

function CoachHome() {
	return (
		<>
			<div className="v33-sectionHead">
				<div>
					<p className="v33-sectionHead__eyebrow">Espace coach</p>
					<h3 className="v33-sectionHead__title">Préparer, structurer, transmettre</h3>
				</div>
				<span className="v33-sectionHead__badge">Coach</span>
			</div>

			<div className="v33-grid">
				<Link to="/generateur" className="v33-card v33-card--accent">
					<p className="v33-card__eyebrow">Production</p>
					<h3 className="v33-card__title">Créer une séance</h3>
					<p className="v33-card__text">
						Construis rapidement une séance lisible, structurée et cohérente avec l’identité BCVB.
					</p>
					<span className="v33-card__link">Ouvrir le générateur</span>
				</Link>

				<Link to="/situations" className="v33-card">
					<p className="v33-card__eyebrow">Bibliothèque</p>
					<h3 className="v33-card__title">Banque de situations</h3>
					<p className="v33-card__text">
						Retrouve les exercices et les situations utiles pour alimenter tes séances.
					</p>
					<span className="v33-card__link">Voir les situations</span>
				</Link>

				<Link to="/categories" className="v33-card">
					<p className="v33-card__eyebrow">Formation</p>
					<h3 className="v33-card__title">Parcours par catégorie</h3>
					<p className="v33-card__text">
						Clarifie les priorités d’apprentissage et la progression de chaque niveau.
					</p>
					<span className="v33-card__link">Ouvrir les catégories</span>
				</Link>

				<Link to="/themes" className="v33-card">
					<p className="v33-card__eyebrow">Jeu</p>
					<h3 className="v33-card__title">Thèmes de jeu</h3>
					<p className="v33-card__text">
						Organise les contenus autour des thèmes prioritaires du référentiel club.
					</p>
					<span className="v33-card__link">Voir les thèmes</span>
				</Link>
			</div>
		</>
	)
}

function JoueurHome() {
	return (
		<>
			<div className="v33-sectionHead">
				<div>
					<p className="v33-sectionHead__eyebrow">Espace joueur</p>
					<h3 className="v33-sectionHead__title">Mes contenus et mes responsabilités</h3>
				</div>
				<span className="v33-sectionHead__badge">Joueur</span>
			</div>

			<div className="v33-grid">
				<Link to="/joueur/contenus" className="v33-card v33-card--accent">
					<p className="v33-card__eyebrow">Ma catégorie</p>
					<h3 className="v33-card__title">Contenus débloqués</h3>
					<p className="v33-card__text">
						Accède aux contenus de ta catégorie et aux éléments rendus disponibles par ton coach.
					</p>
					<span className="v33-card__link">Voir mes contenus</span>
				</Link>

				<Link to="/joueur/charte" className="v33-card">
					<p className="v33-card__eyebrow">Club</p>
					<h3 className="v33-card__title">Lire et accepter la charte</h3>
					<p className="v33-card__text">
						La charte du club devra être lue et validée pour poursuivre dans la plateforme.
					</p>
					<span className="v33-card__link">Ouvrir la charte</span>
				</Link>

				<Link to="/joueur/engagement" className="v33-card">
					<p className="v33-card__eyebrow">Responsabilisation</p>
					<h3 className="v33-card__title">Arbitrage, table, chrono 24, e-marque</h3>
					<p className="v33-card__text">
						Indique ton niveau de connaissance pour aider le club à organiser les formations et les
						désignations.
					</p>
					<span className="v33-card__link">Renseigner mon niveau</span>
				</Link>

				<article className="v33-card">
					<p className="v33-card__eyebrow">Valeurs</p>
					<h3 className="v33-card__title">Être joueur BCVB</h3>
					<p className="v33-card__text">
						Respect, responsabilité, engagement, identité club et contribution à la vie collective.
					</p>
				</article>
			</div>
		</>
	)
}

function ParentHome() {
	return (
		<>
			<div className="v33-sectionHead">
				<div>
					<p className="v33-sectionHead__eyebrow">Espace parent</p>
					<h3 className="v33-sectionHead__title">Comprendre le club et accompagner son enfant</h3>
				</div>
				<span className="v33-sectionHead__badge">Parent</span>
			</div>

			<div className="v33-grid">
				<Link to="/parent/charte" className="v33-card v33-card--accent">
					<p className="v33-card__eyebrow">Charte</p>
					<h3 className="v33-card__title">Lire et signer la charte du club</h3>
					<p className="v33-card__text">
						Une base commune pour partager les règles, les valeurs et le cadre éducatif du BCVB.
					</p>
					<span className="v33-card__link">Ouvrir la charte parent</span>
				</Link>

				<Link to="/parent/vie-club" className="v33-card">
					<p className="v33-card__eyebrow">Vie associative</p>
					<h3 className="v33-card__title">Découvrir le fonctionnement du BCVB</h3>
					<p className="v33-card__text">
						Comprendre la vie associative, les valeurs du club et la logique collective.
					</p>
					<span className="v33-card__link">Découvrir la vie club</span>
				</Link>

				<Link to="/parent/roles" className="v33-card">
					<p className="v33-card__eyebrow">Désignations</p>
					<h3 className="v33-card__title">Tours de rôles et explications</h3>
					<p className="v33-card__text">
						Comprendre les désignations, les responsabilités et le sens des participations.
					</p>
					<span className="v33-card__link">Comprendre les rôles</span>
				</Link>

				<Link to="/parent/referent" className="v33-card">
					<p className="v33-card__eyebrow">Accompagnement</p>
					<h3 className="v33-card__title">Le rôle du parent référent</h3>
					<p className="v33-card__text">
						Une explication claire du rôle du parent référent et de son utilité au sein du club.
					</p>
					<span className="v33-card__link">Lire l’explication</span>
				</Link>
			</div>

			<div className="v33-bottomGrid">
				<article className="v33-panel">
					<p className="v33-panel__eyebrow">Projet club</p>
					<h3 className="v33-panel__title">Projet sportif et éducatif</h3>
					<p className="v33-panel__text">
						Retrouvez les fondements du projet BCVB, les attentes, les valeurs et le cadre éducatif
						du club.
					</p>
					<div className="v33-panel__actions">
						<Link to="/parent/projet-club" className="v33-inlineLink">
							Ouvrir le projet club
						</Link>
					</div>
				</article>

				<article className="v33-panel">
					<p className="v33-panel__eyebrow">Posture parentale</p>
					<h3 className="v33-panel__title">Rôle éducatif et pédagogique</h3>
					<ul className="v33-list">
						<li>Accompagner son enfant avec cohérence</li>
						<li>Respecter les acteurs du club</li>
						<li>Comprendre le rôle des coachs et des bénévoles</li>
					</ul>
				</article>
			</div>
		</>
	)
}

function DirigeantHome() {
	return (
		<>
			<div className="v33-sectionHead">
				<div>
					<p className="v33-sectionHead__eyebrow">Pilotage club</p>
					<h3 className="v33-sectionHead__title">Structurer, harmoniser, transmettre</h3>
				</div>
				<span className="v33-sectionHead__badge">Dirigeant</span>
			</div>

			<div className="v33-grid">
				<Link to="/club" className="v33-card v33-card--accent">
					<p className="v33-card__eyebrow">Projet club</p>
					<h3 className="v33-card__title">Vision sportive et éducative</h3>
					<p className="v33-card__text">
						Accède aux contenus structurants du club, aux valeurs et au projet global BCVB.
					</p>
					<span className="v33-card__link">Ouvrir l’espace club</span>
				</Link>

				<Link to="/bibliotheque" className="v33-card">
					<p className="v33-card__eyebrow">Contenus</p>
					<h3 className="v33-card__title">Bibliothèque club</h3>
					<p className="v33-card__text">
						Consulte les contenus disponibles et la structuration du référentiel du club.
					</p>
					<span className="v33-card__link">Voir la bibliothèque</span>
				</Link>

				<Link to="/categories" className="v33-card">
					<p className="v33-card__eyebrow">Formation</p>
					<h3 className="v33-card__title">Parcours par catégorie</h3>
					<p className="v33-card__text">
						Vérifie la cohérence des contenus et des parcours de formation par niveau.
					</p>
					<span className="v33-card__link">Voir les catégories</span>
				</Link>

				<Link to="/club/pilotage" className="v33-card">
					<p className="v33-card__eyebrow">Pilotage</p>
					<h3 className="v33-card__title">Organisation et harmonisation</h3>
					<p className="v33-card__text">
						Base de travail pour organiser la vie du club et les contenus communs.
					</p>
					<span className="v33-card__link">Ouvrir le pilotage</span>
				</Link>
			</div>
		</>
	)
}

function AdminHome() {
	return (
		<>
			<div className="v33-sectionHead">
				<div>
					<p className="v33-sectionHead__eyebrow">Administration</p>
					<h3 className="v33-sectionHead__title">Piloter la plateforme et les accès</h3>
				</div>
				<span className="v33-sectionHead__badge">Admin</span>
			</div>

			<div className="v33-grid">
				<Link to="/admin" className="v33-card v33-card--accent">
					<p className="v33-card__eyebrow">Membres</p>
					<h3 className="v33-card__title">Gérer les profils</h3>
					<p className="v33-card__text">
						Consulte les membres, les rôles actifs et la structuration des accès.
					</p>
					<span className="v33-card__link">Ouvrir l’administration</span>
				</Link>

				<Link to="/admin/plateforme" className="v33-card">
					<p className="v33-card__eyebrow">Plateforme</p>
					<h3 className="v33-card__title">Piloter les espaces</h3>
					<p className="v33-card__text">
						Base future pour gérer les modules, validations, chartes et accès différenciés.
					</p>
					<span className="v33-card__link">Voir la plateforme</span>
				</Link>

				<Link to="/club" className="v33-card">
					<p className="v33-card__eyebrow">Club</p>
					<h3 className="v33-card__title">Projet BCVB</h3>
					<p className="v33-card__text">
						Vision club, structuration éducative et référentiel commun.
					</p>
					<span className="v33-card__link">Ouvrir le projet club</span>
				</Link>

				<Link to="/generateur" className="v33-card">
					<p className="v33-card__eyebrow">Production</p>
					<h3 className="v33-card__title">Outils coach</h3>
					<p className="v33-card__text">
						Accès complet aux outils de génération et de structuration des contenus terrain.
					</p>
					<span className="v33-card__link">Ouvrir les outils</span>
				</Link>
			</div>
		</>
	)
}

function MemberHome() {
	return (
		<>
			<div className="v33-sectionHead">
				<div>
					<p className="v33-sectionHead__eyebrow">Espace membre</p>
					<h3 className="v33-sectionHead__title">Bienvenue dans le référentiel BCVB</h3>
				</div>
				<span className="v33-sectionHead__badge">Membre</span>
			</div>

			<div className="v33-grid">
				<article className="v33-card v33-card--accent">
					<p className="v33-card__eyebrow">Découverte</p>
					<h3 className="v33-card__title">Plateforme club</h3>
					<p className="v33-card__text">
						Le BCVB Référentiel centralise les contenus, les repères et les outils utiles au club.
					</p>
				</article>

				<Link to="/connexion" className="v33-card">
					<p className="v33-card__eyebrow">Accès</p>
					<h3 className="v33-card__title">Connexion</h3>
					<p className="v33-card__text">
						Connecte-toi avec un rôle actif pour accéder aux contenus adaptés à ton profil.
					</p>
					<span className="v33-card__link">Se connecter</span>
				</Link>
			</div>
		</>
	)
}

export default function HomePage() {
	const { user, profile } = useAuth()
	const role = profile?.role

	return (
		<section className="home-page v33-home">
			<div className="v33-hero">
				<div className="v33-hero__main">
					<p className="v33-hero__eyebrow">BCVB Référentiel</p>
					<h2 className="v33-hero__title">La plateforme multi-acteurs du BCVB.</h2>
					<p className="v33-hero__text">
						Un même cadre pour les coachs, dirigeants, joueurs, parents et administrateurs, avec
						des accès adaptés à chaque rôle.
					</p>

					<div className="v33-hero__actions">
						{user ? (
							<>
								<Link to="/dashboard" className="v33-btn v33-btn--primary">
									Ouvrir mon tableau de bord
								</Link>
								<Link to="/" className="v33-btn v33-btn--dark">
									Voir mon espace
								</Link>
							</>
						) : (
							<>
								<Link to="/connexion" className="v33-btn v33-btn--primary">
									Accéder à l’espace membre
								</Link>
								<Link to="/connexion" className="v33-btn v33-btn--ghost">
									Se connecter
								</Link>
							</>
						)}
					</div>
				</div>

				<div className="v33-hero__side">
					<article className="v33-highlightCard v33-highlightCard--dark">
						<span className="v33-highlightCard__label">Identité BCVB</span>
						<strong className="v33-highlightCard__value">Défendre fort</strong>
						<span className="v33-highlightCard__sub">Courir • Partager la balle</span>
					</article>

					<article className="v33-highlightCard">
						<span className="v33-highlightCard__label">Démarche pédagogique</span>
						<strong className="v33-highlightCard__value">4 étapes</strong>
						<span className="v33-highlightCard__sub">
							Je découvre • Je m’exerce • Je retranscris • Je régule
						</span>
					</article>
				</div>
			</div>

			{isAdmin(role) && <AdminHome />}
			{isDirigeant(role) && <DirigeantHome />}
			{isCoach(role) && <CoachHome />}
			{isJoueur(role) && <JoueurHome />}
			{isParent(role) && <ParentHome />}
			{!user || role === 'member' ? <MemberHome /> : null}
		</section>
	)
}