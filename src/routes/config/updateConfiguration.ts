import { FastifyReply } from "fastify";
import { RequestWithUser } from "../../types/RequestWithUser.js";
import hasPermission from "../../lib/hasPermission.js";
import fs from "node:fs";
import { exec } from "node:child_process";
import ApiConfig from "./configuration.js";

type Config = {
	name: string;
	description: string;
	logEvents: string;
	open: string;
	url: string;
	filePath: string;
};

export default async function ApiUpdateConfig(req: RequestWithUser, res: FastifyReply) {
	// Validate user permission
	if (!hasPermission(req.user!, "SERVER_UPDATE")) return res.status(403).send("You do not have permission to access this resource.");

	const config = req.body as Config;

	if (!config.name || !config.description || !config.logEvents || !config.open || !config.url || !config.filePath) return res.status(400).send("Missing required fields");

	// Update server config
	fs.writeFileSync(
		"./.env",
		`DATABASE_URL=${process.env.DATABASE_URL}
SERVER_NAME=${config.name}
DESCRIPTION=${config.description}
LOG_EVENTS=${config.logEvents}
OPEN=${config.open}
URL=${config.url}
FILE_PATH=${config.filePath}`,
	);

	// Update config for running process
	process.env.SERVER_NAME = config.name;
	process.env.DESCRIPTION = config.description;
	process.env.LOG_EVENTS = config.logEvents;
	process.env.OPEN = config.open;
	process.env.URL = config.url;
	process.env.FILE_PATH = config.filePath;

	ApiConfig(req, res);
}
