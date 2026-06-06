function slugify(value = "terrain-bcvb") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "terrain-bcvb";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function getCourtSvgElement(frameId?: string) {
  if (frameId) {
    return document.querySelector<SVGSVGElement>(`[data-court-editor-id="${frameId}"] svg`);
  }
  return document.querySelector<SVGSVGElement>(".fastdraw-court-svg, .bcvb-court-svg, .fiba-court-pro svg");
}

export function serializeCourtSvg(svgElement: SVGSVGElement | null) {
  if (!svgElement) return "";
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(clone);
}

export function renderCourtSvgMarkup(frameId?: string) {
  return serializeCourtSvg(getCourtSvgElement(frameId));
}

export function exportCourtSvgFromElement(svgElement: SVGSVGElement | null, title = "terrain-bcvb") {
  const svg = serializeCourtSvg(svgElement);
  if (!svg) return false;
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${slugify(title)}.svg`);
  return true;
}

export function exportCourtSvg(frameId: string, title = "terrain-bcvb") {
  return exportCourtSvgFromElement(getCourtSvgElement(frameId), title);
}

export async function exportCourtPngFromElement(svgElement: SVGSVGElement | null, title = "terrain-bcvb", minWidth = 1800) {
  const svg = serializeCourtSvg(svgElement);
  if (!svg || !svgElement) return false;

  const viewBox = svgElement.viewBox.baseVal;
  const ratio = viewBox.height ? viewBox.width / viewBox.height : 28 / 15;
  const width = Math.max(minWidth, viewBox.width);
  const height = Math.round(width / ratio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return false;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const image = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Export PNG impossible"));
      image.src = url;
    });
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) return false;
    downloadBlob(blob, `${slugify(title)}.png`);
    return true;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function exportCourtPng(frameId: string, title = "terrain-bcvb", minWidth = 1800) {
  return exportCourtPngFromElement(getCourtSvgElement(frameId), title, minWidth);
}
