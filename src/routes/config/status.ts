import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import { getServerIcon } from "../../lib/serverIcon.js";

export default async function ApiStatus(req: FastifyRequest, res: FastifyReply) {
	const ServerData = JSON.parse(fs.readFileSync(".serverdata.json").toString());
	res.send({
		version: ServerData.version,
		iconUrl: getServerIcon(),
		name: process.env.SERVER_NAME,
		description: process.env.DESCRIPTION,
	});
}
