import type { ParsedMarkdownTable } from '../../utils/parseMarkdownTable'
import { detectTableVariant, type BCVBTableVariant } from '../../utils/detectTableVariant'
import { BCVBEditorialTable as EditorialTable } from '../editorial/BCVBEditorialTable'

type BCVBEditorialTableProps = {
  table: ParsedMarkdownTable
  variant?: BCVBTableVariant
}

export function BCVBEditorialTable({
  table,
  variant,
}: BCVBEditorialTableProps) {
  return (
    <EditorialTable
      headers={table.headers}
      rows={table.rows}
      variant={variant ?? detectTableVariant(table.headers)}
    />
  )
}
