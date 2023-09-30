import { Hono } from "hono"
import { connection } from './database/client'

type Env = {
  DATABASE_URL: string
  DB: D1Database
}

const app = new Hono<{ Bindings: Env }>()

app.get("/clear", async (c) => {
  const start = performance.now()
  const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

  await db.deleteFrom('Users').execute()
  for (let i = 0; i < 10000; i++) {
    await db.insertInto('Users').values({ id: i + 1, username: `test${i}`, email: `test${i}@example${i}.com` }).execute()
  }

  return c.text(`clear ${performance.now() - start}ms`)
})

app.get("/count", async (c) => {
  const start = performance.now()
  const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

  const data = await db.selectFrom('Users').select(db.fn.count('Users.id').as('count')).executeTakeFirst()

  return c.json({
    time: performance.now() - start,
    data
  })
})

app.get("/write", async (c) => {
  const start = performance.now()
  const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

  const now = new Date().getTime()
  await db.insertInto('Users').values({ username: `test${now}`, email: `test${now}@example${now}.com` }).execute()

  return c.text(`write ${performance.now() - start}ms`)
})

app.get("/read", async (c) => {
  const start = performance.now()
  const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

  const data = await db.selectFrom('Users').selectAll().orderBy('Users.id desc').limit(50).execute()

  return c.json({
    time: performance.now() - start,
    data
  })
})

app.get("/read/:name", async (c) => {
  const start = performance.now()
  const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

  const data = await db.selectFrom('Users').selectAll().where('Users.email', 'like', `%${c.req.param('name')}%`).execute()

  return c.json({
    time: performance.now() - start,
    data
  })
})

export default app
