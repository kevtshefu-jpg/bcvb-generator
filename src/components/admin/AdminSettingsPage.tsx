import { useMemo, useState } from "react";
import type { AdminPlatformConfig } from "../../types/admin";
import { adminPlatformDefaults, loadAdminPlatformConfig, saveAdminPlatformConfig } from "../../lib/admin/adminDefaults";
import AdminSaveBar from "./AdminSaveBar";
import AdminSettingsSidebar from "./AdminSettingsSidebar";
import type { AdminSettingsSection } from "./AdminSettingsSidebar";
import DocumentStandardsPanel from "./DocumentStandardsPanel";
import ExportSettingsPanel from "./ExportSettingsPanel";
import PlatformSecurityPanel from "./PlatformSecurityPanel";
import ReferentialsPanel from "./ReferentialsPanel";
import RolePermissionsPanel from "./RolePermissionsPanel";
import SeasonManagerPanel from "./SeasonManagerPanel";
import "../../styles/admin-settings.css";

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<AdminPlatformConfig>(() => loadAdminPlatformConfig());
  const [activeSection, setActiveSection] = useState<AdminSettingsSection>("roles");
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const activeSeason = config.seasons.find((season) => season.active);
    const enabledReferentials = config.referentials.filter((referential) => referential.enabled).length;
    const adminPermissions = config.roles.find((role) => role.role === "admin")?.permissions.length ?? 0;

    return [
      { label: "Rôles pilotés", value: String(config.roles.length) },
      { label: "Saison active", value: activeSeason?.label.replace("Saison ", "") ?? "—" },
      { label: "Référentiels actifs", value: String(enabledReferentials) },
      { label: "Permissions admin", value: String(adminPermissions) },
    ];
  }, [config]);

  function updateConfig(nextConfig: AdminPlatformConfig) {
    setConfig(nextConfig);
    setDirty(true);
  }

  function saveConfig() {
    saveAdminPlatformConfig(config);
    setDirty(false);
    setLastSavedAt(new Date().toISOString());
  }

  function resetConfig() {
    setConfig(adminPlatformDefaults);
    setDirty(true);
  }

  function renderPanel() {
    if (activeSection === "roles") {
      return (
        <RolePermissionsPanel
          roles={config.roles}
          onChange={(roles) => updateConfig({ ...config, roles })}
        />
      );
    }

    if (activeSection === "seasons") {
      return (
        <SeasonManagerPanel
          seasons={config.seasons}
          onChange={(seasons) => updateConfig({ ...config, seasons })}
        />
      );
    }

    if (activeSection === "standards") {
      return (
        <DocumentStandardsPanel
          standards={config.documentStandards}
          onChange={(documentStandards) => updateConfig({ ...config, documentStandards })}
        />
      );
    }

    if (activeSection === "referentials") {
      return (
        <ReferentialsPanel
          referentials={config.referentials}
          onChange={(referentials) => updateConfig({ ...config, referentials })}
        />
      );
    }

    if (activeSection === "exports") {
      return (
        <ExportSettingsPanel
          exports={config.exports}
          onChange={(exports) => updateConfig({ ...config, exports })}
        />
      );
    }

    return <PlatformSecurityPanel config={config} />;
  }

  return (
    <main className="bcvb-page admin-settings-page">
      <section className="admin-settings-hero">
        <div>
          <p className="bcvb-eyebrow">Paramètres & administration</p>
          <h1>Centre de pilotage global BCVB</h1>
          <p>
            Configurer les rôles, saisons, standards documentaires, référentiels, exports, accès par périmètre,
            paramètres visuels et garde-fous de la plateforme.
          </p>
        </div>
        <div className="admin-settings-hero__cards">
          <article>
            <span>Création qualité</span>
            <strong>Admin</strong>
            <p>Studio, OCR, publication et contrôle qualité renforcé.</p>
          </article>
          <article>
            <span>Portée club</span>
            <strong>Saison · équipe · rôle</strong>
            <p>Prépare les futures policies Supabase et les droits fins.</p>
          </article>
        </div>
      </section>

      <section className="admin-settings-layout">
        <AdminSettingsSidebar activeSection={activeSection} onChange={setActiveSection} metrics={metrics} />
        <div className="admin-settings-content">{renderPanel()}</div>
      </section>

      <AdminSaveBar dirty={dirty} lastSavedAt={lastSavedAt} onSave={saveConfig} onReset={resetConfig} />
    </main>
  );
}
