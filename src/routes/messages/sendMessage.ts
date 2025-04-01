import { FastifyReply } from "fastify";
import db from "../../modules/database.js";
import { RequestWithUser } from "../../types/RequestWithUser.js";
import { connections } from "../../lib/handleMessage.js";
import fileUpload from "../../lib/fileUpload.js";

interface Body {
	message: any;
	poll: any;
}

export default async function ApiSendMessage(req: RequestWithUser, res: FastifyReply) {
	const { id } = req.params as { id: string };
	const { message, poll } = req.body as Body;

	const files = await fileUpload(req, res);

	if (!message && files.length === 0 && !poll) return res.status(400).send("No message or file provided");

	let pollData: {
		question: string;
		options: string[];
	} = { question: "", options: [] };

	try {
		console.log(poll);
		if (poll) pollData = JSON.parse(poll.value);
	} catch (e) {
		return res.status(400).send("Invalid poll data");
	}

	// Validate poll
	if (poll) {
		if (pollData.options.length > 6 || pollData.options.length < 2) return res.status(400).send("Poll must have between 2 and 6 options");
		if (pollData.question.length > 128) return res.status(400).send("Poll question must be less than 128 characters");
		if (pollData.options.some((option) => option.length > 128)) return res.status(400).send("Poll options must be less than 128 characters");
	}

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
			polls: {
				create: poll
					? {
							title: pollData.question,
							options: {
								create: pollData.options.map((option) => ({
									title: option,
								})),
							},
					  }
					: undefined,
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
			polls: { include: { options: true }, omit: { messageId: true } },
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
