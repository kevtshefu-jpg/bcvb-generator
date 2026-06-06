export const BCVB_LOGO_SRC = '/logo_bcvb copie.png'

export type CourtThemeName = 'fastdraw-light' | 'bcvb-editorial' | 'print-clean'

export const COURT_THEMES = {
  'fastdraw-light': {
    wood: '#d6a85f',
    woodDark: '#bd8f49',
    line: '#ffffff',
    lineDark: '#1f2933',
    bcvbRed: '#b5122b',
    navy: '#111827',
    defense: '#1f2933',
    offense: '#b5122b',
    neutral: '#64748b',
    cone: '#f97316',
    ball: '#c2410c',
    zone: 'rgba(181,18,43,0.12)',
    pass: '#1d4ed8',
    move: '#111827',
    dribble: '#b5122b',
  },
  'bcvb-editorial': {
    wood: '#e1b66f',
    woodDark: '#c9984c',
    line: '#fff7ed',
    lineDark: '#111827',
    bcvbRed: '#a32035',
    navy: '#101827',
    defense: '#101827',
    offense: '#a32035',
    neutral: '#475569',
    cone: '#f97316',
    ball: '#c2410c',
    zone: 'rgba(163,32,53,0.14)',
    pass: '#1e40af',
    move: '#101827',
    dribble: '#a32035',
  },
  'print-clean': {
    wood: '#ffffff',
    woodDark: '#f3f4f6',
    line: '#111827',
    lineDark: '#111827',
    bcvbRed: '#111827',
    navy: '#111827',
    defense: '#111827',
    offense: '#ffffff',
    neutral: '#6b7280',
    cone: '#111827',
    ball: '#111827',
    zone: 'rgba(17,24,39,0.08)',
    pass: '#111827',
    move: '#111827',
    dribble: '#111827',
  },
} as const

export function getCourtTheme(theme: CourtThemeName = 'bcvb-editorial') {
  return COURT_THEMES[theme] || COURT_THEMES['bcvb-editorial']
}

export const COURT_THEME = COURT_THEMES['fastdraw-light']

export const courtTheme = {
  ...COURT_THEMES['bcvb-editorial'],
  red: COURT_THEMES['bcvb-editorial'].bcvbRed,
  blue: COURT_THEMES['bcvb-editorial'].pass,
  green: '#3a8960',
  orange: COURT_THEMES['bcvb-editorial'].cone,
}
