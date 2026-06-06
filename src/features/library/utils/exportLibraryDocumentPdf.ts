export async function exportLibraryDocumentHtmlToPdf(
  html: string,
  filename: string
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default
  const { default: JsPDF } = await import('jspdf')

  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.left = '-10000px'
  iframe.style.top = '0'
  iframe.style.width = '1120px'
  iframe.style.height = '1600px'
  iframe.style.border = '0'
  iframe.srcdoc = html
  document.body.appendChild(iframe)

  try {
    await new Promise<void>((resolve, reject) => {
      iframe.onload = () => resolve()
      iframe.onerror = () => reject(new Error('Impossible de préparer le rendu PDF.'))
    })

    const frameDocument = iframe.contentDocument
    if (!frameDocument) {
      throw new Error('Le document PDF est inaccessible.')
    }

    frameDocument.body.classList.add('pdf-export')

    await Promise.all(
      Array.from(frameDocument.images).map((image) => {
        if (image.complete) return Promise.resolve()

        return new Promise<void>((resolve) => {
          image.onload = () => resolve()
          image.onerror = () => resolve()
        })
      })
    )

    const target = frameDocument.querySelector<HTMLElement>('.document-paper')
    if (!target) {
      throw new Error('Le contenu du document est introuvable.')
    }

    const canvas = await html2canvas(target, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      windowWidth: target.scrollWidth,
      windowHeight: target.scrollHeight,
    })

    const pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 8
    const contentWidth = pageWidth - margin * 2
    const contentHeight = pageHeight - margin * 2
    const ratio = contentWidth / canvas.width
    const sliceHeightPx = Math.floor(contentHeight / ratio)

    let offsetY = 0
    let pageIndex = 0

    while (offsetY < canvas.height) {
      const currentSliceHeight = Math.min(sliceHeightPx, canvas.height - offsetY)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = currentSliceHeight

      const context = sliceCanvas.getContext('2d')
      if (!context) {
        throw new Error('Impossible de générer une page PDF.')
      }

      context.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        currentSliceHeight,
        0,
        0,
        canvas.width,
        currentSliceHeight
      )

      if (pageIndex > 0) {
        pdf.addPage()
      }

      pdf.addImage(
        sliceCanvas.toDataURL('image/png'),
        'PNG',
        margin,
        margin,
        contentWidth,
        currentSliceHeight * ratio
      )

      offsetY += currentSliceHeight
      pageIndex += 1
    }

    pdf.save(filename)
  } finally {
    iframe.remove()
  }
}
