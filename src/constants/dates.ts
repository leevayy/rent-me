export const monthNumberToName: { [key: number]: string } = {
    0: "Янв",
    1: "Фев",
    2: "Мар",
    3: "Апр",
    4: "Май",
    5: "Июн",
    6: "Июл",
    7: "Авг",
    8: "Сен",
    9: "Окт",
    10: "Ноя",
    11: "Дек",
} as const;

export const dates = new Array(7).fill(0).map((_, i) => {
    const date = new Date(Date.now());
    date.setDate(date.getDate() + i);
    return date;
});
