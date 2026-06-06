import type { ParsedMarkdownTable } from '../../utils/parseMarkdownTable'
import type { BCVBTableVariant } from '../../utils/detectTableVariant'
import { BCVBEditorialTable } from './BCVBEditorialTable'

type BCVBProgressionTimelineProps = {
  table: ParsedMarkdownTable
  variant?: BCVBTableVariant
}

function getCell(row: string[], headers: string[], names: string[], fallbackIndex: number) {
  const normalized = headers.map((header) =>
    header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  )
  const index = normalized.findIndex((header) =>
    names.some((name) => header.includes(name))
  )

  return row[index >= 0 ? index : fallbackIndex] ?? ''
}

export function BCVBProgressionTimeline({ table, variant = 'default' }: BCVBProgressionTimelineProps) {
  if (variant === 'session') {
    return (
      <div className="bcvb-session-timeline">
        {table.rows.map((row, index) => {
          const time = getCell(row, table.headers, ['temps', 'duree'], 0)
          const block = getCell(row, table.headers, ['bloc'], 1)
          const organization = getCell(row, table.headers, ['organisation'], 2)
          const intention = getCell(row, table.headers, ['intention', 'objectif'], 3)
          const vigilance = getCell(row, table.headers, ['vigilance', 'consigne'], 4)

          return (
            <article className="bcvb-session-step" key={`${time}-${index}`}>
              <span className="bcvb-session-time">{time || `${index + 1}`}</span>
              <div className="bcvb-session-content">
                <h4>{block || `Bloc ${index + 1}`}</h4>
                {organization && <p>{organization}</p>}
                {intention && <strong>{intention}</strong>}
                {vigilance && <em>{vigilance}</em>}
              </div>
            </article>
          )
        })}
      </div>
    )
  }

  if (variant !== 'planning' && variant !== 'default') {
    return <BCVBEditorialTable table={table} variant={variant} />
  }

  return (
    <div className="bcvb-progression-timeline">
      {table.rows.map((row, index) => {
        const step = getCell(row, table.headers, ['etape', 'periode', 'semaine', 'temps'], 0)
        const theme = getCell(row, table.headers, ['theme', 'axe', 'bloc'], 1)
        const situation = getCell(row, table.headers, ['situation', 'contenu'], 2)
        const transfer = getCell(row, table.headers, ['transfert', 'match'], 3)
        const criteria = getCell(row, table.headers, ['critere', 'reussite', 'vigilance'], 4)

        return (
          <article className="bcvb-progression-step" key={`${step}-${index}`}>
            <span className="bcvb-progression-step-number">{index + 1}</span>
            <div>
              <p>{step}</p>
              <h4>{theme || `Étape ${index + 1}`}</h4>
              {situation && <strong>Situation : {situation}</strong>}
              {transfer && <small>Transfert : {transfer}</small>}
              {criteria && <em>Critère : {criteria}</em>}
            </div>
          </article>
        )
      })}
    </div>
  )
}
