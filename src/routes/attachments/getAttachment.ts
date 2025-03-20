import { FastifyReply, FastifyRequest } from "fastify";
import fs from "node:fs";
import log from "../../lib/log.js";

export default async function ApiGetAttachment(req: FastifyRequest, res: FastifyReply) {
	const { fileId } = req.params as { fileId: string };
	try {
		console.log(`${process.env.FILE_PATH}/${fileId}`);

		const file = fs.readFileSync(`${process.env.FILE_PATH}/${fileId}`);
		res.send(file);
	} catch (e) {
		log(e as string, "API_GetA", "ERROR");
		return res.status(500).send("Unable to find file!");
	}
}
