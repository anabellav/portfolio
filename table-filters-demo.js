// Figma 189:4577: older column filters. Sample records are local demonstration data.
const records = [
  { id: 'workforce', name: 'Workforce Size and Cost Overview', updated: '2026-10-03' },
  { id: 'headcount', name: 'Headcount Summary', updated: '2026-09-29' },
  { id: 'landscape', name: 'Functional Landscape (Drill-Down)', updated: '2026-09-20' },
{ id: 'cost', name: 'Functional Workforce Cost Detail', updated: '2026-08-12' },
{ id: 'hiring', name: 'Hiring Plan and Open Positions', updated: '2026-08-05' },
{ id: 'structure', name: 'Organisation Structure Overview', updated: '2026-07-28' },
{ id: 'compensation', name: 'Compensation and Benefits Summary', updated: '2026-07-16' },
{ id: 'capacity', name: 'Team Capacity and Allocation', updated: '2026-07-03' }
];
const $ = selector => document.querySelector(selector);
const card = $('.demo-card');
const popover = $('#filter-popover');
const calendar = $('#calendar');
const rows = $('#dataset-rows');
const search = $('#filter-search');
const from = $('#filter-from');
const to = $('#filter-to');
const apply = $('#filter-apply');
const reset = $('#filter-reset');
const selectAll = $('#select-all');
const EMPTY = () => ({ name: '', updated: '', from: '', to: '' });
const format = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DEMO_TODAY = '2026-10-03'; // Stable across recordings, matching the newest example record.
let applied = EMPTY();
let draft = EMPTY();
let openColumn = null;
let dateField = null;
let viewYear = 2026;
let viewMonth = 8;
let calendarMode = 'date';
let sort = null;
let visible = [...records];
const selected = new Set();

function iso(date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`; }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && iso(new Date(`${value}T00:00:00Z`)) === value; }
function matches(record) {
  return record.name.toLowerCase().includes(applied.name.toLowerCase()) &&
    `${record.updated} ${format.format(new Date(`${record.updated}T00:00:00Z`))}`.toLowerCase().includes(applied.updated.toLowerCase()) &&
    (!applied.from || record.updated >= applied.from) && (!applied.to || record.updated <= applied.to);
}
function renderRows() {
  visible = records.filter(matches);
  if (sort) visible.sort((a, b) => a[sort.key].localeCompare(b[sort.key]) * sort.direction);
  rows.replaceChildren();
  for (const record of visible) {
    const tr = document.createElement('tr');
    tr.dataset.id = record.id;
    const nameCell = document.createElement('td');
    const content = document.createElement('div'); content.className = 'dataset-cell';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selected.has(record.id); checkbox.setAttribute('aria-label', `Select ${record.name}`);
    checkbox.addEventListener('change', () => { checkbox.checked ? selected.add(record.id) : selected.delete(record.id); syncSelectAll(); });
    const name = document.createElement('span'); name.className = 'dataset-name'; name.textContent = record.name; name.title = record.name;
    content.append(checkbox, name); nameCell.append(content);
    const dateCell = document.createElement('td'); dateCell.textContent = format.format(new Date(`${record.updated}T00:00:00Z`));
    tr.append(nameCell, dateCell); rows.append(tr);
  }
  if (!visible.length) {
    const tr = document.createElement('tr'); tr.className = 'empty-row';
    const td = document.createElement('td'); td.colSpan = 2; td.textContent = 'No results found'; tr.append(td); rows.append(tr);
  }
  $('#result-status').textContent = `${visible.length} ${visible.length === 1 ? 'dataset' : 'datasets'} shown`;
  syncSelectAll(); syncIcons();
}
function syncSelectAll() {
  const count = visible.filter(record => selected.has(record.id)).length;
  selectAll.checked = !!visible.length && count === visible.length;
  selectAll.indeterminate = count > 0 && count < visible.length;
  selectAll.disabled = !visible.length;
}
function syncIcons() {
  document.querySelectorAll('.filter-trigger').forEach(button => {
    const key = button.dataset.filter;
    const active = openColumn === key || (key === 'name' ? !!applied.name : !!(applied.updated || applied.from || applied.to));
    button.dataset.active = String(active);
    button.setAttribute('aria-expanded', String(openColumn === key));
    button.querySelector('img').src = `assets/table-filters-demo/${active ? 'IconFilterSearch3' : key === 'updated' ? 'IconFilterSearch1' : 'IconFilterSearch'}.svg`;
  });
}
function closeCalendar(restoreFocus = false) {
  const previous = dateField;
  calendar.hidden = true; dateField = null;
  document.querySelectorAll('[data-calendar]').forEach(button => button.setAttribute('aria-expanded', 'false'));
  document.querySelectorAll('.date-field').forEach(field => field.classList.remove('is-open'));
  if (restoreFocus && previous) $(`#filter-${previous}`).focus({ preventScroll: true });
}
function closePopover(restoreFocus = true) {
  const previous = openColumn;
  closeCalendar(); popover.hidden = true; openColumn = null; syncIcons();
  if (restoreFocus && previous) $(`[data-filter='${previous}']`).focus({ preventScroll: true });
}
function openPopover(column) {
  if (openColumn === column) return closePopover();
  closeCalendar(); openColumn = column; draft = { ...applied };
  popover.hidden = false;
  popover.setAttribute('aria-label', `Filter ${column === 'name' ? 'Dataset' : 'Updated'}`);
  search.setAttribute('aria-label', column === 'updated' ? 'Search updated dates' : 'Search datasets');
  search.value = draft[column]; from.value = draft.from; to.value = draft.to;
  $('#date-fields').hidden = column === 'name';
  // Both column menus use the same anchored visual style; only the date menu is specified in Figma.
  const trigger = $(`[data-filter='${column}']`).getBoundingClientRect();
  const bounds = card.getBoundingClientRect();
  // Convert painted coordinates back to layout pixels, including recording zoom.
  const scaleX = bounds.width / card.offsetWidth;
  const scaleY = bounds.height / card.offsetHeight;
  const left = Math.max(12, Math.min(card.clientWidth - 239, (trigger.right - bounds.left) / scaleX - 220));
  popover.style.left = `${left}px`; popover.style.right = 'auto';
  popover.style.top = `${(trigger.top - bounds.top) / scaleY + 22}px`;
  syncDraft(); syncIcons();
}
function syncDraft() {
  draft[openColumn] = search.value;
  if (openColumn === 'updated') { draft.from = from.value.trim(); draft.to = to.value.trim(); }
  const invalidFormat = openColumn === 'updated' && ((draft.from && !validDate(draft.from)) || (draft.to && !validDate(draft.to)));
  const invalidRange = openColumn === 'updated' && !invalidFormat && draft.from && draft.to && draft.from > draft.to;
  const error = invalidFormat ? 'Use YYYY-MM-DD for each date.' : invalidRange ? 'From must be on or before To.' : '';
  $('#filter-error').textContent = error; $('#filter-error').hidden = !error;
  from.setAttribute('aria-invalid', String(!!error)); to.setAttribute('aria-invalid', String(!!error));
  apply.disabled = !!error || JSON.stringify(draft) === JSON.stringify(applied);
  reset.disabled = openColumn === 'name' ? !(draft.name || applied.name) : !(draft.updated || draft.from || draft.to || applied.updated || applied.from || applied.to);
}
function positionCalendar() {
  if (!dateField) return;
  const bounds = card.getBoundingClientRect();
  const input = $(`#filter-${dateField}`).getBoundingClientRect();
  const height = calendarMode === 'date' ? 296 : 307;
  let left = popover.offsetLeft - 125;
  left = Math.max(12, Math.min(card.clientWidth - 292, left));
  const scaleY = bounds.height / card.offsetHeight;
  const top = Math.min((input.bottom - bounds.top) / scaleY + 6, card.clientHeight - height - 12);
  calendar.style.left = `${left}px`; calendar.style.top = `${Math.max(12, top)}px`;
}
function openCalendar(field) {
  const isSame = dateField === field && !calendar.hidden;
  closeCalendar(); if (isSame) return;
  dateField = field;
  const input = $(`#filter-${field}`);
  // The supplied January 2020 calendar is illustrative; start with the sample-data month.
  const anchor = validDate(input.value) ? input.value : '2026-09-01';
  const date = new Date(`${anchor}T00:00:00Z`); viewYear = date.getUTCFullYear(); viewMonth = date.getUTCMonth(); calendarMode = 'date';
  calendar.hidden = false; input.parentElement.classList.add('is-open');
  $(`[data-calendar='${field}']`).setAttribute('aria-expanded', 'true');
  renderCalendar();
}
function renderCalendar() {
  calendar.classList.toggle('month-mode', calendarMode === 'month');
  $('#calendar-heading').textContent = calendarMode === 'month' ? String(viewYear) : `${monthNames[viewMonth].slice(0, 3)} ${viewYear}`;
  $('#calendar-heading').setAttribute('aria-label', calendarMode === 'month' ? 'Return to calendar dates' : 'Choose month');
  const body = $('#calendar-body'); body.replaceChildren();
  if (calendarMode === 'month') {
    const grid = document.createElement('div'); grid.className = 'month-grid';
    monthNames.forEach((month, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = month.slice(0, 3); button.setAttribute('aria-label', `${month} ${viewYear}`); button.setAttribute('aria-pressed', String(index === viewMonth));
      button.addEventListener('click', () => { viewMonth = index; calendarMode = 'date'; renderCalendar(); }); grid.append(button);
    }); body.append(grid);
  } else {
    const weekdays = document.createElement('div'); weekdays.className = 'weekdays'; weekdays.setAttribute('aria-hidden', 'true');
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(day => { const span = document.createElement('span'); span.textContent = day; weekdays.append(span); });
    const grid = document.createElement('div'); grid.className = 'calendar-days';
    const first = new Date(Date.UTC(viewYear, viewMonth, 1));
    const start = 1 - (first.getUTCDay() + 6) % 7;
    for (let index = 0; index < 42; index++) {
      const date = new Date(Date.UTC(viewYear, viewMonth, start + index)); const value = iso(date);
      const button = document.createElement('button'); button.type = 'button'; button.textContent = date.getUTCDate(); button.dataset.date = value;
      button.setAttribute('aria-label', format.format(date)); button.setAttribute('aria-pressed', String(value === $(`#filter-${dateField}`).value));
      if (date.getUTCMonth() !== viewMonth) button.classList.add('outside-month');
      if (value === DEMO_TODAY) { button.classList.add('today'); button.setAttribute('aria-current', 'date'); }
      button.addEventListener('click', () => chooseDate(value)); grid.append(button);
    } body.append(weekdays, grid);
  }
  positionCalendar();
}
function chooseDate(value) {
  const input = $(`#filter-${dateField}`); input.value = value; syncDraft(); closeCalendar(); input.focus({ preventScroll: true });
}
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', event => { openPopover(button.dataset.filter); if (event.detail === 0 && !popover.hidden) search.focus({ preventScroll: true }); });
  button.addEventListener('mouseenter', () => { if (button.dataset.active !== 'true') button.querySelector('img').src = 'assets/table-filters-demo/IconFilterSearch2.svg'; });
  button.addEventListener('mouseleave', syncIcons);
});
[search, from, to].forEach(input => input.addEventListener('input', syncDraft));
[from, to].forEach(input => input.addEventListener('click', () => { if (dateField !== input.id.replace('filter-', '')) openCalendar(input.id.replace('filter-', '')); }));
document.querySelectorAll('[data-calendar]').forEach(button => button.addEventListener('click', () => openCalendar(button.dataset.calendar)));
$('#filter-form').addEventListener('submit', event => { event.preventDefault(); syncDraft(); if (apply.disabled) return; applied = { ...draft }; closePopover(); renderRows(); });
reset.addEventListener('click', () => {
  if (openColumn === 'name') { applied.name = ''; draft.name = ''; } else { for (const key of ['updated', 'from', 'to']) { applied[key] = ''; draft[key] = ''; } }
  search.value = ''; from.value = draft.from; to.value = draft.to; closeCalendar(); syncDraft(); renderRows();
});
selectAll.addEventListener('change', () => { for (const record of visible) selectAll.checked ? selected.add(record.id) : selected.delete(record.id); renderRows(); });
document.querySelectorAll('[data-sort]').forEach(button => button.addEventListener('click', () => {
  const key = button.dataset.sort; sort = { key, direction: sort?.key === key ? -sort.direction : 1 };
  document.querySelectorAll('th').forEach(th => th.removeAttribute('aria-sort'));
  button.closest('th').setAttribute('aria-sort', sort.direction === 1 ? 'ascending' : 'descending'); renderRows();
}));
document.querySelectorAll('[data-calendar-nav]').forEach(button => button.addEventListener('click', () => {
  const date = new Date(Date.UTC(viewYear, viewMonth + Number(button.dataset.calendarNav), 1)); viewYear = date.getUTCFullYear(); viewMonth = date.getUTCMonth(); renderCalendar();
}));
$('#calendar-heading').addEventListener('click', () => { calendarMode = calendarMode === 'date' ? 'month' : 'date'; renderCalendar(); });
$('#calendar-today').addEventListener('click', () => chooseDate(DEMO_TODAY));
document.addEventListener('pointerdown', event => {
  if (!openColumn) return;
  if (!calendar.hidden && !calendar.contains(event.target) && !event.target.closest('.date-field')) closeCalendar();
  if (!popover.contains(event.target) && !calendar.contains(event.target) && !event.target.closest('[data-filter]')) closePopover(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { if (!calendar.hidden) closeCalendar(true); else if (openColumn) closePopover(); }
  // Recording-only shortcut; never intercept normal typing or browser shortcuts.
  if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'r' && !event.target.closest('input:not([type="checkbox"]),textarea,[contenteditable]')) { event.preventDefault(); resetDemo(); }
});
function resetDemo() {
  closePopover(false); applied = EMPTY(); draft = EMPTY(); sort = null; selected.clear();
  document.querySelectorAll('th').forEach(th => th.removeAttribute('aria-sort'));
  search.value = from.value = to.value = ''; renderRows(); document.activeElement?.blur();
}
window.resetTableFiltersDemo = resetDemo;
addEventListener('resize', positionCalendar);
renderRows();
