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

  if (field.field_type === 'date' || field.field_type === 'datetime') {
    const raw = String(value || '').replace(' ', 'T');
    let date = '', hour = '00', minute = '00';
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) date = raw.slice(0,10);
    if (/T\d{2}:\d{2}/.test(raw)) {
      hour = raw.slice(11,13);
      minute = raw.slice(14,16);
    }
    const hours = Array.from({length:24},(_,i)=>String(i).padStart(2,'0'))
      .map(h=>`<option value="${h}" ${h===hour?'selected':''}>${h}</option>`).join('');
    const minutes = Array.from({length:60},(_,i)=>String(i).padStart(2,'0'))
      .map(m=>`<option value="${m}" ${m===minute?'selected':''}>${m}</option>`).join('');
    const ampm = Number(hour) >= 12 ? 'PM' : 'AM';
    return `<div class="field datetime-field">${label}
      <div class="datetime-24h" data-datetime-wrap>
        <input class="dt-date" type="date" value="${esc(date)}" data-dt-date ${required}>
        <select class="dt-hour" data-dt-hour aria-label="小时">${hours}</select>
        <span class="dt-sep">:</span>
        <select class="dt-minute" data-dt-minute aria-label="分钟">${minutes}</select>
        <span class="dt-ampm" data-dt-ampm>${ampm}</span>
        <input type="hidden" data-key="${key}" value="${esc(date ? date+'T'+hour+':'+minute : '')}" data-dt-value>
      </div>
    </div>`;
  }

  const type = ({number:'number',email:'email',tel:'tel'}[field.field_type] || 'text');
  return `<div class="field">${label}<input type="${type}" data-key="${key}" value="${esc(value)}" ${required}></div>`;
}

export function buildGroupedFieldControls(fields, data = {}) {
  const sorted=[...(fields||[])].sort((a,b)=>(a.order||0)-(b.order||0));
  const emitted=new Set();
  return sorted.map(field=>{
    const group=String(field.group_name||'').trim();
    if(!group)return buildFieldControl(field,data[field.field_key]??'');
    if(emitted.has(group))return '';
    emitted.add(group);
    const groupFields=sorted.filter(x=>String(x.group_name||'').trim()===group);
    return `<section class="field-group-block">
      <div class="field-group-title">${esc(group)}</div>
      <div class="field-group-grid">${groupFields.map(f=>buildFieldControl(f,data[f.field_key]??'')).join('')}</div>
    </section>`;
  }).join('');
}

export function initDateTimeControls(root = document) {
  root.querySelectorAll('[data-datetime-wrap]').forEach(wrap => {
    if (wrap.dataset.ready === '1') return;
    wrap.dataset.ready = '1';
    const date = wrap.querySelector('[data-dt-date]');
    const hour = wrap.querySelector('[data-dt-hour]');
    const minute = wrap.querySelector('[data-dt-minute]');
    const ampm = wrap.querySelector('[data-dt-ampm]');
    const hidden = wrap.querySelector('[data-dt-value]');
    const sync = () => {
      const h = hour.value || '00';
      ampm.textContent = Number(h) >= 12 ? 'PM' : 'AM';
      hidden.value = date.value ? date.value + 'T' + h + ':' + (minute.value || '00') : '';
    };
    date.addEventListener('change', sync);
    hour.addEventListener('change', sync);
    minute.addEventListener('change', sync);
    sync();
  });
}

export function formatDate(value) {
  if (!value) return '';
  const raw = String(value).replace(' ', 'T');
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return String(value);
  const date = raw.slice(0,10);
  if (!/T\d{2}:\d{2}/.test(raw)) return date;
  const hour = raw.slice(11,13), minute = raw.slice(14,16);
  const ampm = Number(hour) >= 12 ? 'PM' : 'AM';
  return date + ' ' + hour + ':' + minute + ' ' + ampm;
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
