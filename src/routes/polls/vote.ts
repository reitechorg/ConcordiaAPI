import { FastifyReply } from "fastify";
import { RequestWithUser } from "../../types/RequestWithUser.js";
import db from "../../modules/database.js";
import { connections } from "../../lib/handleMessage.js";

export default async function ApiPollVote(req: RequestWithUser, res: FastifyReply) {
	const { channelId, pollId, optionId } = req.params as { channelId: string; pollId: string; optionId: string };
	const userId = req.user!.id;

	// Make sure poll exists
	const poll = await db.poll.findFirst({
		where: {
			id: pollId,
		},
		include: {
			options: true,
		},
	});

	if (!poll) return res.status(404).send("Poll not found.");
	if (!poll.options.some((option) => option.id === optionId)) return res.status(404).send("Option not found.");

	// Make sure user hasn't voted yet
	const vote = await db.vote.findFirst({
		where: {
			optionId: optionId,
			userId: userId,
		},
	});
	if (vote) return res.status(401).send("You have already voted for this option.");

	const response = await db.poll.update({
		where: { id: pollId },
		data: {
			options: {
				update: {
					where: { id: optionId },
					data: {
						votes: {
							create: {
								userId,
							},
						},
					},
				},
			},
		},
	});

	connections.forEach((connection) => {
		connection.send(
			JSON.stringify({
				type: "newVote",
				data: {
					serverUrl: connection.url,
					channelId: channelId,
					votes: {
						// TODO add data
					},
				},
			}),
		);
	});

	return res.send(response);
}
