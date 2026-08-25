// Set these to NaN to not debug parts of the time.
// January is 0, and not 1 btw.
// [hours, minutes, seconds, date, month, year]
const debugTime = [7, 0, 0, 25, 7, 2026];
const debugUpdateInterval = 1000;
const debug = false;

const updateInterval = 1;

export function initializeTicker(callback) {
    if (debug) {
        console.log('Debug ticker active!');

        const now = new Date();

        if (!isNaN(debugTime[0])) now.setHours(debugTime[0]);
        if (!isNaN(debugTime[1])) now.setMinutes(debugTime[1]);
        if (!isNaN(debugTime[2])) now.setSeconds(debugTime[2]);
        if (!isNaN(debugTime[3])) now.setDate(debugTime[3]);
        if (!isNaN(debugTime[4])) now.setMonth(debugTime[4]);
        if (!isNaN(debugTime[5])) now.setFullYear(debugTime[5]);

        return setInterval(() => {
            callback(now);
            now.setSeconds(now.getSeconds() + 1);
        }, debugUpdateInterval);
    }

    return setInterval(() => {
        const now = new Date();
        callback(now);
    }, updateInterval);
}