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

export default function TutorialRoleMatrix({ currentRole }: TutorialRoleMatrixProps) {
  const normalizedRole = normalizeRole(currentRole);

  return (
    <section className="tutorial-role-matrix">
      <div className="tutorial-section-heading">
        <p>Droits d’accès</p>
        <h2>Matrice par rôle</h2>
      </div>

      <div className="tutorial-role-table-wrap">
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
    </section>
  );
}
