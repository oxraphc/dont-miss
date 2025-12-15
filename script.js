const BASE_API_URL = "https://api.myquran.com/v3/sholat/jadwal/d6baf65e0b240ce177cf70da146c8dc8/"
const clockElem = document.getElementById('clock');
const nextPrayerTimeElem = document.getElementById('next-prayer-time');
const nextPrayerElem = document.getElementById('next-prayer');

let nextPrayerIndex = undefined;
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
    const now = new Date();
    const todayDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}` // YYYY-MM-DD
    
    now.setDate(now.getDate() - 1); // Rewind date by 1 day
    const yesterdayDate = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}` // YYYY-MM-DD

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
}
getPrayerSchedule();


// 1 sec loop
setInterval(() => {
    const now = new Date();

    updateClock(now);
    updateNextPrayerIndex(now);
    calcTimeUntilNextPrayer(now);
}, 1000);

// 1. Update next prayer
// 2. Calculate delta
// TODO
// 3. Have "Next prayer" and "Current prayer" with the former ranging 1 hour before adzan 
//    and the latter ∞ hour after adzan
// 4. Update time bar

function updateClock(now) {
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    clockElem.innerText = `${hours}:${minutes}:${seconds}`;
}


function updateNextPrayerIndex(now) {
    const currentTimeInMinutes = timeToMinutes(now.getHours(), now.getMinutes());

    for (let i = 0; i < prayerSchedule.length; i++) {
        const t = prayerSchedule[i][1].split(':');
        const prayerTimeInMinutes = timeToMinutes(t[0], t[1]);
        const timeDelta = prayerTimeInMinutes - currentTimeInMinutes;

        if (timeDelta > 0 && timeDelta < 30) {
            nextPrayerIndex = i;
            break;
        }

        // When the page was first opened, nextPrayerIndex would be undefined.
        // So just find the next prayer index, ignore the condition of <30mins.
        if (nextPrayerIndex === undefined) {
            if (currentTimeInMinutes < prayerTimeInMinutes) {
                nextPrayerIndex = i;
                break;
            }
        }
    }
}


function calcTimeUntilNextPrayer(now) {
    const currentTimeInMinutes = timeToMinutes(now.getHours(), now.getMinutes());

    const t = prayerSchedule[nextPrayerIndex][1].split(':');
    const prayerTimeInMinutes = timeToMinutes(t[0], t[1]);

    nextPrayerTimeDelta = prayerTimeInMinutes - currentTimeInMinutes;
}


function formatMinutes(minutes) {
    if (!minutes) {
        return '0m';
    }

    const m = minutes % 60;
    const h = (minutes - m) / 60;
    let s = [];

    if (h > 0) {
        s.push(`${h}h`);
    }
    if (m > 0) {
        s.push(`${m}m`);
    }

    return s.join(' ');
}


function timeToMinutes(hours, minutes) {
    return Number(hours) * 60 + Number(minutes);
}


function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1, str.length);
}