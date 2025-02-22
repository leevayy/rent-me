import { Markup } from "telegraf";
import { CallbackData, CallbackType } from "../types/callbacks.ts";
import { storeCallback } from "../services/storages/CallbacksStorage.ts";
import { dates, monthNumberToName } from "../constants/dates.ts";
import { getAppointmentsForDate } from "../services/storages/AppointmentsStorage.ts";
import { ME_CHAT_ID } from "./init.ts";
import { RoutesNames } from "../services/router.ts";
import { getNotificationsByUserId } from "../services/storages/NotificationsStorage.ts";

export const BigKeyboard = async (user_id: number) => {
	const isNotifyEnabled = await getNotificationsByUserId(user_id);

	const buttons = [RoutesNames.MAKE_APPOINTMENT];

	if (isNotifyEnabled) {
		buttons.push(RoutesNames.DISABLE_NOTIFICATIONS);
	} else {
		buttons.push(RoutesNames.ENABLE_NOTIFICATIONS);
	}

	buttons.push(RoutesNames.LIST_APPOINTMENTS);

	return Markup.keyboard([
		buttons,
	]).resize();
};

export const inlineDates = async (msg_id: CallbackData["msg_id"]) => {
	const keyboardButtons = await Promise.all(dates.map(async (date) => {
		const callbackData: CallbackData = {
			msg_id,
			payload: {
				type: CallbackType.DATE,
				date: date.toISOString(),
			},
		};

		const storeId = await storeCallback(callbackData);

		return {
			text: date.getDate() + " " + monthNumberToName[date.getMonth()],
			callback_data: storeId,
		};
	}));

	const cancelData: CallbackData = {
		msg_id,
		payload: {
			type: CallbackType.CANCEL,
		},
	};
	const cancelId = await storeCallback(cancelData);

	return {
		inline_keyboard: [
			keyboardButtons.slice(0, 4),
			keyboardButtons.slice(4),
			[{
				text: "❌",
				callback_data: cancelId,
			}],
		],
	};
};

export const inlineTime = async (data: CallbackData) => {
	if (data.payload.type === CallbackType.CANCEL) {
		return;
	}

	const date = new Date(data.payload.date);
	const { payload } = data;

	const startHour = Math.max(
		new Date().getDate() === date.getDate() ? date.getHours() : 0,
		8,
	);

	const maxHour = 22;

	const appointments = await getAppointmentsForDate(ME_CHAT_ID, date);

	const isTimeAvailable = (hour: number) => {
		return hour > startHour && hour <= maxHour &&
			!appointments.some((appointment) => {
				const start = hour;
				const end = hour + 1;

				return !(start >= appointment.value.end_time ||
					end <= appointment.value.start_time);
			});
	};

	switch (payload.type) {
		case CallbackType.DATE: {
			const buttons = await Promise.all(
				new Array(24).fill(0).map((_, i) => i).filter((hour) =>
					isTimeAvailable(hour)
				)
					.map(async (hour) => {
						const callbackData: CallbackData = {
							msg_id: data.msg_id,
							payload: {
								type: CallbackType.START_TIME,
								date: payload.date,
								start_time: hour,
							},
						};

						const storeId = await storeCallback(callbackData);

						return {
							text: hour + ":00",
							callback_data: storeId,
						};
					}),
			);

			const cancelData: CallbackData = {
				msg_id: data.msg_id,
				payload: {
					type: CallbackType.CANCEL,
				},
			};
			const cancelId = await storeCallback(cancelData);

			buttons.push({
				text: "❌",
				callback_data: cancelId,
			});

			return Markup.inlineKeyboard(buttons, {
				wrap: (_btn, _i, currentRow) => currentRow.length === 4,
			});
		}

		case CallbackType.START_TIME: {
			const maxAvailableHour = appointments.reduce((minStart, appointment) => {
				if (appointment.value.start_time < payload.start_time) {
					return minStart;
				}

				if (appointment.value.start_time > minStart) {
					return minStart;
				} else {
					return appointment.value.start_time;
				}
			}, 25);

			const buttons = await Promise.all(
				new Array(24).fill(0).map((_, i) => i).filter((hour) => {
					return hour > payload.start_time &&
						hour <= maxAvailableHour;
				}).map(async (hour) => {
					const callbackData: CallbackData = {
						msg_id: data.msg_id,
						payload: {
							type: CallbackType.END_TIME,
							date: payload.date,
							start_time: payload.start_time,
							end_time: hour,
						},
					};

					const storeId = await storeCallback(callbackData);

					return {
						text: hour + ":00",
						callback_data: storeId,
					};
				}),
			);

			const cancelData: CallbackData = {
				msg_id: data.msg_id,
				payload: {
					type: CallbackType.CANCEL,
				},
			};
			const cancelId = await storeCallback(cancelData);

			buttons.push({
				text: "❌",
				callback_data: cancelId,
			});

			return Markup.inlineKeyboard(buttons, {
				wrap: (_btn, _i, currentRow) => currentRow.length === 4,
			});
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
