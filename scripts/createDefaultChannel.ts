import db from "../src/modules/database.js";
import chalk from "chalk";

const createChannel = async () => {
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

	console.log(chalk.green("\n[SETUP] Creating default channel..."));
	await db.channel.create({
		data: {
			title: "general",
			description: "The default channel",
		},
	});
};

createChannel();
