import { FastifyReply, FastifyRequest } from "fastify";
import fs from "fs";
import { getServerIcon } from "../../lib/serverIcon.js";
import path from "path";

export default async function ApiStatus(
	req: FastifyRequest,
	res: FastifyReply,
) {
	const ServerData = JSON.parse(
		fs
			.readFileSync(
				path.join(process.env.FILE_PATH!, "server", ".serverdata.json"),
			)
			.toString(),
	);
	res.send({
		version: ServerData.version,
		iconUrl: getServerIcon(),
		name: process.env.SERVER_NAME,
		description: process.env.DESCRIPTION,
	});
}
