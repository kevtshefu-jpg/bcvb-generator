type BCVBChapterHeadingProps = {
  number?: number
  title: string
  subtitle?: string
  kind?: 'section' | 'summary' | 'situation' | 'annex' | 'synthesis'
}

export function BCVBChapterHeading({
  number,
  title,
  subtitle,
  kind = 'section',
}: BCVBChapterHeadingProps) {
  const label =
    kind === 'summary'
      ? 'Sommaire'
      : kind === 'annex'
        ? 'Annexe'
        : kind === 'synthesis'
          ? 'Synthèse'
          : kind === 'situation'
            ? 'Fiche terrain'
            : 'Chapitre'

  return (
    <header className={`bcvb-chapter-heading bcvb-chapter-heading--${kind}`}>
      <div>
        <span>{label}</span>
        {typeof number === 'number' && <strong>{String(number).padStart(2, '0')}</strong>}
      </div>
      <section>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </section>
    </header>
  )
}

