import { FastifyReply } from "fastify";
import db from "../../modules/database.js";
import { RequestWithUser } from "../../types/RequestWithUser.js";
import { connections } from "../../lib/handleMessage.js";
import fileUpload from "../../lib/fileUpload.js";

interface Body {
	message: any;
}

export default async function ApiSendMessage(req: RequestWithUser, res: FastifyReply) {
	const { id } = req.params as { id: string };
	const { message } = req.body as Body;

	const files = await fileUpload(req, res);

	if (!message && files.length === 0) return res.send({ status: 400, message: "No message or file provided" });

	const newMessage = await db.message.create({
		data: {
			text: message?.value ?? "",
			channel: {
				connect: {
					id: id,
				},
			},
			author: {
				connect: {
					id: req.user!.id,
				},
			},
			files: {
				connect: files?.map((file) => ({ id: file.id })) || [],
			},
		},
		include: {
			author: {
				select: {
					id: true,
					name: true,
					profileUrl: true,
				},
			},
			files: true,
		},
	});

	connections.forEach((connection) => {
		connection.send(
			JSON.stringify({
				type: "newMessage",
				data: {
					serverUrl: connection.url,
					channelId: id,
					message: newMessage,
				},
			}),
		);
	});
	res.send(newMessage);
}
