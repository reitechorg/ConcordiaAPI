import { FastifyReply } from "fastify";
import fileUpload from "../../lib/fileUpload.js";
import db from "../../modules/database.js";
import { RequestWithUser } from "../../types/RequestWithUser.js";
import log from "../../lib/log.js";
import { connections } from "../../lib/handleMessage.js";

export default async function ApiSendAttachment(req: RequestWithUser, res: FastifyReply) {
	const file = await fileUpload(req, res);
	if (!file) return res.status(500).send("Error handling file upload!");

	const { channelId } = req.params as { channelId: string };

	try {
		const saveAttachment = await db.attachment.create({
			data: {
				file: {
					connect: {
						id: file.id,
					},
				},
				author: {
					connect: {
						id: req.user!.id,
					},
				},
				channel: {
					connect: {
						id: channelId,
					},
				},
			},
			include: {
				file: true,
				author: {
					omit: {
						password: true,
						publicKey: true,
					},
				},
			},
		});
		console.log(saveAttachment);
		saveAttachment.file.path = `${process.env.URL}/files/${saveAttachment.file.path}`;

		connections.forEach((connection) => {
			connection.send(
				JSON.stringify({
					type: "newAttachment",
					data: {
						serverUrl: connection.url,
						channelId: channelId,
						message: saveAttachment,
					},
				}),
			);
		});
		res.send(saveAttachment);
	} catch (e) {
		log(e as string, "[API_SA]", "ERROR");
		return res.status(500).send("Error handling file upload!");
	}
}
