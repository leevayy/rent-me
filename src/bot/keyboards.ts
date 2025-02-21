import { Markup } from "telegraf";
import { CallbackData, CallbackType } from "../types/callbacks.ts";
import { storeData } from "../services/storage.ts";
import { dates, monthNumberToName } from "../constants/dates.ts";

export const inlineDates = async (msg_id: CallbackData["msg_id"]) => {
    const keyboardButtons = await Promise.all(dates.map(async (date) => {
        const callbackData: CallbackData = {
            msg_id,
            payload: {
                type: CallbackType.DATE,
                date: date.toISOString(),
            },
        };

        const storeId = await storeData(callbackData);

        return {
            text: date.getDate() + " " + monthNumberToName[date.getMonth()],
            callback_data: storeId,
        };
    }));

    return {
        inline_keyboard: [keyboardButtons.slice(0, 4), keyboardButtons.slice(4)],
    };
};

export const inlineTime = async (data: CallbackData) => {
    const date = new Date(data.payload.date);
    const { payload } = data;

    const startHour = new Date().getDate() === date.getDate()
        ? date.getHours()
        : 0;

    switch (payload.type) {
        case CallbackType.DATE: {
            const markup = Markup.inlineKeyboard(
                await Promise.all(
                    new Array(Math.max(24 - startHour, 0)).fill(0).map(async (_, i) => {
                        const callbackData: CallbackData = {
                            msg_id: data.msg_id,
                            payload: {
                                type: CallbackType.START_TIME,
                                date: payload.date,
                                start_time: startHour + i,
                            },
                        };

                        const storeId = await storeData(callbackData);

                        return {
                            text: startHour + i + ":00",
                            callback_data: storeId,
                        };
                    }),
                ),
                { wrap: (_btn, _i, currentRow) => currentRow.length === 4 },
            );

            return markup;
        }

        case CallbackType.START_TIME: {
            const markup = Markup.inlineKeyboard(
                await Promise.all(
                    new Array(24 - payload.start_time).fill(0).map(async (_, i) => {
                        const callbackData: CallbackData = {
                            msg_id: data.msg_id,
                            payload: {
                                type: CallbackType.END_TIME,
                                date: payload.date,
                                start_time: payload.start_time,
                                end_time: payload.start_time + 1 + i,
                            },
                        };

                        const storeId = await storeData(callbackData);

                        return {
                            text: payload.start_time + 1 + i + ":00",
                            callback_data: storeId,
                        };
                    }),
                ),
                { wrap: (_btn, _i, currentRow) => currentRow.length === 4 },
            );

            return markup;
        }

        default: {
            return Markup.inlineKeyboard([
                {
                    text: "",
                    callback_data: JSON.stringify({
                        message: "Error: wrong payload type",
                    }),
                },
            ]);
        }
    }
};
