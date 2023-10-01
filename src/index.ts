import { Hono } from "hono"
import { connection } from './database/client'
import { sql } from "kysely"

type Env = {
  DATABASE_URL: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.get("/clear", async (c) => {
  try {
    const start = performance.now()
    const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

    await db.deleteFrom('Users').execute()
    for (let i = 0; i < 999; i++) {
      const data = [...Array(101)].map((_, index) => {
        const id = index + 1 + (i * 101)
        return `(${id}, 'test${id}', 'test${id}@example${id}.com')`
      })
      await sql.raw(`INSERT INTO "Users" ("id", "username", "email") VALUES ${data.join(',')}`).execute(db)
    }

    return c.text(`clear ${performance.now() - start}ms`)
  } catch (e) {
    return c.text((e as Error).message)
  }
})

app.get("/count", async (c) => {
  try {
    const start = performance.now()
    const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

    const data = await db.selectFrom('Users').select(db.fn.count('Users.id').as('count')).executeTakeFirst()

    return c.json({
      time: performance.now() - start,
      data
    })
  } catch (e) {
    return c.text((e as Error).message)
  }
})

app.get("/write", async (c) => {
  try {
    const start = performance.now()
    const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

    const now = new Date().getTime()
    await db.insertInto('Users').values({ username: `test${now}`, email: `test${now}@example${now}.com` }).execute()

    return c.text(`write ${performance.now() - start}ms`)
  } catch (e) {
    return c.text((e as Error).message)
  }
})

app.get("/read", async (c) => {
  try {
    const start = performance.now()
    const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

    const data = await db.selectFrom('Users').selectAll().orderBy('Users.id desc').limit(50).execute()

    return c.json({
      time: performance.now() - start,
      data
    })
  } catch (e) {
    return c.text((e as Error).message)
  }
})

app.get("/read/:name", async (c) => {
  try {
    const start = performance.now()
    const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

    const data = await db.selectFrom('Users').selectAll().where('Users.email', 'like', `%${c.req.param('name')}%`).execute()

    return c.json({
      time: performance.now() - start,
      data
    })
  } catch (e) {
    return c.text((e as Error).message)
  }
})

export default app
