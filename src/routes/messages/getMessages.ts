import { FastifyReply, FastifyRequest } from "fastify";
import db from "../../modules/database.js";

export default async function ApiMessages(req: FastifyRequest, res: FastifyReply) {
	const { id } = req.params as { id: string };
	const messages = await db.message.findMany({ where: { channelId: id }, include: { author: { omit: { password: true, publicKey: true } }, files: { omit: { path: true } } } });

	res.send(messages);
}
