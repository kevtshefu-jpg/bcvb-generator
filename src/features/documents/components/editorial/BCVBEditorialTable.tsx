import type { BCVBTableVariant } from '../../utils/detectTableVariant'

export type BCVBEditorialTableProps = {
  headers: string[]
  rows: string[][]
  variant?: BCVBTableVariant
}

function renderInline(value: string) {
  return value.split(/(\*\*[^*]+\*\*)/g).map((chunk, index) =>
    /^\*\*[^*]+\*\*$/.test(chunk) ? (
      <strong key={index}>{chunk.slice(2, -2)}</strong>
    ) : (
      <span key={index}>{chunk}</span>
    )
  )
}

function SummaryTable({ headers, rows }: BCVBEditorialTableProps) {
  const titleIndex = headers.findIndex((header) => /partie|section|chapitre/i.test(header))
  const contentIndex = headers.findIndex((header) => /contenu|description/i.test(header))
  const utilityIndex = headers.findIndex((header) => /utilite|terrain|usage/i.test(header.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))

  return (
    <div className="bcvb-summary-list">
      {rows.map((row, index) => (
        <article className="bcvb-summary-row bcvb-summary-item" key={`${row[0]}-${index}`}>
          <span className="bcvb-summary-number">{String(index + 1).padStart(2, '0')}</span>
          <div>
            <h4>{renderInline(row[titleIndex >= 0 ? titleIndex : 0] ?? `Partie ${index + 1}`)}</h4>
            {row[contentIndex] && <p>{renderInline(row[contentIndex])}</p>}
            {row[utilityIndex] && <small>{renderInline(row[utilityIndex])}</small>}
          </div>
        </article>
      ))}
    </div>
  )
}

export function BCVBEditorialTable({
  headers,
  rows,
  variant = 'default',
}: BCVBEditorialTableProps) {
  if (variant === 'summary') {
    return <SummaryTable headers={headers} rows={rows} variant={variant} />
  }

  return (
    <div className={`bcvb-table-wrap bcvb-table-wrap--${variant}`}>
      <table className={`bcvb-editorial-table bcvb-editorial-table--${variant}`}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{renderInline(header)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header, cellIndex) => {
                const cell = row[cellIndex] ?? ''

                return (
                  <td key={`${header}-${rowIndex}`}>
                    {cellIndex === 0 && (variant === 'planning' || variant === 'session') ? (
                      <span className="bcvb-doc-pill">{renderInline(cell)}</span>
                    ) : (
                      renderInline(cell)
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
