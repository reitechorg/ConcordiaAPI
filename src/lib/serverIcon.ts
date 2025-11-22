import path from "node:path";
import sharp from "sharp";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import { toWebp } from "@dicebear/converter";

let serverIcon: string =
	"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

export async function loadServerIcon() {
	// Try to get server's icon, if failed, generate an icon
	const serverIconPath = path.join(
		process.env.FILE_PATH ?? "",
		"server",
		"server-icon.png",
	);
	try {
		await sharp(serverIconPath).metadata();
	} catch (e) {
		generateIconPlaceholder();
		return;
	}

	// Get the icon and change it's size
	const iconBuffer = await sharp(serverIconPath)
		.resize(256, 256)
		.webp()
		.toBuffer();

	// Set the server's icon
	const imageData = `data:image/webp;base64,${iconBuffer.toString("base64")}`;
	serverIcon = imageData;
}

async function generateIconPlaceholder() {
	const size = 256;

	const serverName = process.env.SERVER_NAME || "CC";

	const icon = createAvatar(initials, {
		seed: serverName,
	});

	const webp = toWebp(icon);

	serverIcon = await webp.toDataUri();
}

export function getServerIcon() {
	return serverIcon;
}
