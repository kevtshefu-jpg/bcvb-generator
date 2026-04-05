import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../auth/context/AuthContext'

type MemberRow = {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

export default function AdminPage() {
  const { profile } = useAuth()
  const [members, setMembers] = useState<MemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMembers() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, is_active, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setMembers((data || []) as MemberRow[])
      setLoading(false)
    }

    loadMembers()
  }, [])

  return (
    <section className="admin-page">
      <div className="admin-page__hero">
        <p className="admin-page__eyebrow">Administration</p>
        <h2 className="admin-page__title">Gestion des membres</h2>
        <p className="admin-page__text">
          Espace réservé aux administrateurs. Cette page centralise la lecture des profils membres BCVB.
        </p>
      </div>

      <div className="admin-page__grid">
        <article className="admin-page__card">
          <h3>Compte connecté</h3>
          <p><strong>Email :</strong> {profile?.email}</p>
          <p><strong>Rôle :</strong> {profile?.role}</p>
          <p><strong>Actif :</strong> {profile?.is_active ? 'Oui' : 'Non'}</p>
        </article>

        <article className="admin-page__card">
          <h3>Résumé</h3>
          <p><strong>Membres chargés :</strong> {members.length}</p>
          <p><strong>Chargement :</strong> {loading ? 'En cours' : 'Terminé'}</p>
          <p><strong>Erreur :</strong> {error || 'Aucune'}</p>
        </article>
      </div>

      <div className="admin-page__tableCard">
        <div className="admin-page__tableHead">
          <h3>Profils membres</h3>
        </div>

        {loading ? (
          <p>Chargement des profils...</p>
        ) : error ? (
          <p style={{ color: 'crimson' }}>{error}</p>
        ) : members.length === 0 ? (
          <p>Aucun profil trouvé.</p>
        ) : (
          <div className="admin-page__tableWrap">
            <table className="admin-page__table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Actif</th>
                  <th>Créé le</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.full_name || '—'}</td>
                    <td>{member.email}</td>
                    <td>{member.role}</td>
                    <td>{member.is_active ? 'Oui' : 'Non'}</td>
                    <td>{new Date(member.created_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
