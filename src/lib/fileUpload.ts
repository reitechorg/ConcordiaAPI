import { FastifyReply, FastifyRequest } from "fastify";
import { randomString } from "./randomString.js";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import log from "./log.js";
import db from "../modules/database.js";
import { RequestWithUser } from "../types/RequestWithUser.js";
import path from "node:path";

const acceptTypes = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"application/json",
];

type Options = {
	savePath?: string;
	acceptTypes?: string[]; // Override allowed mime-types
};

const errorUnsuported = (res: FastifyReply, type: string) => {
	log(
		`Attempted upload of unsuported file type: ${type}`,
		"FILE_UPLOAD",
		"WARN",
	);
	return res.status(400).send("This endpoint doesn't support your file type");
};

type L_File = {
	filename: string;
	mimetype: string;
	path: string;
};

export default async function fileUpload(
	req: RequestWithUser,
	res: FastifyReply,
	options?: Options,
) {
	// Validate server has a location path or an override was given
	if (!process.env.FILE_PATH && !options?.savePath)
		return res
			.status(500)
			.send("This server doesn't have a location to store files!");

	// Get the files
	const data = await req.saveRequestFiles();

	// Make sure we got a files
	if (!data) return [];
	let files: L_File[] = [];
	// Process all files
	await Promise.all(
		data.map(async (file) => {
			// Make sure filetype is accepted
			if (options?.acceptTypes && !options.acceptTypes.includes(file.mimetype))
				return errorUnsuported(res, file.mimetype); // Check for overriden types
			if (!acceptTypes.includes(file.mimetype))
				return errorUnsuported(res, file.mimetype); // Check for safe types

			// Get the file type extension
			let type;
			switch (file.mimetype) {
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

			// Genereta a filename
			let fileName = randomString(32, true); // Create a name

			// Create a path
			let generatedPath = options?.savePath
				? `${options.savePath}/${fileName}${type}`
				: path.join(process.env.FILE_PATH!, "upload", `${fileName}${type}`);

			// Make sure no file exists with this name
			while (fs.existsSync(generatedPath)) {
				fileName = randomString(32, true);
				generatedPath = options?.savePath
					? `${options.savePath}/${fileName}${type}`
					: path.join(process.env.FILE_PATH!, "upload", `${fileName}${type}`);
			}

			// Save file
			fs.copyFileSync(file.filepath, generatedPath);

			files.push({
				filename: file.filename,
				mimetype: file.mimetype,
				path: generatedPath,
			});
		}),
	);

	// Add all files to database
	await db.file.createMany({
		data: files.map((file) => {
			return {
				filename: file.filename,
				mimetype: file.mimetype,
				path: file.path,
				authorId: req.user!.id,
			};
		}),
	});

	const result = await db.file.findMany({
		where: {
			path: {
				in: files.map((file) => file.path),
			},
		},
	});

	return result ?? [];
}
