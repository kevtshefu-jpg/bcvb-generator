import { detectTableVariant, type BCVBTableVariant } from '../../utils/detectTableVariant'
import type { ParsedMarkdownTable } from '../../utils/parseMarkdownTable'
import { BCVBEditorialTable } from './BCVBEditorialTable'

type BCVBTableBlockProps = {
  title?: string
  table: ParsedMarkdownTable
  variant?: BCVBTableVariant
}

export function BCVBTableBlock({ title, table, variant }: BCVBTableBlockProps) {
  const resolvedVariant = variant ?? detectTableVariant(table.headers)

  return (
    <section className={`bcvb-table-block bcvb-table-block--${resolvedVariant}`}>
      {title && <h3 className="bcvb-table-title">{title}</h3>}
      <BCVBEditorialTable headers={table.headers} rows={table.rows} variant={resolvedVariant} />
    </section>
  )
}

