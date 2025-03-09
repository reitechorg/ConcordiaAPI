export async function incomingMessage(msg: Buffer) {
	const text = await msg.toString();
	console.log(text);
}

export let connections: any[] = [];
