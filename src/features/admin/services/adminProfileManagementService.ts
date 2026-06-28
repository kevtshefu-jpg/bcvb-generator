import { supabase } from '../../../lib/supabase'

export type AdminProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  is_active: boolean | null
  profile_status?: string | null
  created_at: string | null
  updated_at?: string | null
}

export type AdminProfileAction = 'deactivate' | 'reactivate' | 'delete'

async function getFunctionErrorMessage(error: unknown) {
  const context = (error as { context?: { json?: () => Promise<unknown>; text?: () => Promise<string> } })?.context

  if (context?.json) {
    try {
      const body = await context.json()
      const message = (body as { error?: unknown; message?: unknown })?.error || (body as { message?: unknown })?.message

      if (message) return String(message)
    } catch {
      // Le corps peut ne pas être du JSON selon l'erreur Edge Function.
    }
  }

  if (context?.text) {
    try {
      const text = await context.text()
      if (text) return text
    } catch {
      // Fallback ci-dessous.
    }
  }

  return error instanceof Error ? error.message : 'Erreur Edge Function inconnue.'
}

export async function listProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active, profile_status, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as AdminProfileRow[]
}

async function runAdminProfileAction(profileId: string, action: AdminProfileAction) {
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean
    error?: string
    profileId?: string
    profile_id?: string
    action?: AdminProfileAction
    warning?: string | null
  }>('admin-delete-profile', {
    body: {
      profileId,
      action,
    },
  })

  if (error) {
    throw new Error(await getFunctionErrorMessage(error))
  }

  if (!data?.ok) {
    throw new Error(data?.error || 'Action profil impossible.')
  }

  return data
}

export function deactivateProfile(profileId: string) {
  return runAdminProfileAction(profileId, 'deactivate')
}

export function reactivateProfile(profileId: string) {
  return runAdminProfileAction(profileId, 'reactivate')
}

export function deleteProfile(profileId: string) {
  return runAdminProfileAction(profileId, 'delete')
}

export const fetchAdminProfiles = listProfiles
