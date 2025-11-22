import { FastifyReply } from "fastify";
import db from "../../modules/database.js";
import hasPermission from "../../lib/hasPermission.js";
import { Permissions } from "@prisma/client";
import { RequestWithUser } from "../../types/RequestWithUser.js";
import unauthorized from "../../lib/noPermission.js";
import log from "../../lib/log.js";

export default async function ApiDeleteRole(
	req: RequestWithUser,
	res: FastifyReply,
) {
	if (!hasPermission(req.user!, Permissions.ROLE_DELETE))
		return unauthorized(res);

	const { roleId } = req.params as { roleId: string };
	if (!roleId || roleId == ":roleId")
		return res.status(400).send("Malformed request");

	try {
		await db.role.delete({
			where: {
				title: roleId,
			},
		});
		log(`Deleted role ${roleId}`, "DeleteRole", "INFO");

		res.status(200).send("Deleted role");
	} catch (e) {
		return res.status(500).send({ error: "Error deleting role" });
	}
}
