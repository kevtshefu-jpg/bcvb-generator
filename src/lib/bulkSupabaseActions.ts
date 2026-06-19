import { supabase } from './supabase'

export type BulkActionResult = {
  ok: boolean
  count: number
  error?: string
}

export type BulkRowsOptions = {
  idColumn?: string
  deletedAtColumn?: string
  archivedAtColumn?: string
  statusColumn?: string
  deletedStatusValue?: string
  archivedStatusValue?: string
}

const defaultOptions = {
  idColumn: 'id',
  deletedAtColumn: 'deleted_at',
  archivedAtColumn: 'archived_at',
  statusColumn: 'status',
  deletedStatusValue: 'deleted',
  archivedStatusValue: 'archived',
}

function normalizeIds(ids: string[]) {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)))
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: unknown }).message)
  }
  return 'Action groupée impossible.'
}

export async function updateRowsByIds(
  table: string,
  ids: string[],
  patch: Record<string, unknown>,
  options: BulkRowsOptions = {},
): Promise<BulkActionResult> {
  const cleanIds = normalizeIds(ids)
  const mergedOptions = { ...defaultOptions, ...options }

  if (!table.trim()) {
    return { ok: false, count: 0, error: 'Table Supabase non renseignée.' }
  }

  if (cleanIds.length === 0) {
    return { ok: false, count: 0, error: 'Aucun élément sélectionné.' }
  }

  const { error } = await supabase
    .from(table)
    .update(patch)
    .in(mergedOptions.idColumn, cleanIds)

  if (error) {
    return { ok: false, count: 0, error: getErrorMessage(error) }
  }

  return { ok: true, count: cleanIds.length }
}

export async function softDeleteRows(
  table: string,
  ids: string[],
  options: BulkRowsOptions = {},
): Promise<BulkActionResult> {
  const mergedOptions = { ...defaultOptions, ...options }
  const now = new Date().toISOString()

  return updateRowsByIds(
    table,
    ids,
    {
      [mergedOptions.deletedAtColumn]: now,
      [mergedOptions.statusColumn]: mergedOptions.deletedStatusValue,
    },
    mergedOptions,
  )
}

export async function archiveRows(
  table: string,
  ids: string[],
  options: BulkRowsOptions = {},
): Promise<BulkActionResult> {
  const mergedOptions = { ...defaultOptions, ...options }
  const now = new Date().toISOString()

  return updateRowsByIds(
    table,
    ids,
    {
      [mergedOptions.archivedAtColumn]: now,
      [mergedOptions.statusColumn]: mergedOptions.archivedStatusValue,
    },
    mergedOptions,
  )
}

export async function hardDeleteRows(
  table: string,
  ids: string[],
  options: BulkRowsOptions = {},
): Promise<BulkActionResult> {
  const cleanIds = normalizeIds(ids)
  const mergedOptions = { ...defaultOptions, ...options }

  if (!table.trim()) {
    return { ok: false, count: 0, error: 'Table Supabase non renseignée.' }
  }

  if (cleanIds.length === 0) {
    return { ok: false, count: 0, error: 'Aucun élément sélectionné.' }
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .in(mergedOptions.idColumn, cleanIds)

  if (error) {
    return { ok: false, count: 0, error: getErrorMessage(error) }
  }

  return { ok: true, count: cleanIds.length }
}
