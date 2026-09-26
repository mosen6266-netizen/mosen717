import { createClient } from 'https://esm.sh/@base44/sdk?bundle';
import { APP_ID } from './config.js';

export const base44 = createClient({ appId: APP_ID });
export const createIsolatedClient = () => createClient({ appId: APP_ID });

export function esc(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
}

export function showMessage(el, text, type = '') {
  if (!el) return;
  el.textContent = text;
  el.className = 'notice' + (type ? ' ' + type : '');
  el.hidden = false;
}

export function hideMessage(el) {
  if (el) el.hidden = true;
}

export function buildFieldControl(field, value = '') {
  const required = field.required ? 'required' : '';
  const star = field.required ? ' <span class="req">*</span>' : '';
  const key = esc(field.field_key);
  const label = `<label>${esc(field.label)}${star}</label>`;
  if (field.field_type === 'textarea') {
    return `<div class="field">${label}<textarea data-key="${key}" ${required}>${esc(value)}</textarea></div>`;
  }
  if (field.field_type === 'select') {
    const opts = String(field.options || '').split(',').map(x => x.trim()).filter(Boolean);
    const html = opts.map(o => `<option value="${esc(o)}" ${String(value) === o ? 'selected' : ''}>${esc(o)}</option>`).join('');
    return `<div class="field">${label}<select data-key="${key}" ${required}><option value="">请选择</option>${html}</select></div>`;
  }
  const type = ({number:'number',date:'date',datetime:'datetime-local',email:'email',tel:'tel'}[field.field_type] || 'text');
  return `<div class="field">${label}<input type="${type}" data-key="${key}" value="${esc(value)}" ${required}></div>`;
}

export function formatDate(value) {
  if (!value) return '';
  return String(value).replace('T',' ').slice(0,16);
}

export function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(a.href);
  a.remove();
}
