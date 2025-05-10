import { DurableObject } from "cloudflare:workers";
import { type Kysely, sql } from "kysely";
import { connectionForDurableObject } from "../database/client";
import type { DB } from "../database/types";

export class CheckSqliteDurableObject extends DurableObject {
	sql: SqlStorage;
	db: Kysely<DB>;
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.sql = ctx.storage.sql;
		this.db = connectionForDurableObject(this.sql);

		ctx.blockConcurrencyWhile(async () => {
			await this._migrate();
		});
	}

	async clear() {
		await this.db.deleteFrom("Users").execute();
		for (let i = 0; i < 999; i++) {
			const data = [...Array(101)].map((_, index) => {
				const id = index + 1 + i * 101;
				return `(${id}, 'test${id}', 'test${id}@example${id}.com')`;
			});
			await sql
				.raw(
					`INSERT INTO "Users" ("id", "username", "email") VALUES ${data.join(",")}`,
				)
				.execute(this.db);
		}
	}

	async count() {
		const data = await this.db
			.selectFrom("Users")
			.select(this.db.fn.count("Users.id").as("count"))
			.executeTakeFirst();
		return data;
	}

	async write() {
		const min = 200000;
		const max = 999999;
		const id = Math.floor(Math.random() * (max - min + 1)) + min;
		await this.db
			.insertInto("Users")
			.values({
				id,
				username: `test${id}`,
				email: `test${id}@example${id}.com`,
			})
			.execute();
	}

	async read() {
		return await this.db
			.selectFrom("Users")
			.selectAll()
			.orderBy("Users.id", "desc")
			.limit(50)
			.execute();
	}

	async read100() {
		for (let i = 0; i < 100; i++) {
			const uuid = Math.floor(Math.random() * 999999);
			await this.db
				.selectFrom("Users")
				.selectAll()
				.where(sql<boolean>`${uuid} = ${uuid}`)
				.orderBy("Users.id", "desc")
				.limit(50)
				.execute();
		}
		const uuid = Math.floor(Math.random() * 999999);
		return await this.db
			.selectFrom("Users")
			.selectAll()
			.where(sql<boolean>`${uuid} = ${uuid}`)
			.where("Users.id", ">", 100)
			.orderBy("Users.id", "desc")
			.limit(50)
			.execute();
	}

	async readName(name: string) {
		return await this.db
			.selectFrom("Users")
			.selectAll()
			.where("Users.email", "like", `%${name}%`)
			.execute();
	}
	async readName100(name: string) {
		for (let i = 0; i < 100; i++) {
			await this.db
				.selectFrom("Users")
				.selectAll()
				.where("Users.email", "like", `%${name}%`)
				.execute();
		}
		return await this.db
			.selectFrom("Users")
			.selectAll()
			.where("Users.email", "like", `%${name}%`)
			.execute();
	}

	async _migrate() {
		this.sql.exec(`CREATE TABLE IF NOT EXISTS "Users" (
id INTEGER PRIMARY KEY NOT NULL,
username TEXT NOT NULL,
email TEXT NOT NULL
);
`);
	}
}
