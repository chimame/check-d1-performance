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

    const min = 200000
    const max = 999999
    const id = Math.floor(Math.random() * (max - min + 1)) + min
    await db.insertInto('Users').values({ id, username: `test${id}`, email: `test${id}@example${id}.com` }).execute()

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
      type: 'read 1',
      time: performance.now() - start,
      data
    })
  } catch (e) {
    return c.text((e as Error).message)
  }
})

app.get("/read/100", async (c) => {
  try {
    const start = performance.now()
    const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

    for(let i = 0; i < 999; i++) {
      await db.selectFrom('Users').selectAll().orderBy('Users.id desc').limit(50).execute()
    }
    const data = await db.selectFrom('Users').selectAll().orderBy('Users.id desc').limit(50).execute()

    return c.json({
      type: 'read 100',
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
      type: `read name: ${c.req.param('name')} 1`,
      time: performance.now() - start,
      data
    })
  } catch (e) {
    return c.text((e as Error).message)
  }
})

app.get("/read/:name/100", async (c) => {
  try {
    const start = performance.now()
    const db = connection(c.req.query('type') === 'pg' ? c.env.DATABASE_URL : c.env.DB)

    for(let i = 0; i < 999; i++) {
      await db.selectFrom('Users').selectAll().where('Users.email', 'like', `%${c.req.param('name')}%`).execute()
    }
    const data = await db.selectFrom('Users').selectAll().where('Users.email', 'like', `%${c.req.param('name')}%`).execute()

    return c.json({
      type: `read name: ${c.req.param('name')} 100`,
      time: performance.now() - start,
      data
    })
  } catch (e) {
    return c.text((e as Error).message)
  }
})

export default {
  ...app,
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: EventContext<Env, any, any>
  ) {
    try {
      //const db = connection(env.DATABASE_URL)

      //await db.deleteFrom('Users').execute()
      await env.DB.prepare(
        "DELETE FROM Users"
      ).run()
      for (let i = 0; i < 10; i++) {
        //await sql.raw(`INSERT INTO "Users" ("id", "username", "email") VALUES (${i}, 'test${i}', 'test${i}@example${i}.com')`).execute(db)
        await env.DB.prepare(
          `INSERT INTO "Users" ("id", "username", "email") VALUES (${i}, 'test${i}', 'test${i}@example${i}.com')`
        ).run()
      }
    } catch (e) {
      console.log((e as Error).message)
    }
  }
}
