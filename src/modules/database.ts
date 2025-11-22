import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

function parseMysqlConnectionString(conn: string) {
	// Ensure URL has a scheme so the URL parser can handle it
	const normalized = conn.startsWith("mysql://") ? conn : "mysql://" + conn;

	const regexp = /\/\/([^:/?#]+)(?::(.+))?@([^:/?#]+)(?::(\d+))?\/([^/?#]+)/;

	const data = regexp.exec(conn);

	if (!data) throw new Error("Invalid DATABASE_URL!");

	return {
		user: data[1],
		password: data[2],
		host: data[3],
		port: parseInt(data[4]),
		database: data[5],
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
