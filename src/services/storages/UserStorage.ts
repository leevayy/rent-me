import { UserData } from "../../types/users.ts";
import { kv } from "../init.ts";

export async function updateUser(data: UserData): Promise<string> {
	const id = crypto.randomUUID();
	await kv.set(["users", String(data.id)], data, {
		expireIn: 1000 * 60 * 60 * 24 * 8,
	});
	return id;
}

export async function getUser(telegram_id: string): Promise<UserData | null> {
	const result = await kv.get<UserData>(["users", telegram_id]);
	return result.value;
}
