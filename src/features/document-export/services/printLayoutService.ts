export type PrintOrientation = "portrait" | "landscape";

export function preparePrintLayout(contentElementId: string, orientation: PrintOrientation) {
  const element = document.getElementById(contentElementId);
  if (!element) throw new Error(`Contenu exportable introuvable : ${contentElementId}`);

  document.documentElement.dataset.printOrientation = orientation;
  element.classList.add("bcvb-print-exporting");

  return () => {
    element.classList.remove("bcvb-print-exporting");
    delete document.documentElement.dataset.printOrientation;
  };
}

export function suggestPrintOrientation(element: HTMLElement | null): PrintOrientation {
  if (!element) return "portrait";
  const hasWideTable = Boolean(element.querySelector(".bcvb-table-block--full, .bcvb-table-block--compact"));
  return hasWideTable ? "landscape" : "portrait";
}
