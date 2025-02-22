export const enum CallbackType {
	DATE = "date",
	START_TIME = "time1",
	END_TIME = "time2",
	CANCEL = "CANCEL",
}

export type CallbackPayload =
	| {
		type: CallbackType.CANCEL;
	}
	| {
		type: CallbackType.DATE;
		date: string;
	}
	| {
		type: CallbackType.START_TIME;
		date: string;
		start_time: number;
	}
	| {
		type: CallbackType.END_TIME;
		date: string;
		start_time: number;
		end_time: number;
	};

export type CallbackData = {
	msg_id: number | null;
	payload: CallbackPayload;
};
