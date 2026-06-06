import { downloadSource } from "../services/documentVersionService";

type SourceDownloadButtonProps = {
  documentId: string;
  contentSource: string;
};

export default function SourceDownloadButton({ documentId, contentSource }: SourceDownloadButtonProps) {
  return (
    <button type="button" onClick={() => downloadSource(documentId, contentSource)}>
      Télécharger source Markdown
    </button>
  );
}
