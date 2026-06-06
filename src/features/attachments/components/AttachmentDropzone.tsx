import { useRef, useState } from "react";

type AttachmentDropzoneProps = {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
};

const acceptedFormats = ".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.csv";

export default function AttachmentDropzone({ disabled = false, onFileSelected }: AttachmentDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file) onFileSelected(file);
  }

  return (
    <section
      className={dragging ? "attachment-dropzone attachment-dropzone--dragging" : "attachment-dropzone"}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedFormats}
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div>
        <p className="bcvb-eyebrow">Import fichier</p>
        <h2>Déposer PDF texte, PDF scanné ou image</h2>
        <p>
          Formats acceptés : PDF, JPG, PNG, WEBP, TXT, Markdown, CSV. Taille conseillée : moins de 25 Mo pour garder
          l’interface réactive.
        </p>
      </div>
      <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}>
        Choisir un fichier
      </button>
    </section>
  );
}
