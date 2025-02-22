import { bot } from "../bot/init.ts";
import { appointmentsToMessage } from "../utils/formatters.ts";
import { getAppointmentsForUser } from "./storages/AppointmentsStorage.ts";
import {
	getNotifications,
	storeNotificationState,
} from "./storages/NotificationsStorage.ts";

const every_45_minutes = "45 * * * *";

export const toggleNotificationsForUser = async (
	user_id: number,
	notify: boolean,
) => {
	await storeNotificationState({
		chatId: user_id,
		notify,
	});
};

export const notificationsJob = () => {
	Deno.cron("Notify users", every_45_minutes, async () => {
		const notifications = await getNotifications();

		notifications.filter((notification) => notification.notify).forEach(
			async ({ chatId }) => {
				const appointments = await getAppointmentsForUser(chatId);

				const hour = new Date().getHours();

				const nextAppointment = appointments.find((appointment) =>
					appointment.value.start_time === hour + 1
				);

				if (
					nextAppointment
				) {
					await bot.telegram.sendMessage(
						chatId,
						"У вас есть запись на следующий час " +
							await appointmentsToMessage([nextAppointment.value]),
					);
				}
			},
		);
	});
};
