import type { ReactNode } from 'react'

export type BcvbSectionIconName =
  | 'dashboard'
  | 'production'
  | 'documents'
  | 'document'
  | 'court'
  | 'quality'
  | 'import'
  | 'ocr'
  | 'library'
  | 'create'
  | 'settings'
  | 'export'
  | 'user'
  | 'club'
  | 'tutorial'
  | 'faq'
  | 'session'
  | 'planning'
  | 'teams'
  | 'attendance'
  | 'evaluation'
  | 'directors'
  | 'parents'
  | 'archive'
  | 'pdf'
  | 'search'

type BcvbSectionIconProps = {
  name: BcvbSectionIconName
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark' | 'red' | 'green' | 'blue' | 'amber' | 'purple'
}

const iconPaths: Record<BcvbSectionIconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="7" rx="2" />
      <rect x="4" y="13" width="7" height="7" rx="2" />
      <rect x="13" y="13" width="7" height="7" rx="2" />
    </>
  ),

  production: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 8v8" />
      <path d="M8 10l4-2 4 2" />
    </>
  ),

  documents: (
    <>
      <path d="M7 3h7l4 4v14H7V3z" />
      <path d="M14 3v5h5" />
      <path d="M9.5 12h5" />
      <path d="M9.5 15h7" />
      <path d="M9.5 18h4" />
    </>
  ),

  document: (
    <>
      <path d="M7 4h8l3 3v13H7V4z" />
      <path d="M15 4v4h4" />
      <path d="M9.5 11.5h5" />
      <path d="M9.5 14.5h6" />
      <path d="M9.5 17.5h3.5" />
    </>
  ),

  court: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M12 5v14" />
      <circle cx="12" cy="12" r="3" />
      <path d="M3 9h4" />
      <path d="M17 9h4" />
      <path d="M3 15h4" />
      <path d="M17 15h4" />
    </>
  ),

  quality: (
    <>
      <path d="M12 3l7 4v5c0 4.5-2.8 7.7-7 9-4.2-1.3-7-4.5-7-9V7l7-4z" />
      <path d="M8.5 12.5l2.2 2.2 4.8-5" />
    </>
  ),

  import: (
    <>
      <path d="M12 4v10" />
      <path d="M8 10l4 4 4-4" />
      <path d="M5 18h14" />
      <path d="M6 20h12" />
    </>
  ),

  ocr: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M7 9h10" />
      <path d="M7 12h6" />
      <path d="M7 15h8" />
      <path d="M3 8V5a2 2 0 0 1 2-2h3" />
      <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
    </>
  ),

  library: (
    <>
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" />
      <path d="M8 4v13a3 3 0 0 0 3 3" />
      <path d="M9 8h6" />
      <path d="M9 11h6" />
    </>
  ),

  create: (
    <>
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
      <path d="M16 4l4 4" />
    </>
  ),

  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7.5 7.5 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.7-1L14.5 3h-5l-.3 3.1a8 8 0 0 0-1.7 1l-2.4-1-2 3.4L5.1 11a7.5 7.5 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 1.7 1l.3 3.1h5l.3-3.1a8 8 0 0 0 1.7-1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z" />
    </>
  ),

  export: (
    <>
      <path d="M12 20V10" />
      <path d="M8 14l4-4 4 4" />
      <path d="M5 4h14v6" />
      <path d="M5 4v16h14v-4" />
    </>
  ),

  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),

  club: (
    <>
      <path d="M12 3l8 4v6c0 4.2-2.8 7-8 8-5.2-1-8-3.8-8-8V7l8-4z" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </>
  ),

  tutorial: (
    <>
      <path d="M4 5h13a3 3 0 0 1 3 3v11H7a3 3 0 0 1-3-3V5z" />
      <path d="M8 8h7" />
      <path d="M8 11h8" />
      <path d="M8 14h5" />
      <path d="M17 5v14" />
    </>
  ),

  faq: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.7 9.2a2.5 2.5 0 0 1 4.7 1.3c0 2-2.4 2.1-2.4 4" />
      <path d="M12 18h.01" />
    </>
  ),

  session: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h10" />
      <path d="M7 13h5" />
      <path d="M16 13l2 2 3-4" />
    </>
  ),

  planning: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 9h16" />
      <path d="M8 13h2" />
      <path d="M12 13h2" />
      <path d="M16 13h2" />
      <path d="M8 17h2" />
      <path d="M12 17h2" />
    </>
  ),

  teams: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M3.5 20a5 5 0 0 1 9 0" />
      <path d="M11.5 20a5 5 0 0 1 9 0" />
    </>
  ),

  attendance: (
    <>
      <path d="M5 4h14v16H5V4z" />
      <path d="M8 8h8" />
      <path d="M8 12h5" />
      <path d="M8 16h3" />
      <path d="M15 15l1.5 1.5L20 13" />
    </>
  ),

  evaluation: (
    <>
      <path d="M5 4h14v16H5V4z" />
      <path d="M9 9l1.5 1.5L14 7" />
      <path d="M9 15l1.5 1.5L15 12" />
      <path d="M7 20h10" />
    </>
  ),

  directors: (
    <>
      <path d="M12 3l8 4v5c0 4.2-2.8 7.2-8 9-5.2-1.8-8-4.8-8-9V7l8-4z" />
      <path d="M9 12l2 2 4-5" />
      <path d="M8 18h8" />
    </>
  ),

  parents: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M4 20a5.5 5.5 0 0 1 10 0" />
      <path d="M12 20a4.5 4.5 0 0 1 8 0" />
    </>
  ),

  archive: (
    <>
      <path d="M4 7h16v13H4V7z" />
      <path d="M3 4h18v3H3V4z" />
      <path d="M9 11h6" />
    </>
  ),

  pdf: (
    <>
      <path d="M7 3h7l4 4v14H7V3z" />
      <path d="M14 3v5h5" />
      <path d="M8.5 14h1.5a1.5 1.5 0 0 0 0-3H8.5v6" />
      <path d="M13 11v6" />
      <path d="M13 11h1a3 3 0 0 1 0 6h-1" />
    </>
  ),

  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M16 16l4 4" />
      <path d="M8 10.5h5" />
    </>
  ),
}

export function BcvbSectionIcon({
  name,
  size = 'md',
  variant = 'light',
}: BcvbSectionIconProps) {
  return (
    <span
      className={`bcvb-section-icon bcvb-section-icon--${size} bcvb-section-icon--${variant}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="bcvb-section-icon__svg"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        aria-hidden="true"
      >
        {iconPaths[name]}
      </svg>
    </span>
  )
}