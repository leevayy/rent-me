import { getUser } from "../services/storages/UserStorage.ts";
import { AppointmentData } from "../types/appointments.ts";

import { unique } from "moderndash";

export const twoDigitNumber = (number: number) =>
	number < 10 ? "0" + number : number;

export const dateToRuDate = (date: Date) => {
	return `${twoDigitNumber(date.getDate())}.${
		twoDigitNumber(date.getMonth() + 1)
	}.${date.getFullYear()}`;
};

export const hoursToTimeInterval = (start: number, end: number) => {
	return `${twoDigitNumber(start)}:00 - ${twoDigitNumber(end)}:00`;
};

const appointmentToMessage = (
	appointment: AppointmentData,
	userViewById: (id: number) => string,
) => {
	const date = new Date(appointment.date);

	return `
${appointment.message}

@${userViewById(appointment.author_id)} ${appointment.notify ? "🔔" : "🔕"}

Участники: @${
		appointment.participantsIds
			.map(userViewById)
			.join(", @")
	}

${dateToRuDate(date)} ${
		hoursToTimeInterval(
			appointment.start_time,
			appointment.end_time,
		)
	}`;
};

export const appointmentsToMessage = async (
	appointments: AppointmentData[],
) => {
	const groupedAppointments = Object.groupBy(
		appointments,
		(appointment) => dateToRuDate(new Date(appointment.date)),
	);

	const sortedAppointments = unique(
		appointments.toSorted((a, b) =>
			new Date(a.date).getTime() - new Date(b.date).getTime()
		).map((appointments) => dateToRuDate(new Date(appointments.date))),
	);

	const participants: Record<number, Awaited<ReturnType<typeof getUser>>> =
		Object
			.fromEntries(
				await Promise.all(
					appointments.flatMap((appointment) =>
						appointment.participantsIds.map(async (
							id,
						) => [id, await getUser(String(id))])
					),
				),
			);

	const userViewById = (id: number) =>
		participants[id]?.username ?? participants[id]?.first_name ??
			"Неизвестный 🫥";

	return sortedAppointments.flatMap((key) =>
		groupedAppointments[key]?.sort((a, b) => a.start_time - b.start_time)?.map(
			(appointment) => {
				return appointmentToMessage(
					appointment,
					userViewById,
				);
			},
		)
	).join("\n") || "Нет записей на консультации";
};
