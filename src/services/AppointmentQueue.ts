import { AppointmentData } from "../types/appointments.ts";
import { storeAppointmentDirectly } from "./storages/AppointmentsStorage.ts";

type QueueItem = {
	data: AppointmentData;
	resolve: (value: string | null) => void;
	reject: (error: Error) => void;
	retries: number;
};

export class AppointmentQueue {
	private queues: Map<number, QueueItem[]> = new Map();
	private processing: Set<number> = new Set();
	private maxRetries = 3;

	enqueue(appointmentData: AppointmentData): Promise<string | null> {
		return new Promise((resolve, reject) => {
			const authorId = appointmentData.author_id;
			const queueItem: QueueItem = {
				data: appointmentData,
				resolve,
				reject,
				retries: 0,
			};

			if (!this.queues.has(authorId)) {
				this.queues.set(authorId, []);
			}

			this.queues.get(authorId)!.push(queueItem);
			this.processQueue(authorId);
		});
	}

	private async processQueue(authorId: number) {
		if (this.processing.has(authorId)) {
			return;
		}

		const queue = this.queues.get(authorId);
		if (!queue?.length) {
			return;
		}

		this.processing.add(authorId);

		try {
			const item = queue[0];
			const result = await storeAppointmentDirectly(item.data);

			queue.shift();
			item.resolve(result);
		} catch (_error) {
			const item = queue[0];
			item.retries++;

			if (item.retries >= this.maxRetries) {
				queue.shift();
				item.reject(
					new Error(
						`Failed to store appointment after ${this.maxRetries} attempts`,
					),
				);
			}
		} finally {
			this.processing.delete(authorId);

			if (queue.length > 0) {
				// Process next item in queue if any
				setTimeout(() => this.processQueue(authorId), 100);
			} else {
				this.queues.delete(authorId);
			}
		}
	}
}
