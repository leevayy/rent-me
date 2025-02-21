import { Context, NarrowedContext } from "telegraf";
import { CallbackQuery, Update } from "telegraf/types";
import { bot, ME_CHAT_ID } from "./init.ts";
import { getData } from "../services/storage.ts";
import { CallbackType } from "../types/callbacks.ts";
import { dateToRuDate, hoursToTimeInterval } from "../utils/formatters.ts";
import { inlineDates, inlineTime } from "./keyboards.ts";

export const handleMessage = async (ctx: Context) => {
    const message = await ctx.reply("Выберите свободную дату для записи");
    const keyboard = await inlineDates(message.message_id);
    
    ctx.telegram.editMessageReplyMarkup(
        ctx.chat!.id,
        message.message_id,
        undefined,
        keyboard,
    );
};

export const notifyMe = async (
    ctx: NarrowedContext<Context<Update>, Update.CallbackQueryUpdate<CallbackQuery>>
) => {
    const storeId = (ctx.callbackQuery as CallbackQuery.DataQuery).data;
    const callbackData = await getData(storeId);

    if (!callbackData || callbackData.payload.type !== CallbackType.END_TIME) {
        return;
    }

    bot.telegram.sendMessage(
        ME_CHAT_ID,
        `${ctx.from.first_name} (@${ctx.from.username}). Оформлена запись на ${
            dateToRuDate(new Date(callbackData.payload.date))
        } ${
            hoursToTimeInterval(
                callbackData.payload.start_time,
                callbackData.payload.end_time,
            )
        }`,
    );
};

export const handleCallback = async (
    ctx: NarrowedContext<Context<Update>, Update.CallbackQueryUpdate<CallbackQuery>>
) => {
    try {
        const storeId = (ctx.callbackQuery as CallbackQuery.DataQuery).data;
        const callbackData = await getData(storeId);

        if (!callbackData) {
            return;
        }

        const { payload } = callbackData;

        switch (payload.type) {
            case CallbackType.DATE:
                await ctx.telegram.editMessageText(
                    ctx.chat?.id,
                    callbackData.msg_id ?? undefined,
                    undefined,
                    "Выберите время начала",
                );

                await ctx.telegram.editMessageReplyMarkup(
                    ctx.chat?.id,
                    callbackData.msg_id ?? undefined,
                    undefined,
                    (await inlineTime(callbackData)).reply_markup,
                );
                break;
            case CallbackType.START_TIME:
                await ctx.telegram.editMessageText(
                    ctx.chat?.id,
                    callbackData.msg_id ?? undefined,
                    undefined,
                    "Выберите время окончания",
                );

                await ctx.telegram.editMessageReplyMarkup(
                    ctx.chat?.id,
                    callbackData.msg_id ?? undefined,
                    undefined,
                    (await inlineTime(callbackData)).reply_markup,
                );
                break;
            case CallbackType.END_TIME:
                ctx.reply(
                    `Запись успешно создана ${dateToRuDate(new Date(payload.date))} ${
                        hoursToTimeInterval(payload.start_time, payload.end_time)
                    }`,
                );
                notifyMe(ctx);
                break;
        }
    } catch (error) {
        console.log(error);
    }
};
