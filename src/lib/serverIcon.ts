import sharp from "sharp";

let serverIcon: string | null = null;

export async function loadServerIcon() {
	// Check if the server icon exists
	try {
		await sharp('server-icon.png').metadata();
	} catch (e) {
		generateIconPlaceholder();
		return;
	}

	const iconBuffer = await sharp('server-icon.png')
		.resize(256, 256)
		.webp()
		.toBuffer();

	const imageData = `data:image/webp;base64,${iconBuffer.toString('base64')}`;
	serverIcon = imageData;

}

async function generateIconPlaceholder() {
	const size = 256;

	const serverName = process.env.SERVER_NAME || "CC";
	const initials = serverName.split(" ").map((word) => word[0]).join("");
	const text = initials.toUpperCase().slice(0, 2);


	const label = Buffer.from(`
		<svg width="${256}" height="${256}">
			<text x="50%" y="50%" text-anchor="middle" dy="0.25em" fill="#fff" font-size="${size/2}px">${text}</text>
		</svg>
	`);

	const iconBuffer = await sharp({
		create: {
			width: size,
			height: size,
			channels: 4,
			background: { r: 0, g: 187, b: 167, alpha: 1 },
		}
	})
		.composite([{
			input: label,
			top: 0,
			left: 0,
		}])
		.webp()
		.toBuffer();

		serverIcon = `data:image/webp;base64,${iconBuffer.toString('base64')}`;
}

export function getServerIcon() {
	return serverIcon;
}
