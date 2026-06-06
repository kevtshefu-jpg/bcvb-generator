import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { withTimeout } from '../utils/withTimeout'

export default function DebugLocal() {
  const [status, setStatus] = useState<Record<string, unknown>>({ loading: true })

  useEffect(() => {
    let mounted = true

    async function run() {
      const result: Record<string, unknown> = {}

      try {
        const session = await withTimeout(supabase.auth.getSession(), 12000)
        result.session = {
          ok: !session.error,
          error: session.error?.message ?? null,
          user: session.data.session?.user?.email ?? null,
        }
      } catch (err) {
        result.session = {
          ok: false,
          error: err instanceof Error ? err.message : 'Erreur session inconnue',
        }
      }

      try {
        const docs = await withTimeout(
          supabase.from('library_documents').select('id,title').limit(1),
          12000
        )

        result.libraryDocuments = {
          ok: !docs.error,
          error: docs.error?.message ?? null,
          count: docs.data?.length ?? 0,
        }
      } catch (err) {
        result.libraryDocuments = {
          ok: false,
          error: err instanceof Error ? err.message : 'Erreur documents inconnue',
        }
      }

      try {
        const profile = await withTimeout(
          supabase.from('profiles').select('id,email,role,is_active').limit(1),
          12000
        )

        result.profiles = {
          ok: !profile.error,
          error: profile.error?.message ?? null,
          count: profile.data?.length ?? 0,
        }
      } catch (err) {
        result.profiles = {
          ok: false,
          error: err instanceof Error ? err.message : 'Erreur profils inconnue',
        }
      }

      if (mounted) setStatus({ loading: false, result })
    }

    run()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <main style={{ padding: 32 }}>
      <h1>Debug local BCVB</h1>
      <pre>{JSON.stringify(status, null, 2)}</pre>
    </main>
  )
}
