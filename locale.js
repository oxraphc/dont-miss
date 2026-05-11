export let language;

export function loadLanguage(lang) {
    switch (lang) {
        case 'en':
            language = english;
            break;
    }

    // Change HTML side texts
    document.getElementById('locale-preferences-title').innerText = language.preferencesTitle;
    document.getElementById('locale-preferences-option-location').innerText = language.preferencesOptionLocation;
    document.getElementById('locale-preferences-option-language').innerText = language.preferencesOptionLanguage;
    document.getElementById('locale-preferences-option-theme').innerText = language.preferencesOptionTheme;
    document.getElementById('locale-preferences-option-prayer-time-adjustment').innerText = language.preferencesOptionPrayerTimeAdjustment;
    document.getElementById('locale-preferences-option-detailed-texts').innerText = language.preferencesOptionDetailedTexts;
    document.getElementById('locale-preferences-option-icons').innerText = language.preferencesOptionIcons;
    document.getElementById('locale-preferences-theme-light').text = language.preferencesThemeLight;
    document.getElementById('locale-preferences-theme-dark').text = language.preferencesThemeDark;
    document.getElementById('locale-preferences-prayer-time-adjustment-neg-5').text = language.preferencesPrayerTimeAdjustmentNeg5;
    document.getElementById('locale-preferences-prayer-time-adjustment-neg-4').text = language.preferencesPrayerTimeAdjustmentNeg4;
    document.getElementById('locale-preferences-prayer-time-adjustment-neg-3').text = language.preferencesPrayerTimeAdjustmentNeg3;
    document.getElementById('locale-preferences-prayer-time-adjustment-neg-2').text = language.preferencesPrayerTimeAdjustmentNeg2;
    document.getElementById('locale-preferences-prayer-time-adjustment-neg-1').text = language.preferencesPrayerTimeAdjustmentNeg1;
    document.getElementById('locale-preferences-prayer-time-adjustment-zero').text = language.preferencesPrayerTimeAdjustmentZero;
    document.getElementById('locale-preferences-prayer-time-adjustment-pos-1').text = language.preferencesPrayerTimeAdjustmentPos1;
    document.getElementById('locale-preferences-prayer-time-adjustment-pos-2').text = language.preferencesPrayerTimeAdjustmentPos2;
    document.getElementById('locale-preferences-prayer-time-adjustment-pos-3').text = language.preferencesPrayerTimeAdjustmentPos3;
    document.getElementById('locale-preferences-prayer-time-adjustment-pos-4').text = language.preferencesPrayerTimeAdjustmentPos4;
    document.getElementById('locale-preferences-prayer-time-adjustment-pos-5').text = language.preferencesPrayerTimeAdjustmentPos5;
    document.getElementById('locale-preferences-detailed-texts-enabled').innerHTML = `<input type="checkbox" id="detailed-texts-mode"> ${language.preferencesEnabled}`;
    document.getElementById('locale-preferences-icons-enabled').innerHTML = `<input type="checkbox" id="show-icons"> ${language.preferencesEnabled}`;
}

const english = {
    miscFetchingSchedule: 'Fetching Schedule...',
    errorTryRefresh: 'Try refreshing.',
    prayerFajr: 'Fajr',
    prayerSunrise: 'Sunrise',
    prayerDhuha: 'Dhuha',
    prayerDzuhr: 'Dzuhr',
    prayerAshr: 'Ashr',
    prayerMaghrib: 'Maghrib',
    prayerIsha: 'Isha\'',
    progressBarMin: 'min',
    progressBarHr: 'hr',
    progressBarNow: 'Now',
    titleUpcoming: 'Upcoming',
    titleNextPrayer: 'Next prayer :',
    titleCurrently: 'Currently :',
    titleCurrentPrayer: 'Current prayer :',
    nextPreviousButtonUpcoming: 'Upcoming ▶',
    nextPreviousButtonNextPrayer: 'Next prayer ▶',
    nextPreviousButtonCurrently: '◀ Currently',
    nextPreviousButtonCurrentPrayer: '◀ Current prayer',
    preferencesTitle: 'Preferences',
    preferencesOptionLocation: 'Location',
    preferencesOptionLanguage: 'Language',
    preferencesOptionTheme: 'Theme',
    preferencesOptionPrayerTimeAdjustment: 'Prayer Time Adjustment',
    preferencesOptionDetailedTexts: 'Detailed Texts',
    preferencesOptionIcons: 'Icons',
    preferencesThemeLight: 'Dzuhr Light',
    preferencesThemeDark: 'Tahajjud Dark',
    preferencesPrayerTimeAdjustmentNeg5: '-5 min earlier',
    preferencesPrayerTimeAdjustmentNeg4: '-4 min earlier',
    preferencesPrayerTimeAdjustmentNeg3: '-3 min earlier',
    preferencesPrayerTimeAdjustmentNeg2: '-2 min earlier',
    preferencesPrayerTimeAdjustmentNeg1: '-1 min earlier',
    preferencesPrayerTimeAdjustmentZero: 'No adjustment',
    preferencesPrayerTimeAdjustmentPos1: '+1 min later',
    preferencesPrayerTimeAdjustmentPos2: '+2 min later',
    preferencesPrayerTimeAdjustmentPos3: '+3 min later',
    preferencesPrayerTimeAdjustmentPos4: '+4 min later',
    preferencesPrayerTimeAdjustmentPos5: '+5 min later',
    preferencesEnabled: 'Enabled'
};