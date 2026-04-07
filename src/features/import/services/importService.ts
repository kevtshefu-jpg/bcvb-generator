import { supabase } from '../../../lib/supabase'

export type ImportBatchRow = {
  id: string
  created_at: string
  created_by: string | null
  source_type: string
  file_name: string
  status: string
}

export type ImportRowInsert = {
  raw_data: Record<string, unknown>
  normalized_first_name?: string | null
  normalized_last_name?: string | null
  normalized_email?: string | null
  normalized_phone?: string | null
  normalized_birth_year?: number | null
  normalized_category_id?: string | null
  status?: string
}

export async function createImportBatch(
  createdBy: string | undefined,
  sourceType: string,
  fileName: string
) {
  const { data, error } = await supabase
    .from('import_batches')
    .insert({
      created_by: createdBy ?? null,
      source_type: sourceType,
      file_name: fileName,
      status: 'draft',
    })
    .select('*')
    .single()

  if (error) throw error
  return data as ImportBatchRow
}

export async function insertImportRows(batchId: string, rows: ImportRowInsert[]) {
  if (rows.length === 0) return []

  const payload = rows.map((row) => ({
    batch_id: batchId,
    raw_data: row.raw_data,
    normalized_first_name: row.normalized_first_name ?? null,
    normalized_last_name: row.normalized_last_name ?? null,
    normalized_email: row.normalized_email ?? null,
    normalized_phone: row.normalized_phone ?? null,
    normalized_birth_year: row.normalized_birth_year ?? null,
    normalized_category_id: row.normalized_category_id ?? null,
    status: row.status ?? 'pending',
  }))

  const { data, error } = await supabase
    .from('import_rows')
    .insert(payload)
    .select('*')

  if (error) throw error
  return data ?? []
}

export async function finalizeImportBatch(batchId: string) {
  const { data, error } = await supabase
    .from('import_batches')
    .update({ status: 'ready' })
    .eq('id', batchId)
    .select('*')
    .single()

  if (error) throw error
  return data as ImportBatchRow
}