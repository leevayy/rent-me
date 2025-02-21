import { bot } from "./src/bot/init.ts";
import { handleCallback, handleMessage } from "./src/bot/handlers.ts";

bot.on(["message"], handleMessage);
bot.on(["callback_query"], handleCallback);

bot.launch();
