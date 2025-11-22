import { confirm, input, password } from "@inquirer/prompts";
import chalk from "chalk";
import { execSync } from "child_process";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const validateServerName = (servername: string) => {
	servername = servername.trim();
	if (servername.length < 3 || servername.length > 20)
		return "Server name must be between 3 and 20 characters";
	return true;
};

const validateDescription = (description: string) => {
	description = description.trim();
	if (description.length > 100)
		return "Server description must be less than or 100 characters";
	return true;
};

const validateUsername = (username: string) => {
	username = username.trim();
	if (username.length < 3 || username.length > 20)
		return "Username must be between 3 and 20 characters";
	if (!/^[a-zA-Z0-9]+$/g.test(username)) return "Username must be alphanumeric";
	return true;
};

const validatePassword = (password: string) => {
	password = password.trim();
	if (!/[0-9]+/g.test(password))
		return "Password must contain at least one number";
	if (!/[a-z]+/g.test(password))
		return "Password must contain at least one lowercase letter";
	if (!/[A-Z]+/g.test(password))
		return "Password must contain at least one uppercase letter";
	return true;
};

const setupDatabase = async () => {
	const database = {
		dbUser: await input({ message: "Username: ", required: true }),
		dbPassword: await password({ message: "Password: " }),
		dbHost: await input({ message: "Host(IP:PORT): ", required: true }),
		dbName: await input({ message: "Database name: ", required: true }),
		dbUrl: "",
	};

	// WARN localhost defaults to ipv6, if  ipv6 disabled fails everytime

	const dbUrl = `mysql://${database.dbUser}:${database.dbPassword}@${database.dbHost}/${database.dbName}`;

	try {
		const connection = await mysql.createConnection(dbUrl);
		if (connection) connection.end();

		console.log(chalk.green("[SETUP] Database test connection successful!"));
		database.dbUrl = dbUrl;
	} catch (error) {
		console.error(chalk.red.bold("[SETUP] Database connection failed!"));
		console.error(
			chalk.red(
				`[SETUP] Please check your database credentials ${chalk.bold.underline(
					"and that the database is running",
				)}.`,
			),
		);
		return null;
	}

	return database;
};
type Database = Awaited<ReturnType<typeof setupDatabase>>;

const setupPrisma = async (database: Database) => {
	console.log(chalk.green("[SETUP] Checking for existing database schema..."));

	console.log(chalk.green("[SETUP] Creating database schema..."));

	// save to file
	fs.writeFileSync("./.env", `DATABASE_URL=${database!.dbUrl}`);

	// create the schema
	const data = execSync(`npx prisma migrate deploy`);

	// create functions
	const data2 = execSync(`npx prisma generate`);

	console.log(data.toString("utf8"));
	console.log(data2.toString("utf8"));

	console.log(chalk.green("[SETUP] Database schema created!"));
};

const validateServerURL = (serverURL: string) => {
	serverURL = serverURL.trim();
	if (!serverURL.startsWith("http://") && !serverURL.startsWith("https://"))
		return "Server URL must be either http or https!";
	if (serverURL.endsWith("/")) return "Server URL must not end with a slash!";
	return true;
};

const setup = async () => {
	let database: Database | null = null;

	console.log(chalk.green("[SETUP] Starting server setup..."));

	console.log(chalk.green("\n[SETUP] Database configuration:"));

	// Loop until a valid database connection is established
	do {
		database = await setupDatabase();
	} while (!database);

	// Ask if the user wants to setup the database schema
	const setup = await confirm({
		message: "Create database schema?",
		default: true,
	});
	if (setup) setupPrisma(database);

	// Server config
	console.log(chalk.green("\n[SETUP] Server configuration:"));
	const serverName = (
		await input({
			message: "Server name: ",
			required: true,
			validate: validateServerName,
		})
	).trim();
	const description = (
		await input({
			message: "Server description: ",
			validate: validateDescription,
		})
	).trim();
	const logEvents = await confirm({ message: "Log events?", default: true });
	const serverURL = (
		await input({
			message: "Server URL: ",
			required: true,
			validate: validateServerURL,
		})
	).trim();
	const storagePath = (
		await input({
			message: "Storage path: [ex. ./files]",
			default: "./files",
			required: true,
		})
	).trim();

	// Save server config
	console.log(chalk.green("\n[SETUP] Saving server configuration..."));
	try {
		if (!fs.existsSync(storagePath)) fs.mkdirSync(storagePath); // Create the storage directory if it doesn't exist
	} catch (e) {
		console.log(
			chalk.red(
				"[SETUP] Error creating storage directory, please check the path and permissions",
			),
		);
	}

	fs.writeFileSync(
		"./.env",
		`DATABASE_URL=${
			database!.dbUrl
		}\nSERVER_NAME=${serverName}\nDESCRIPTION=${description}\nLOG_EVENTS=${logEvents}\nURL=${serverURL}\nFILE_PATH=${storagePath}\nOPEN=true`,
	);

	// Create folders
	fs.mkdirSync(path.join(storagePath, "server"), { recursive: true });
	fs.mkdirSync(path.join(storagePath, "upload"), { recursive: true });

	fs.writeFileSync(
		path.join(storagePath, "server", ".serverdata.json"),
		`{"version":"0.0.0", "lastUpdate":0}`,
	); // TODO check for update

	// Admin setup
	console.log(chalk.green("\n[SETUP] Admin user:"));
	const adminName = (
		await input({
			message: "Username: ",
			required: true,
			validate: validateUsername,
		})
	).trim();
	const adminPassword = await password({
		message: "Password: ",
		validate: validatePassword,
	});

	console.log(chalk.green("\n[SETUP] Creating admin user..."));

	// Create a temporary file to read data from
	fs.writeFileSync(
		"./.temp.env",
		`DATABASE_URL=${
			database!.dbUrl
		}\nADMIN_USERNAME=${adminName}\nADMIN_PASSWORD=${adminPassword}`,
	);

	// Run the script to create the admin user
	execSync(`npx tsx --env-file=.temp.env ./scripts/createAdmin.ts`);

	// Run script to create a default channel
	execSync(`npx tsx --env-file=.temp.env ./scripts/createDefaultChannel.ts`);

	// Remove the temporary file
	fs.unlinkSync("./.temp.env");
	console.log(chalk.green("[SETUP] Admin user created!"));

	console.log(chalk.green("\n[SETUP] Server setup complete!"));
	console.log(
		chalk.green.bold("[SETUP] Please restart the server to apply changes."),
	);
};

export default setup;
