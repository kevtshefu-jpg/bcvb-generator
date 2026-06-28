import { roleCapabilityMatrix } from "../../lib/tutorials/tutorialData";

type TutorialRoleMatrixProps = {
  currentRole?: string | null;
};

const roleColumns = [
  { key: "admin", label: "Admin" },
  { key: "responsable_technique", label: "Resp. technique" },
  { key: "coach", label: "Coach" },
  { key: "dirigeant", label: "Dirigeant" },
  { key: "parent_referent", label: "Parent réf." },
  { key: "membre", label: "Membre" },
] as const;

function normalizeRole(role?: string | null) {
  if (role === "member" || role === "parent" || role === "joueur") return "membre";
  if (role === "team_staff") return "parent_referent";
  return role ?? "membre";
}

function splitCapabilities(value: string) {
  if (value.toLowerCase() === "non") return ["Non accessible"];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function TutorialRoleMatrix({ currentRole }: TutorialRoleMatrixProps) {
  const normalizedRole = normalizeRole(currentRole);

  return (
    <section className="tutorial-role-matrix" id="droits-acces">
      <div className="tutorial-section-heading">
        <p>Droits d’accès</p>
        <h2>Matrice par rôle</h2>
      </div>

      <div className="tutorial-role-table-wrap responsive-data-table">
        <table className="tutorial-role-table">
          <thead>
            <tr>
              <th>Module</th>
              {roleColumns.map((role) => (
                <th key={role.key} className={normalizedRole === role.key ? "tutorial-role-active" : undefined}>
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roleCapabilityMatrix.map((row) => (
              <tr key={row.module}>
                <th>{row.module}</th>
                {roleColumns.map((role) => (
                  <td key={role.key} className={normalizedRole === role.key ? "tutorial-role-active" : undefined}>
                    {row[role.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tutorial-role-card-list responsive-data-mobile" aria-label="Matrice par rôle mobile">
        {roleCapabilityMatrix.map((row) => (
          <article className="tutorial-role-card" key={row.module}>
            <h3>{row.module}</h3>

            <div className="tutorial-role-card__grid">
              {roleColumns.map((role) => (
                <section
                  className={
                    normalizedRole === role.key
                      ? "tutorial-role-card__role tutorial-role-card__role--active"
                      : "tutorial-role-card__role"
                  }
                  key={role.key}
                >
                  <h4>{role.label}</h4>
                  <ul>
                    {splitCapabilities(row[role.key]).map((capability) => (
                      <li key={capability}>{capability}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
