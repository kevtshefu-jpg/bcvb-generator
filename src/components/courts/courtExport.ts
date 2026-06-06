import type { CourtType, SessionCourtFrame } from '../../modules/sessions/sessionModels'
import { getCourtDimensions } from './courtGeometry'

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'terrain-bcvb'
}

function download(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function getCourtSvgElement(frameId: string) {
  return document.querySelector<SVGSVGElement>(`[data-court-frame-id="${frameId}"] svg`)
}

export function serializeCourtSvg(svgElement: SVGSVGElement | null) {
  if (!svgElement) return ''
  const clone = svgElement.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clone)
}

export function renderCourtSvgMarkup(frameId: string) {
  return serializeCourtSvg(getCourtSvgElement(frameId))
}

export function exportCourtSvg(frame: SessionCourtFrame) {
  const svg = renderCourtSvgMarkup(frame.id)
  if (!svg) return false
  download(svg, `${slugify(frame.title)}.svg`, 'image/svg+xml;charset=utf-8')
  return true
}

export async function exportCourtPng(frame: SessionCourtFrame) {
  const svgElement = getCourtSvgElement(frame.id)
  if (!svgElement) return false

  const svg = serializeCourtSvg(svgElement)
  const { length, width } = getCourtDimensions(frame.courtType)
  const canvas = document.createElement('canvas')
  canvas.width = length * 120
  canvas.height = width * 120
  const context = canvas.getContext('2d')
  if (!context) return false

  const image = new Image()
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('Export PNG impossible'))
    image.src = url
  })

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(url)

  const pngUrl = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = pngUrl
  link.download = `${slugify(frame.title)}.png`
  link.click()
  return true
}

export type CourtQualityReport = {
  score: number
  warnings: string[]
}

export function courtQualityScore(frame: SessionCourtFrame): CourtQualityReport {
  const warnings: string[] = []
  let score = 0
  const dimensions = getCourtDimensions(frame.courtType)
  const isHalf = frame.courtType !== 'full'

  score += frame.courtType ? 10 : 0
  score += dimensions.length > 0 && dimensions.width === 15 ? 20 : 0
  score += 10
  score += 10
  score += 10
  score += 10
  const objectsInBounds = frame.objects.every((object) => {
    const x = object.x > dimensions.length ? (object.x / 100) * dimensions.length : object.x
    const y = object.y > dimensions.width ? (object.y / 100) * dimensions.width : object.y
    return x >= 0 && x <= dimensions.length && y >= 0 && y <= dimensions.width
  })
  score += objectsInBounds ? 10 : 0
  score += frame.arrows.length > 0 || frame.objects.length <= 1 ? 10 : 6
  score += 5
  score += 5

  if (isHalf && dimensions.length !== 14) warnings.push('Demi-terrain mal proportionné')
  if (!objectsInBounds) warnings.push('Objets hors terrain')
  if (!frame.objects.length) warnings.push('Terrain trop vide pour export PDF')
  if (!frame.arrows.length && frame.objects.length > 1) warnings.push('Flèches illisibles ou absentes')

  return { score: Math.min(100, score), warnings }
}

export function isProCourtType(courtType: CourtType | string) {
  return ['full', 'half', 'half-left', 'half-right', 'half-offense', 'half-defense', 'mini'].includes(courtType)
}
