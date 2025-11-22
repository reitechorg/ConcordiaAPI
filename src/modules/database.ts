import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

function parseMysqlConnectionString(conn: string) {
	// Ensure URL has a scheme so the URL parser can handle it
	const normalized = conn.startsWith("mysql://") ? conn : "mysql://" + conn;

	const url = new URL(normalized);

	return {
		host: url.hostname,
		user: url.username,
		password: url.password,
		port: parseInt(url.port),
		database: url.pathname ? url.pathname.replace(/^\//, "") : undefined,
	};
}

// Prisma you're so shit at times...
const adapter = new PrismaMariaDb({
	...parseMysqlConnectionString(process.env.DATABASE_URL!),
});

const db = new PrismaClient({ adapter }).$extends({
	result: {
		file: {
			url: {
				needs: { id: true },
				compute(file) {
					return `${process.env.URL}/files/${file.id}`;
				},
			},
		},
	},
});
export default db;
