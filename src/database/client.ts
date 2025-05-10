import type { DB } from "./types";

import { Kysely } from "kysely";
import { PostgresDialect } from "kysely";
import { D1Dialect } from "kysely-d1";
import { Pool } from "pg";
import { SqlStorageDialect } from "../../lib/kysely-sql-storage";

export const connection = (database: D1Database | string) =>
	new Kysely<DB>({
		dialect:
			typeof database === "string"
				? new PostgresDialect({
						pool: new Pool({
							connectionString: database,
							maxUses: Number.POSITIVE_INFINITY,
							max: 10000,
						}),
					})
				: new D1Dialect({ database }),
		log: (event) => {
			console.log(`sql: ${event.query.sql}`);
			console.log(`parameters: ${event.query.parameters}`);
		},
	});

export const connectionForDurableObject = (database: SqlStorage) =>
	new Kysely<DB>({
		dialect: new SqlStorageDialect({ database }),
		log: (event) => {
			console.log(`sql: ${event.query.sql}`);
			console.log(`parameters: ${event.query.parameters}`);
		},
	});
