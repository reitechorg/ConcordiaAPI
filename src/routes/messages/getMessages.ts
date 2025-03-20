import { FastifyReply, FastifyRequest } from "fastify";
import db from "../../modules/database.js";

export default async function ApiMessages(req: FastifyRequest, res: FastifyReply) {
	const { id } = req.params as { id: string };
	let reply = [];
	const messages = await db.message.findMany({ where: { channelId: id }, include: { author: { omit: { password: true, publicKey: true } } } });
	const attachments = await db.attachment.findMany({ where: { channelId: id }, include: { author: { omit: { password: true, publicKey: true } }, file: true } });
	attachments.forEach((attachment) => {
		attachment.file.path = `${process.env.URL}/files/${attachment.file.path}`;
	});
	reply = [...messages, ...attachments];

	reply.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
	console.log(attachments);

	res.send(reply);
}
