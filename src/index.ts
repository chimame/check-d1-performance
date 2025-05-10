import { Hono } from "hono";
import { sql } from "kysely";
import { connection } from "./database/client";

export { CheckSqliteDurableObject } from "./durableObjects/CheckSqliteDurableObject";

type Variables = {
	clear: () => Promise<void>;
	getCount: () => Promise<{ count: number | string | bigint } | undefined>;
	write: () => Promise<void>;
	read: () => Promise<
		{
			id: number;
			username: string;
			email: string;
		}[]
	>;
	read100: () => Promise<
		{
			id: number;
			username: string;
			email: string;
		}[]
	>;
	readName: (name: string) => Promise<
		{
			id: number;
			username: string;
			email: string;
		}[]
	>;
	readName100: (name: string) => Promise<
		{
			id: number;
			username: string;
			email: string;
		}[]
	>;
};

const baseApp = new Hono<{ Bindings: Env; Variables: Variables }>();

baseApp.use("*", async (c, next) => {
	if (c.req.path.startsWith("/do/")) {
		const id = c.env.CHECK_SQLITE_DURABLE_OBJECT.idFromName("db");
		const stub = c.env.CHECK_SQLITE_DURABLE_OBJECT.get(id);

		c.set("clear", async () => {
			await stub.clear();
		});

		c.set("getCount", async () => {
			return stub.count();
		});

		c.set("write", async () => {
			await stub.write();
		});

		c.set("read", async () => {
			return await stub.read();
		});

		c.set("read100", async () => {
			return await stub.read100();
		});

		c.set("readName", async (name: string) => {
			return await stub.readName(name);
		});
		c.set("readName100", async (name: string) => {
			return await stub.readName100(name);
		});
	} else {
		const db = connection(
			c.req.query("type") === "pg" ? c.env.DATABASE_URL : c.env.DB,
		);

		c.set("clear", async () => {
			await db.deleteFrom("Users").execute();
			for (let i = 0; i < 999; i++) {
				const data = [...Array(101)].map((_, index) => {
					const id = index + 1 + i * 101;
					return `(${id}, 'test${id}', 'test${id}@example${id}.com')`;
				});
				await sql
					.raw(
						`INSERT INTO "Users" ("id", "username", "email") VALUES ${data.join(",")}`,
					)
					.execute(db);
			}
		});

		c.set("getCount", async () => {
			return await db
				.selectFrom("Users")
				.select(db.fn.count("Users.id").as("count"))
				.executeTakeFirst();
		});

		c.set("write", async () => {
			const min = 200000;
			const max = 999999;
			const id = Math.floor(Math.random() * (max - min + 1)) + min;
			await db
				.insertInto("Users")
				.values({
					id,
					username: `test${id}`,
					email: `test${id}@example${id}.com`,
				})
				.execute();
		});

		c.set("read", async () => {
			return await db
				.selectFrom("Users")
				.selectAll()
				.orderBy("Users.id", "desc")
				.limit(50)
				.execute();
		});

		c.set("read100", async () => {
			for (let i = 0; i < 100; i++) {
				const uuid = Math.floor(Math.random() * 999999);
				await db
					.selectFrom("Users")
					.selectAll()
					.where(sql<boolean>`${uuid} = ${uuid}`)
					.orderBy("Users.id", "desc")
					.limit(50)
					.execute();
			}
			const uuid = Math.floor(Math.random() * 999999);
			return await db
				.selectFrom("Users")
				.selectAll()
				.where(sql<boolean>`${uuid} = ${uuid}`)
				.orderBy("Users.id", "desc")
				.limit(50)
				.execute();
		});

		c.set("readName", async (name: string) => {
			return await db
				.selectFrom("Users")
				.selectAll()
				.where("Users.email", "like", `%${name}%`)
				.execute();
		});
		c.set("readName100", async (name: string) => {
			for (let i = 0; i < 100; i++) {
				await db
					.selectFrom("Users")
					.selectAll()
					.where("Users.email", "like", `%${name}%`)
					.execute();
			}
			return await db
				.selectFrom("Users")
				.selectAll()
				.where("Users.email", "like", `%${name}%`)
				.execute();
		});
	}
	await next();
});

baseApp.get("/clear", async (c) => {
	try {
		const start = performance.now();
		await c.get("clear")();

		return c.text(`clear ${performance.now() - start}ms`);
	} catch (e) {
		return c.text((e as Error).message);
	}
});

baseApp.get("/count", async (c) => {
	try {
		const start = performance.now();
		const data = await c.get("getCount")();

		return c.json({
			time: performance.now() - start,
			data,
		});
	} catch (e) {
		return c.text((e as Error).message);
	}
});

baseApp.get("/write", async (c) => {
	try {
		const start = performance.now();
		await c.get("write")();
		return c.text(`write ${performance.now() - start}ms`);
	} catch (e) {
		return c.text((e as Error).message);
	}
});

baseApp.get("/read", async (c) => {
	try {
		const start = performance.now();
		const data = await c.get("read")();

		return c.json({
			type: "read 1",
			time: performance.now() - start,
			data,
		});
	} catch (e) {
		return c.text((e as Error).message);
	}
});

baseApp.get("/read/100", async (c) => {
	try {
		const start = performance.now();
		const data = await c.get("read100")();

		return c.json({
			type: "read 100",
			time: performance.now() - start,
			data,
		});
	} catch (e) {
		return c.text((e as Error).message);
	}
});

baseApp.get("/read/:name", async (c) => {
	try {
		const start = performance.now();
		const data = await c.get("readName")(c.req.param("name"));

		return c.json({
			type: `read name: ${c.req.param("name")} 1`,
			time: performance.now() - start,
			data,
		});
	} catch (e) {
		return c.text((e as Error).message);
	}
});

baseApp.get("/read/:name/100", async (c) => {
	try {
		const start = performance.now();
		const data = await c.get("readName100")(c.req.param("name"));

		return c.json({
			type: `read name: ${c.req.param("name")} 100`,
			time: performance.now() - start,
			data,
		});
	} catch (e) {
		return c.text((e as Error).message);
	}
});

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
app.route("/do", baseApp);
app.route("/", baseApp);

export default app;
