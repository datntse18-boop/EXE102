export type Role = 'guest' | 'member' | 'leader' | 'manager' | 'admin'

export type User = {
  id: string
  name: string
  email: string
  role: Role
}
