import { supabase } from '../../../lib/supabase'

export type LibraryDocumentRow = {
  id: string
  title: string
  description: string | null
  document_type: string
  file_ext: string | null
  bucket_name: string
  storage_path: string
  category_code: string | null
  theme_code: string | null
  team_code: string | null
  audience: string
  season: string | null
  status: string
  is_active: boolean
  is_featured: boolean
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export async function fetchLibraryDocuments() {
  const { data, error } = await supabase
    .from('library_documents')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as LibraryDocumentRow[]
}export async function createLibraryDocumentSignedUrl(
  bucketName: string,
  storagePath: string
) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(storagePath, 60)

  if (error) {
    throw error
  }

  return data.signedUrl
}