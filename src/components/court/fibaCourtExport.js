function slugify(value = 'terrain-bcvb') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'terrain-bcvb'
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function getCourtSvgElement(frameId) {
  if (frameId) return document.querySelector(`[data-court-frame-id="${frameId}"] svg`)
  return document.querySelector('.bcvb-court-svg, .fiba-court-pro svg, .court-stage svg')
}

export function serializeCourtSvg(svgElement) {
  if (!svgElement) return ''
  const clone = svgElement.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clone)
}

export function renderCourtSvgMarkup({ frameId } = {}) {
  return serializeCourtSvg(getCourtSvgElement(frameId))
}

export function exportCourtSvg({ frameId, title = 'terrain-bcvb' } = {}) {
  const svg = renderCourtSvgMarkup({ frameId })
  if (!svg) return false
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), `${slugify(title)}.svg`)
  return true
}

export async function exportCourtPng({ frameId, title = 'terrain-bcvb', minWidth = 1600 } = {}) {
  const svgElement = getCourtSvgElement(frameId)
  const svg = serializeCourtSvg(svgElement)
  if (!svg || !svgElement) return false

  const viewBox = svgElement.viewBox.baseVal
  const ratio = viewBox.height ? viewBox.width / viewBox.height : 28 / 15
  const width = Math.max(minWidth, viewBox.width)
  const height = Math.round(width / ratio)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return false
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)

  const image = new Image()
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
      image.src = url
    })
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return false
    downloadBlob(blob, `${slugify(title)}.png`)
    return true
  } finally {
    URL.revokeObjectURL(url)
  }
}
