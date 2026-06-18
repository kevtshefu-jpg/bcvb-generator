import { downloadSource } from "../services/documentVersionService";

type SourceDownloadButtonProps = {
  documentId: string;
  contentSource: string;
  fileNameSuffix?: string;
};

export default function SourceDownloadButton({ documentId, contentSource, fileNameSuffix }: SourceDownloadButtonProps) {
  return (
    <button type="button" onClick={() => downloadSource(documentId, contentSource, fileNameSuffix)}>
      Télécharger source Markdown
    </button>
  );
}
