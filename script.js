const API_URL = "https://api.myquran.com/v3/sholat/jadwal/d6baf65e0b240ce177cf70da146c8dc8/today"
const clockElem = document.getElementById('clock');

let todayTimes = [];
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
        todayTimes.push(
            jadwal['subuh'],
            jadwal['terbit'],
            jadwal['dzuhur'],
            jadwal['ashar'],
            jadwal['maghrib'],
            jadwal['isya']
        )
    }
}
getPrayerTimes();


// update clock
setInterval(() => {
    const now = new Date();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');
    clockElem.innerText = `${hours}:${minutes}:${seconds}`;
}, 1000);

// TODO
// 1. Update next prayer
// 2. Calculate delta
// 3. Update time bar