import { AppointmentData } from "../../types/appointments.ts";
import { kv } from "../init.ts";
import { ulid } from "@std/ulid";
import { AppointmentQueue } from "../AppointmentQueue.ts";
import { ME_CHAT_ID } from "../../bot/init.ts";

const appointmentQueue = new AppointmentQueue();

export async function storeAppointmentDirectly(
	data: AppointmentData,
): Promise<string | null> {
	const appointments = await getAppointmentsForDate(
		ME_CHAT_ID,
		new Date(data.date),
	);

	if (
		appointments.some((appointment) => {
			const isValid = () => {
				return (data.start_time <= data.end_time);
			};

			const isOverlapping = (start: number, end: number) => {
				return !(start >= data.end_time || end <= data.start_time);
			};

			return !isValid() || isOverlapping(
				appointment.value.start_time,
				appointment.value.end_time,
			);
		})
	) {
		return null;
	}

	const id = ulid();
	await kv.set(["appointments", ME_CHAT_ID, id], data);
	return id;
}

export async function storeAppointment(
	data: AppointmentData,
): Promise<string | null> {
	return await appointmentQueue.enqueue(data);
}

export async function getAppointment(
	id: string,
): Promise<AppointmentData | null> {
	const result = await kv.get<AppointmentData>(["appointments", id]);
	return result.value;
}

export async function getAppointmentsForDate(
	user_id: number,
	date: Date,
) {
	const iter = kv.list<AppointmentData>({
		"prefix": ["appointments", user_id],
	});

	const appointments = [];
	for await (const res of iter) appointments.push(res);

	const filtered = appointments.filter((appointment) => {
		const appointmentDate = new Date(appointment.value.date);

		return (
			appointmentDate.getFullYear() === date.getFullYear() &&
			appointmentDate.getMonth() === date.getMonth() &&
			appointmentDate.getDate() === date.getDate()
		);
	});

	return filtered;
}

export async function getAppointmentsForUser(
	user_id: number,
) {
	const iter = kv.list<AppointmentData>({
		"prefix": ["appointments", user_id],
	});

	const appointments = [];
	for await (const res of iter) appointments.push(res);

	const filtered = appointments.filter((appointment) =>
		appointment.value.participantsIds.includes(user_id)
	);

	return filtered;
}

if (import.meta.main) {
	// const date = `2023-02-${Math.floor(Math.random() * 28)}`;
	// const authorId = Math.floor(Math.random() * 1000);

	// // Test the functions
	// const testData1: AppointmentData = {
	// 	date: date,
	// 	start_time: 9,
	// 	end_time: 11,
	// 	author_id: authorId,
	// 	participantsIds: [],
	// 	created_at: Date.now(),
	// 	message: "Test appointment 1",
	// 	notify: true,
	// };

	// const testData2: AppointmentData = {
	// 	date: date,
	// 	start_time: 9,
	// 	end_time: 10,
	// 	author_id: authorId,
	// 	participantsIds: [],
	// 	created_at: Date.now(),
	// 	message: "Test appointment 2",
	// 	notify: true,
	// };

	// // Test sequential processing
	// Promise.all([
	// 	storeAppointment(testData1),
	// 	storeAppointment(testData2),
	// ]).then(async ([id1, id2]) => {
	// 	console.log("Stored appointment IDs:", id1, id2);
	// 	// Second appointment should be rejected due to time overlap
	// 	console.log(
	// 		"Appointments for date:",
	// 		await getAppointmentsForDate(authorId, new Date(date)),
	// 	);
	// });

	const a = await getAppointmentsForUser(ME_CHAT_ID);
	a.forEach((appointment) => kv.delete(appointment.key));
}
