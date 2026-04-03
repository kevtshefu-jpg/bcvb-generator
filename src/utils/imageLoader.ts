export interface LoadedImageFile {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
  name: string;
}

export async function loadImageFile(file: File): Promise<LoadedImageFile> {
  const dataUrl = await readFileAsDataUrl(file);
  const dimensions = await getImageDimensions(dataUrl);

  return {
    dataUrl,
    mimeType: file.type || "image/png",
    width: dimensions.width,
    height: dimensions.height,
    name: file.name,
  };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Impossible de lire le fichier image."));
    };

    reader.onerror = () => reject(reader.error || new Error("Erreur lecture image."));
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error("Impossible de charger l'image."));
    img.src = dataUrl;
  });
}
