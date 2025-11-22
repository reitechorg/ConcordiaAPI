import { FastifyReply } from "fastify";
import db from "../../modules/database.js";
import hasPermission from "../../lib/hasPermission.js";
import { RequestWithUser } from "../../types/RequestWithUser.js";
import { Permissions } from "@prisma/client";
import unauthorized from "../../lib/noPermission.js";
import log from "../../lib/log.js";

export default async function ApiAssignRole(
	req: RequestWithUser,
	res: FastifyReply,
) {
	if (!hasPermission(req.user!, Permissions.ROLE_ASSIGN))
		return unauthorized(res);

	const { roleId, userId } = req.params as { roleId: string; userId: string };

	try {
		const role = await db.user.update({
			where: {
				id: userId,
			},
			data: {
				roles: {
					connect: {
						title: roleId,
					},
				},
			},
			include: {
				roles: { include: { permissions: true } },
			},
		});

		log(`Assigned role ${roleId}`, "AssignRole", "INFO");

		res.status(200).send(role);
	} catch (e) {
		return res.status(500).send({ error: `Error assigning role ${roleId}` });
	}
}
