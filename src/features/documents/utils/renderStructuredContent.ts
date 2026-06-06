import type { ParsedMarkdownTable } from './parseMarkdownTable'
import { parseStructuredContent } from './structuredContentParser'

export type StructuredContentSegment =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level: number }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'callout'; title: string; text: string }
  | { type: 'table'; table: ParsedMarkdownTable }

export function renderStructuredContent(source: string): StructuredContentSegment[] {
  return parseStructuredContent(source).map((segment) => {
    if (segment.type === 'table') {
      return {
        type: 'table',
        table: { headers: segment.headers, rows: segment.rows },
      }
    }

    return segment
  })
}
