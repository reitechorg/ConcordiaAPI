import chalk from "chalk";
import runHTTPServer from "./modules/router.js";
import updateHandler from "./modules/update.js";
import { loadServerIcon } from "./lib/serverIcon.js";

if (process.env.DEV) {
	console.log(chalk.blue("Running in DEV mode"));
}

// Load icon
loadServerIcon();

// Start API server
runHTTPServer();

// Start update handler
if (process.env.AUTO_UPDATE !== "false") {
	updateHandler();
	setInterval(() => {
		updateHandler();
	}, 1000 * 60 * 60 * 25); // 25 hours
}

console.log(chalk.green.bold("[MAIN] [INFO] Server started!"));
