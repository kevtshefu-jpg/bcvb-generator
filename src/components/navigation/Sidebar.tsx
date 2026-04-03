import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Accueil" },
  { to: "/categories", label: "Catégories" },
  { to: "/themes", label: "Thèmes" },
  { to: "/situations", label: "Banque de situations" },
  { to: "/generateur", label: "Générateur" }
];

export function Sidebar() {
  return (
    <aside
      style={{
        background: "#111111",
        color: "#ffffff",
        padding: "24px 18px",
        borderRight: "1px solid rgba(255,255,255,0.08)"
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 14,
            background: "linear-gradient(180deg, #C8102E, #9B0B22)",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            marginBottom: 12
          }}
        >
          BCVB
        </div>
        <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>Référentiel club</div>
        <div style={{ color: "rgba(255,255,255,0.64)", fontSize: "0.9rem", marginTop: 6 }}>
          Défendre Fort · Courir · Partager la balle
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              padding: "12px 14px",
              borderRadius: 12,
              background: isActive ? "rgba(200,16,46,0.18)" : "transparent",
              color: "#ffffff",
              fontWeight: 700
            })}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
