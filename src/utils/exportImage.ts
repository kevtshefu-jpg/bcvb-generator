export async function nodeToDataUrl(node: HTMLElement, scale = 2): Promise<string> {
	const html2canvas = (await import("html2canvas")).default;
	const canvas = await html2canvas(node, {
		backgroundColor: "#ffffff",
		scale,
		useCORS: true,
	});

	return canvas.toDataURL("image/png");
}

export async function exportElementToPng(
	element: HTMLElement,
	filename = "fiche-bcvb.png",
): Promise<void> {
	const imageData = await nodeToDataUrl(element, 2);
	const link = document.createElement("a");
	link.href = imageData;
	link.download = filename;
	link.click();
}
