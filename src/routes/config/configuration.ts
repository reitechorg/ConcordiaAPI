import { FastifyReply } from "fastify";
import { RequestWithUser } from "../../types/RequestWithUser.js";
import hasPermission from "../../lib/hasPermission.js";

export default async function ApiConfig(req: RequestWithUser, res: FastifyReply) {
	// Validate user permission
	if (!hasPermission(req.user!, "SERVER_UPDATE")) return res.status(403).send("You do not have permission to access this resource.");

	// Send server config
	res.send({
		name: process.env.SERVER_NAME,
		description: process.env.DESCRIPTION,
		logEvents: process.env.LOG_EVENTS,
		open: process.env.OPEN,
		url: process.env.URL,
		filePath: process.env.FILE_PATH,
	});
}
