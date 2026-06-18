import { nodeToDataUrl } from "./exportImage";

/**
 * Exports a DOM element as a single-page A4 PDF (auto orientation).
 * Both html2canvas and jsPDF are loaded lazily.
 * The content is centred and scaled to fill the page without cropping.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  filename = "fiche-bcvb.pdf"
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const { default: JsPDF } = await import("jspdf");

  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new JsPDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  let finalWidth = pageWidth;
  let finalHeight = (canvas.height * finalWidth) / canvas.width;

  if (finalHeight > pageHeight) {
    finalHeight = pageHeight;
    finalWidth = (canvas.width * finalHeight) / canvas.height;
  }

  const x = (pageWidth - finalWidth) / 2;

  pdf.addImage(imgData, "PNG", x, 0, finalWidth, finalHeight);
  pdf.save(filename);
}

/**
 * Exports a DOM node as a paginated PDF (A4 portrait).
 * Content taller than one page is sliced across multiple pages.
 */
export type ExportNodeToPdfOptions = {
  orientation?: "portrait" | "landscape";
  title?: string;
  marginMm?: number;
  includePageNumbers?: boolean;
}

export async function exportNodeToPdf(
  node: HTMLElement,
  filename: string,
  options: ExportNodeToPdfOptions = {}
): Promise<void> {
  const { default: JsPDF } = await import("jspdf");
  const imageData = await nodeToDataUrl(node, 2);

  const pdf = new JsPDF({
    orientation: options.orientation ?? "portrait",
    unit: "mm",
    format: "a4",
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = options.marginMm ?? 0;
  const contentWidth = Math.max(10, pageWidth - margin * 2);
  const contentHeight = Math.max(10, pageHeight - margin * 2);
  const footerHeight = options.includePageNumbers ? 6 : 0;
  const usableHeight = Math.max(10, contentHeight - footerHeight);

  // Reconstruct pixel dimensions from the data URL to compute ratio
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = imageData;
  });

  const canvasWidth = img.naturalWidth;
  const canvasHeight = img.naturalHeight;

  const imgWidth = contentWidth;
  const imgHeight = (canvasHeight * imgWidth) / canvasWidth;

  function addFooter(pageIndex: number) {
    if (!options.includePageNumbers) return;
    pdf.setFontSize(8);
    pdf.setTextColor(90, 90, 90);
    const label = `${options.title || filename.replace(/\.pdf$/i, "")} · page ${pageIndex}`;
    pdf.text(label, margin, pageHeight - 5, { baseline: "bottom" });
  }

  if (imgHeight <= usableHeight) {
    pdf.addImage(imageData, "PNG", margin, margin, imgWidth, imgHeight);
    addFooter(1);
  } else {
    const ratio = contentWidth / canvasWidth;
    const pageHeightPx = usableHeight / ratio;
    let renderedHeightPx = 0;
    let pageIndex = 1;

    while (renderedHeightPx < canvasHeight) {
      const sliceHeightPx = Math.min(pageHeightPx, canvasHeight - renderedHeightPx);
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvasWidth;
      pageCanvas.height = sliceHeightPx;

      const pageCtx = pageCanvas.getContext("2d");
      if (!pageCtx) break;

      pageCtx.drawImage(
        img,
        0,
        renderedHeightPx,
        canvasWidth,
        sliceHeightPx,
        0,
        0,
        canvasWidth,
        sliceHeightPx
      );

      const pageData = pageCanvas.toDataURL("image/png");
      const pageImgHeight = Math.min(sliceHeightPx * ratio, usableHeight);

      if (renderedHeightPx > 0) {
        pdf.addPage();
      }

      pdf.addImage(pageData, "PNG", margin, margin, contentWidth, pageImgHeight);
      addFooter(pageIndex);
      renderedHeightPx += sliceHeightPx;
      pageIndex += 1;
    }
  }

  pdf.save(filename);
}
