import { createClient } from '@supabase/supabase-js'

function normalizeSupabaseUrl(value?: string) {
  return String(value || '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '')
}

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL)
const supabaseAnonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables Supabase manquantes')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
