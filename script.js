const API_BASE_URL = "https://api.myquran.com/v3/sholat/jadwal/"
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
const locationSelector = document.getElementById('location');

let savedDate = new Date().getDate();
let prayerScheduleDownloaded = false;
let nextPrayerIndex;
let nextPrayerTimeDelta = 0;
let selectedLocationIndex = locationSelector.selectedIndex;
const prayerSchedule = [];
// 0- Isya' (yesterday)
// 1- Fajr
// 2- Sunrise
// 3- Dhuha
// 4- Dzuhr
// 5- Ashr
// 6- Magrhib
// 7- Isha'
const locationID = [
    'd6baf65e0b240ce177cf70da146c8dc8', // Tulungagung
    'eda80a3d5b344bc40f3bc04f65b7a357', // Kota Kediri
    '4734ba6f3de83d861c3176a6273cac6d', // Surabaya
    '06138bc5af6023646ede0e1f7c1eac75', // Kota Malang
    '577ef1154f3240ad5b9b413aa7346a1e', // Kota Yogyakarta
    '74db120f0a8e5646ef5a30154e9f6deb', // Kota Semarang
    '58a2fc6ed39fd083f55d4182bf88826d', // Kota Jakarta
    'bd4c9ab730f5513206b999ec0d90d1fb', // Kota Tangerang
    'cedebb6e872f539bef8c3f919874e9d7', // Kota Bekasi
    '6a9aeddfc689c1d0e3b9ccc3ab651bc5' // Kota Denpasar
]


// Fetch and parse prayer schedules
async function getPrayerSchedule() {
    console.log("Fetching new schedule...");
    prayerScheduleDownloaded = false;
    prayerSchedule.length = 0; // Clear prayerSchedule array
    const useLocationID = locationID[selectedLocationIndex];

    const now = new Date();
    const todayDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`; // YYYY-MM-DD

    now.setDate(now.getDate() - 1); // Rewind date by 1 day
    const yesterdayDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`; // YYYY-MM-DD

    // Fetch and parse yesterday's schedule
    try {
        const response = await fetch(API_BASE_URL + useLocationID + '/' + yesterdayDate);
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
        return;
    }

    // Fetch and parse today's schedule
    try {
        const response = await fetch(API_BASE_URL + useLocationID + '/' + 'today');
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
        return;
    }

    prayerScheduleDownloaded = true;
    console.log("New schedule fetched and parsed.")
}
getPrayerSchedule();


// 1 second update loop
setInterval(() => {
    const now = new Date();
    updateClock(now);

    if (savedDate !== now.getDate()) {
        savedDate = now.getDate();
        getPrayerSchedule();
    }

    if (prayerScheduleDownloaded) {
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

    const prayerTime = prayerSchedule[nextPrayerIndex][1];
    const t = prayerTime.split(':'); // ["<hours>", "<minutes>"]
    const prayerTimeInMinutes = timeToMinutes(t[0], t[1]);

    if (nextPrayerIndex === 0) {
        nextPrayerTimeDelta = prayerTimeInMinutes - (1440 + currentTimeInMinutes); // 1440 = 24h in minutes
    } else {
        nextPrayerTimeDelta = prayerTimeInMinutes - currentTimeInMinutes;
    }
}


function updateView() {
    // Update nextPrayer
    nextPrayerElem.innerText = capitalize(prayerSchedule[nextPrayerIndex][0]);
    nextPrayerTimeElem.innerText = prayerSchedule[nextPrayerIndex][1];

    // Update nextTitle
    if (nextPrayerIndex !== 2) {
        if (nextPrayerTimeDelta > 0) {
            nextTitleElem.innerText = 'Next prayer :';
        } else if (nextPrayerTimeDelta <= 0) {
            nextTitleElem.innerText = 'Current prayer :';
        }
    } else {
        if (nextPrayerTimeDelta > 0) {
            nextTitleElem.innerText = 'Upcoming :';
        } else if (nextPrayerTimeDelta <= 0) {
            nextTitleElem.innerText = 'Currently :';
        }
    }

    // Update progress's bar label
    if (nextPrayerTimeDelta < -30) {
        deltaTimeLabel.innerHTML = '<br><br>' + formatMinutes(nextPrayerTimeDelta) + ' ▶';
    } else {
        deltaTimeLabel.innerHTML = '<br>▲<br>' + formatMinutes(nextPrayerTimeDelta);
    }
    
    // Get progress's bar label container offset 
    const containerComputedStyle = window.getComputedStyle(progressesBarLabelContainerContainer);
    const containerOffset = (parseInt(containerComputedStyle.width, 10) / 2) + 2;
    const centerOffset = -1.5; // To properly center the progress's bar marker when hitting the 50% mark
    
    // Update progress's bar and label position
    const progress = nextPrayerTimeDeltaPercent();
    progressesBar.style.width = `calc(${progress}% + ${centerOffset}px)`;
    progressesBarLabelContainer.style.width = `calc(${progress}% + ${containerOffset}px + ${centerOffset}px)`;
}


// Detect locationSelector change
locationSelector.addEventListener('change', () => {
    selectedLocationIndex = locationSelector.selectedIndex;
    console.log(`Selected location changed to ${locationSelector.value}`);

    // Reset view while fetching
    nextTitleElem.innerText = 'ㅤ';
    nextPrayerElem.innerText = 'ㅤ';
    nextPrayerTimeElem.innerText = 'Fetching schedule...';
    deltaTimeLabel.innerText = '';
    progressesBar.style.width = '0';
    progressesBarLabelContainer.style.width = '0';
    
    // Fetch new schedule with new location
    getPrayerSchedule();
});


function nextPrayerTimeDeltaPercent() {
    let useThreshold;
    if (nextPrayerIndex != 2) {
        useThreshold = TIME_DELTA_THRESHOLD;
    } else {
        useThreshold = DHUHA_TIME_DELTA_THRESHOLD;
    }

    let percent = rangePercent(useThreshold, nextPrayerTimeDelta, (useThreshold * -1));
    
    // Bracket to 100
    if (percent > 100) {
        percent = percent - (percent - 100);
    }
        
    return percent;
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
        s.push(`${h} hr`);
    }

    if (m > 0) {
        s.push(`${m} min`);
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
    const max_total = Math.abs(min) + Math.abs(max);

    let percentage = ((current + max_total / 2) / max_total) * 100;

    // Invert to its complement if min > max
    if (min > max) {
        percentage = 100 - percentage;
    }
    // Originally, the percentage will always favored the 
    // largest numeric, ignoring the min-max placement.

    return percentage;
}