import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'

export type UserRole =
  | 'admin'
  | 'dirigeant'
  | 'coach'
  | 'joueur'
  | 'parent'
  | 'member'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  category_id: string | null
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

function buildFallbackProfile(currentUser: User): Profile {
  return {
    id: currentUser.id,
    email: currentUser.email ?? '',
    full_name: (currentUser.user_metadata?.full_name as string | undefined) ?? null,
    role: 'member',
    is_active: true,
    category_id: null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_active, category_id')
        .eq('id', currentUser.id)
        .maybeSingle()

      if (error) {
        console.error('Erreur chargement profil :', error)
        setProfile(buildFallbackProfile(currentUser))
        return
      }

      if (!data) {
        setProfile(buildFallbackProfile(currentUser))
        return
      }

      setProfile(data as Profile)
    } catch (error) {
      console.error('Erreur inattendue chargement profil :', error)
      setProfile(buildFallbackProfile(currentUser))
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    await loadProfile(user)
  }, [loadProfile, user])

  useEffect(() => {
    let isMounted = true

    async function bootstrap() {
      setLoading(true)

      try {
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return

        const currentSession = data.session ?? null
        const currentUser = currentSession?.user ?? null

        setSession(currentSession)
        setUser(currentUser)

        await loadProfile(currentUser)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return

      const currentSession = newSession ?? null
      const currentUser = currentSession?.user ?? null

      setSession(currentSession)
      setUser(currentUser)

      // Évite de repasser toute l'app en loading sur les refresh silencieux
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setLoading(true)
        await loadProfile(currentUser)
        if (isMounted) {
          setLoading(false)
        }
        return
      }

      // Pour les autres événements, on met à jour le profil sans bloquer l'interface
      await loadProfile(currentUser)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? error.message : null }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
    setSession(null)
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
    [user, session, profile, loading, refreshProfile]
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