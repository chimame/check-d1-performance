import type { DB } from './types'

import { Kysely } from 'kysely'
import { D1Dialect } from 'kysely-d1'
import { Pool } from 'pg'
import { PostgresDialect } from 'kysely'

export const connection = (database: D1Database | string) =>
  new Kysely<DB>({
    dialect: typeof database === 'string' ? new PostgresDialect({
      pool: new Pool({
        connectionString: database,
        maxUses: Infinity,
        max: 10000,
      }),
    })
 : new D1Dialect({ database }),
    log: (event) => {
      console.log(`sql: ${event.query.sql}`)
      console.log(`parameters: ${event.query.parameters}`)
    },
  })
