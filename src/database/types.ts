import { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely'

export interface DB {
  Users: UsersTable
}

export interface UsersTable {
  id: Generated<number>
  username: string
  email: string
}
