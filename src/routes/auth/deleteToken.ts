import { FastifyReply } from "fastify";
import { RequestWithUser } from "../../types/RequestWithUser.js";
import db from "../../modules/database.js";

export default async function ApiDeleteToken(req: RequestWithUser, res: FastifyReply) {
	const token = await db.token.delete({
		where: {
			token: req.headers.authorization,
		},
	});

	res.status(200).send({ message: "Logged out" });
}
