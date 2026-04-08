import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

console.log('SUPABASE URL RAW =', JSON.stringify(import.meta.env.VITE_SUPABASE_URL))
console.log('SUPABASE URL TRIM =', JSON.stringify(supabaseUrl))

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables Supabase manquantes')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)