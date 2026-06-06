const legend = [
  ['Déplacement', 'move'],
  ['Passe', 'pass'],
  ['Dribble', 'dribble'],
  ['Défenseur', 'defender'],
  ['Attaquant', 'offense'],
  ['Plot / zone', 'zone'],
  ['Ballon', 'ball'],
]

export function CourtLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`court-legend ${compact ? 'court-legend--compact' : ''}`}>
      {legend.map(([label, type]) => (
        <span className={`court-legend__item court-legend__item--${type}`} key={type}>{label}</span>
      ))}
    </div>
  )
}
