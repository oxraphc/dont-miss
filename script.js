const API_URL = "https://api.myquran.com/v3/sholat/jadwal/d6baf65e0b240ce177cf70da146c8dc8/today"
const clockElem = document.getElementById('clock');
const nextPrayerTimeElem = document.getElementById('next-prayer-time');
const nextPrayerElem = document.getElementById('next-prayer');

let nextPrayerIndex = 0;
const todayPrayerTimes = [];
// 0- Fajr
// 1- Sunrise
// 2- Dzuhr
// 3- Ashr
// 4- Maghrib
// 5- Isha'


// process today's prayer times
async function getPrayerTimes() {
    const now = new Date();
    const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}` // YYYY-MM-DD

    const response = await fetch(API_URL);
    if (response.ok) {
        const jsonResponse = await response.json();
        const jadwal = jsonResponse['data']['jadwal'][date];
        todayPrayerTimes.push(
            ['fajr', jadwal['subuh']],
            ['sunrise', jadwal['terbit']],
            ['dzuhr', jadwal['dzuhur']],
            ['ashr', jadwal['ashar']],
            ['maghrib', jadwal['maghrib']],
            ['isya\'', jadwal['isya']],
        )
    }
}
getPrayerTimes();


// 1 sec loop
setInterval(() => {
    const now = new Date();

    updateClock(now);
    updateNextPrayer(now);
}, 1000);

// 1. Update next prayer
// 2. Calculate delta
// TODO
// 3. Update time bar
// 4. Have "Next prayer" and "Current prayer" with the former ranging 1 hour before adzan 
//    and the latter ~ hour after adzan

function updateClock(now) {
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    clockElem.innerText = `${hours}:${minutes}:${seconds}`;
}


function updateNextPrayer(now) {
    const currentTimeInMinutes = timeToMinutes(now.getHours(), now.getMinutes());
    
    for (let i = 0; i < todayPrayerTimes.length; i++) {
        const t = todayPrayerTimes[i][1].split(':');
        const prayerTimeInMinutes = timeToMinutes(t[0], t[1]);

        if (currentTimeInMinutes < prayerTimeInMinutes) {
            nextPrayerIndex = i;
            nextPrayerTimeElem.innerText = todayPrayerTimes[i][1];
            nextPrayerElem.innerText = capitalize(todayPrayerTimes[i][0]);
            break;
        }
    }
}


function calcTimeDelta(from, to) {
    return to - from;
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