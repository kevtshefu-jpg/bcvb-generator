export type UserRole =
  | 'admin'
  | 'coach'
  | 'dirigeant'
  | 'joueur'
  | 'parent'
  | 'member'

export type ProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole | null
  category_id: string | null
  is_active: boolean | null
}