import { CallbackData } from "../../types/callbacks.ts";
import { kv } from "../init.ts";

export async function storeCallback(data: CallbackData): Promise<string> {
	const id = crypto.randomUUID();
	await kv.set(["callbacks", id], data, { expireIn: 3600000 });
	return id;
}

export async function getCallback(id: string): Promise<CallbackData | null> {
	const result = await kv.get<CallbackData>(["callbacks", id]);
	return result.value;
}
