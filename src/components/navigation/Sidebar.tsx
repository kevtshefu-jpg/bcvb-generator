//
import { NavLink } from 'react-router-dom';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <img
          src="/logo-bcvb.png"
          alt="Logo BCVB"
          className="sidebar__logoImage"
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
            <NavLink to="/" end>
              Accueil
            </NavLink>
          </div>
        </div>
      </nav>
      <div className="sidebar__footer">
        <p className="sidebar__footerTitle">Identité BCVB</p>
        <p className="sidebar__footerText">Défendre fort • Courir • Partager la balle</p>
      </div>
    </aside>
  );
}