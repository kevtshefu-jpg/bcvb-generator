import type { DocumentStandard } from '../../documents/standards/documentFamilyStandards'

type EditorialStandardCardProps = {
  standard: DocumentStandard | null
  onApply: () => void
  disabled?: boolean
}

export function EditorialStandardCard({
  standard,
  onApply,
  disabled,
}: EditorialStandardCardProps) {
  if (!standard) {
    return (
      <section className="ai-studio-card ai-studio-card--muted">
        <p className="ai-studio-kicker">Standard éditorial</p>
        <h2>Aucune famille sélectionnée</h2>
        <p>Choisis une famille documentaire pour charger le standard de production.</p>
      </section>
    )
  }

  return (
    <section className="ai-studio-card ai-standard-card">
      <div className="ai-studio-card__header">
        <p className="ai-studio-kicker">Standard éditorial appliqué</p>
        <h2>{standard.label}</h2>
        <p>{standard.promptIntention}</p>
      </div>

      <div className="ai-standard-grid">
        <span><strong>Format</strong>{standard.format}</span>
        <span><strong>Volume</strong>{standard.volume}</span>
        <span><strong>Public</strong>{standard.publicTarget}</span>
        <span><strong>Première page</strong>{standard.firstPage}</span>
        <span><strong>Palette</strong>{standard.palette}</span>
        <span><strong>Mise en page</strong>{standard.layout}</span>
        <span><strong>Typographie</strong>{standard.typography}</span>
        <span><strong>Graphiques</strong>{standard.graphicElements}</span>
      </div>

      <div className="ai-standard-columns">
        <div>
          <h3>Structure obligatoire</h3>
          <ul>
            {standard.mandatoryBlocks.map((block) => (
              <li key={block}>{block}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Seuils qualité</h3>
          <ul>
            <li>{standard.minTables} tableaux minimum</li>
            <li>{standard.minSituations} situations minimum</li>
            <li>{standard.minDiagrams} schémas minimum</li>
            {standard.nonNegotiables.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>
      </div>

      <button type="button" className="ai-studio-primary" onClick={onApply} disabled={disabled}>
        Appliquer ce standard au cadre
      </button>
    </section>
  )
}
