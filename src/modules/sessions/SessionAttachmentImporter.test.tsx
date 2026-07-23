import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionAttachmentImporter } from "./SessionAttachmentImporter";

describe("SessionAttachmentImporter", () => {
  it("ne fabrique aucun texte quand le fichier ne peut pas être extrait localement", async () => {
    const onExtractedTextChange = vi.fn();
    const onFileNameChange = vi.fn();
    const { container } = render(
      <SessionAttachmentImporter
        extractedText=""
        fileName=""
        onExtractedTextChange={onExtractedTextChange}
        onFileNameChange={onFileNameChange}
      />
    );
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    fireEvent.change(input!, {
      target: { files: [new File(["image"], "fiche.png", { type: "image/png" })] },
    });

    expect(onFileNameChange).toHaveBeenCalledWith("fiche.png");
    expect(onExtractedTextChange).not.toHaveBeenCalled();
    expect(await screen.findByText(/Lecture automatique non disponible/)).toBeInTheDocument();
  });
});
