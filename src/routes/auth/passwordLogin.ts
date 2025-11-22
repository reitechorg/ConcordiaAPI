import { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import db from "../../modules/database.js";
import crypto from "crypto";
import log from "../../lib/log.js";
import { getAndDeleteChallenge } from "../../lib/challengeStorage.js";
import { isCuid } from "@paralleldrive/cuid2";
import { safeUser } from "../../lib/safeData.js";

type BodyType = {
	username: string;
	password: string;
};

export default async function ApiLoginWithPassword(req: FastifyRequest<{ Body: BodyType }>, res: FastifyReply) {
	const { username, password } = req.body;

	// Get user if exists
	const user = await db.user.findFirst({
		where: {
			name: username,
			password: {
				not: null,
			},
		},
	});

	if (!user) return res.status(400).send({ message: "User not found" });
	if (!user.password) return res.status(500).send({ message: "User found but no password" });

	// Check if password is correct
	if (!bcrypt.compareSync(password, user.password!)) return res.status(400).send({ message: "Invalid password" });

	// Create a token
	const token = await db.token.create({
		data: {
			userId: user.id,
			token: crypto.randomBytes(64).toString("hex"),
		},
	});

	log(`User ${user.name} logged in`, "Login", "INFO");

	return res.status(200).send({ status: 200, token: token.token, user: safeUser(user) });
}
