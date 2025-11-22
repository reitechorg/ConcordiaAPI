import { Permissions, PermissionState } from "@prisma/client";
import db from "../src/modules/database.js";
import bcrypt from "bcryptjs";
import chalk from "chalk";

const createAdmin = async () => {
	if (!process.env.ADMIN_PASSWORD) {
		throw new Error(
			"[ERROR] [scripts/createAdmin] PASSWORD env is not defined",
		);
	}
	if (!process.env.ADMIN_USERNAME) {
		throw new Error(
			"[ERROR] [scripts/createAdmin] USERNAME env is not defined",
		);
	}

	const permissions = Object.values(Permissions);
	console.log(chalk.green("\n[SETUP] Creating role..."));
	await db.role.create({
		data: {
			title: "admin",
			permissions: {
				createMany: {
					data: permissions.map((perm) => ({
						permission: perm,
						state: PermissionState.ALLOW,
					})),
				},
			},
		},
	});

	const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

	console.log(chalk.green("\n[SETUP] Creating admin user..."));
	await db.user.create({
		data: {
			name: process.env.ADMIN_USERNAME,
			password: passwordHash,
			roles: {
				connect: {
					title: "admin",
				},
			},
		},
	});
};

createAdmin();
