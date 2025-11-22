import Fastify from "fastify";
import ApiMessages from "../routes/messages/getMessages.js";
import ApiUser from "../routes/users/user.js";
import ApiSendMessage from "../routes/messages/sendMessage.js";
import ApiLogin from "../routes/auth/login.js";
import ApiRegister from "../routes/auth/register.js";
import authenticatedPathRegistrator from "../lib/authPath.js";
import ApiCreateChannel from "../routes/channels/createChannel.js";
import ApiDeleteChannel from "../routes/channels/deleteChannel.js";
import ApiGetChannels from "../routes/channels/getChannels.js";
import ApiDeleteMessage from "../routes/messages/deleteMessage.js";
import ApiUpdateMessage from "../routes/messages/updateMessage.js";
import OpenCheck from "../middlewares/open.js";
import ApiUpdateChannel from "../routes/channels/updateChannel.js";
import ApiRoles from "../routes/roles/getRoles.js";
import ApiCreateRoles from "../routes/roles/createRole.js";
import ApiUpdateRoles from "../routes/roles/updateRole.js";
import ApiDeleteRole from "../routes/roles/deleteRole.js";
import cors from "@fastify/cors";
import ApiDeleteToken from "../routes/auth/deleteToken.js";
import ApiDeleteTokens from "../routes/auth/deleteTokens.js";
import ApiUsers from "../routes/users/users.js";
import ApiAssignRole from "../routes/roles/assignRole.js";
import ApiUnassignRole from "../routes/roles/unassingRole.js";
import fastifyView from "@fastify/view";
import Handlebars from "handlebars";
import ApiStatus from "../routes/config/status.js";
import chalk from "chalk";
import ApiRoot from "../routes/root.js";
import ApiInitLogin from "../routes/auth/init.js";
import ApiLoginWithPassword from "../routes/auth/passwordLogin.js";
import websocket from "@fastify/websocket";
import { connections, incomingMessage } from "../lib/handleMessage.js";
import Multipart from "@fastify/multipart";
import ApiGetAttachment from "../routes/attachments/getAttachment.js";
import ApiConfig from "../routes/config/configuration.js";
import ApiUpdateConfig from "../routes/config/updateConfiguration.js";
import ApiPollVote from "../routes/polls/vote.js";
import ApiConfigAccess from "../routes/config/access.js";

export default async function runHTTPServer() {
	const fastify = Fastify({
		logger: process.env.DEV ? true : false,
	});

	// Register cors
	await fastify.register(cors, {
		origin: true,
		allowedHeaders: ["content-type", "accept", "authorization"],
	});

	const authPost = authenticatedPathRegistrator(fastify, "POST");
	const authPut = authenticatedPathRegistrator(fastify, "PUT");
	const authGet = authenticatedPathRegistrator(fastify, "GET");
	const authDelete = authenticatedPathRegistrator(fastify, "DELETE");

	// WebSocket
	fastify.register(websocket);

	// Websocket handle
	fastify.register(async function (fastify) {
		fastify.get("/ws", { websocket: true }, (socket) => {
			socket.on("message", (msg: any) => {
				incomingMessage(msg);
			});

			console.log("New connection!", socket);
			socket.send("Hello, world!");
			connections.push(socket);
		});
	});

	fastify.addHook("onRequest", OpenCheck);

	// Register view
	await fastify.register(fastifyView, {
		engine: {
			handlebars: Handlebars,
		},
		root: "./src/templates",
		production: !process.env.DEV,
	});

	// Register multipart
	fastify.register(Multipart, {
		attachFieldsToBody: true,
		limits: {
			fieldNameSize: 20, // Max field name size in bytes
			fieldSize: 500, // Max field value size in bytes
			fields: 5, // Max number of non-file fields
			fileSize: 2500000, // For multipart forms, the max file size in bytes
			files: 10, // Max number of file fields
			headerPairs: 1000, // Max number of header key=>value pairs
			parts: 10000, // For multipart forms, the max number of parts (fields + files)
		},
	});

	//
	//  Register routes
	//

	// Unauthenticated paths
	fastify.get("/", ApiRoot);
	fastify.get("/status", ApiStatus);

	//
	// Auth paths
	//
	fastify.post("/auth/init", ApiInitLogin);
	fastify.post("/auth/login", ApiLogin);
	fastify.post("/auth/login/password", ApiLoginWithPassword);
	fastify.post("/auth/register", ApiRegister);

	//
	// Authenticated paths
	//
	authGet("/users", ApiUsers);
	authGet("/user", ApiUser);

	// Token management
	authDelete("/logout", ApiDeleteToken); // Logout
	authDelete("/logout/all", ApiDeleteTokens); // Logout

	// Messages
	authGet("/channels/:id/messages", ApiMessages);
	authPost("/channels/:id/messages", ApiSendMessage);
	authPut("/channels/:channelId/messages/:messageId", ApiUpdateMessage);
	authDelete("/channels/:channelId/messages/:messageId", ApiDeleteMessage);

	// Attachments
	fastify.get("/files/:fileId", ApiGetAttachment);

	// Channels
	authGet("/channels", ApiGetChannels);
	authPost("/channels", ApiCreateChannel);
	authPut("/channels/:channelId", ApiUpdateChannel);
	authDelete("/channels/:channelId", ApiDeleteChannel);

	// Roles
	authGet("/roles", ApiRoles); // Get all roles
	authPost("/roles", ApiCreateRoles); // Create role
	authPut("/roles/:roleId", ApiUpdateRoles); // Update role
	authDelete("/roles/:roleId", ApiDeleteRole); // Delete role

	// Roles w/ users
	authPost("/roles/:roleId/users/:userId", ApiAssignRole); // Add user to role
	authDelete("/roles/:roleId/users/:userId", ApiUnassignRole); // Remove user from role

	// Server configuration
	authGet("/config/access", ApiConfigAccess);
	authGet("/config", ApiConfig);
	authPost("/config", ApiUpdateConfig);

	// Polls
	authPost("/channels/:channelId/polls/:pollId/:optionId", ApiPollVote);

	// Start the server
	fastify.listen(
		{
			port: parseInt(process.env.SERVER_PORT || "3000"),
			host: "0.0.0.0",
		},
		function (err: Error | null, address: string) {
			if (err) {
				fastify.log.error(err);
			}

			if (address) {
				console.log(
					`${chalk.white.bold("Server listening on")} ${chalk.bold.green(
						address,
					)}`,
				);
			}
		},
	);

	return fastify;
}
