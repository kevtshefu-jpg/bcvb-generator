import { supabase } from '../lib/supabase'

export type SaveManualGeneratedDocumentInput = {
  title: string
  content: string
  description?: string
  documentType: string
  category?: string
  subcategory?: string
  audience?: string
  season?: string | null
  tags?: string[]
  sourceDocumentId?: string | null
  generationType?: string
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function saveManualGeneratedDocument({
  title,
  content,
  description,
  documentType,
  category = 'Général BCVB',
  subcategory = 'Ressource documentaire',
  audience = 'Interne club',
  season = null,
  tags = [],
  sourceDocumentId = null,
  generationType = 'manual_chatgpt',
}: SaveManualGeneratedDocumentInput) {
  console.log('Début enregistrement manuel du document')

  const cleanTitle = title?.trim()
  const cleanContent = content?.trim()
  const cleanDocumentType = documentType?.trim()

  if (!cleanTitle) {
    throw new Error('Le titre du document est obligatoire.')
  }

  if (!cleanDocumentType) {
    throw new Error('Le type de document est obligatoire.')
  }

  if (!cleanContent) {
    throw new Error('Le contenu à enregistrer est vide.')
  }

  const now = new Date().toISOString()
  const safeSlug = slugify(cleanTitle)
  const storageFolder =
    generationType === 'transformed_document'
      ? 'transformed-documents'
      : 'manual-chatgpt'
  const uniquePath = `${storageFolder}/${Date.now()}-${safeSlug}.md`

  const payload = {
    title: cleanTitle,
    description:
      description?.trim() ||
      'Ressource documentaire BCVB.',

    document_type: cleanDocumentType,
    file_ext: 'md',
    bucket_name: 'bcvb-library',
    storage_path: uniquePath,

    category: category?.trim() || null,
    subcategory: subcategory?.trim() || null,
    category_code: category?.trim() || null,
    theme_code: subcategory?.trim() || null,
    team_code: null,

    audience: audience?.trim() || 'Interne club',
    season: season?.trim() || null,
    status: 'uploaded',

    is_active: true,
    is_featured: false,
    is_ai_generated: true,

    uploaded_by: null,
    source_document_id: sourceDocumentId,
    generation_request_id: null,

    tags: Array.from(
      new Set(
        ['BCVB', ...tags]
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    ),
    content: cleanContent,

    created_at: now,
    updated_at: now,
  }

  console.log('Payload envoyé à Supabase :', payload)

  const { data, error } = await supabase
    .from('library_documents')
    .insert(payload)
    .select('id, title, document_type, storage_path, status')
    .single()

  if (error) {
    console.error('Erreur Supabase insertion :', error)
    throw new Error(error.message)
  }

  console.log('Document enregistré :', data)

  return data
}
