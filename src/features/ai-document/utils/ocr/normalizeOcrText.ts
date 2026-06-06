export function normalizeOcrText(text: string): string {
  const normalizedBullets = text
    .replace(/[•●▪◦]/g, '-')
    .replace(/\r\n/g, '\n')
    .replace(/\bundefined\b|\[object Object\]/g, '')

  const lines = normalizedBullets
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, ' ').trim())

  const cleaned: string[] = []

  for (const line of lines) {
    if (!line) {
      if (cleaned[cleaned.length - 1] !== '') cleaned.push('')
      continue
    }

    if (/^\d+$/.test(line)) continue
    if (/^page\s+\d+\s+(sur|\/)\s+\d+$/i.test(line)) continue
    if (/^\d+\s*\/\s*\d+$/.test(line)) continue
    if (/^[^\wÀ-ÿ|]{1,4}$/.test(line)) continue

    const previous = cleaned[cleaned.length - 1]
    const isTableLine = line.includes('|') && line.split('|').filter(Boolean).length >= 2
    const looksLikeTitle =
      line.length <= 80 &&
      /^[A-ZÀ-Ÿ0-9][A-ZÀ-Ÿ0-9\s'’:/-]{5,}$/.test(line) &&
      !isTableLine
    const shouldJoin =
      previous &&
      previous !== '' &&
      !previous.endsWith('.') &&
      !previous.endsWith(':') &&
      !previous.includes('|') &&
      !isTableLine &&
      !looksLikeTitle &&
      line[0] === line[0]?.toLowerCase()

    if (shouldJoin) {
      cleaned[cleaned.length - 1] = `${previous} ${line}`
    } else {
      cleaned.push(line)
    }
  }

  return cleaned
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

