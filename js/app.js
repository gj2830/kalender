// De instelbare kalender — moderne remake
// Alle state leeft in `settings`, wordt bewaard in localStorage en gespiegeld naar de URL-hash zodat
// een link of embed de kalender exact zo laat zien.

const MONTH_NAMES = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];
const DAY_NAMES_MON = ['Ma','Di','Wo','Do','Vr','Za','Zo'];
const DAY_NAMES_SUN = ['Zo','Ma','Di','Wo','Do','Vr','Za'];
const DAY_NAMES_FULL = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];

const DEFAULTS = {
  year: new Date().getFullYear(),
  start: '1',
  months: 12,
  cols: 6,
  weekStart: 1,
  catNational: true,
  catCatholic: false,
  catCommercial: false,
  catRoyal: false,
  catInfo: false,
  ownDays: [],
  showAge: false,
  sort: 'date',
  font: "system-ui, sans-serif",
  fontSize: 1,
  feestSize: 1,
  theme: 'light',
  weekStyle: 'normal',
  weekPos: 'back',
  printInfo: false,
  printTent: false,
  satRed: true,
  sunRed: true,
  todayBorder: true,
  holidayBold: true,
  infoUnder: true,
  weekVertical: false,
  tooltip: true,
};

let settings = loadSettings();

function loadSettings() {
  let s = { ...DEFAULTS };
  try {
    const stored = localStorage.getItem('kalenderSettings');
    if (stored) s = { ...s, ...JSON.parse(stored) };
  } catch (e) {}
  try {
    if (location.hash.length > 1) {
      const fromHash = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
      s = { ...s, ...fromHash };
    }
  } catch (e) {}
  return s;
}

function persist() {
  localStorage.setItem('kalenderSettings', JSON.stringify(settings));
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(settings))));
  history.replaceState(null, '', '#' + encoded);
}

function set(key, value) {
  settings[key] = value;
  persist();
  render();
}

// ---------- UI binding ----------

function bindControls() {
  const el = id => document.getElementById(id);

  el('optYear').value = settings.year;
  el('optYear').addEventListener('input', e => set('year', parseInt(e.target.value) || DEFAULTS.year));

  el('optStart').value = settings.start;
  el('optStart').addEventListener('change', e => set('start', e.target.value));

  el('optMonths').value = settings.months;
  el('monthsVal').textContent = settings.months;
  el('optMonths').addEventListener('input', e => { el('monthsVal').textContent = e.target.value; set('months', parseInt(e.target.value)); });

  el('optCols').value = settings.cols;
  el('colsVal').textContent = settings.cols;
  el('optCols').addEventListener('input', e => { el('colsVal').textContent = e.target.value; set('cols', parseInt(e.target.value)); });

  el('optWeekStart').value = settings.weekStart;
  el('optWeekStart').addEventListener('change', e => set('weekStart', parseInt(e.target.value)));

  ['catNational','catCatholic','catCommercial','catRoyal','catInfo'].forEach(k => {
    el(k).checked = settings[k];
    el(k).addEventListener('change', e => set(k, e.target.checked));
  });

  el('optShowAge').checked = settings.showAge;
  el('optShowAge').addEventListener('change', e => set('showAge', e.target.checked));

  el('optSort').value = settings.sort;
  el('optSort').addEventListener('change', e => set('sort', e.target.value));

  el('optFont').value = settings.font;
  el('optFont').addEventListener('change', e => set('font', e.target.value));

  el('optFontSize').value = settings.fontSize;
  el('sizeVal').textContent = settings.fontSize;
  el('optFontSize').addEventListener('input', e => { el('sizeVal').textContent = e.target.value; set('fontSize', parseInt(e.target.value)); });

  el('optFeestSize').value = settings.feestSize;
  el('sizeFeestVal').textContent = settings.feestSize;
  el('optFeestSize').addEventListener('input', e => { el('sizeFeestVal').textContent = e.target.value; set('feestSize', parseInt(e.target.value)); });

  el('optTheme').value = settings.theme;
  el('optTheme').addEventListener('change', e => set('theme', e.target.value));

  el('optWeekStyle').value = settings.weekStyle;
  el('optWeekStyle').addEventListener('change', e => set('weekStyle', e.target.value));

  el('optWeekPos').value = settings.weekPos;
  el('optWeekPos').addEventListener('change', e => set('weekPos', e.target.value));

  ['satRed','sunRed','todayBorder','holidayBold','infoUnder','weekVertical','tooltip','printInfo','printTent'].forEach(k => {
    const optId = 'opt' + k[0].toUpperCase() + k.slice(1);
    el(optId).checked = settings[k];
    el(optId).addEventListener('change', e => set(k, e.target.checked));
  });

  el('addOwnRow').addEventListener('click', () => {
    settings.ownDays.push({ name: '', date: '', type: 'verjaardag' });
    persist(); renderOwnTable(); render();
  });

  el('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-ui');
  });

  el('settingsToggle').addEventListener('click', () => {
    document.getElementById('panel').classList.toggle('open');
  });

  el('copyLink').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      flashButton(el('copyLink'), '✅ Gekopieerd!');
    } catch (e) { flashButton(el('copyLink'), '⚠️ Kon niet kopiëren'); }
  });

  el('copyEmbed').addEventListener('click', async () => {
    const code = `<iframe src="${location.href}" width="900" height="700" style="border:0"></iframe>`;
    try {
      await navigator.clipboard.writeText(code);
      flashButton(el('copyEmbed'), '✅ Gekopieerd!');
    } catch (e) { flashButton(el('copyEmbed'), '⚠️ Kon niet kopiëren'); }
  });

  el('printBtn').addEventListener('click', () => el('printDialog').showModal());
  el('cancelPrint').addEventListener('click', () => el('printDialog').close());
  el('printDialog').addEventListener('click', e => {
    if (e.target === el('printDialog')) el('printDialog').close(); // klik op de achtergrond sluit de popup
  });
  el('doPrint').addEventListener('click', () => {
    el('printDialog').close();
    window.print();
  });

  el('resetAll').addEventListener('click', () => {
    if (!confirm('Alle instellingen terugzetten naar standaard?')) return;
    settings = { ...DEFAULTS };
    localStorage.removeItem('kalenderSettings');
    history.replaceState(null, '', location.pathname);
    bindControls();
    renderOwnTable();
    render();
  });
}

function flashButton(btn, text) {
  const original = btn.textContent;
  btn.textContent = text;
  setTimeout(() => btn.textContent = original, 1600);
}

function renderOwnTable() {
  const body = document.getElementById('ownTableBody');
  body.innerHTML = '';
  settings.ownDays.forEach((row, i) => {
    const tr = document.createElement('tr');

    const nameTd = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Naam';
    nameInput.value = row.name;
    nameInput.addEventListener('input', e => { row.name = e.target.value; persist(); render(); });
    nameTd.appendChild(nameInput);

    const dateTd = document.createElement('td');
    const dateInput = document.createElement('input');
    dateInput.type = 'text';
    dateInput.placeholder = 'dd-mm-jjjj';
    dateInput.value = row.date;
    dateInput.addEventListener('input', e => { row.date = e.target.value; persist(); render(); });
    dateTd.appendChild(dateInput);

    const typeTd = document.createElement('td');
    const typeSel = document.createElement('select');
    [['verjaardag','Verjaardag'],['naamdag','Naamdag'],['jubileum','Jubileum'],['gedenkdag','Gedenkdag']].forEach(([v,l]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = l;
      if (row.type === v) o.selected = true;
      typeSel.appendChild(o);
    });
    typeSel.addEventListener('change', e => { row.type = e.target.value; persist(); render(); });
    typeTd.appendChild(typeSel);

    const delTd = document.createElement('td');
    const delBtn = document.createElement('button');
    delBtn.textContent = '✕';
    delBtn.className = 'btn-del';
    delBtn.title = 'Verwijderen';
    delBtn.addEventListener('click', () => { settings.ownDays.splice(i, 1); persist(); renderOwnTable(); render(); });
    delTd.appendChild(delBtn);

    tr.append(nameTd, dateTd, typeTd, delTd);
    body.appendChild(tr);
  });
}

// ---------- Datum helpers ----------

function parseOwnDate(str) {
  // dd-mm or dd-mm-jjjj, ook dd/mm(/jjjj) toegestaan
  const m = str.trim().match(/^(\d{1,2})[-\/](\d{1,2})(?:[-\/](\d{2,4}))?$/);
  if (!m) return null;
  const day = parseInt(m[1]), month = parseInt(m[2]);
  const year = m[3] ? parseInt(m[3]) : null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { day, month, year };
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

// ---------- Render ----------

function todayInfo() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const newYear = new Date(now.getFullYear() + 1, 0, 1);
  const nights = Math.ceil((newYear - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  const text = `Het is vandaag ${DAY_NAMES_FULL[now.getDay()]} ${now.getDate()} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()} (${now.toLocaleTimeString('nl-NL')}), de ${dayOfYear}e dag dit jaar. Nog ${nights} overnachtingen tot het ${now.getFullYear()+1} is.`;
  document.getElementById('todayLine').textContent = text;
}

function applyGlobalStyle() {
  const root = document.documentElement;
  root.style.setProperty('--cal-font', settings.font);
  root.style.setProperty('--cal-font-size', (0.75 + settings.fontSize * 0.1) + 'rem');
  root.style.setProperty('--feest-font-size', (0.62 + settings.feestSize * 0.07) + 'rem');
  document.body.dataset.theme = settings.theme;
  document.body.classList.toggle('print-hide-info', !settings.printInfo);
  document.body.classList.toggle('print-tent', settings.printTent);
  applyPrintPageSize();
}

// Staat op liggend wanneer er veel maanden naast elkaar staan (anders past de grid niet
// netjes op staand papier); de tafelkalender blijft staand (2 gestapelde helften).
function applyPrintPageSize() {
  let style = document.getElementById('printPageSizeStyle');
  if (!style) {
    style = document.createElement('style');
    style.id = 'printPageSizeStyle';
    document.head.appendChild(style);
  }
  const landscape = settings.cols >= 4;
  style.textContent = `@media print { @page { size: ${landscape ? 'landscape' : 'portrait'}; margin: 1.2cm; } }`;
}

function buildMonthList() {
  let startYear = settings.year, startMonth;
  const now = new Date();
  if (settings.start === 'now') startMonth = now.getMonth() + 1;
  else if (settings.start === 'prev') {
    startMonth = now.getMonth(); // vorige maand (1-indexed al -1)
    if (startMonth === 0) { startMonth = 12; startYear -= 1; }
  } else startMonth = parseInt(settings.start);

  const list = [];
  let y = startYear, m = startMonth;
  for (let i = 0; i < settings.months; i++) {
    list.push({ year: y, month: m });
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return list;
}

function getAllOwnEventsForDate(year, month, day) {
  const matches = [];
  settings.ownDays.forEach(row => {
    if (!row.name || !row.date) return;
    const parsed = parseOwnDate(row.date);
    if (!parsed) return;
    if (parsed.month === month && parsed.day === day) {
      let label = row.name;
      if (settings.showAge && parsed.year) {
        const age = year - parsed.year;
        if (age >= 0) label += ` (${age})`;
      }
      matches.push({ name: label, type: row.type });
    }
  });
  return matches;
}

function renderMonth(year, month) {
  const holidays = getHolidays(year).filter(h => h.month === month && settings['cat' + capitalize(h.cat)]);
  const holidayMap = new Map();
  holidays.forEach(h => {
    if (!holidayMap.has(h.day)) holidayMap.set(h.day, []);
    holidayMap.get(h.day).push(h.name);
  });

  const card = document.createElement('section');
  card.className = 'month-card';

  const title = document.createElement('h3');
  title.textContent = `${MONTH_NAMES[month-1]} ${year}`;
  card.appendChild(title);

  const table = document.createElement('table');
  table.className = 'month-table';
  if (settings.weekVertical) table.classList.add('week-vertical');

  const dayNames = settings.weekStart === 1 ? DAY_NAMES_MON : DAY_NAMES_SUN;
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const dayThs = dayNames.map(d => {
    const th = document.createElement('th');
    th.textContent = d;
    return th;
  });
  const wkTh = document.createElement('th');
  wkTh.textContent = 'Wk';
  wkTh.className = 'wk-col';
  const headCells = settings.weekPos === 'front' ? [wkTh, ...dayThs] : [...dayThs, wkTh];
  headCells.forEach(th => headRow.appendChild(th));
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const dim = daysInMonth(year, month);
  const firstDate = new Date(year, month - 1, 1);
  let firstDow = firstDate.getDay(); // 0=zo
  let leading = settings.weekStart === 1 ? (firstDow + 6) % 7 : firstDow;

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;

  let cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  while (cells.length < 42) cells.push(null); // altijd 6 weekrijen: gelijke kaarthoogte, geen verspringen

  const allFeestNamesThisMonth = [];

  for (let w = 0; w < cells.length / 7; w++) {
    const tr = document.createElement('tr');
    const weekCells = cells.slice(w * 7, w * 7 + 7);
    let weekHasDay = false;
    const dayTds = weekCells.map((d, idx) => {
      const td = document.createElement('td');
      if (d === null) return td;
      weekHasDay = true;
      const actualDow = settings.weekStart === 1 ? (idx === 6 ? 0 : idx + 1) : idx;

      td.textContent = d;
      td.dataset.day = d;
      const own = getAllOwnEventsForDate(year, month, d);
      const dayHolidays = holidayMap.get(d) || [];
      const allNames = [...dayHolidays, ...own.map(o => o.name)];

      if (dayHolidays.length && settings.holidayBold) td.classList.add('is-holiday');
      if (own.length) td.classList.add('is-own');
      if (settings.satRed && actualDow === 6) td.classList.add('is-weekend');
      if (settings.sunRed && actualDow === 0) td.classList.add('is-weekend');
      if (settings.todayBorder && isCurrentMonth && now.getDate() === d) td.classList.add('is-today');

      if (allNames.length) {
        allFeestNamesThisMonth.push({ day: d, label: allNames.join(', ') });
        if (settings.tooltip) td.title = allNames.join(', ');
        const dot = document.createElement('span');
        dot.className = 'day-dot';
        td.appendChild(dot);

        // hover op de datum licht de bijbehorende regel onderaan de maand op (en andersom)
        td.addEventListener('mouseenter', () => {
          card.querySelectorAll(`.feest-link[data-day="${d}"]`).forEach(s => s.classList.add('is-linked'));
        });
        td.addEventListener('mouseleave', () => {
          card.querySelectorAll(`.feest-link[data-day="${d}"]`).forEach(s => s.classList.remove('is-linked'));
        });
      }

      return td;
    });
    const wkTd = document.createElement('td');
    wkTd.className = 'wk-col ' + 'wk-' + settings.weekStyle;
    if (weekHasDay) {
      const firstDayInWeek = weekCells.find(d => d !== null) || 1;
      wkTd.textContent = isoWeekNumber(new Date(year, month - 1, firstDayInWeek));
    }
    const rowCells = settings.weekPos === 'front' ? [wkTd, ...dayTds] : [...dayTds, wkTd];
    rowCells.forEach(td => tr.appendChild(td));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  card.appendChild(table);

  if (settings.infoUnder && allFeestNamesThisMonth.length) {
    const info = document.createElement('p');
    info.className = 'month-info';
    allFeestNamesThisMonth.forEach((item, idx) => {
      if (idx > 0) info.appendChild(document.createTextNode(' · '));
      const span = document.createElement('span');
      span.className = 'feest-link';
      span.dataset.day = item.day;
      span.textContent = `${item.label}(${item.day})`;
      span.addEventListener('mouseenter', () => {
        const cell = card.querySelector(`td[data-day="${item.day}"]`);
        if (cell) cell.classList.add('highlight-day');
      });
      span.addEventListener('mouseleave', () => {
        const cell = card.querySelector(`td[data-day="${item.day}"]`);
        if (cell) cell.classList.remove('highlight-day');
      });
      info.appendChild(span);
    });
    card.appendChild(info);
  }

  return card;
}

function capitalize(s) { return s[0].toUpperCase() + s.slice(1); }

function render() {
  applyGlobalStyle();
  const root = document.getElementById('calendarRoot');
  root.innerHTML = '';
  root.style.setProperty('--cols', settings.cols);
  const months = buildMonthList();
  months.forEach(({ year, month }) => root.appendChild(renderMonth(year, month)));
  buildTentRoot(months);
}

// Tafelkalender voor printen: net als op het scherm staan er "Maanden naast elkaar"
// maandparen naast elkaar op één vel. Elke kolom is 1 paar: boven ondersteboven,
// onder rechtop — na uitknippen en vouwen op de stippellijn staat 'm als leesbaar tentje.
function buildTentRoot(months) {
  const old = document.getElementById('tentRoot');
  if (old) old.remove();
  if (!settings.printTent) return;

  const root = document.createElement('div');
  root.id = 'tentRoot';
  root.className = 'tent-root';

  const colsPerSheet = Math.max(1, settings.cols);
  const monthsPerSheet = colsPerSheet * 2;

  for (let s = 0; s < months.length; s += monthsPerSheet) {
    const chunk = months.slice(s, s + monthsPerSheet);
    const sheet = document.createElement('div');
    sheet.className = 'tent-sheet';

    // boven- en onderhelften zijn 2 losse doorlopende rijen, met 1 vouwlijn die over
    // de hele breedte recht doorloopt (i.p.v. per kolom een eigen, scheve vouwlijn)
    const topRow = document.createElement('div');
    topRow.className = 'tent-row';
    topRow.style.setProperty('--tent-cols', colsPerSheet);

    const bottomRow = document.createElement('div');
    bottomRow.className = 'tent-row';
    bottomRow.style.setProperty('--tent-cols', colsPerSheet);

    for (let c = 0; c < colsPerSheet; c++) {
      const top = chunk[c * 2];
      const bottom = chunk[c * 2 + 1];
      if (!top && !bottom) break; // geen maanden meer over voor deze kolom

      const topHalf = document.createElement('div');
      topHalf.className = 'tent-half tent-half--rotated';
      if (top) topHalf.appendChild(renderMonth(top.year, top.month));
      topRow.appendChild(topHalf);

      const bottomHalf = document.createElement('div');
      bottomHalf.className = 'tent-half';
      if (bottom) bottomHalf.appendChild(renderMonth(bottom.year, bottom.month));
      bottomRow.appendChild(bottomHalf);
    }

    const fold = document.createElement('div');
    fold.className = 'tent-fold';

    sheet.append(topRow, fold, bottomRow);
    root.appendChild(sheet);
  }

  document.body.appendChild(root);
}

// ---------- init ----------

function init() {
  todayInfo();
  setInterval(todayInfo, 30000);
  bindControls();
  renderOwnTable();
  render();
}

document.addEventListener('DOMContentLoaded', init);
