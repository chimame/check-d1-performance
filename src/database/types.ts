import type { Generated } from "kysely";

export interface DB {
	Users: UsersTable;
}

export interface UsersTable {
	id: Generated<number>;
	username: string;
	email: string;
}
