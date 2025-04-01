import { FastifyReply, FastifyRequest } from "fastify";
import db from "../../modules/database.js";
import { RequestWithUser } from "../../types/RequestWithUser.js";

export default async function ApiMessages(req: RequestWithUser, res: FastifyReply) {
	const { id } = req.params as { id: string };
	let messages = await db.message.findMany({
		where: { channelId: id },
		include: {
			author: {
				select: {
					id: true,
					name: true,
					profileUrl: true,
					createdAt: true,
					updatedAt: true,
					password: false,
					publicKey: false,
				},
			},
			files: {
				select: {
					id: true,
					filename: true,
					mimetype: true,
					url: true,
					path: false,
					messageId: false,
				},
			},
			polls: {
				include: {
					options: {
						select: {
							title: true,
							votes: true,
						},
					},
				},
			},
		},
	});

	messages.forEach((message) => {
		if (message.polls.length > 0) {
			message.polls[0].options.forEach((option) => {
				option.votes.forEach((vote) => {
					if (vote.userId == req.user!.id) {
						//@ts-ignore
						option.voted = true;
					}
				});
			});
		}
	});

	res.send(messages);
}
