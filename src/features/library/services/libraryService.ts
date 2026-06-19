import { supabase } from '../../../lib/supabase'
import { updateRowsByIds } from '../../../lib/bulkSupabaseActions'

export type LibraryDocumentRow = {
  id: string
  title: string
  description: string | null
  summary?: string | null
  document_type: string
  family?: string | null
  file_url?: string | null
  file_ext: string | null
  bucket_name: string
  storage_path: string
  category: string | null
  subCategory?: string | null
  sub_category?: string | null
  subcategory: string | null
  theme?: string | null
  sportCategory?: string | null
  sport_category?: string | null
  category_code: string | null
  theme_code: string | null
  team_code: string | null
  audience: string | string[]
  season: string | null
  tags: string[] | null
  content: string | null
  status: string
  visibility?: 'private' | 'club' | 'coaches' | 'leaders' | 'parents_ref' | 'public' | null
  allowedRoles?: string[] | null
  allowed_roles?: string[] | null
  ownerId?: string | null
  owner_id?: string | null
  teamId?: string | null
  team_id?: string | null
  quality_status?: string | null
  qualityScore?: number | null
  quality_score?: number | null
  publication_level?: string | null
  publicationLevel?: string | null
  level?: string | null
  sourcePath?: string | null
  source_path?: string | null
  pdfPath?: string | null
  pdf_path?: string | null
  downloadUrl?: string | null
  download_url?: string | null
  sourceDownloadUrl?: string | null
  source_download_url?: string | null
  pdf_url?: string | null
  pdf_storage_path?: string | null
  source_markdown?: string | null
  sourceDocumentId?: string | null
  source_document_id: string | null
  transformedFromTitle?: string | null
  transformed_from_title?: string | null
  transformationDate?: string | null
  transformation_date?: string | null
  transformationMode?: 'bcvb_upgrade' | string | null
  transformation_mode?: 'bcvb_upgrade' | string | null
  version?: string | number | null
  parentDocumentId?: string | null
  parent_document_id?: string | null
  createdFromDocumentId?: string | null
  created_from_document_id?: string | null
  isLatestVersion?: boolean | null
  is_latest_version?: boolean | null
  versions_count?: number | null
  isArchived?: boolean | null
  is_archived?: boolean | null
  archivedAt?: string | null
  archived_at?: string | null
  archivedBy?: string | null
  archived_by?: string | null
  isDeleted?: boolean | null
  is_deleted?: boolean | null
  deletedAt?: string | null
  deleted_at?: string | null
  deletedBy?: string | null
  deleted_by?: string | null
  deleteReason?: string | null
  delete_reason?: string | null
  is_active: boolean
  is_featured: boolean
  is_ai_generated: boolean | null
  uploaded_by: string | null
  generation_request_id: string | null
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
}

export async function createLibraryDocumentSignedUrl(
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

async function updateLibraryDocumentWithFallback(
  documentId: string,
  payload: Record<string, unknown>,
  fallback: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('library_documents')
    .update(payload)
    .eq('id', documentId)
    .select('id, title, status, updated_at')
    .single()

  if (!error) return data

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('library_documents')
    .update(fallback)
    .eq('id', documentId)
    .select('id, title, status, updated_at')
    .single()

  if (fallbackError) throw fallbackError
  return fallbackData
}

export async function archiveLibraryDocument(documentId: string, userId?: string | null) {
  const now = new Date().toISOString()
  return updateLibraryDocumentWithFallback(
    documentId,
    {
      is_archived: true,
      archived_at: now,
      archived_by: userId ?? null,
      status: 'archived',
      updated_at: now,
    },
    {
      is_active: false,
      status: 'archived',
      updated_at: now,
    }
  )
}

export async function archiveLibraryDocuments(documentIds: string[], userId?: string | null) {
  const now = new Date().toISOString()
  return updateRowsByIds(
    'library_documents',
    documentIds,
    {
      is_archived: true,
      archived_at: now,
      archived_by: userId ?? null,
      status: 'archived',
      updated_at: now,
    },
  )
}

export async function softDeleteLibraryDocument(
  documentId: string,
  userId: string | null | undefined,
  deleteReason: string
) {
  const now = new Date().toISOString()
  return updateLibraryDocumentWithFallback(
    documentId,
    {
      is_deleted: true,
      deleted_at: now,
      deleted_by: userId ?? null,
      delete_reason: deleteReason,
      is_active: false,
      status: 'deleted',
      updated_at: now,
    },
    {
      is_active: false,
      status: 'deleted',
      updated_at: now,
    }
  )
}

export async function softDeleteLibraryDocuments(
  documentIds: string[],
  userId: string | null | undefined,
  deleteReason: string
) {
  const now = new Date().toISOString()
  return updateRowsByIds(
    'library_documents',
    documentIds,
    {
      is_deleted: true,
      deleted_at: now,
      deleted_by: userId ?? null,
      delete_reason: deleteReason,
      is_active: false,
      status: 'deleted',
      updated_at: now,
    },
  )
}
