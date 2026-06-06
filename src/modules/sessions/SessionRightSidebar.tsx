import { SessionAutosaveStatus } from './SessionAutosaveStatus'
import { SessionExportPanel } from './SessionExportPanel'
import { SessionQualityPanel } from './SessionQualityPanel'
import { SessionQuickSummary } from './SessionQuickSummary'
import type { TrainingSessionV2 } from './sessionModels'

type SessionRightSidebarProps = {
  session: TrainingSessionV2
  restored: boolean
  lastSavedAt: string | null
  onAutoFix: (mode?: string) => void
  onBuildUpgradePrompt?: () => void
  onExportPdf?: () => void
}

export function SessionRightSidebar({ session, restored, lastSavedAt, onAutoFix, onBuildUpgradePrompt, onExportPdf }: SessionRightSidebarProps) {
  return (
    <aside className="session-sidebar session-side-panel session-editor-sidebar">
      <SessionAutosaveStatus restored={restored} lastSavedAt={lastSavedAt} />
      <SessionQuickSummary session={session} />
      <SessionQualityPanel session={session} onAutoFix={onAutoFix} onBuildUpgradePrompt={onBuildUpgradePrompt} onExportPdf={onExportPdf} />
      <SessionExportPanel session={session} />
    </aside>
  )
}
