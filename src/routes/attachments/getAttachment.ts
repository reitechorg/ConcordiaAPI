import { FastifyReply, FastifyRequest } from "fastify";
import fs from "node:fs";
import log from "../../lib/log.js";
import db from "../../modules/database.js";

export default async function ApiGetAttachment(req: FastifyRequest, res: FastifyReply) {
	const { fileId } = req.params as { fileId: string };
	try {
		console.log(`${process.env.FILE_PATH}/${fileId}`);

		const data = await db.file.findUnique({
			where: {
				id: fileId,
			},
		});

		if (!data) return res.status(404).send("Unable to find file!");

		const file = fs.readFileSync(data.path);
		res.header("Content-Type", data?.mimetype);
		res.send(file);
	} catch (e) {
		log(e as string, "API_GetA", "ERROR");
		return res.status(404).send("Unable to find file!");
	}
}
