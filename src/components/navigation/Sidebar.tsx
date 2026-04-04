import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Accueil" },
  { to: "/categories", label: "Catégories" },
  { to: "/themes", label: "Thèmes" },
  { to: "/situations", label: "Banque de situations" },
  { to: "/connexion", label: "Connexion membre" }
];

export function Sidebar() {
  return (
    <aside className="public-sidebar">
      <div className="public-sidebar__brand">
        <img src="/logo_bcvb copie.png" alt="BCVB" className="public-sidebar__logo" />
        <div>
          <div className="public-sidebar__title">BCVB Platform</div>
          <div className="public-sidebar__subtitle">Référentiel · Générateur · Espace membres</div>
        </div>
      </div>

      <nav className="public-sidebar__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? "public-sidebar__link is-active" : "public-sidebar__link"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="public-sidebar__footer">
        <div className="public-sidebar__quote">Défendre Fort · Courir · Partager la balle</div>
        <div className="public-sidebar__note">Base publique + accès membre limité</div>
      </div>
    </aside>
  );
}
