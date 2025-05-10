import {
	type CompiledQuery,
	type DatabaseConnection,
	type DatabaseIntrospector,
	type Dialect,
	type Driver,
	type Kysely,
	type QueryCompiler,
	type QueryResult,
	SqliteAdapter,
	SqliteIntrospector,
	SqliteQueryCompiler,
} from "kysely";

export interface SqlStorageDialectConfig {
	database: SqlStorage;
}

export class SqlStorageDialect implements Dialect {
	#config: SqlStorageDialectConfig;

	constructor(config: SqlStorageDialectConfig) {
		this.#config = config;
	}

	createAdapter() {
		return new SqliteAdapter();
	}

	createDriver(): Driver {
		return new SqlStorageDriver(this.#config);
	}

	createQueryCompiler(): QueryCompiler {
		return new SqliteQueryCompiler();
	}

	createIntrospector(db: Kysely<any>): DatabaseIntrospector {
		return new SqliteIntrospector(db);
	}
}

class SqlStorageDriver implements Driver {
	#config: SqlStorageDialectConfig;

	constructor(config: SqlStorageDialectConfig) {
		this.#config = config;
	}

	async init(): Promise<void> {}

	async acquireConnection(): Promise<DatabaseConnection> {
		return new SqlStorageConnection(this.#config);
	}

	async beginTransaction(conn: SqlStorageConnection): Promise<void> {
		return await conn.beginTransaction();
	}

	async commitTransaction(conn: SqlStorageConnection): Promise<void> {
		return await conn.commitTransaction();
	}

	async rollbackTransaction(conn: SqlStorageConnection): Promise<void> {
		return await conn.rollbackTransaction();
	}

	async releaseConnection(_conn: SqlStorageConnection): Promise<void> {}

	async destroy(): Promise<void> {}
}

class SqlStorageConnection implements DatabaseConnection {
	#config: SqlStorageDialectConfig;

	constructor(config: SqlStorageDialectConfig) {
		this.#config = config;
	}

	async executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
		const cursor = this.#config.database.exec(
			compiledQuery.sql,
			...compiledQuery.parameters,
		);

		const numAffectedRows =
			cursor.rowsWritten > 0 ? BigInt(cursor.rowsWritten) : undefined;

		return {
			insertId: undefined,
			rows: cursor.toArray() as O[],
			numAffectedRows,
			// @ts-ignore deprecated in kysely >= 0.23, keep for backward compatibility.
			numUpdatedOrDeletedRows: numAffectedRows,
		};
	}

	async beginTransaction() {
		throw new Error("Transactions are not supported yet.");
	}

	async commitTransaction() {
		throw new Error("Transactions are not supported yet.");
	}

	async rollbackTransaction() {
		throw new Error("Transactions are not supported yet.");
	}

	async *streamQuery<O>(
		_compiledQuery: CompiledQuery,
		_chunkSize: number,
	): AsyncIterableIterator<QueryResult<O>> {
		throw new Error("D1 Driver does not support streaming");
	}
}
