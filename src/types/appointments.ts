export type AppointmentData = {
    date: string;
    start_time: number;
    end_time: number;
    author_id: number;
    participantsIds: number[];
    created_at: number;
    message: string;
    notify: boolean;
}
