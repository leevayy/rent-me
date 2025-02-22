import { ME_CHAT_ID } from "../bot/init.ts";
import { BigKeyboard, inlineDates } from "../bot/keyboards.ts";
import { appointmentsToMessage } from "../utils/formatters.ts";
import { getAppointmentsForUser } from "./storages/AppointmentsStorage.ts";
import { createMessageRouter } from "./MessageRouter.ts";
import { toggleNotificationsForUser } from "./notificationsCron.ts";

export const enum RoutesNames {
	START = "/start",
	LIST_APPOINTMENTS = "📆",
	MAKE_APPOINTMENT = "🤝",
	DISABLE_NOTIFICATIONS = "🔔",
	ENABLE_NOTIFICATIONS = "🔕",
}

export const router = createMessageRouter([
	{
		type: "text",
		path: RoutesNames.LIST_APPOINTMENTS,
		handler: async (ctx) => {
			// if (ctx.chat?.id !== ME_CHAT_ID) {
			// 	return;
			// }
			const appointments = await getAppointmentsForUser(ME_CHAT_ID);

			ctx.reply(
				await appointmentsToMessage(
					appointments.map((appointment) => appointment.value),
				),
			);

			return;
		},
	},
	{
		type: "text",
		path: RoutesNames.START,
		handler: async (ctx) => {
			ctx.telegram.sendMessage(
				ctx.chat.id,
				`Привет, я бот для записи на консультации. Чтобы записаться, нажми на кнопку «${RoutesNames.MAKE_APPOINTMENT}» ниже`,
				await BigKeyboard(ctx.chat.id),
			);
		},
	},
	{
		type: "text",
		path: RoutesNames.ENABLE_NOTIFICATIONS,
		handler: async (ctx) => {
			await toggleNotificationsForUser(ctx.chat.id, true);
			await ctx.reply("Уведомления включены", await BigKeyboard(ctx.chat.id));
		},
	},
	{
		type: "text",
		path: RoutesNames.DISABLE_NOTIFICATIONS,
		handler: async (ctx) => {
			await toggleNotificationsForUser(ctx.chat.id, false);
			await ctx.reply("Уведомления выключены", await BigKeyboard(ctx.chat.id));
		},
	},
	{
		type: "default",
		handler: async (ctx) => {
			const message = await ctx.reply("Выберите свободную дату для записи");
			const keyboard = await inlineDates(message.message_id);

			ctx.telegram.editMessageReplyMarkup(
				ctx.chat!.id,
				message.message_id,
				undefined,
				keyboard,
			);
		},
	},
]);
