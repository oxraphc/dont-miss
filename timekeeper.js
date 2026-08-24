// Set these to NaN to not debug parts of the time.
const debugHours = 7;
const debugMinutes = 0;
const debugSeconds = 0;
const debugDate = 25;
const debugMonth = 7; // January is 0, not 1 btw.
const debugYear = 2026;

const debug = false;
const updateInterval = 1;
const debugUpdateInterval = 1000;


export function initializeTicker(callback) {
    if (debug) {
        console.log('Debug ticker active!');

        const now = new Date();

        if (debug) {
            if (!isNaN(debugHours)) now.setHours(debugHours);
            if (!isNaN(debugMinutes)) now.setMinutes(debugMinutes);
            if (!isNaN(debugSeconds)) now.setSeconds(debugSeconds);
            if (!isNaN(debugDate)) now.setDate(debugDate);
            if (!isNaN(debugMonth)) now.setMonth(debugMonth);
            if (!isNaN(debugYear)) now.setFullYear(debugYear);
        }

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