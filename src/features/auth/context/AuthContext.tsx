import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { withTimeout } from '../../../utils/withTimeout'
import { normalizeRole } from '../../../config/roles'
import { isKnownUserRole } from '../utils/profileAccess'

export type UserRole =
  | 'admin'
  | 'dirigeant'
  | 'responsable_technique'
  | 'technical_manager'
  | 'coach'
  | 'team_staff'
  | 'parent_referent'
  | 'joueur'
  | 'parent'
  | 'benevole'
  | 'arbitre'
  | 'otm'
  | 'membre'
  | 'member'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  profile_status: string
  category_id: string | null
}

type AuthContextType = {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  profileError: string | null
  accessDenied: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type ProfileRow = {
  id?: string | null
  email?: string | null
  full_name?: string | null
  role?: string | null
  is_active?: boolean | null
  profile_status?: string | null
  category_id?: string | null
}

function buildLoadedProfile(currentUser: User, row: ProfileRow): Profile {
  const normalizedRole = normalizeRole(row.role)
  if (!row.role || !isKnownUserRole(normalizedRole)) {
    throw new Error('Le profil ne contient aucun rôle reconnu.')
  }

  return {
    id: row.id || currentUser.id,
    email: row.email || currentUser.email || '',
    full_name:
      row.full_name ??
      ((currentUser.user_metadata?.full_name as string | undefined) || null),
    role: normalizedRole,
    is_active: row.is_active === true,
    profile_status: row.profile_status ?? '',
    category_id: row.category_id ?? null,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null)
      setProfileError(null)
      return
    }

    setProfile(null)
    setProfileError(null)

    try {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('id, email, full_name, role, is_active, profile_status, category_id')
          .eq('id', currentUser.id)
          .maybeSingle(),
        12000,
        'Chargement du profil trop long.'
      )

      if (error) {
        console.error('Erreur chargement profil :', error)
        setProfileError('Le profil applicatif n’a pas pu être chargé.')
        return
      }

      if (!data) {
        setProfileError('Aucun profil applicatif n’est associé à ce compte.')
        return
      }

      setProfile(buildLoadedProfile(currentUser, data as ProfileRow))
    } catch (error) {
      console.error('Erreur inattendue chargement profil :', error)
      setProfile(null)
      setProfileError(error instanceof Error ? error.message : 'Le profil applicatif n’a pas pu être vérifié.')
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
        const { data } = await withTimeout(
          supabase.auth.getSession(),
          12000,
          'Chargement de session trop long.'
        )
        if (!isMounted) return

        const currentSession = data.session ?? null
        const currentUser = currentSession?.user ?? null

        setSession(currentSession)
        setUser(currentUser)

        await loadProfile(currentUser)
      } catch (error) {
        console.error('Erreur bootstrap auth :', error)
        if (isMounted) {
          setSession(null)
          setUser(null)
          setProfile(null)
          setProfileError('La session n’a pas pu être vérifiée.')
        }
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
        try {
          await loadProfile(currentUser)
        } finally {
          if (isMounted) {
            setLoading(false)
          }
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
    setProfileError(null)
  }

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      profileError,
      accessDenied: Boolean(user && (!profile || profile.is_active !== true || profile.profile_status !== 'active')),
      signIn,
      signOut,
      refreshProfile,
    }),
    [user, session, profile, loading, profileError, refreshProfile]
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
