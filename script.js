const API_BASE_URL = "https://api.myquran.com/v3/sholat/jadwal/"
const TIME_DELTA_THRESHOLD = 30; // Minutes
const SUNRISE_DHUHA_TIME_DELTA_THRESHOLD = 15; // Minutes

const clockElem = document.getElementById('clock');
const titleElem = document.getElementById('title');
const prayerNameElem = document.getElementById('prayer-name');
const prayerTimeElem = document.getElementById('prayer-time');
const deltaTimeElem = document.getElementById('delta-time');
const progressBar = document.getElementById('progress');
const progressMarkerLabelContainer = document.getElementById('progress-marker-label-container');
const deltaTimeContainer = document.getElementById('delta-time-container');
const locationSelector = document.getElementById('location');
const progressBarMarkerLabelMin = document.getElementById('progress-bar-marker-min');
const progressBarMarkerLabelMax = document.getElementById('progress-bar-marker-max');

let savedDate = new Date().getDate();
let prayerScheduleDownloaded = false;
let prayerIndex;
let prayerTimeDelta = 0;
let selectedLocationIndex = locationSelector.selectedIndex;
let deltaTimeThresholdInUse = TIME_DELTA_THRESHOLD;
const prayerSchedule = [];
// Table array, each row goes like: ["<prayer_name>", "<prayer_time>"]
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
];


// Load saved schedule to avoid refetching.
retrieveStorage();


// Fetch and parse prayer schedules
async function getPrayerSchedule() {
    console.log("Fetching new schedule...");
    prayerScheduleDownloaded = false;
    resetView();
    prayerSchedule.length = 0; // Clear prayerSchedule array
    const useLocationID = locationID[selectedLocationIndex];

    const now = new Date();
    const todayDate = formatDate(now);

    now.setDate(now.getDate() - 1); // Rewind date by 1 day
    const yesterdayDate = formatDate(now);

    // Fetch and parse yesterday's schedule
    try {
        const response = await fetch(API_BASE_URL + useLocationID + '/' + yesterdayDate);
        if (response.ok) {
            const jsonResponse = await response.json();
            const jadwal = jsonResponse['data']['jadwal'][yesterdayDate];
            prayerSchedule.push(
                ['isha\' (yesterday)', jadwal['isya']] // We only need yesterday's isha time
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
    updateStorage();
    console.log("New schedule fetched, parsed, and stored.");
}


// Global update loop
setInterval(() => {
    const now = new Date();
    updateClock(now);

    if (savedDate !== now.getDate()) {
        savedDate = now.getDate();
        getPrayerSchedule();
    }

    if (prayerScheduleDownloaded) {
        updatePrayerIndex(now);
        updatePrayerTimeDelta(now);
        updateView();
    }
}, 1);

// =================================================== TESTING / DEBUG ONLY
// const now = new Date();
// now.setHours(11);
// now.setMinutes(31);
// now.setSeconds(0);
// console.log("Debug mode active!")
// setInterval(() => {
//     if (savedDate !== now.getDate()) {
//         savedDate = now.getDate();
//         getPrayerSchedule();
//     }
//     if (prayerScheduleDownloaded) {
//         updateClock(now);
//         updatePrayerIndex(now);
//         updatePrayerTimeDelta(now);
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


function updatePrayerIndex(now) {
    const currentTimeInMinutes = timeToMinutes(now.getHours(), now.getMinutes());

    for (let i = 1; i < prayerSchedule.length; i++) {
        const t = prayerSchedule[i][1].split(':');
        const prayerTimeInMinutes = timeToMinutes(t[0], t[1]);
        const timeDelta = prayerTimeInMinutes - currentTimeInMinutes;

        if (timeDelta > 0) {
            if (i === 2 || i === 3) {
                if (timeDelta <= SUNRISE_DHUHA_TIME_DELTA_THRESHOLD) {
                    prayerIndex = i;
                    break;
                }
                if (timeDelta > SUNRISE_DHUHA_TIME_DELTA_THRESHOLD) {
                    prayerIndex = i - 1;
                    break;
                }
            } else {
                if (timeDelta <= TIME_DELTA_THRESHOLD) {
                    prayerIndex = i;
                    break;
                }
                if (timeDelta > TIME_DELTA_THRESHOLD) {
                    prayerIndex = i - 1;
                    break;
                }
            }
        }
        // When code execution reaches here, it means it is past isha'
        // So set the prayerIndex to the last loop's iteration, 7 for isha'
        prayerIndex = i;
    }
}


function updatePrayerTimeDelta(now) {
    const currentTimeInMinutes = timeToMinutes(now.getHours(), now.getMinutes());

    const prayerTime = prayerSchedule[prayerIndex][1];
    const t = prayerTime.split(':'); // ["<hours>", "<minutes>"]
    const prayerTimeInMinutes = timeToMinutes(t[0], t[1]);

    if (prayerIndex === 0) {
        prayerTimeDelta = prayerTimeInMinutes - (1440 + currentTimeInMinutes); // 1440 = 24h in minutes
    } else {
        prayerTimeDelta = prayerTimeInMinutes - currentTimeInMinutes;
    }
}


function updateView() {
    prayerNameElem.innerText = prayerIndex === 0 ? 'Isha\'' : capitalize(prayerSchedule[prayerIndex][0]);
    prayerTimeElem.innerText = prayerSchedule[prayerIndex][1];

    updateDeltaTimeThresholdInUse();
    progressBarMarkerLabelMin.innerText = `-${deltaTimeThresholdInUse} min`;
    progressBarMarkerLabelMax.innerText = `+${deltaTimeThresholdInUse} min`;

    updateTitle();
    updateDeltaTimeLabel();
    updateProgressBar();
}


function updateTitle() {
    if (prayerIndex !== 2) {
        if (prayerTimeDelta > 0) {
            titleElem.innerText = 'Next prayer :';
        } else if (prayerTimeDelta <= 0) {
            titleElem.innerText = 'Current prayer :';
        }
    } else {
        if (prayerTimeDelta > 0) {
            titleElem.innerText = 'Upcoming :';
        } else if (prayerTimeDelta <= 0) {
            titleElem.innerText = 'Currently :';
        }
    }
}


function updateDeltaTimeLabel() {
    if (prayerTimeDelta <= (deltaTimeThresholdInUse * -1)) {
        deltaTimeElem.innerHTML = '<br><br>' + formatMinutes(prayerTimeDelta) + ' ▶';
    } else {
        deltaTimeElem.innerHTML = '<br>▲<br>' + formatMinutes(prayerTimeDelta);
    }
}


function updateDeltaTimeThresholdInUse() {
    if (prayerIndex === 2 || prayerIndex === 3) {
        deltaTimeThresholdInUse = SUNRISE_DHUHA_TIME_DELTA_THRESHOLD;
    } else {
        deltaTimeThresholdInUse = TIME_DELTA_THRESHOLD;
    }
}


function updateProgressBar() {
    const progress = getPrayerTimeDeltaPercent();

    // Get progress bar label container offset 
    const containerComputedStyle = window.getComputedStyle(deltaTimeContainer);
    let containerOffset = (parseInt(containerComputedStyle.width, 10) / 2) + 2;
    let centerOffset = -1.5; // To properly center the progress's bar marker when hitting the 50% mark
    
    if (progress >= 100) {
        // Omit any offsets if full progress
        centerOffset = 0;
        containerOffset = 0;
    }
    
    // Update progress bar and label position
    progressBar.style.width = `calc(${progress}% + ${centerOffset}px)`;
    progressMarkerLabelContainer.style.width = `calc(${progress}% + ${containerOffset}px + ${centerOffset}px)`;
}


// Detect locationSelector change
locationSelector.addEventListener('change', () => {
    console.log(`Location changed to ${locationSelector.value}`);
    selectedLocationIndex = locationSelector.selectedIndex;
    getPrayerSchedule();
});


function resetView() {
    titleElem.innerText = 'ㅤ';
    prayerNameElem.innerText = 'ㅤ';
    prayerTimeElem.innerText = 'Fetching schedule...';
    deltaTimeElem.innerText = '';
    progressBar.style.width = '0';
    progressMarkerLabelContainer.style.width = '0';
}


function getPrayerTimeDeltaPercent() {
    let percent = rangePercent(
        deltaTimeThresholdInUse,
        prayerTimeDelta,
        (deltaTimeThresholdInUse * -1)
    );
    
    // Bracket to 100
    if (percent > 100) {
        percent = percent - (percent - 100);
    }
        
    return percent;
}


function updateStorage() {
    const schedule = Object.fromEntries(prayerSchedule);
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('locationIndex', selectedLocationIndex);
    localStorage.setItem('lastUpdate', formatDate(new Date()));
    console.log('Storage updated or populated.');
}


function retrieveStorage() {
    let storageSchedule;
    let storageLocationIndex;
    let storageLastUpdate;

    try {
        storageSchedule = localStorage.getItem('schedule');
        storageLocationIndex = localStorage.getItem('locationIndex');
        storageLastUpdate = localStorage.getItem('lastUpdate');
        
        if (!(storageSchedule && storageLocationIndex && storageLastUpdate)) {
            throw new Error();
        }
        console.log('Saved schedule found.'); // If reaches here, saved storage was found.

        if (storageLastUpdate == formatDate(new Date())) {
            const storageScheduleParsed = JSON.parse(localStorage.getItem('schedule'));
            prayerSchedule.push(
                    ['isha\' (yesterday)', storageScheduleParsed['isha\' (yesterday)']],
                    ['fajr', storageScheduleParsed['fajr']],
                    ['sunrise', storageScheduleParsed['sunrise']],
                    ['dhuha', storageScheduleParsed['dhuha']],
                    ['dzuhr', storageScheduleParsed['dzuhr']],
                    ['ashr', storageScheduleParsed['ashr']],
                    ['maghrib', storageScheduleParsed['maghrib']],
                    ['isha\'', storageScheduleParsed['isha\'']],
                )

            selectedLocationIndex = Number(localStorage.getItem('locationIndex'));
            locationSelector.selectedIndex = selectedLocationIndex;
            prayerScheduleDownloaded = true;
            console.log('Prayer schedule and location loaded from storage.');

        } else {
            console.log('Storage outdated. Updating...');
            getPrayerSchedule();
        }
        
    } catch {
        console.log('Storage empty. Populating...');
        getPrayerSchedule();
    }
}


function formatDate(now) {
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    
    return `${year}-${month}-${day}`;
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
    const amountBetweenMinCurrent = (current + (min * -1));
    const amountBetweenMinMax = max + (min * -1);
    const ones = 100 / (amountBetweenMinMax === 0 ? 1 : amountBetweenMinMax);

    /**
     * Logically, if we just divide 100% with a number, we'll get how
     * many % a one of that number get.
     * 
     * For example, if we divide 100% with 50, we'll get that each 1's
     * of our 50 took each 2% of the 100%
     * 
     * Therefore, we could just multiply how many 1's took of the 100%
     * with a number within our 50 to get the percentage.
     */

    return current === max ? 100 : (ones * amountBetweenMinCurrent);
}