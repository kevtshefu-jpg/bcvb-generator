import { useState } from "react";
import type { AttachmentProcessingResult, BcvbDocumentType } from "../../../types/attachments";
import { bcvbDocumentTypeLabels, transformAttachmentToBcvbMarkdown } from "../services/documentTransformer";

type AttachmentToDocumentPanelProps = {
  result: AttachmentProcessingResult | null;
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  onSendToStudio: (documentType: BcvbDocumentType, markdown: string) => void;
};

const documentTypes = Object.keys(bcvbDocumentTypeLabels) as BcvbDocumentType[];

export default function AttachmentToDocumentPanel({
  result,
  markdown,
  onMarkdownChange,
  onSendToStudio,
}: AttachmentToDocumentPanelProps) {
  const [documentType, setDocumentType] = useState<BcvbDocumentType>("guide_coach");
  const [building, setBuilding] = useState(false);

  async function buildMarkdown() {
    if (!result) return;
    setBuilding(true);
    try {
      const nextMarkdown = await transformAttachmentToBcvbMarkdown(result, documentType);
      onMarkdownChange(nextMarkdown);
    } finally {
      setBuilding(false);
    }
  }

  return (
    <section className="attachment-transform-panel">
      <header>
        <div>
          <p className="bcvb-eyebrow">Transformation éditoriale</p>
          <h2>Transformer en document BCVB</h2>
          <span>Le brouillon conserve la source OCR, la confiance et les incertitudes.</span>
        </div>
        <select
          value={documentType}
          onChange={(event) => setDocumentType(event.target.value as BcvbDocumentType)}
          disabled={!result}
        >
          {documentTypes.map((type) => (
            <option value={type} key={type}>
              {bcvbDocumentTypeLabels[type]}
            </option>
          ))}
        </select>
      </header>

      <div className="attachment-transform-actions">
        <button type="button" onClick={buildMarkdown} disabled={!result || building}>
          {building ? "Structuration..." : "Générer brouillon BCVB"}
        </button>
        <button type="button" onClick={() => onSendToStudio(documentType, markdown)} disabled={!result || !markdown.trim()}>
          Envoyer au Studio éditorial
        </button>
      </div>

      <textarea
        className="attachment-transform-preview"
        value={markdown}
        onChange={(event) => onMarkdownChange(event.target.value)}
        placeholder="Le brouillon BCVB Rich Markdown apparaîtra ici."
      />
    </section>
  );
}
