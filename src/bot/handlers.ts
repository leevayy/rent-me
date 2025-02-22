import { Context, NarrowedContext } from "telegraf";
import { CallbackQuery, Update } from "telegraf/types";
import { bot, ME_CHAT_ID } from "./init.ts";
import { getCallback } from "../services/storages/CallbacksStorage.ts";
import { CallbackType } from "../types/callbacks.ts";
import { dateToRuDate, hoursToTimeInterval } from "../utils/formatters.ts";
import { inlineTime } from "./keyboards.ts";
import { storeAppointment } from "../services/storages/AppointmentsStorage.ts";

import { updateUser } from "../services/storages/UserStorage.ts";
import { router } from "../services/router.ts";
import { MessageContext } from "../services/MessageRouter.ts";

const registerUser = async (ctx: Context) => {
	if (!ctx.from) {
		return;
	}

	const userId = await updateUser({
		id: ctx.from.id,
		first_name: ctx.from.first_name,
		last_name: ctx.from?.last_name,
		username: ctx.from?.username,
	});

	return userId;
};

export const handleMessage = async (ctx: MessageContext) => {
	await registerUser(ctx);

	router(ctx);
};

const notifyMe = async (
	ctx: NarrowedContext<
		Context<Update>,
		Update.CallbackQueryUpdate<CallbackQuery>
	>,
) => {
	const storeId = (ctx.callbackQuery as CallbackQuery.DataQuery).data;
	const callbackData = await getCallback(storeId);

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
	ctx: NarrowedContext<
		Context<Update>,
		Update.CallbackQueryUpdate<CallbackQuery>
	>,
) => {
	try {
		const storeId = (ctx.callbackQuery as CallbackQuery.DataQuery).data;
		const callbackData = await getCallback(storeId);

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
					(await inlineTime(callbackData))?.reply_markup,
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
					(await inlineTime(callbackData))?.reply_markup,
				);
				break;
			case CallbackType.END_TIME: {
				const appointmentId = await storeAppointment({
					author_id: ctx.from.id,
					date: payload.date,
					start_time: payload.start_time,
					end_time: payload.end_time,
					participantsIds: [ctx.from.id, ME_CHAT_ID],
					created_at: Date.now(),
					message: "",
					notify: true,
				});

				if (!appointmentId) {
					await ctx.telegram.editMessageReplyMarkup(
						ctx.chat?.id,
						callbackData.msg_id ?? undefined,
						undefined,
						{ inline_keyboard: [] },
					);

					await ctx.telegram.editMessageText(
						ctx.chat?.id,
						callbackData.msg_id ?? undefined,
						undefined,
						"Не удалось создать запись ):",
					);

					return;
				}

				await ctx.telegram.deleteMessage(
					ctx.chat?.id ?? "",
					callbackData.msg_id ?? 0,
				);

				ctx.reply(
					`Запись успешно создана ${dateToRuDate(new Date(payload.date))} ${
						hoursToTimeInterval(payload.start_time, payload.end_time)
					}`,
				);
				notifyMe(ctx);
				break;
			}
			case CallbackType.CANCEL: {
				const callback = await getCallback(
					(ctx.callbackQuery as CallbackQuery.DataQuery).data,
				);

				if (!callback) {
					return;
				}

				if (callback.payload.type === CallbackType.CANCEL) {
					await ctx.telegram.editMessageText(
						ctx.chat?.id ?? "",
						callback.msg_id ?? 0,
						undefined,
						"Бронирование отменено 🤯",
					);

					await ctx.telegram.editMessageReplyMarkup(
						ctx.chat?.id ?? "",
						callback.msg_id ?? 0,
						undefined,
						{
							inline_keyboard: [],
						},
					);
				}
			}
		}
	} catch (error) {
		console.log(error);
	}
};
