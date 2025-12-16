const BASE_API_URL = "https://api.myquran.com/v3/sholat/jadwal/d6baf65e0b240ce177cf70da146c8dc8/"
const TIME_DELTA_THRESHOLD = 30; // Minutes
const DHUHA_TIME_DELTA_THRESHOLD = 15; // Minutes

const clockElem = document.getElementById('clock');
const nextTitleElem = document.getElementById('next-title');
const nextPrayerElem = document.getElementById('next-prayer');
const nextPrayerTimeElem = document.getElementById('next-prayer-time');
const deltaTimeLabel = document.getElementById('delta-time-label');
const progressesBar = document.getElementById('progresses-bar');
const progressesBarLabelContainer = document.getElementById('progresses-bar-label');
const progressesBarLabelContainerContainer = document.getElementById('label-container');

let savedDate;
let prayerScheduleDownloaded = false;
let nextPrayerIndex;
let nextPrayerTimeDelta = 0;
const prayerSchedule = [];
// 0- Isya' (yesterday)
// 1- Fajr
// 2- Sunrise
// 3- Dhuha
// 4- Dzuhr
// 5- Ashr
// 6- Magrhib
// 7- Isha'

// Fetch and parse prayer schedules
async function getPrayerSchedule() {
    prayerScheduleDownloaded = false;
    prayerSchedule.length = 0; // clear prayerSchedule array

    const now = new Date();
    const todayDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`; // YYYY-MM-DD

    now.setDate(now.getDate() - 1); // Rewind date by 1 day
    const yesterdayDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`; // YYYY-MM-DD

    // Fetch and parse yesterday's schedule
    try {
        const response = await fetch(BASE_API_URL + yesterdayDate);
        if (response.ok) {
            const jsonResponse = await response.json();
            const jadwal = jsonResponse['data']['jadwal'][yesterdayDate];
            prayerSchedule.push(
                ['isha\'', jadwal['isya']] // We only need yesterday's isha time
            )
        } else {
            throw new Error(`Failed to fetch yesterday prayer schedule (${response.status})`);
        }
    } catch (e) {
        console.error(e);
    }

    // Fetch and parse today's schedule
    try {
        const response = await fetch(BASE_API_URL + 'today');
        if (response.ok) {
            const jsonResponse = await response.json();
            const jadwal = jsonResponse['data']['jadwal'][todayDate];
            prayerSchedule.push(
                ['fajr', jadwal['subuh']],
                ['sunrise', jadwal['terbit']],
                ['dhuha', jadwal['dhuha']],
                ['dzuhr', jadwal['dzuhur']],
                ['ashr', jadwal['ashar']],
                ['maghrib', jadwal['maghrib']],
                ['isha\'', jadwal['isya']],
            )
        } else {
            throw new Error(`Failed to fetch today prayer schedule (${response.status})`);
        }
    } catch (e) {
        console.error(e);
    }

    prayerScheduleDownloaded = true;
}


// 1 sec loop
setInterval(() => {
    const now = new Date();

    if (savedDate !== now.getDate()) {
        savedDate = now.getDate();
        getPrayerSchedule();
    }

    if (prayerScheduleDownloaded) {
        updateClock(now);
        updateNextPrayerIndex(now);
        calcTimeUntilNextPrayer(now);
        updateView();
    }
}, 1000);

// =================================================== TESTING / DEBUG ONLY
// const now = new Date();
// now.setHours(11);
// now.setMinutes(31);
// setInterval(() => {
//     if (savedDate !== now.getDate()) {
//         savedDate = now.getDate();
//         getPrayerSchedule();
//     }
//     if (prayerScheduleDownloaded) {
//         updateClock(now);
//         updateNextPrayerIndex(now);
//         calcTimeUntilNextPrayer(now);
//         updateView();
//         now.setSeconds(now.getSeconds() + 1);
//     }
// }, 10);
//  ========================================================================

// 1. Update next prayer
// 2. Calculate delta
// 3. Have "Next prayer" and "Current prayer" with the former ranging 1 hour before adzan 
//    and the latter ∞ hour after adzan
// 4. Update time bar
// 5. Fetch new time schedule when day changes
// 6. Side arrow when progress goes beyond +-30m
// TODO
// 7. Add loading screen when waiting for data
// 8. Refactor everything

function updateClock(now) {
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    clockElem.innerText = `${hours}:${minutes}:${seconds}`;
}


function updateNextPrayerIndex(now) {
    const currentTimeInMinutes = timeToMinutes(now.getHours(), now.getMinutes());

    for (let i = 1; i < prayerSchedule.length; i++) {
        const t = prayerSchedule[i][1].split(':');
        const prayerTimeInMinutes = timeToMinutes(t[0], t[1]);
        const timeDelta = prayerTimeInMinutes - currentTimeInMinutes;

        if (timeDelta > 0) {
            if (i === 3 && timeDelta > DHUHA_TIME_DELTA_THRESHOLD) {
                nextPrayerIndex = 2;
                break;
            }
            if (timeDelta <= TIME_DELTA_THRESHOLD) {
                nextPrayerIndex = i;
                break;
            }
            if (timeDelta > TIME_DELTA_THRESHOLD) {
                nextPrayerIndex = i - 1;
                break;
            }
        }
        // When code execution reaches here, it means it is past isha'
        // So set the nextPrayerIndex to the last loop's iteration, 7 for isha'
        nextPrayerIndex = i;
    }
}


function calcTimeUntilNextPrayer(now) {
    const currentTimeInMinutes = timeToMinutes(now.getHours(), now.getMinutes());

    const sel = prayerSchedule[nextPrayerIndex][1];
    const t = sel.split(':');
    const prayerTimeInMinutes = timeToMinutes(t[0], t[1]);

    nextPrayerTimeDelta = prayerTimeInMinutes - currentTimeInMinutes;
}


function updateView() {
    // Update nextPrayer
    nextPrayerElem.innerText = capitalize(prayerSchedule[nextPrayerIndex][0]);
    nextPrayerTimeElem.innerText = prayerSchedule[nextPrayerIndex][1];

    // Update nextTitle
    if (nextPrayerIndex !== 2) {
        if (nextPrayerTimeDelta > 0) {
            nextTitleElem.innerText = 'Next prayer :'
        } else if (nextPrayerTimeDelta <= 0) {
            nextTitleElem.innerText = 'Current prayer :'
        }
    } else {
        if (nextPrayerTimeDelta > 0) {
            nextTitleElem.innerText = 'Upcoming :'
        } else if (nextPrayerTimeDelta <= 0) {
            nextTitleElem.innerText = 'Currently :'
        }
    }

    // Update Progresses Bar label
    if (nextPrayerTimeDelta < -30) {
        deltaTimeLabel.innerHTML = '<br><br>' + formatMinutes(nextPrayerTimeDelta) + ' ▶';
    } else {
        deltaTimeLabel.innerHTML = '<br>▲<br>' + formatMinutes(nextPrayerTimeDelta);
    }

    // Update Progresses Bar Label Container Position
    let useThreshold;
    if (nextPrayerIndex != 2) {
        useThreshold = TIME_DELTA_THRESHOLD;
    } else {
        useThreshold = DHUHA_TIME_DELTA_THRESHOLD;
    }

    let progress = rangePercent(useThreshold, nextPrayerTimeDelta, (useThreshold * -1));
    if (progress > 100) {
        progress = progress - (progress - 100);
    } // bracket to 100

    const containerComputedStyle = window.getComputedStyle(progressesBarLabelContainerContainer);
    const containerOffset = (parseInt(containerComputedStyle.width, 10) / 2) + 2;
    const centerOffset = 1.5;

    progressesBar.style.width = `calc(${progress}% - ${centerOffset}px)`;
    progressesBarLabelContainer.style.width = `calc(${progress}% + ${containerOffset}px - ${centerOffset}px)`;

}


function formatMinutes(minutes) {
    if (!minutes) {
        return 'Now';
    }

    const m = Math.abs(minutes) % 60;
    const h = (Math.abs(minutes) - m) / 60;
    let prefix = '-';
    let s = [];

    if (minutes < 0) {
        prefix = '+';
    }

    if (h > 0) {
        s.push(`${h}h`);
    }

    if (m > 0) {
        s.push(`${m}m`);
    }

    return prefix + s.join(' ');
}


function timeToMinutes(hours, minutes) {
    return Number(hours) * 60 + Number(minutes);
}


function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1, str.length);
}


function rangePercent(min, current, max) {
    const full_max = Math.abs(min) + Math.abs(max)

    let percentage = ((current + full_max / 2) / full_max) * 100;

    if (min > max) {
        percentage = 100 - percentage;
    } // flip the value.
    // originally, the percentage will always favored the 
    // largest numeric, ignoring the min-max placement.

    return percentage;
}