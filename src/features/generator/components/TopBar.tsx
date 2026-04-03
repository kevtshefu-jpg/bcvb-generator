type Props = {
  title: string;
  onSave: () => void;
  onLoad: () => void;
  onExportText: () => void;
  onPrintSheet: () => void;
};

const CLUB_BADGES = [
  "Défendre fort",
  "Courir",
  "Partager la balle",
];

const QUICK_HINTS = [
  "Sélectionner",
  "Placer",
  "Relier",
  "Exporter",
];

export function TopBar({
  title,
  onSave,
  onLoad,
  onExportText,
  onPrintSheet,
}: Props) {
  return (
    <header className="bcvb-topbar">
      <div className="bcvb-topbar__brand">
        <div className="bcvb-topbar__logo-wrap">
          <img
            src="/logo_bcvb copie.png"
            alt="Logo BCVB"
            className="bcvb-topbar__logo-image"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
            }}
          />
          <div className="bcvb-topbar__logo-fallback">BCVB</div>
        </div>

        <div className="bcvb-topbar__identity">
          <div className="bcvb-topbar__eyebrow">
            Référentiel club · Générateur de situations
          </div>

          <div className="bcvb-topbar__title-row">
            <h1 className="bcvb-topbar__title">{title || "Nouvelle situation"}</h1>
            <span className="bcvb-topbar__status">V18.1</span>
          </div>

          <p className="bcvb-topbar__subtitle">
            Outil BCVB de conception terrain, lecture coach et structuration pédagogique.
          </p>

          <div className="bcvb-topbar__meta-row">
            <div className="bcvb-topbar__badges">
              {CLUB_BADGES.map((item) => (
                <span key={item} className="bcvb-badge">
                  {item}
                </span>
              ))}
            </div>

            <div className="bcvb-topbar__quick-hints">
              {QUICK_HINTS.map((item) => (
                <span key={item} className="bcvb-topbar__hint-pill">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bcvb-topbar__actions">
        <div className="bcvb-topbar__actions-head">
          <div className="bcvb-topbar__actions-title">Actions rapides</div>
          <div className="bcvb-topbar__actions-subtitle">
            Sauvegarde, chargement, export et impression coach
          </div>
        </div>

        <div className="bcvb-topbar__buttons">
          <button
            className="bcvb-ghost-btn"
            onClick={onLoad}
            type="button"
            title="Charger un état sauvegardé"
          >
            Charger état
          </button>

          <button
            className="bcvb-ghost-btn"
            onClick={onExportText}
            type="button"
            title="Exporter la situation au format texte"
          >
            Export texte
          </button>

          <button
            className="bcvb-ghost-btn"
            onClick={onPrintSheet}
            type="button"
            title="Ouvrir la fiche coach imprimable"
          >
            Fiche coach
          </button>

          <button
            className="bcvb-primary-btn"
            onClick={onSave}
            type="button"
            title="Sauvegarder l’état actuel"
          >
            Sauvegarder état
          </button>
        </div>

        <div className="bcvb-topbar__footer-note">
          Astuce : commence par la structure, puis place les joueurs, ensuite relie les actions.
        </div>
      </div>
    </header>
  );
}
