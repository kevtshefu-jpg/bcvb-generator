type AdminSaveBarProps = {
  dirty: boolean;
  lastSavedAt: string | null;
  onSave: () => void;
  onReset: () => void;
};

export default function AdminSaveBar({ dirty, lastSavedAt, onSave, onReset }: AdminSaveBarProps) {
  return (
    <div className={dirty ? "admin-save-bar admin-save-bar--dirty" : "admin-save-bar"}>
      <div>
        <span>{dirty ? "Modifications non enregistrées" : "Configuration synchronisée"}</span>
        <strong>
          {lastSavedAt
            ? `Dernière sauvegarde locale : ${new Date(lastSavedAt).toLocaleString("fr-FR")}`
            : "Aucune sauvegarde locale encore créée"}
        </strong>
      </div>
      <div>
        <button type="button" className="admin-save-bar__secondary" onClick={onReset}>
          Réinitialiser
        </button>
        <button type="button" onClick={onSave} disabled={!dirty}>
          Enregistrer
        </button>
      </div>
    </div>
  );
}
