import path from "node:path";
import sharp from "sharp";

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
	const initials = serverName
		.split(" ")
		.map((word) => word[0])
		.join("");
	const text = initials.toUpperCase().slice(0, 2);

	const label = Buffer.from(`
		<svg width="${256}" height="${256}">
			<text x="50%" y="50%" text-anchor="middle" dy="0.25em" fill="#fff" font-size="${
				size / 2
			}px">${text}</text>
		</svg>
	`);

	const iconBuffer = await sharp({
		create: {
			width: size,
			height: size,
			channels: 4,
			background: { r: 0, g: 187, b: 167, alpha: 1 },
		},
	})
		.composite([
			{
				input: label,
				top: 0,
				left: 0,
			},
		])
		.webp()
		.toBuffer();

	serverIcon = `data:image/webp;base64,${iconBuffer.toString("base64")}`;
}

export function getServerIcon() {
	return serverIcon;
}
