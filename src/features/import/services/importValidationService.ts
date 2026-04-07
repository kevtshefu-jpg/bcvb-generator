import { supabase } from '../../../lib/supabase'

export type ImportRowDb = {
  id: string
  batch_id: string
  raw_data: Record<string, unknown>
  normalized_first_name: string | null
  normalized_last_name: string | null
  normalized_email: string | null
  normalized_phone: string | null
  normalized_birth_year: number | null
  normalized_category_id: string | null
  status: string
  validated: boolean
  imported_profile_id: string | null
  validation_note: string | null
}

export async function fetchImportRows(batchId: string) {
  const { data, error } = await supabase
    .from('import_rows')
    .select('*')
    .eq('batch_id', batchId)
    .order('id', { ascending: true })

  if (error) throw error
  return (data ?? []) as ImportRowDb[]
}

export async function updateImportRowValidation(
  rowId: string,
  validated: boolean,
  validationNote?: string
) {
  const { data, error } = await supabase
    .from('import_rows')
    .update({
      validated,
      validation_note: validationNote ?? null,
    })
    .eq('id', rowId)
    .select('*')
    .single()

  if (error) throw error
  return data as ImportRowDb
}

export async function createProfileFromImportRow(row: ImportRowDb) {
  const generatedId = crypto.randomUUID()

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: generatedId,
      email: row.normalized_email,
      full_name: [row.normalized_first_name, row.normalized_last_name].filter(Boolean).join(' '),
      role: 'joueur',
      category_id: row.normalized_category_id,
      is_active: true,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function markImportRowAsImported(rowId: string, importedProfileId: string) {
  const { data, error } = await supabase
    .from('import_rows')
    .update({
      status: 'imported',
      imported_profile_id: importedProfileId,
      validated: true,
    })
    .eq('id', rowId)
    .select('*')
    .single()

  if (error) throw error
  return data as ImportRowDb
}

export async function fetchImportBatches() {
  const { data, error } = await supabase
    .from('import_batches')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}