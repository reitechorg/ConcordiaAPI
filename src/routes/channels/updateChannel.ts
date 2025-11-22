import { FastifyReply } from "fastify";
import db from "../../modules/database.js";
import { Permission, Permissions, PermissionState } from "@prisma/client";
import { RequestWithUser, SafeUser } from "../../types/RequestWithUser.js";
import hasPermission from "../../lib/hasPermission.js";
import log from "../../lib/log.js";

export default async function ApiUpdateChannel(
	req: RequestWithUser,
	res: FastifyReply,
) {
	const { channelId } = req.params as { channelId: string };

	const { title, description, permissions } = req.body as {
		title?: string;
		description?: string;
		permissions: Permission[];
	};

	let updatedChannel;

	if (hasPermission(req.user as SafeUser, Permissions.CHANNEL_UPDATE)) {
		try {
			if (title) {
				updatedChannel = await db.channel.update({
					where: { id: channelId },
					data: { title },
				});
			}
			if (description) {
				updatedChannel = await db.channel.update({
					where: { id: channelId },
					data: { description },
				});
			}
		} catch (e) {
			return res.status(500).send({ error: "Error updating channel" });
		}
	} else {
		return res
			.status(403)
			.send({ error: "You do not have permission to update this channel" });
	}

	log(
		`Updated channel ${channelId} by ${req.user!.name}`,
		"UpdateChannel",
		"INFO",
	);

	return res.status(200).send(updatedChannel);
}
