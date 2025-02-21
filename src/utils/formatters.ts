export const twoDigitNumber = (number: number) => number < 10 ? "0" + number : number;

export const dateToRuDate = (date: Date) => {
    return `${twoDigitNumber(date.getDate())}.${
        twoDigitNumber(date.getMonth() + 1)
    }.${date.getFullYear()}`;
};

export const hoursToTimeInterval = (start: number, end: number) => {
    return `${twoDigitNumber(start)}:00 - ${twoDigitNumber(end)}:00`;
};
