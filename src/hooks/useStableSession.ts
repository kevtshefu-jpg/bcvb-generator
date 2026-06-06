import { useEffect, useRef, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type StableSessionState = {
  loading: boolean
  session: Session | null
  user: User | null
  error: string | null
}

export function useStableSession(): StableSessionState {
  const mountedRef = useRef(true)

  const [state, setState] = useState<StableSessionState>({
    loading: true,
    session: null,
    user: null,
    error: null,
  })

  useEffect(() => {
    mountedRef.current = true

    let timeoutId: number | null = null

    async function loadSession() {
      try {
        timeoutId = window.setTimeout(() => {
          if (!mountedRef.current) return

          setState((current) => ({
            ...current,
            loading: false,
            error: current.session
              ? null
              : 'Chargement de session trop long. Rafraîchis ou reconnecte-toi.',
          }))
        }, 10000)

        const { data, error } = await supabase.auth.getSession()

        if (!mountedRef.current) return

        if (error) {
          setState({
            loading: false,
            session: null,
            user: null,
            error: error.message,
          })
          return
        }

        setState({
          loading: false,
          session: data.session,
          user: data.session?.user ?? null,
          error: null,
        })
      } catch (err) {
        if (!mountedRef.current) return

        const message = err instanceof Error ? err.message : 'Erreur lors du chargement de session.'
        setState({
          loading: false,
          session: null,
          user: null,
          error: message,
        })
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId)
      }
    }

    loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return

      setState({
        loading: false,
        session,
        user: session?.user ?? null,
        error: null,
      })
    })

    return () => {
      mountedRef.current = false
      if (timeoutId) window.clearTimeout(timeoutId)
      listener.subscription.unsubscribe()
    }
  }, [])

  return state
}
