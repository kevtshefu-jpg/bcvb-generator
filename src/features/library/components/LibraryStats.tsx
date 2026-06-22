type LibraryStatsProps = {
  totalCount: number
  publishedCount?: number
  draftCount?: number
  archivedCount?: number
  selectedCount?: number
  withoutPdfCount?: number
  transformableCount?: number
  recentCount?: number
  showArchived?: boolean
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="bcvb-premium-kpi">
      <span className="bcvb-premium-kpi__label">{label}</span>
      <strong className="bcvb-premium-kpi__value">{value}</strong>
    </article>
  )
}

export default function LibraryStats({
  totalCount,
  publishedCount = 0,
  draftCount = 0,
  archivedCount = 0,
  selectedCount = 0,
  withoutPdfCount = 0,
  transformableCount = 0,
  recentCount = 0,
  showArchived = false,
}: LibraryStatsProps) {
  return (
    <section className="library-stats bcvb-premium-grid bcvb-premium-grid--4 bcvb-grid-safe">
      <StatCard label="Documents visibles" value={totalCount} />
      <StatCard label="Publiables" value={publishedCount} />
      <StatCard label="À corriger" value={draftCount} />
      <StatCard label="Sans PDF" value={withoutPdfCount} />
      <StatCard label="Transformables" value={transformableCount} />
      <StatCard label="Récents" value={recentCount} />
      {showArchived ? <StatCard label="Archivés" value={archivedCount} /> : null}
      {selectedCount > 0 ? <StatCard label="Sélectionnés" value={selectedCount} /> : null}
    </section>
  )
}
