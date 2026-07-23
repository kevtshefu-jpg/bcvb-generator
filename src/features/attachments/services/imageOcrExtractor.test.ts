import { beforeEach, describe, expect, it, vi } from "vitest";

const { recognize, terminate, createWorker } = vi.hoisted(() => ({
  recognize: vi.fn(),
  terminate: vi.fn(),
  createWorker: vi.fn(),
}));

vi.mock("tesseract.js", () => ({ createWorker }));

import {
  extractOcrFromImage,
  OcrExtractionError,
  recognizeCanvasWithOcr,
} from "./imageOcrExtractor";

describe("imageOcrExtractor", () => {
  const canvas = {} as HTMLCanvasElement;

  beforeEach(() => {
    vi.clearAllMocks();
    createWorker.mockResolvedValue({ recognize, terminate });
    terminate.mockResolvedValue(undefined);
  });

  it("retourne uniquement le texte réellement reconnu", async () => {
    recognize.mockResolvedValue({ data: { text: "  Texte réellement lu  ", confidence: 87.4 } });

    await expect(recognizeCanvasWithOcr(canvas)).resolves.toEqual({
      text: "Texte réellement lu",
      confidence: 87,
    });
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("signale explicitement un résultat vide", async () => {
    recognize.mockResolvedValue({ data: { text: "  ", confidence: 0 } });

    await expect(recognizeCanvasWithOcr(canvas)).rejects.toMatchObject({
      code: "empty",
      message: "Aucun texte n’a été détecté dans ce fichier.",
    });
  });

  it("signale explicitement une erreur réseau", async () => {
    createWorker.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(recognizeCanvasWithOcr(canvas)).rejects.toMatchObject({
      code: "network",
      message: "L’extraction est momentanément indisponible. Réessayez.",
    });
  });

  it("signale explicitement une erreur du fournisseur", async () => {
    recognize.mockRejectedValue(new Error("worker crashed"));

    await expect(recognizeCanvasWithOcr(canvas)).rejects.toMatchObject({
      code: "provider",
      message: "L’extraction n’a pas pu aboutir. Réessayez ou saisissez le texte.",
    });
  });

  it("refuse un fichier image invalide avant de lancer l’OCR", async () => {
    const invalidFile = new File([], "vide.png", { type: "image/png" });

    await expect(extractOcrFromImage(invalidFile)).rejects.toEqual(
      new OcrExtractionError("invalid_file")
    );
    expect(createWorker).not.toHaveBeenCalled();
  });

  it("ne remplace jamais une erreur par du texte inventé", async () => {
    recognize.mockRejectedValue(new Error("provider unavailable"));

    const outcome = await recognizeCanvasWithOcr(canvas).catch((error: unknown) => error);

    expect(outcome).toBeInstanceOf(OcrExtractionError);
    expect(outcome).not.toHaveProperty("text");
    expect(String(outcome)).not.toContain("simulé");
    expect(String(outcome)).not.toContain("Philosophie BCVB");
  });
});
