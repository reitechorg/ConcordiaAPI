import { PrismaClient } from "@prisma/client";
const db = new PrismaClient().$extends({
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
