// Berekening van Nederlandse feest- en gedenkdagen per jaar.
// Elke dag heeft: { month, day, name, cat } met cat in national|catholic|commercial|royal|info

function easterSunday(year) {
  // Meeus/Jones/Butcher algoritme
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// n-de weekdag (0=zo..6=za) van een maand; n=1 is de eerste
function nthWeekdayOfMonth(year, month, weekday, n) {
  const first = new Date(year, month - 1, 1);
  let offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  return new Date(year, month - 1, day);
}

function lastWeekdayOfMonth(year, month, weekday) {
  const last = new Date(year, month, 0); // laatste dag vorige maand-trick -> laatste dag van `month`
  let offset = (last.getDay() - weekday + 7) % 7;
  return addDays(last, -offset);
}

function md(date) {
  return { month: date.getMonth() + 1, day: date.getDate() };
}

function getHolidays(year) {
  const easter = easterSunday(year);
  const list = [];

  const push = (date, name, cat) => list.push({ ...md(date), name, cat });
  const pushFixed = (month, day, name, cat) => list.push({ month, day, name, cat });

  // Nationaal
  pushFixed(1, 1, 'Nieuwjaarsdag', 'national');
  push(easter, '1e Paasdag', 'national');
  push(addDays(easter, 1), '2e Paasdag', 'national');
  {
    // Koningsdag: 27 april, maar als dat een zondag is dan 26 april
    const kd = new Date(year, 3, 27);
    if (kd.getDay() === 0) kd.setDate(26);
    push(kd, 'Koningsdag', 'national');
  }
  pushFixed(5, 4, 'Dodenherdenking', 'national');
  pushFixed(5, 5, 'Bevrijdingsdag', 'national');
  push(addDays(easter, 39), 'Hemelvaartsdag', 'national');
  push(addDays(easter, 49), '1e Pinksterdag', 'national');
  push(addDays(easter, 50), '2e Pinksterdag', 'national');
  push(nthWeekdayOfMonth(year, 5, 0, 2), 'Moederdag', 'national');
  push(nthWeekdayOfMonth(year, 6, 0, 3), 'Vaderdag', 'national');
  push(nthWeekdayOfMonth(year, 9, 2, 3), 'Prinsjesdag', 'national');
  pushFixed(10, 3, 'Leidens Ontzet', 'national');
  pushFixed(8, 28, 'Gronings Ontzet', 'national');
  pushFixed(12, 25, '1e Kerstdag', 'national');
  pushFixed(12, 26, '2e Kerstdag', 'national');
  pushFixed(12, 31, 'Oudjaarsdag', 'national');

  // Katholiek
  pushFixed(1, 6, 'Driekoningen', 'catholic');
  push(addDays(easter, -46), 'Aswoensdag', 'catholic');
  push(addDays(easter, -3), 'Witte Donderdag', 'catholic');
  push(addDays(easter, -2), 'Goede Vrijdag', 'catholic');
  pushFixed(8, 15, 'Maria-Tenhemelopneming', 'catholic');
  pushFixed(11, 1, 'Allerheiligen', 'catholic');
  pushFixed(11, 2, 'Allerzielen', 'catholic');
  pushFixed(12, 8, 'Maria Onbevlekte Ontvangenis', 'catholic');

  // Commercieel
  pushFixed(2, 14, 'Valentijnsdag', 'commercial');
  pushFixed(3, 8, 'Internationale Vrouwendag', 'commercial');
  pushFixed(10, 4, 'Dierendag', 'commercial');
  pushFixed(10, 31, 'Halloween', 'commercial');
  pushFixed(11, 11, 'Sint Maarten', 'commercial');
  push(nthWeekdayOfMonth(year, 11, 5, 4), 'Black Friday', 'commercial');
  pushFixed(12, 5, 'Pakjesavond', 'commercial');
  pushFixed(12, 6, 'Sint Nicolaas', 'commercial');

  // Koninklijke familie (geboortedata)
  pushFixed(1, 31, 'Prinses Beatrix jarig', 'royal');
  pushFixed(4, 10, 'Prinses Ariane jarig', 'royal');
  pushFixed(4, 27, 'Koning Willem-Alexander jarig', 'royal');
  pushFixed(5, 17, 'Koningin Máxima jarig', 'royal');
  pushFixed(6, 26, 'Prinses Alexia jarig', 'royal');
  pushFixed(12, 7, 'Prinses Amalia jarig', 'royal');

  // Info
  push(lastWeekdayOfMonth(year, 3, 0), 'Zomertijd begint', 'info');
  push(lastWeekdayOfMonth(year, 10, 0), 'Wintertijd begint (klok terug)', 'info');

  return list;
}

function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = (d.getUTCDay() + 6) % 7; // 0 = maandag
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const diff = d - firstThursday;
  return 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
}
