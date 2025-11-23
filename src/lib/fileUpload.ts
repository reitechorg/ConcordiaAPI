import { FastifyReply, FastifyRequest } from "fastify";
import { randomString } from "./randomString.js";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import log from "./log.js";
import db from "../modules/database.js";
import { RequestWithUser } from "../types/RequestWithUser.js";
import path from "node:path";
import { SavedMultipartFile } from "@fastify/multipart";

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

	// Make sure we got files
	if (!data) return [];

	// Process all files
	const files = await uploadFiles(data, req.user!.id, res, options);
	return files;
}

export async function uploadFiles(
	files: SavedMultipartFile[],
	userId: string,
	res: FastifyReply,
	options?: Options,
) {
	let uploadedFiles: L_File[] = [];

	await Promise.all(
		files.map(async (file) => {
			// Validate file type
			if (options?.acceptTypes && !options.acceptTypes.includes(file.mimetype))
				return errorUnsuported(res, file.mimetype); // Check for overriden types

			if (!acceptTypes.includes(file.mimetype))
				return errorUnsuported(res, file.mimetype);

			// Make sure upload path exists
			EnsureUploadPath();

			// Generate file's path
			const generatedPath = MakeUniqueFilePath();

			// Save file
			fs.copyFileSync(file.filepath, generatedPath);

			uploadedFiles.push({
				filename: file.filename,
				mimetype: file.mimetype,
				path: generatedPath,
			});
		}),
	);

	// Add all files to database
	await db.file.createMany({
		data: uploadedFiles.map((file) => {
			return {
				filename: file.filename,
				mimetype: file.mimetype,
				path: file.path,
				authorId: userId,
			};
		}),
	});

	const result = await db.file.findMany({
		where: {
			path: {
				in: uploadedFiles.map((file) => file.path),
			},
		},
	});

	return result ?? [];
}

export function MakeUniqueFilePath() {
	// Genereta a filename
	let fileName = randomString(32, true); // Create a name

	// Create a path
	let generatedPath = makePath(undefined, fileName);

	// Make sure no file exists with this name
	while (fs.existsSync(generatedPath))
		generatedPath = makePath(undefined, fileName);

	return generatedPath;
}

const makePath = (options: Options | undefined, fileName: string) => {
	return options?.savePath
		? `${options.savePath}/${fileName}`
		: path.join(process.env.FILE_PATH!, "upload", `${fileName}`);
};

export function EnsureUploadPath() {
	// Create upload path if it doesn't exist yet
	const uploadPath = path.join(process.env.FILE_PATH!, "upload");

	if (!fs.existsSync(uploadPath))
		fs.mkdirSync(uploadPath, {
			recursive: true,
		});
}
