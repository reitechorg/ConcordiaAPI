import { FastifyReply, FastifyRequest } from "fastify";
import { randomString } from "./randomString.js";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import log from "./log.js";
import db from "../modules/database.js";
import { RequestWithUser } from "../types/RequestWithUser.js";

const acceptTypes = ["image/jpeg", "image/png", "image/webp"];

type Options = {
	savePath?: string;
	acceptTypes?: string[]; // Override allowed mime-types
	callback?: Function;
};

const errorUnsuported = (res: FastifyReply, type: string) => {
	log(`Attempted upload of unsuported file type: ${type}`, "FILE_UPLOAD", "WARN");
	return res.status(400).send("This endpoint doesn't support your file type");
};

export default async function fileUpload(req: RequestWithUser, res: FastifyReply, options?: Options) {
	// Validate server has a location path or an override was given
	if (!process.env.FILE_PATH && !options?.savePath) return res.status(500).send("This server doesn't have a location to store files!");

	// Get the file
	const data = await req.file();

	// Make sure we got a file
	if (!data) return;

	// Make sure filetype is accepted
	if (options?.acceptTypes && !options.acceptTypes.includes(data.mimetype)) return errorUnsuported(res, data.mimetype); // Check for overriden types
	if (!acceptTypes.includes(data.mimetype)) return errorUnsuported(res, data.mimetype); // Check for safe types

	let type;
	switch (data.mimetype) {
		case "image/jpeg":
			type = ".jpg";
			break;
		case "image/png":
			type = ".png";
			break;
		case "image/webp":
			type = ".webp";
			break;
	}

	let fileName = randomString(32, true); // Create a name

	let path = options?.savePath ? `${options.savePath}/${fileName}${type}` : `${process.env.FILE_PATH}/${fileName}${type}`;

	// Make sure no file exists with this name
	while (fs.existsSync(path)) {
		fileName = randomString(32, true);
		path = options?.savePath ? `${options.savePath}/${fileName}${type}` : `${process.env.FILE_PATH}/${fileName}${type}`;
	}

	// Save file
	await pipeline(data.file, fs.createWriteStream(path));

	const file = await db.file.create({
		data: {
			filename: data.filename,
			mimetype: data.mimetype,
			path: `${fileName}${type}`,
			author: {
				connect: {
					id: req.user!.id,
				},
			},
		},
	});

	return file;
}
