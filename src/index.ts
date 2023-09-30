import { Hono } from "hono"

const app = new Hono()

app.get("/clear", (c) => {
  return c.text("clear")
})

app.get("/write", (c) => {
  return c.text("write")
})

app.get("/read", (c) => {
  return c.text("read")
})

app.get("/read/:name", (c) => {
  return c.text(`read ${c.req.param('name')}`)
})

export default app
