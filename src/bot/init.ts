import { Telegraf } from "telegraf";

const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
const ME_CHAT_ID = Deno.env.get("ME_CHAT_ID") ?? 0;

if (!BOT_TOKEN) {
    throw new Error("BOT_TOKEN is required");
}

if (!ME_CHAT_ID) {
    throw new Error("ME_CHAT_ID is required");
}

export const bot = new Telegraf(BOT_TOKEN);
export { ME_CHAT_ID };
