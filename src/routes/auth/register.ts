import { FastifyReply, FastifyRequest } from "fastify";
import db from "../../modules/database.js";
import crypto from "crypto";
import log from "../../lib/log.js";
import { isCuid } from "@paralleldrive/cuid2";
import { safeUser } from "../../lib/safeData.js";
import fs from "node:fs";
import { MakeUniqueFilePath, uploadFiles } from "../../lib/fileUpload.js";

type BodyType = {
	publicKey: string;
	cuid: string;
	username: string;
	profileUrl?: string;
};

export default async function ApiRegister(
	req: FastifyRequest<{ Body: BodyType }>,
	res: FastifyReply,
) {
	const { username, cuid, publicKey, profileUrl } = req.body;

	// Make sure cuid is a valid cuid
	if (!isCuid(cuid)) return res.status(400).send({ message: "Invalid cuid!" });

	// TODO validate public key

	// Check if user exists
	const user = await db.user.findFirst({
		where: {
			id: cuid,
		},
	});

	if (user) return res.status(400).send({ message: "User already exists!" });

	// Create new user
	let newUser = await db.user.create({
		data: {
			id: cuid,
			name: username,
			publicKey: publicKey,
		},
	});

	// Update user with an profilePicture if it's provided
	if (profileUrl) {
		// Convert image and save
		const base64Data = profileUrl.replace(/^data:image\/\w+;base64,/, "");
		const mimetype = profileUrl.slice(0, 20).split(":")[1].split(";")[0];
		const buffer = Buffer.from(base64Data, "base64");
		const filePath = MakeUniqueFilePath();
		fs.writeFileSync(filePath, buffer);

		// Add image to db
		const file = await db.file.create({
			data: {
				filename: newUser.name,
				mimetype: mimetype,
				path: filePath,
				authorId: newUser.id,
			},
		});

		newUser = await db.user.update({
			where: {
				id: newUser.id,
			},
			data: {
				profileUrl: process.env.URL + "/files/" + file.id,
			},
		});
	}

	// Create a token
	const token = await db.token.create({
		data: {
			userId: newUser.id,
			token: crypto.randomBytes(64).toString("hex"),
		},
	});

	log(`New user ${newUser.name}`, "Register", "INFO");

	return res.send({ status: 200, token: token.token, user: safeUser(newUser) });
}
