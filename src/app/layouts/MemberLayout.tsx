import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/context/AuthContext";

const memberLinks = [
  { to: "/espace", label: "Tableau de bord" },
  { to: "/generateur", label: "Générateur" },
  { to: "/seances", label: "Séances" },
  { to: "/bibliotheque", label: "Bibliothèque" },
  { to: "/club", label: "Club" }
];

export function MemberLayout() {
  const { user, logout, hasRole } = useAuth();

  return (
    <div className="member-shell">
      <aside className="member-sidebar">
        <div className="member-brand">
          <img src="/logo_bcvb copie.png" alt="BCVB" className="member-brand__logo" />
          <div>
            <div className="member-brand__title">BCVB Platform</div>
            <div className="member-brand__subtitle">Défendre Fort · Courir · Partager la balle</div>
          </div>
        </div>

        <nav className="member-nav">
          {memberLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "member-nav__link is-active" : "member-nav__link"
              }
            >
              {link.label}
            </NavLink>
          ))}

          {hasRole(["admin", "dirigeant"]) ? (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                isActive ? "member-nav__link is-active" : "member-nav__link"
              }
            >
              Administration
            </NavLink>
          ) : null}
        </nav>

        <div className="member-sidebar__footer">
          <div className="member-user-card">
            <div className="member-user-card__avatar">{user?.initials}</div>
            <div>
              <div className="member-user-card__name">{user?.fullName}</div>
              <div className="member-user-card__meta">{user?.team || user?.role}</div>
            </div>
          </div>

          <button type="button" className="secondary-button wide" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="member-main">
        <header className="member-topbar">
          <div>
            <div className="member-topbar__eyebrow">Espace membre sécurisé</div>
            <h1>{user?.role === "admin" ? "Pilotage complet BCVB" : "Espace de travail BCVB"}</h1>
          </div>
          <div className="member-topbar__right">
            <span className="member-chip">Accès limité</span>
            <span className="member-chip">Rôle : {user?.role}</span>
          </div>
        </header>

        <div className="member-main__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
