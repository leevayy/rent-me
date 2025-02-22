import { NotificationData } from "../../types/notifications.ts";
import { kv } from "../init.ts";

export async function storeNotificationState(
	data: NotificationData,
): Promise<string> {
	const id = crypto.randomUUID();
	await kv.set(["notifications", data.chatId], data, { expireIn: 3600000 });
	return id;
}

export async function getNotifications() {
	const iter = kv.list<NotificationData>({
		"prefix": ["notifications"],
	});

	const notifications = [];
	for await (const res of iter) notifications.push(res);

	return notifications.map((notification) => notification.value);
}

export async function getNotificationsByUserId(user_id: number) {
	const data = await kv.get<NotificationData>(
		["notifications", user_id],
	);

	const state = data.value?.notify ?? true;

	return state;
}
