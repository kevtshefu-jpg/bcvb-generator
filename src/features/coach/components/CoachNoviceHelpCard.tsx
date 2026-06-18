import type { ReactNode } from 'react'

type CoachNoviceHelpCardProps = {
  title: string
  children: ReactNode
  tone?: 'red' | 'dark' | 'light'
}

export default function CoachNoviceHelpCard({
  title,
  children,
  tone = 'light',
}: CoachNoviceHelpCardProps) {
  return (
    <aside className={`coach-novice-help-card coach-novice-help-card--${tone}`}>
      <strong>{title}</strong>
      <div>{children}</div>
    </aside>
  )
}
