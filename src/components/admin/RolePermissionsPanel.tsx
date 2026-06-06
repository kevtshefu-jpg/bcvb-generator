import type { RolePermissionConfig } from "../../types/admin";
import { enforceAdminGuardrails, permissionGroups, permissionLabels, togglePermission } from "../../lib/admin/permissions";

type RolePermissionsPanelProps = {
  roles: RolePermissionConfig[];
  onChange: (roles: RolePermissionConfig[]) => void;
};

export default function RolePermissionsPanel({ roles, onChange }: RolePermissionsPanelProps) {
  function handleToggle(role: RolePermissionConfig, permission: Parameters<typeof togglePermission>[1], enabled: boolean) {
    const nextRoles = roles.map((item) => (item.role === role.role ? togglePermission(item, permission, enabled) : item));
    onChange(enforceAdminGuardrails(nextRoles));
  }

  return (
    <section className="admin-settings-panel">
      <div className="admin-settings-panel__head">
        <div>
          <p>Très haute priorité</p>
          <h2>Rôles et permissions</h2>
          <span>Définir qui peut créer, modifier, télécharger, administrer et piloter les modules BCVB.</span>
        </div>
        <strong>Admin uniquement</strong>
      </div>

      <div className="admin-role-grid">
        {roles.map((role) => (
          <article className="admin-role-card" key={role.role}>
            <header>
              <h3>{role.label}</h3>
              <p>{role.description}</p>
              <span>{role.permissions.length} permissions</span>
            </header>

            <div className="admin-permission-groups">
              {permissionGroups.map((group) => (
                <div key={`${role.role}-${group.label}`} className="admin-permission-group">
                  <strong>{group.label}</strong>
                  {group.permissions.map((permission) => {
                    const adminOnly = [
                      "documents.create",
                      "documents.delete",
                      "documents.publish",
                      "studio.use",
                      "studio.admin",
                      "ocr.use",
                      "quality.run",
                      "admin.settings",
                    ].includes(permission);
                    const disabled = adminOnly && role.role !== "admin";

                    return (
                      <label key={permission} className={disabled ? "admin-switch admin-switch--disabled" : "admin-switch"}>
                        <input
                          type="checkbox"
                          checked={role.permissions.includes(permission)}
                          disabled={disabled}
                          onChange={(event) => handleToggle(role, permission, event.target.checked)}
                        />
                        <span>{permissionLabels[permission]}</span>
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
