import { supabase } from '../lib/supabase'

type SaveManualGeneratedDocumentInput = {
  title: string
  content: string
  category?: string
  subcategory?: string
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
  category = 'Document généré',
  subcategory = 'Mode manuel ChatGPT',
  sourceDocumentId = null,
  generationType = 'manual_chatgpt',
}: SaveManualGeneratedDocumentInput) {
  console.log('Début enregistrement manuel ChatGPT')

  const cleanTitle = title?.trim() || 'Document généré manuellement avec ChatGPT'
  const cleanContent = content?.trim()

  if (!cleanContent) {
    throw new Error('Le contenu à enregistrer est vide.')
  }

  const now = new Date().toISOString()
  const safeSlug = slugify(cleanTitle)
  const uniquePath = `manual-chatgpt/${Date.now()}-${safeSlug}.md`

  const payload = {
    title: cleanTitle,
    description:
      'Document généré manuellement avec ChatGPT puis enregistré dans la bibliothèque BCVB.',

    document_type: generationType || 'manual_chatgpt',
    file_ext: 'md',
    bucket_name: 'bcvb-library',
    storage_path: uniquePath,

    category,
    subcategory,
    category_code: null,
    theme_code: null,
    team_code: null,

    audience: 'member',
    season: null,
    status: 'uploaded',

    is_active: true,
    is_featured: false,
    is_ai_generated: true,

    uploaded_by: null,
    source_document_id: sourceDocumentId,
    generation_request_id: null,

    tags: ['BCVB', 'ChatGPT', 'Mode manuel', generationType],
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