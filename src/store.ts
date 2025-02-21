import { CallbackData } from "./types.ts";

const kv = await Deno.openKv();

export async function storeData(data: CallbackData): Promise<string> {
	const id = crypto.randomUUID();
	await kv.set(["callbacks", id], data, { expireIn: 3600000 });
	return id;
}

export async function getData(id: string): Promise<CallbackData | null> {
	const result = await kv.get<CallbackData>(["callbacks", id]);
	return result.value;
}
