import { Link } from 'react-router-dom'
import type {
  EditorialStudioFamilyOption,
  EditorialStudioFormValues,
  EditorialStudioMetaItem,
} from '../types/editorialStudioTypes'

type EditorialStudioFormProps = {
  values: EditorialStudioFormValues
  families: EditorialStudioFamilyOption[]
  metadata: EditorialStudioMetaItem[]
  disabled?: boolean
  onChange: (nextValues: Partial<EditorialStudioFormValues>) => void
  onAttachment: (file: File | null) => void
}

export function EditorialStudioForm({
  values,
  families,
  metadata,
  disabled = false,
  onChange,
  onAttachment,
}: EditorialStudioFormProps) {
  return (
    <>
      <section className="editorial-panel editorial-step-card">
        <header>
          <p className="bcvb-eyebrow">OCR / texte brut</p>
          <h2>Sources importées</h2>
        </header>
        <div className="editorial-attachment-row">
          <label>
            <span>Importer PDF, image, DOCX ou texte</span>
            <small>Ajoute une source brute. Le texte extrait reste modifiable avant transformation.</small>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md,.csv,image/*"
              disabled={disabled}
              onChange={(event) => onAttachment(event.target.files?.[0] ?? null)}
            />
          </label>
          <Link to="/admin/ocr-pieces-jointes">Ouvrir OCR avancé</Link>
        </div>
        <textarea
          className="editorial-textarea editorial-studio-form__textarea"
          value={values.sourceText}
          disabled={disabled}
          onChange={(event) => onChange({ sourceText: event.target.value })}
          placeholder="Texte OCR, source brute, notes de fichier ou contenu à transformer."
        />
      </section>

      <section className="editorial-panel editorial-step-card editorial-studio-form" id="studio-classification">
        <header>
          <p className="bcvb-eyebrow">Notes admin</p>
          <h2>Cadrage et métadonnées</h2>
        </header>
        <div className="editorial-form-grid editorial-form-grid--single editorial-studio-form__grid">
          <label className="editorial-studio-form__field">
            <span>Titre du document</span>
            <input
              value={values.targetDocument}
              disabled={disabled}
              onChange={(event) => onChange({ targetDocument: event.target.value })}
            />
          </label>
          <label className="editorial-studio-form__field">
            <span>Famille</span>
            <select
              value={values.family}
              disabled={disabled}
              onChange={(event) => onChange({ family: event.target.value })}
            >
              {families.map((family) => (
                <option value={family.id} key={family.id}>
                  {family.label}
                </option>
              ))}
            </select>
          </label>
          <label className="editorial-studio-form__field">
            <span>Catégorie</span>
            <input
              value={values.category}
              disabled={disabled}
              onChange={(event) => onChange({ category: event.target.value })}
            />
          </label>
          <label className="editorial-studio-form__field">
            <span>Public</span>
            <input
              value={values.audience}
              disabled={disabled}
              onChange={(event) => onChange({ audience: event.target.value })}
            />
          </label>
        </div>
        <dl className="editorial-metadata-list">
          {metadata.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}
