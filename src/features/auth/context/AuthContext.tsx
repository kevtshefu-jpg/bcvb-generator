import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'dirigeant' | 'coach' | 'member'
  is_active: boolean
}

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    console.log('[Auth] loadProfile start', userId)

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[Auth] loadProfile error', error)
      setProfile(null)
      return
    }

    if (!data) {
      console.warn('[Auth] loadProfile no profile found')
      setProfile(null)
      return
    }

    console.log('[Auth] loadProfile success', data)
    setProfile(data as Profile)
  }

  async function refreshProfile() {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()

    setSession(currentSession)
    setUser(currentSession?.user ?? null)

    if (currentSession?.user) {
      await loadProfile(currentSession.user.id)
    } else {
      setProfile(null)
    }
  }

  useEffect(() => {
    let active = true

    async function bootstrap() {
      setLoading(true)

      const {
        data: { session: initialSession },
        error,
      } = await supabase.auth.getSession()

      if (!active) return

      if (error) {
        console.error('[Auth] getSession error', error)
      }

      setSession(initialSession)
      setUser(initialSession?.user ?? null)

      if (initialSession?.user) {
        await loadProfile(initialSession.user.id)
      } else {
        setProfile(null)
      }

      if (!active) return
      setLoading(false)
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[Auth] onAuthStateChange', event, newSession?.user?.id)

      if (!active) return

      setLoading(true)
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await loadProfile(newSession.user.id)
      } else {
        setProfile(null)
      }

      if (!active) return
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    console.log('[Auth] signIn start', email)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('[Auth] signIn error', error)
      return { error: error.message }
    }

    console.log('[Auth] signIn success')

    return { error: null }
  }

  async function signOut() {
    console.log('[Auth] signOut start')
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
    console.log('[Auth] signOut done')
  }

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      signIn,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
