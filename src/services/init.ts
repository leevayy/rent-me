import { notificationsJob } from "./notificationsCron.ts";

export const kv = await Deno.openKv();

notificationsJob();
