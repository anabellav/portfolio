// Independent after-demo. Nothing is persisted: refresh always resets it.
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
const card = $('.after-card');
const search = $('#table-search');
const control = $('#filter-control');
const trigger = $('#open-filters');
const popover = $('#filter-popover');
const from = $('#filter-from');
const to = $('#filter-to');
const apply = $('#apply-filters');
const calendar = $('#calendar');
const format = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEMO_TODAY = '2026-10-03';
let applied = { from: '', to: '' };
let query = '';
let dateField = null;
let viewYear = 2026;
let viewMonth = 8;
const selected = new Set();
function iso(date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`; }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && iso(new Date(`${value}T00:00:00Z`)) === value; }
function renderRows() {
  const visible = records.filter(record => (!applied.from || record.updated >= applied.from) && (!applied.to || record.updated <= applied.to) && `${record.name} ${record.updated} ${format.format(new Date(`${record.updated}T00:00:00Z`))}`.toLowerCase().includes(query.toLowerCase()));
  const body = $('#dataset-rows'); body.replaceChildren();
  for (const record of visible) {
    const row = document.createElement('tr'); row.dataset.id = record.id;
    const nameCell = document.createElement('td'); const group = document.createElement('div'); group.className = 'dataset-cell';
    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selected.has(record.id); checkbox.setAttribute('aria-label', `Select ${record.name}`);
    checkbox.addEventListener('change', () => checkbox.checked ? selected.add(record.id) : selected.delete(record.id));
    const name = document.createElement('span'); name.className = 'dataset-name'; name.textContent = record.name; name.title = record.name;
    group.append(checkbox, name); nameCell.append(group);
    const updatedCell = document.createElement('td'); updatedCell.textContent = format.format(new Date(`${record.updated}T00:00:00Z`));
    row.append(nameCell, updatedCell); body.append(row);
  }
  if (!visible.length) {
    const row = document.createElement('tr'); row.className = 'empty-row';
    const cell = document.createElement('td'); cell.colSpan = 2;
    cell.append($('#no-results-template').content.cloneNode(true));
    row.append(cell); body.append(row);
  }
  $('.table-container').scrollTop = 0;
  $('#result-status').textContent = `${visible.length} ${visible.length === 1 ? 'dataset' : 'datasets'} shown`;
}
function syncControl() {
  const count = Number(!!(applied.from || applied.to));
  const open = !popover.hidden;
  control.classList.toggle('is-applied', !!count); control.classList.toggle('is-open', open);
  $('#filter-label').textContent = count ? `Filters (${count})` : 'Filters';
  $('#clear-filters').hidden = !count;
  trigger.setAttribute('aria-expanded', String(open));
  $('#filter-icon').src = `assets/table-filters-after-demo/filter-${count || open ? 'active' : 'default'}.svg`;
}
function syncDraft() {
  const start = from.value.trim(); const end = to.value.trim();
  const invalid = (start && !validDate(start)) || (end && !validDate(end));
  const reversed = !invalid && start && end && start > end;
  const error = invalid ? 'Use YYYY-MM-DD for dates.' : reversed ? 'From must be on or before To.' : '';
  $('#date-error').textContent = error; $('#date-error').hidden = !error;
  from.setAttribute('aria-invalid', String(!!error)); to.setAttribute('aria-invalid', String(!!error));
  apply.disabled = !!error || (!start && !end) || (start === applied.from && end === applied.to);
  $('#clear-draft').disabled = !(start || end || applied.from || applied.to);
  if (!calendar.hidden) positionCalendar();
}
function positionPopover() {
  const a = trigger.getBoundingClientRect(); const b = card.getBoundingClientRect();
  const scaleX = b.width / card.offsetWidth;
  const scaleY = b.height / card.offsetHeight;
  popover.style.left = `${Math.max(12, Math.min(card.clientWidth - 272, (a.left - b.left) / scaleX + 1))}px`;
  popover.style.top = `${(a.bottom - b.top) / scaleY + 10}px`;
}
function closeCalendar(restoreFocus = false) {
  const previous = dateField; calendar.hidden = true; dateField = null;
  document.querySelectorAll('[data-calendar]').forEach(button => button.setAttribute('aria-expanded', 'false'));
  document.querySelectorAll('.date-field').forEach(field => field.classList.remove('is-open'));
  if (restoreFocus && previous) $(`#filter-${previous}`).focus({ preventScroll: true });
}
function closePopover(restoreFocus = true) {
  closeCalendar(); popover.hidden = true; syncControl();
  if (restoreFocus) trigger.focus({ preventScroll: true });
}
function openPopover(keyboard = false) {
  if (!popover.hidden) return closePopover();
  from.value = applied.from; to.value = applied.to;
  popover.hidden = false; syncDraft(); syncControl(); positionPopover();
  if (keyboard) from.focus({ preventScroll: true });
}
function clearFilters() {
  applied = { from: '', to: '' }; from.value = to.value = ''; closeCalendar();
  syncDraft(); syncControl(); renderRows();
}
function positionCalendar() {
  if (!dateField) return;
  const input = $(`#filter-${dateField}`).getBoundingClientRect(); const b = card.getBoundingClientRect();
  const scaleX = b.width / card.offsetWidth;
  const scaleY = b.height / card.offsetHeight;
  const left = Math.max(12, Math.min(card.clientWidth - 300, (input.left - b.left) / scaleX));
  const top = Math.max(12, Math.min(card.clientHeight - 324, (input.bottom - b.top) / scaleY + 4));
  calendar.style.left = `${left}px`; calendar.style.top = `${top}px`;
}
function openCalendar(field) {
  const same = dateField === field && !calendar.hidden;
  closeCalendar(); if (same) return;
  dateField = field;
  const input = $(`#filter-${field}`); const value = validDate(input.value) ? input.value : '2026-09-01';
  const date = new Date(`${value}T00:00:00Z`); viewYear = date.getUTCFullYear(); viewMonth = date.getUTCMonth();
  calendar.hidden = false; input.parentElement.classList.add('is-open');
  $(`[data-calendar='${field}']`).setAttribute('aria-expanded', 'true'); renderCalendar();
}
function renderCalendar() {
  $('#calendar-heading').textContent = `${months[viewMonth]} ${viewYear}`;
  const body = $('#calendar-days'); body.replaceChildren();
  const start = 1 - new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  for (let index = 0; index < 42; index++) {
    const date = new Date(Date.UTC(viewYear, viewMonth, start + index)); const value = iso(date);
    const button = document.createElement('button'); button.type = 'button'; button.textContent = date.getUTCDate(); button.dataset.date = value;
    button.setAttribute('aria-label', format.format(date)); button.setAttribute('aria-pressed', String(value === $(`#filter-${dateField}`).value));
    if (date.getUTCMonth() !== viewMonth) button.classList.add('outside-month');
    if (value === DEMO_TODAY) { button.classList.add('today'); button.setAttribute('aria-current', 'date'); }
    button.addEventListener('click', () => { const input = $(`#filter-${dateField}`); input.value = value; closeCalendar(); syncDraft(); input.focus({ preventScroll: true }); });
    body.append(button);
  }
  positionCalendar();
}
search.addEventListener('input', () => { query = search.value; $('.search-wrap').classList.toggle('has-search', !!query); renderRows(); });
trigger.addEventListener('click', event => openPopover(event.detail === 0));
control.addEventListener('mouseenter', () => { if (popover.hidden && !applied.from && !applied.to) $('#filter-icon').src = 'assets/table-filters-after-demo/filter-hover.svg'; });
control.addEventListener('mouseleave', syncControl);
$('#clear-filters').addEventListener('click', () => { clearFilters(); closePopover(); });
$('#clear-draft').addEventListener('click', clearFilters);
[from, to].forEach(input => {
  input.addEventListener('input', syncDraft);
  input.addEventListener('click', () => { if (dateField !== input.id.replace('filter-', '')) openCalendar(input.id.replace('filter-', '')); });
});
document.querySelectorAll('[data-calendar]').forEach(button => button.addEventListener('click', () => openCalendar(button.dataset.calendar)));
$('#filter-form').addEventListener('submit', event => { event.preventDefault(); syncDraft(); if (apply.disabled) return; applied = { from: from.value.trim(), to: to.value.trim() }; closePopover(); renderRows(); });
document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => { const date = new Date(Date.UTC(viewYear, viewMonth + Number(button.dataset.nav), 1)); viewYear = date.getUTCFullYear(); viewMonth = date.getUTCMonth(); renderCalendar(); }));
document.addEventListener('pointerdown', event => {
  if (popover.hidden) return;
  if (!calendar.hidden && !calendar.contains(event.target) && !event.target.closest('.date-field')) closeCalendar();
  if (!popover.contains(event.target) && !calendar.contains(event.target) && !control.contains(event.target)) closePopover(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!calendar.hidden) closeCalendar(true);
    else if (!popover.hidden) closePopover();
    else if (event.target === search && query) { event.preventDefault(); search.value = ''; search.dispatchEvent(new Event('input')); }
  }
  if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'r' && !event.target.closest('input:not([type="checkbox"]),textarea,[contenteditable]')) { event.preventDefault(); resetDemo(); }
});
function resetDemo() {
  closePopover(false); applied = { from: '', to: '' }; query = ''; search.value = from.value = to.value = ''; selected.clear();
  $('.search-wrap').classList.remove('has-search'); syncControl(); renderRows(); document.activeElement?.blur();
}
window.resetTableFiltersAfterDemo = resetDemo;
addEventListener('resize', () => { if (!popover.hidden) positionPopover(); positionCalendar(); });
renderRows(); syncControl();
