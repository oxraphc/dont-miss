import { loadLanguage, language } from './locale.js';

const API_BASE_URL = 'https://api.myquran.com/v3/sholat/jadwal/';
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
const progressBarMarkerLabelMin = document.getElementById('progress-bar-marker-min');
const progressBarMarkerLabelMax = document.getElementById('progress-bar-marker-max');
const nextPreviousButtonContainer = document.getElementById('next-previous-button-container');
const nextPreviousButton = document.getElementById('next-previous-button');
const openPreferencesButton = document.getElementById('preferences-button');
const closePreferencesButton = document.getElementById('close-pref-menu');
const preferencesMenuScreen = document.getElementById('preferences-menu-screen');
const locationSelector = document.getElementById('location');
const languageSelector = document.getElementById('lang');
const themeSelector = document.getElementById('theme');
const locationLoaderAnimElem = document.getElementById('location-loader');
const langLoaderAnimElem = document.getElementById('lang-loader');
const themeLoaderAnimElem = document.getElementById('theme-loader');
// const delayLoaderAnimElem = document.getElementById('delay-loader');
// const detailedTextsModeLoaderAnimElem = document.getElementById('detailed-texts-mode-loader');
// const showIconsLoaderAnimElem = document.getElementById('show-icons-loader');


let prayerIndexSkipped = false;
let savedDate = new Date().getDate();
let prayerScheduleDownloaded = false;
let prayerIndex;
let prayerTimeDelta = 0;
let selectedLocationIndex = 0;
let deltaTimeThresholdInUse = TIME_DELTA_THRESHOLD;
const prayerSchedule = [];
// Table array, each row goes like: ['<prayer_name>', '<prayer_time>']
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
    console.log('Fetching new schedule...');
    prayerIndexSkipped = false;
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
            );
        } else {
            throw new Error(`Failed to fetch yesterday prayer schedule (Code ${response.status})`);
        }
    } catch (e) {
        console.error(e);
        showErrorToUser(e);
        return;
    }

    // Fetch and parse today's schedule
    try {
        const response = await fetch(API_BASE_URL + useLocationID + '/' + 'today');
        if (response.ok) {
            const jsonResponse = await response.json();
            const jadwal = jsonResponse['data']['jadwal'][todayDate];
            prayerSchedule.push(
                ['prayerFajr', jadwal['subuh']],
                ['prayerSunrise', jadwal['terbit']],
                ['prayerDhuha', jadwal['dhuha']],
                ['prayerDzuhr', jadwal['dzuhur']],
                ['prayerAshr', jadwal['ashar']],
                ['prayerMaghrib', jadwal['maghrib']],
                ['prayerIsha', jadwal['isya']]
            );
        } else {
            throw new Error(`Failed to fetch today prayer schedule (Code ${response.status})`);
        }
    } catch (e) {
        console.error(e);
        showErrorToUser(e);
        return;
    }

    prayerScheduleDownloaded = true;
    storeSchedule();
    locationLoaderAnimElem.classList.add('hidden');
    console.log('New schedule fetched, parsed, and stored.');
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
// console.log('Debug mode active!')
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
    if (prayerIndexSkipped) {
        return;
    }

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
    const t = prayerTime.split(':'); // ['<hours>', '<minutes>']
    const prayerTimeInMinutes = timeToMinutes(t[0], t[1]);

    if (prayerIndex === 0) {
        prayerTimeDelta = prayerTimeInMinutes - (1440 + currentTimeInMinutes); // 1440 = 24h in minutes
    } else {
        prayerTimeDelta = prayerTimeInMinutes - currentTimeInMinutes;
    }

    if (prayerTimeDelta <= 30) prayerIndexSkipped = false; // Release prayerIndex update latch
}


function updateView() {
    prayerNameElem.innerText = prayerIndex === 0 ? language.prayerIsha : language[prayerSchedule[prayerIndex][0]];
    prayerTimeElem.innerText = prayerSchedule[prayerIndex][1];

    updateDeltaTimeThresholdInUse();
    progressBarMarkerLabelMin.innerText = `-${deltaTimeThresholdInUse} ${language.progressBarMin}`;
    progressBarMarkerLabelMax.innerText = `+${deltaTimeThresholdInUse} ${language.progressBarMin}`;

    updateTitle();
    updateDeltaTimeLabel();
    updateProgressBar();
    updateNextPreviousButton();
}


function updateTitle() {
    if (prayerTimeDelta > 0) {
        titleElem.innerText = (prayerIndex === 2) ? language.titleUpcoming : language.titleNextPrayer;
    } else if (prayerTimeDelta <= 0) {
        titleElem.innerText = (prayerIndex === 2) ? language.titleCurrently : language.titleCurrentPrayer;
    }
}


function updateDeltaTimeLabel() {
    if (prayerTimeDelta <= ((deltaTimeThresholdInUse + 1) * -1)) {
        deltaTimeElem.innerHTML = '<br><br>' + formatMinutes(prayerTimeDelta) + ' ▶';
    } else if (prayerTimeDelta >= (deltaTimeThresholdInUse + 1)) {
        deltaTimeElem.innerHTML = '<br><br>' + '◀ ' + formatMinutes(prayerTimeDelta);
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
    // Get progress bar label container offset
    const containerComputedStyle = window.getComputedStyle(deltaTimeContainer);
    let containerOffset = (parseInt(containerComputedStyle.width, 10) / 2) + 2;
    let centerOffset = -1.2; // Properly center the progress's bar marker when hitting the 50% mark

    if (prayerTimeDelta < (deltaTimeThresholdInUse * -1)) {
        // Omit all offset if progress > 100%
        progressMarkerLabelContainer.classList.replace('container-align-start', 'container-align-end');
        centerOffset = 0;
        containerOffset = 0;
    } else if (prayerTimeDelta > deltaTimeThresholdInUse) {
        // Omit all offset if progress < 0%
        progressMarkerLabelContainer.classList.replace('container-align-end', 'container-align-start');
        centerOffset = 0;
        containerOffset = 0;
    } else {
        // Default
        progressMarkerLabelContainer.classList.replace('container-align-start', 'container-align-end');
    }

    // Update progress bar and label position
    const progress = getPrayerTimeDeltaPercent();
    progressBar.style.width = `calc(${(progress < 0) ? 0 : progress}% + ${centerOffset}px)`;
    progressMarkerLabelContainer.style.width = `calc(${(progress < 0) ? 100 : progress}% + ${containerOffset}px + ${centerOffset}px)`;
}


function resetView() {
    titleElem.innerText = 'ㅤ';
    prayerNameElem.innerText = 'ㅤ';
    prayerTimeElem.innerText = language.miscFetchingSchedule;
    deltaTimeElem.innerText = '';
    progressBar.style.width = '0';
    progressMarkerLabelContainer.style.width = '0';
    nextPreviousButtonContainer.classList.add('hidden');
    progressBarMarkerLabelMin.innerText = '';
    progressBarMarkerLabelMax.innerText = '';
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


function storeSchedule() {
    const schedule = Object.fromEntries(prayerSchedule);
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('lastUpdate', formatDate(new Date()));
    console.log('Schedule stored.');
}


function retrieveStorage() {
    retrieveStoredPreferences();
    retrieveStoredSchedule();
}


function retrieveStoredPreferences() {
    const storageLocationIndex = localStorage.getItem('locationIndex');
    const storageLanguage = localStorage.getItem('language');
    const storageTheme = localStorage.getItem('theme');

    if (!storageLocationIndex) {
        localStorage.setItem('locationIndex', selectedLocationIndex);
    }
    selectedLocationIndex = Number(localStorage.getItem('locationIndex'));
    locationSelector.selectedIndex = selectedLocationIndex;

    if (!storageLanguage) {
        localStorage.setItem('language', 'en');
    }
    languageSelector.value = localStorage.getItem('language');
    loadLanguage(languageSelector.value);

    if (!storageTheme) {
        localStorage.setItem('theme', 'light');
    }
    themeSelector.value = localStorage.getItem('theme');
    changeTheme(themeSelector.value);
}


function retrieveStoredSchedule() {
    let storageSchedule;
    let storageLastUpdate;

    try {
        storageSchedule = localStorage.getItem('schedule');
        storageLastUpdate = localStorage.getItem('lastUpdate');

        if (!(storageSchedule && storageLastUpdate)) {
            throw new Error();
        }
        console.log('Stored schedule found.'); // found if reaches here.

        if (storageLastUpdate === formatDate(new Date())) {
            const storageScheduleParsed = JSON.parse(localStorage.getItem('schedule'));
            prayerSchedule.push(
                ['isha\' (yesterday)', storageScheduleParsed['isha\' (yesterday)']],
                ['prayerFajr', storageScheduleParsed['prayerFajr']],
                ['prayerSunrise', storageScheduleParsed['prayerSunrise']],
                ['prayerDhuha', storageScheduleParsed['prayerDhuha']],
                ['prayerDzuhr', storageScheduleParsed['prayerDzuhr']],
                ['prayerAshr', storageScheduleParsed['prayerAshr']],
                ['prayerMaghrib', storageScheduleParsed['prayerMaghrib']],
                ['prayerIsha', storageScheduleParsed['prayerIsha']]
            );

            prayerScheduleDownloaded = true;
            console.log('Prayer schedule loaded from storage.');
        } else {
            console.log('Stored schedule outdated. Updating...');
            getPrayerSchedule();
        }
    } catch {
        console.log('No stored schedule found. Fetching...');
        getPrayerSchedule();
    }
}


function showErrorToUser(error) {
    const errorMsg = document.createElement('p');
    errorMsg.innerText = error + '\n' + language.errorTryRefresh;
    errorMsg.style.color = 'red';
    errorMsg.style.margin = '10px';
    document.body.appendChild(errorMsg);
}


nextPreviousButton.addEventListener('click', () => {
    const buttonMode = nextPreviousButton.dataset.mode;

    if (buttonMode === 'next') {
        prayerIndexSkipped = true;
        prayerIndex++;
    } else if (buttonMode === 'previous') {
        prayerIndexSkipped = false;
    }
});


function updateNextPreviousButton() {
    if (prayerTimeDelta <= ((deltaTimeThresholdInUse + 1) * -1)) {
        if (prayerIndex !== 7) {
            nextPreviousButtonContainer.classList.remove('hidden');
            nextPreviousButton.innerText = (prayerIndex === 1) ? language.nextPreviousButtonUpcoming : language.nextPreviousButtonNextPrayer;
            nextPreviousButton.dataset.mode = 'next';
        }
    } else if (prayerTimeDelta >= (deltaTimeThresholdInUse + 1)) {
        nextPreviousButtonContainer.classList.remove('hidden');
        nextPreviousButton.innerText = (prayerIndex === 3) ? language.nextPreviousButtonCurrently : language.nextPreviousButtonCurrentPrayer;
        nextPreviousButton.dataset.mode = 'previous';
    } else {
        nextPreviousButtonContainer.classList.add('hidden');
    }
}


openPreferencesButton.addEventListener('click', () => {
    preferencesMenuScreen.classList.add('shown');
    preferencesMenuScreen.classList.remove('hidden');
});


closePreferencesButton.addEventListener('click', () => {
    preferencesMenuScreen.classList.remove('shown');
    preferencesMenuScreen.classList.add('hidden');
});


locationSelector.addEventListener('change', () => {
    locationLoaderAnimElem.classList.remove('hidden');
    selectedLocationIndex = locationSelector.selectedIndex;
    localStorage.setItem('locationIndex', selectedLocationIndex);
    console.log(`Location changed to ${locationSelector.value}`);
    getPrayerSchedule();
});


languageSelector.addEventListener('change', () => {
    langLoaderAnimElem.classList.remove('hidden');
    loadLanguage(languageSelector.value);
    console.log(`Language changed to ${languageSelector.value}`);
    localStorage.setItem('language', languageSelector.value);

    // Effect's purely for UX
    setTimeout(() => {
        langLoaderAnimElem.classList.add('hidden');
    }, 200);
});


themeSelector.addEventListener('change', () => {
    themeLoaderAnimElem.classList.remove('hidden');
    changeTheme(themeSelector.value);
    localStorage.setItem('theme', themeSelector.value);

    // Effect's purely for UX
    setTimeout(() => {
        themeLoaderAnimElem.classList.add('hidden');
    }, 200);
});


function changeTheme(theme) {
    switch (theme) {
        case 'light':
            document.body.classList.remove('dark');
            document.getElementById('logo').classList.remove('dark');
            break;
        case 'dark':
            document.body.classList.add('dark');
            document.getElementById('logo').classList.add('dark');
            break;
    }
}


function formatDate(now) {
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
}


function formatMinutes(minutes) {
    if (!minutes) {
        return language.progressBarNow;
    }

    const m = Math.abs(minutes) % 60;
    const h = (Math.abs(minutes) - m) / 60;
    let prefix = '-';
    const s = [];

    if (minutes < 0) {
        prefix = '+';
    }

    if (h > 0) {
        s.push(`${h} ${language.progressBarHr}`);
    }

    if (m > 0) {
        s.push(`${m} ${language.progressBarMin}`);
    }

    return prefix + s.join(' ');
}


function timeToMinutes(hours, minutes) {
    return Number(hours) * 60 + Number(minutes);
}


function rangePercent(min, current, max) {
    const amountBetweenMinCurrent = (current + (min * -1));
    const amountBetweenMinMax = max + (min * -1);
    const ones = 100 / (amountBetweenMinMax === 0 ? 1 : amountBetweenMinMax);

    return current === max ? 100 : (ones * amountBetweenMinCurrent);
}