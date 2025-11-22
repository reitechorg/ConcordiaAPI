import { FastifyReply, FastifyRequest } from "fastify";
import { getServerIcon } from "../lib/serverIcon.js";

export default function ApiRoot(req: FastifyRequest, res: FastifyReply) {
	return res.viewAsync("root.handlebars", {
		server: {
			name: process.env.SERVER_NAME,
			iconUrl: getServerIcon(),
			description: process.env.DESCRIPTION,
			url: encodeURIComponent(process.env.URL as string),
		},
	});
}
