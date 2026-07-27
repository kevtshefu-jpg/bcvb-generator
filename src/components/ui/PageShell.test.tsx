import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageShell } from './PageShell'

describe('PageShell', () => {
  it('utilise la largeur standard par défaut', () => {
    const { container } = render(<PageShell>Contenu</PageShell>)

    expect(container.firstElementChild).toHaveClass(
      'bcvb-page-shell',
      'bcvb-page-shell--standard',
    )
  })

  it.each(['reading', 'wide', 'fullBleed'] as const)(
    'expose la variante de largeur %s',
    (variant) => {
      const { container } = render(<PageShell variant={variant}>Contenu</PageShell>)

      expect(container.firstElementChild).toHaveClass(`bcvb-page-shell--${variant}`)
    },
  )

  it('conserve compact comme alias de la largeur de lecture', () => {
    const { container } = render(<PageShell compact>Contenu</PageShell>)

    expect(container.firstElementChild).toHaveClass('bcvb-page-shell--reading')
  })
})
