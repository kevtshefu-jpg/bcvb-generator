import type { ReactNode } from 'react'

type MobilePageShellProps = {
  children: ReactNode
  className?: string
}

export default function MobilePageShell({
  children,
  className = '',
}: MobilePageShellProps) {
  return (
    <section className={`mobile-page-shell ${className}`.trim()}>
      {children}
    </section>
  )
}