import { FastifyReply } from "fastify";
import db from "../../modules/database.js";
import hasPermission from "../../lib/hasPermission.js";
import { RequestWithUser } from "../../types/RequestWithUser.js";
import { Permission, Permissions } from "@prisma/client";
import unauthorized from "../../lib/noPermission.js";
import log from "../../lib/log.js";

export default async function ApiCreateRoles(
	req: RequestWithUser,
	res: FastifyReply,
) {
	if (!hasPermission(req.user!, Permissions.ROLE_CREATE))
		return unauthorized(res);

	if (!req.body) return res.status(400).send("No body provided");

	const { title, permissions } = req.body as {
		title: string;
		permissions: Permission[];
	};

	try {
		const role = await db.role.create({
			data: {
				title: title,
				permissions: {
					create: permissions,
				},
			},
			include: { permissions: { omit: { roleId: true, channelId: true } } },
		});
		log(`Created role ${role.title}`, "CreateRole", "INFO");

		res.status(200).send(role);
	} catch (e) {
		return res.status(500).send({ error: "Error creating role" });
	}
}
