import { useMemo, useRef, useState } from 'react'
import { exportNodeToPdf } from '../../../utils/exportPdf'
import type { LibraryDocumentRow } from '../../library/services/libraryService'
import { parseBcvbDiagramBlock } from '../../library/utils/bcvbDiagramRenderer'
import { type CourtDiagramProps } from './BCVBCourtDiagram'
import { BCVBFibaCourtDiagram } from './court/BCVBFibaCourtDiagram'
import {
  parseBCVBRichMarkdown,
  type BCVBParsedBlock,
} from '../utils/parseBCVBRichMarkdown'
import { normalizeBCVBRichMarkdown } from '../utils/normalizeBCVBRichMarkdown'
import { inferDiagramFromSituation } from '../utils/inferDiagramFromSituation'
import {
  renderStructuredContent,
  type StructuredContentSegment,
} from '../utils/renderStructuredContent'
import { BCVBEditorialTable } from './blocks/BCVBEditorialTable'
import { BCVBProgressionTimeline } from './blocks/BCVBProgressionTimeline'
import { detectTableVariant, type BCVBTableVariant } from '../utils/detectTableVariant'
import { BCVBChapterHeading } from './editorial/BCVBChapterHeading'
import { BCVBKeyPointGrid } from './editorial/BCVBKeyPointGrid'
import { DocumentFamilyLayout } from '../layouts/DocumentFamilyLayout'
import { getPdfExportOptions } from '../utils/getPdfExportOptions'
import { resolveDocumentFamilyId } from '../standards/documentFamilyStandards'

type BCVBRichDocumentRendererProps = {
  content: string
  document: Pick<
    LibraryDocumentRow,
    'title' | 'document_type' | 'category_code' | 'theme_code' | 'audience' | 'season'
  >
}

const SITUATION_FIELDS: Array<[string, string]> = [
  ['objectif', 'Objectif'],
  ['organisation', 'Organisation'],
  ['materiel', 'Matériel'],
  ['deroulement', 'Déroulement'],
  ['consignes_joueurs', 'Consignes joueurs'],
  ['points_coach', 'Points coach'],
  ['criteres_reussite', 'Critères de réussite'],
  ['variables_simplification', 'Simplification'],
  ['variables_complexification', 'Complexification'],
  ['evolution_1', 'Évolution 1'],
  ['evolution_2', 'Évolution 2'],
  ['transfert_match', 'Transfert match'],
  ['erreurs_frequentes', 'Erreurs fréquentes'],
  ['corrections_possibles', 'Corrections possibles'],
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
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

function StructuredContent({
  value,
  tableVariant = 'default',
}: {
  value: string
  tableVariant?: BCVBTableVariant
}) {
  const segments = renderStructuredContent(value)

  return (
    <>
      {segments.map((segment: StructuredContentSegment, index) => {
        if (segment.type === 'table') {
          return (
            <BCVBEditorialTable
              key={`segment-table-${index}`}
              table={segment.table}
              variant={tableVariant === 'default' ? detectTableVariant(segment.table.headers) : tableVariant}
            />
          )
        }

        if (segment.type === 'heading') {
          return (
            <h2 className="bcvb-doc-section-title" key={`segment-heading-${index}`}>
              {segment.text}
            </h2>
          )
        }

        if (segment.type === 'list') {
          if (segment.items.length > 4) {
            return <BCVBKeyPointGrid key={`segment-keypoints-${index}`} items={segment.items} />
          }

          return (
            <ul className="bcvb-doc-list" key={`segment-list-${index}`}>
              {segment.items.map((item) => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </ul>
          )
        }

        if (segment.type === 'quote') {
          return (
            <blockquote className="bcvb-doc-quote" key={`segment-quote-${index}`}>
              {renderInline(segment.text)}
            </blockquote>
          )
        }

        if (segment.type === 'callout') {
          return (
            <aside className="bcvb-doc-card" key={`segment-callout-${index}`}>
              <span className="bcvb-doc-section-kicker">{segment.title}</span>
              <p>{renderInline(segment.text)}</p>
            </aside>
          )
        }

        return (
          <p className="bcvb-doc-paragraph" key={`segment-paragraph-${index}`}>
            {renderInline(segment.text)}
          </p>
        )
      })}
    </>
  )
}

function BlockContent({
  block,
  tableVariant = 'default',
}: {
  block: BCVBParsedBlock
  tableVariant?: BCVBTableVariant
}) {
  const content = block.fields.content || block.fields.texte || ''

  if (block.tables.length > 0) {
    const contentAlreadyContainsTable = /\|.+\|/.test(content)

    return (
      <>
        {content && <StructuredContent value={content} tableVariant={tableVariant} />}
        {!contentAlreadyContainsTable &&
          block.tables.map((table, index) => (
            <BCVBEditorialTable key={index} table={table} variant={tableVariant} />
          ))}
      </>
    )
  }

  return <StructuredContent value={content || block.raw} tableVariant={tableVariant} />
}

function HeroBlock({ block, document }: { block: BCVBParsedBlock; document: BCVBRichDocumentRendererProps['document'] }) {
  return (
    <section className="bcvb-editorial-hero">
      <div className="bcvb-editorial-hero__brand">
        <img src="/logo_bcvb copie.png" alt="BCVB" />
        <span>BCVB Référentiel</span>
      </div>
      <div>
        <p>{document.document_type || 'Document BCVB'}</p>
        <h1>{block.fields.title || block.fields.titre || document.title}</h1>
        {(block.fields.subtitle || block.fields.sous_titre) && (
          <strong>{block.fields.subtitle || block.fields.sous_titre}</strong>
        )}
      </div>
      <div className="bcvb-editorial-hero__meta">
        <span>{document.category_code || 'Général BCVB'}</span>
        <span>{document.audience || 'Interne club'}</span>
        <span>{document.season || 'Intemporel'}</span>
      </div>
    </section>
  )
}

function IdentityBlock({ block }: { block: BCVBParsedBlock }) {
  return (
    <section className="bcvb-doc-block bcvb-identity-block">
      <h2>{block.fields.title || block.fields.titre || 'Identité BCVB'}</h2>
      <BlockContent block={block} />
      <div className="bcvb-identity-badges">
        <span>Défendre fort</span>
        <span>Courir</span>
        <span>Partager la balle</span>
      </div>
    </section>
  )
}

function SectionBlock({ block }: { block: BCVBParsedBlock }) {
  return (
    <section className="bcvb-doc-block bcvb-doc-section bcvb-section-block">
      <BCVBChapterHeading
        title={block.fields.title || block.fields.titre || 'Chapitre BCVB'}
        subtitle={block.fields.subtitle || block.fields.sous_titre}
        kind={block.type === 'bcvb-summary' ? 'summary' : block.type === 'bcvb-annex' ? 'annex' : 'section'}
      />
      <BlockContent block={block} />
    </section>
  )
}

function TableBlock({ block }: { block: BCVBParsedBlock }) {
  const firstTable = block.tables[0]
  const variant =
    block.fields.variant as BCVBTableVariant ||
    (firstTable ? detectTableVariant(firstTable.headers) : undefined) ||
    (block.type === 'bcvb-planning-table'
      ? 'planning'
      : block.type === 'bcvb-session-template'
        ? 'session'
        : block.type === 'bcvb-evaluation-grid'
          ? 'evaluation'
          : 'default')
  const canTimeline =
    block.type === 'bcvb-progression' ||
    block.type === 'bcvb-session-template'

  return (
    <section className={`bcvb-doc-block bcvb-table-block bcvb-table-block--${variant}`}>
      <span className="bcvb-doc-section-kicker">
        {block.type === 'bcvb-planning-table'
          ? 'Planification'
          : block.type === 'bcvb-progression'
            ? 'Progression'
            : block.type === 'bcvb-session-template'
              ? 'Séance type'
              : block.type === 'bcvb-evaluation-grid'
                ? 'Évaluation'
                : 'Tableau'}
      </span>
      <h2 className="bcvb-doc-section-title">{block.fields.title || block.fields.titre || 'Tableau BCVB'}</h2>
      {canTimeline && firstTable ? (
        <BCVBProgressionTimeline table={firstTable} variant={variant} />
      ) : (
        <BlockContent block={block} tableVariant={variant} />
      )}
    </section>
  )
}

function SituationBlock({
  block,
  diagrams,
}: {
  block: BCVBParsedBlock
  diagrams?: BCVBParsedBlock[]
}) {
  const diagramDataList =
    diagrams && diagrams.length > 0
      ? diagrams.map(diagramBlockToProps)
      : [inferDiagramFromSituation(block)]

  return (
    <article className="bcvb-situation-layout bcvb-situation-with-diagram">
      <div className="bcvb-situation-card">
        <header className="bcvb-situation-header">
          <small>{block.fields.numero || 'Situation pédagogique'}</small>
          <h2>{block.fields.title || block.fields.titre || 'Situation terrain BCVB'}</h2>
          {block.fields.finalite && <p>{block.fields.finalite}</p>}
        </header>
        <div className="bcvb-situation-fields">
          {SITUATION_FIELDS.map(([key, label]) =>
            block.fields[key] ? (
              <div className="bcvb-situation-field" key={key}>
                <strong>{label}</strong>
                <span>{block.fields[key]}</span>
              </div>
            ) : null
          )}
        </div>
      </div>
      <div className="bcvb-situation-diagrams">
        {diagramDataList.map((diagramData, index) => (
          <section className="bcvb-diagram-step" key={`${diagramData.title}-${index}`}>
            {diagramDataList.length > 1 && (
              <span className="bcvb-diagram-step-label">Étape {index + 1}</span>
            )}
            <BCVBFibaCourtDiagram {...diagramData} subtitle={diagramData.intent} />
          </section>
        ))}
      </div>
    </article>
  )
}

function DiagramBlock({ block }: { block: BCVBParsedBlock }) {
  const diagramData = diagramBlockToProps(block)
  return <BCVBFibaCourtDiagram {...diagramData} subtitle={diagramData.intent} />
}

function ConclusionBlock({ block }: { block: BCVBParsedBlock }) {
  return (
    <section className="bcvb-doc-block bcvb-conclusion-block">
      <h2>{block.fields.title || block.fields.titre || 'Synthèse finale'}</h2>
      <BlockContent block={block} />
    </section>
  )
}

function UnknownBlock({ block }: { block: BCVBParsedBlock }) {
  return (
    <section className="bcvb-doc-block bcvb-section-block">
      <h2>{block.fields.title || block.fields.titre || 'Bloc documentaire'}</h2>
      <BlockContent block={block} />
    </section>
  )
}

function RenderBlock({
  block,
  document,
  nextBlocks = [],
}: {
  block: BCVBParsedBlock
  document: BCVBRichDocumentRendererProps['document']
  nextBlocks?: BCVBParsedBlock[]
}) {
  if (block.type === 'bcvb-hero') return <HeroBlock block={block} document={document} />
  if (block.type === 'bcvb-identity') return <IdentityBlock block={block} />
  if (block.type === 'bcvb-situation' || block.type === 'bcvb-exercise-card') {
    const diagrams = nextBlocks.filter((item) => item.type === 'bcvb-diagram')
    return <SituationBlock block={block} diagrams={diagrams} />
  }
  if (block.type === 'bcvb-diagram') return <DiagramBlock block={block} />
  if (
    block.type === 'bcvb-planning-table' ||
    block.type === 'bcvb-table' ||
    block.type === 'bcvb-progression' ||
    block.type === 'bcvb-session-template' ||
    block.type === 'bcvb-evaluation-grid' ||
    block.type === 'bcvb-cycle' ||
    block.type === 'bcvb-microcycle'
  ) {
    return <TableBlock block={block} />
  }
  if (block.type === 'bcvb-conclusion') return <ConclusionBlock block={block} />
  if (
    block.type === 'bcvb-section' ||
    block.type === 'bcvb-chapter' ||
    block.type === 'bcvb-markdown' ||
    block.type === 'bcvb-summary' ||
    block.type === 'bcvb-callout' ||
    block.type === 'bcvb-warning' ||
    block.type === 'bcvb-annex' ||
    block.type === 'bcvb-poster' ||
    block.type === 'bcvb-poster-summary'
  ) {
    return <SectionBlock block={block} />
  }

  return <UnknownBlock block={block} />
}

export function BCVBRichDocumentRenderer({ content, document }: BCVBRichDocumentRendererProps) {
  const paperRef = useRef<HTMLDivElement | null>(null)
  const [exporting, setExporting] = useState(false)
  const normalizedContent = useMemo(() => normalizeBCVBRichMarkdown(content).content, [content])
  const blocks = useMemo(() => parseBCVBRichMarkdown(normalizedContent), [normalizedContent])
  const documentFamily = useMemo(
    () =>
      resolveDocumentFamilyId(
        [
          document.document_type,
          document.title,
          document.category_code,
          document.theme_code,
        ]
          .filter(Boolean)
          .join(' ')
      ),
    [document]
  )
  const hasHero = blocks.some((block) => block.type === 'bcvb-hero')
  const filename = `${slugify(document.title || 'document-bcvb') || 'document-bcvb'}-bcvb`

  async function handlePdfDownload() {
    if (!paperRef.current) return
    setExporting(true)
    try {
      await exportNodeToPdf(
        paperRef.current,
        `${filename}.pdf`,
        getPdfExportOptions(documentFamily)
      )
    } finally {
      setExporting(false)
    }
  }

  function handleSourceDownload() {
    const blob = new Blob([normalizedContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `${filename}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <DocumentFamilyLayout document={document} family={documentFamily}>
      <div className="bcvb-editorial-document">
        <div ref={paperRef} className="bcvb-editorial-page document-paper">
        <header className="bcvb-document-cover">
          <img src="/logo_bcvb copie.png" alt="BCVB" />
          <div>
            <p>{document.document_type || 'Document BCVB'}</p>
            <h1>{document.title}</h1>
            <div>
              <span>{document.category_code || 'Général BCVB'}</span>
              <span>{document.theme_code || 'Thème transversal'}</span>
              <span>{document.audience || 'Interne club'}</span>
              <span>{document.season || 'Intemporel'}</span>
            </div>
          </div>
          <div className="bcvb-document-actions">
            <button type="button" onClick={handlePdfDownload} disabled={exporting}>
              {exporting ? 'Préparation PDF...' : 'Télécharger en PDF'}
            </button>
            <button type="button" onClick={handleSourceDownload}>
              Télécharger la source
            </button>
          </div>
        </header>

        <main className="bcvb-editorial-content">
          {!hasHero && (
            <HeroBlock
              block={{
                id: 'fallback-hero',
                type: 'bcvb-hero',
                raw: '',
                fields: {
                  title: document.title,
                  subtitle: 'Document premium BCVB',
                },
                tables: [],
              }}
              document={document}
            />
          )}

          {blocks.map((block, index) => {
            const previousBlock = blocks[index - 1]

            if (
              block.type === 'bcvb-diagram' &&
              (previousBlock?.type === 'bcvb-situation' ||
                previousBlock?.type === 'bcvb-exercise-card' ||
                previousBlock?.type === 'bcvb-diagram')
            ) {
              return null
            }

            const nextDiagramBlocks: BCVBParsedBlock[] = []
            if (block.type === 'bcvb-situation' || block.type === 'bcvb-exercise-card') {
              let cursor = index + 1
              while (blocks[cursor]?.type === 'bcvb-diagram') {
                nextDiagramBlocks.push(blocks[cursor])
                cursor += 1
              }
            }

            return (
              <RenderBlock
                key={block.id}
                block={block}
                nextBlocks={nextDiagramBlocks}
                document={document}
              />
            )
          })}
        </main>
        </div>
      </div>
    </DocumentFamilyLayout>
  )
}

function diagramBlockToProps(block: BCVBParsedBlock): CourtDiagramProps {
  try {
    const parsed = parseBcvbDiagramBlock(block.raw)
    const court = inferCourtModeForDiagram(block, parsed)
    const ball = resolveDiagramBall(block.raw, parsed.players, parsed.ball)

    return {
      title: parsed.title || block.fields.title,
      court,
      intent: parsed.intent || block.fields.intent,
      players: parsed.players,
      ball,
      arrows: parsed.arrows.map((arrow) => ({
        type: arrow.type,
        from: arrow.from,
        toX: arrow.toX ?? 50,
        toY: arrow.toY ?? 50,
        label: arrow.label,
      })),
      zones: parsed.zones,
      notes: parsed.notes,
    }
  } catch {
    return {
      title: block.fields.title || 'Schéma terrain BCVB',
      court: 'half',
      intent: block.fields.intent || 'Organisation terrain à compléter.',
      players: [{ id: 'J1', team: 'offense', x: 50, y: 65, label: '1' }],
      arrows: [{ type: 'move', from: 'J1', toX: 50, toY: 40, label: 'action' }],
      notes: ['Schéma minimal généré car les données source sont incomplètes.'],
    }
  }
}

function inferCourtModeForDiagram(
  block: BCVBParsedBlock,
  parsed: ReturnType<typeof parseBcvbDiagramBlock>
): 'half' | 'full' {
  if (parsed.court === 'full') return 'full'

  const text = `${block.raw} ${parsed.title || ''} ${parsed.intent || ''}`.toLowerCase()
  const explicitFullCourtKeywords =
    /plein terrain|tout terrain|full court|transition|contre-attaque|contre attaque|remont[ée]e|repli|r[ée]cup[ée]ration|sortie de balle|5c4|3c2|3c0|3c1|4c3|course-poursuite|course poursuite/

  const yValues = [
    ...parsed.players.map((player) => player.y),
    ...parsed.arrows.flatMap((arrow) => [arrow.toY ?? 50]),
    ...(parsed.ball ? [parsed.ball.y] : []),
  ]
  const minY = Math.min(...yValues, 50)
  const maxY = Math.max(...yValues, 50)
  const usesBothHalves = minY <= 30 && maxY >= 70

  return explicitFullCourtKeywords.test(text) || usesBothHalves ? 'full' : 'half'
}

function resolveDiagramBall(
  raw: string,
  players: ReturnType<typeof parseBcvbDiagramBlock>['players'],
  parsedBall?: { x: number; y: number }
) {
  const holder = /ball\s*:\s*\n\s*(?:-\s*)?holder\s*:\s*([A-Za-z0-9_-]+)/i.exec(raw)?.[1]
  if (holder) {
    const player = players.find((item) => item.id.toLowerCase() === holder.toLowerCase())
    if (player) return { x: player.x, y: player.y }
  }

  return parsedBall
}
