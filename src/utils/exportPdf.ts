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
export async function exportNodeToPdf(node: HTMLElement, filename: string): Promise<void> {
  const { default: JsPDF } = await import("jspdf");
  const imageData = await nodeToDataUrl(node, 2);

  const pdf = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Reconstruct pixel dimensions from the data URL to compute ratio
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = imageData;
  });

  const canvasWidth = img.naturalWidth;
  const canvasHeight = img.naturalHeight;

  const imgWidth = pageWidth;
  const imgHeight = (canvasHeight * imgWidth) / canvasWidth;

  if (imgHeight <= pageHeight) {
    pdf.addImage(imageData, "PNG", 0, 0, imgWidth, imgHeight);
  } else {
    const ratio = pageWidth / canvasWidth;
    const pageHeightPx = pageHeight / ratio;
    let renderedHeightPx = 0;

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
      const pageImgHeight = sliceHeightPx * ratio;

      if (renderedHeightPx > 0) {
        pdf.addPage();
      }

      pdf.addImage(pageData, "PNG", 0, 0, pageWidth, pageImgHeight);
      renderedHeightPx += sliceHeightPx;
    }
  }

  pdf.save(filename);
}
