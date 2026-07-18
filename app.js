/* ============================
   CheckIP - app.js
   ============================ */

const API_BASE = 'https://ipwho.is';
let currentIP = '';
let currentData = null; // store full IP data for saving

// ─── Helpers ─────────────────────────────────────────────────────────────────
function flag(countryCode) {
  if (!countryCode) return '';
  return countryCode.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(c.charCodeAt(0) + 127397)
  );
}

function formatNA(val) {
  return val && val !== 'undefined' ? val : '—';
}

function makeRow(key, val) {
  return `<div class="detail-row">
    <span class="detail-key">${key}</span>
    <span class="detail-val">${formatNA(val)}</span>
  </div>`;
}

function makeCard(iconClass, iconSvg, label, value, sub = '') {
  return `<div class="info-card">
    <div class="card-icon ${iconClass}">
      ${iconSvg}
    </div>
    <div class="card-label">${label}</div>
    <div class="card-value">${formatNA(value)}</div>
    ${sub ? `<div class="card-sub">${sub}</div>` : ''}
  </div>`;
}

// SVG icons
const SVG = {
  location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  network: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  currency: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  language: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`,
};

// ─── Normalize ipwho.is → internal format ────────────────────────────────────
function normalize(raw) {
  if (!raw.success) throw new Error(raw.message || 'IP not found');
  return {
    ip:             raw.ip,
    version:        raw.type,
    country_name:   raw.country,
    country_code:   raw.country_code,
    continent_code: raw.continent_code,
    region:         raw.region,
    region_code:    raw.region_code,
    city:           raw.city,
    postal:         raw.postal,
    latitude:       raw.latitude,
    longitude:      raw.longitude,
    asn:            raw.connection?.asn ? `AS${raw.connection.asn}` : null,
    org:            raw.connection?.isp || raw.connection?.org || null,
    timezone:       raw.timezone?.id,
    utc_offset:     raw.timezone?.utc,
    calling_code:   raw.calling_code ? String(raw.calling_code).replace('+','') : null,
    currency_name:  null,
    currency:       null,
    languages:      null,
    _raw:           raw,
  };
}

// ─── Main fetch ───────────────────────────────────────────────────────────────
async function fetchIPData(ip = '') {
  const url = ip ? `${API_BASE}/${encodeURIComponent(ip)}` : API_BASE;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw = await res.json();
  return normalize(raw);
}

// ─── Render main data ─────────────────────────────────────────────────────────
function renderData(d) {
  currentIP = d.ip || '';

  // Hero
  const ipEl = document.getElementById('ipValue');
  ipEl.textContent = d.ip || '—';
  ipEl.style.display = 'block';
  document.getElementById('ipSkeleton').style.display = 'none';

  // Badges
  const badgesEl = document.getElementById('ipBadges');
  const badgeType = document.getElementById('badgeType');
  badgeType.textContent = d.version || (d.ip && d.ip.includes(':') ? 'IPv6' : 'IPv4');
  badgesEl.style.display = 'flex';

  // Store full data globally
  currentData = d;

  // Copy btn
  document.getElementById('btnCopy').style.display = 'inline-flex';

  // Save note btn
  document.getElementById('btnSave').style.display = 'inline-flex';


  // Summary cards
  const cardsGrid = document.getElementById('cardsGrid');
  const timeStr = d.timezone ? new Date().toLocaleString('vi-VN', { timeZone: d.timezone, hour: '2-digit', minute: '2-digit' }) : null;

  cardsGrid.innerHTML =
    makeCard('icon-cyan', SVG.location, 'Quốc gia',
      `${flag(d.country_code)} ${d.country_name || d.country}`, d.region || '') +
    makeCard('icon-accent', SVG.globe, 'Thành phố',
      d.city, d.postal ? `Mã bưu điện: ${d.postal}` : '') +
    makeCard('icon-emerald', SVG.network, 'ISP / Tổ chức',
      d.org || d.asn, d.asn || '') +
    makeCard('icon-amber', SVG.clock, 'Múi giờ',
      d.timezone, timeStr ? `Giờ địa phương: ${timeStr}` : '') +
    makeCard('icon-rose', SVG.currency, 'Continent',
      d.continent_code, d.country_code ? `Mã quốc gia: ${d.country_code}` : '') +
    makeCard('icon-purple', SVG.language, 'Mã quốc tế',
      d.calling_code ? `+${d.calling_code}` : null, d.postal ? `Mã bưu điện: ${d.postal}` : '');


  // Detail section
  document.getElementById('locationRows').innerHTML =
    makeRow('Châu lục', d.continent_code) +
    makeRow('Quốc gia', `${flag(d.country_code)} ${d.country_name}`) +
    makeRow('Vùng / Tỉnh', d.region) +
    makeRow('Mã vùng', d.region_code) +
    makeRow('Thành phố', d.city) +
    makeRow('Mã bưu điện', d.postal) +
    makeRow('Vĩ độ', d.latitude) +
    makeRow('Kinh độ', d.longitude);

  document.getElementById('networkRows').innerHTML =
    makeRow('Địa chỉ IP', d.ip) +
    makeRow('Phiên bản', d.version) +
    makeRow('ASN', d.asn) +
    makeRow('Tổ chức', d.org) +
    makeRow('Múi giờ UTC', d.utc_offset) +
    makeRow('Múi giờ', d.timezone);

  // Browser info
  const ua = navigator.userAgent;
  const browserName = getBrowser(ua);
  const osName = getOS(ua);
  const lang = navigator.language || navigator.userLanguage;
  const screen_ = `${screen.width} × ${screen.height}`;
  const colorDepth = `${screen.colorDepth}-bit`;

  document.getElementById('systemRows').innerHTML =
    makeRow('Trình duyệt', browserName) +
    makeRow('Hệ điều hành', osName) +
    makeRow('Ngôn ngữ', lang) +
    makeRow('Màn hình', screen_) +
    makeRow('Độ sâu màu', colorDepth) +
    makeRow('Múi giờ máy', Intl.DateTimeFormat().resolvedOptions().timeZone);

  document.getElementById('detailSection').style.display = 'grid';

  // Map
  if (d.latitude && d.longitude) {
    const lat = parseFloat(d.latitude).toFixed(4);
    const lon = parseFloat(d.longitude).toFixed(4);
    document.getElementById('mapCoords').textContent = `${lat}°N, ${lon}°E`;
    document.getElementById('mapIframe').src =
      `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.15},${lat - 0.15},${parseFloat(lon) + 0.15},${parseFloat(lat) + 0.15}&layer=mapnik&marker=${lat},${lon}`;
    document.getElementById('mapSection').style.display = 'block';
  }

  // Tự động lưu lên server
  autoSaveToServer();
}

// ─── Browser / OS detection ───────────────────────────────────────────────────
function getBrowser(ua) {
  if (/Edg\//.test(ua)) return 'Microsoft Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Unknown';
}

function getOS(ua) {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad/.test(ua)) return 'iOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

// ─── Copy IP ─────────────────────────────────────────────────────────────────
function copyIP() {
  if (!currentIP) return;
  navigator.clipboard.writeText(currentIP).then(() => {
    const btn = document.getElementById('btnCopy');
    const txt = document.getElementById('copyText');
    btn.classList.add('copied');
    txt.textContent = '✓ Đã sao chép!';
    setTimeout(() => {
      btn.classList.remove('copied');
      txt.textContent = 'Sao chép IP';
    }, 2000);
  });
}

// ─── Save Note ───────────────────────────────────────────────────────────────
function saveNote() {
  if (!currentData) return;
  const d = currentData;
  const ua = navigator.userAgent;
  const now = new Date();
  const timestamp = now.toLocaleString('vi-VN', { timeZone: d.timezone || undefined });
  const localTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const sep = '═'.repeat(52);
  const line = '─'.repeat(52);

  const note = [
    sep,
    '  CHECKIP – GHI CHÚ THÔNG TIN ĐỊA CHỈ IP',
    sep,
    `  Thời gian lưu : ${now.toLocaleString('vi-VN')}`,
    '',
    '📡 THÔNG TIN IP',
    line,
    `  Địa chỉ IP    : ${d.ip || '—'}`,
    `  Phiên bản     : ${d.version || (d.ip && d.ip.includes(':') ? 'IPv6' : 'IPv4')}`,
    `  ASN           : ${d.asn || '—'}`,
    `  ISP / Tổ chức : ${d.org || '—'}`,
    '',
    '📍 VỊ TRÍ ĐỊA LÝ',
    line,
    `  Quốc gia      : ${d.country_name || '—'} (${d.country_code || '—'})`,
    `  Châu lục      : ${d.continent_code || '—'}`,
    `  Vùng / Tỉnh   : ${d.region || '—'} (${d.region_code || '—'})`,
    `  Thành phố     : ${d.city || '—'}`,
    `  Mã bưu điện   : ${d.postal || '—'}`,
    `  Vĩ độ         : ${d.latitude || '—'}`,
    `  Kinh độ       : ${d.longitude || '—'}`,
    '',
    '🕐 THỜI GIAN & KHU VỰC',
    line,
    `  Múi giờ       : ${d.timezone || '—'}`,
    `  UTC offset    : ${d.utc_offset || '—'}`,
    `  Giờ địa phương: ${d.timezone ? now.toLocaleString('vi-VN', { timeZone: d.timezone }) : '—'}`,
    '',
    '💰 TIỀN TỆ & NGÔN NGỮ',
    line,
    `  Tiền tệ       : ${d.currency_name || '—'} (${d.currency || '—'})`,
    `  Ngôn ngữ      : ${d.languages || '—'}`,
    `  Mã quốc tế    : +${d.calling_code || '—'}`,
    '',
    '💻 TRÌNH DUYỆT & HỆ THỐNG',
    line,
    `  Trình duyệt   : ${getBrowser(ua)}`,
    `  Hệ điều hành  : ${getOS(ua)}`,
    `  Ngôn ngữ máy  : ${navigator.language || '—'}`,
    `  Màn hình      : ${screen.width} × ${screen.height} px`,
    `  Độ sâu màu    : ${screen.colorDepth}-bit`,
    `  Múi giờ máy   : ${localTZ}`,
    `  User-Agent    : ${ua}`,
    '',
    sep,
    `  Tạo bởi CheckIP · ${now.toISOString()}`,
    sep,
  ].join('\n');

  // Trigger download
  const blob = new Blob([note], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = now.toISOString().slice(0, 19).replace(/[T:]/g, '-');
  a.href = url;
  a.download = `checkip_${d.ip}_${dateStr}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Visual feedback
  const btn = document.getElementById('btnSave');
  const txt = document.getElementById('saveText');
  btn.classList.add('saved');
  txt.textContent = '✓ Đã lưu!';
  setTimeout(() => {
    btn.classList.remove('saved');
    txt.textContent = 'Lưu .txt';
  }, 2500);
}

// ─── Auto Save to Server ────────────────────────────────────────────────────────
async function autoSaveToServer() {
  if (!currentData) return;

  const d = currentData;
  const ua = navigator.userAgent;
  const now = new Date();
  
  const payload = {
    ...d,
    timeLocal: now.toLocaleString('vi-VN'),
    timeRemote: d.timezone ? now.toLocaleString('vi-VN', { timeZone: d.timezone }) : '—',
    browser: getBrowser(ua),
    os: getOS(ua),
    language: navigator.language || '—',
    screen: `${screen.width} × ${screen.height} px`,
    colorDepth: `${screen.colorDepth}-bit`,
    localTZ: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: ua
  };

  try {
    const res = await fetch('/auto-save-txt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    if (result.success) {
      console.log('✅ Auto-saved to note.txt successfully!');
    }
  } catch (error) {
    console.error('⚠️ Lỗi auto-save:', error);
  }
}


// ─── Lookup another IP ────────────────────────────────────────────────────────
async function lookupIP() {
  const input = document.getElementById('lookupInput').value.trim();
  const resultEl = document.getElementById('lookupResult');
  const btn = document.getElementById('btnLookup');

  if (!input) {
    resultEl.className = 'lookup-result error';
    resultEl.textContent = '⚠️ Vui lòng nhập địa chỉ IP.';
    resultEl.style.display = 'block';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Đang tra cứu...';
  resultEl.style.display = 'none';

  try {
    const d = await fetchIPData(input);
    const timeStr = d.timezone ? new Date().toLocaleString('vi-VN', { timeZone: d.timezone, hour: '2-digit', minute: '2-digit' }) : '—';

    resultEl.className = 'lookup-result';
    resultEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <span style="font-family:'JetBrains Mono',monospace;font-size:1.1rem;font-weight:700;color:var(--text-primary);">${d.ip}</span>
        <span class="badge">${d.version || 'IPv4'}</span>
        <span style="font-size:1.4rem;">${flag(d.country_code)}</span>
      </div>
      <div class="lookup-grid">
        <div class="lookup-item"><div class="lookup-item-key">Quốc gia</div><div class="lookup-item-val">${formatNA(d.country_name)}</div></div>
        <div class="lookup-item"><div class="lookup-item-key">Thành phố</div><div class="lookup-item-val">${formatNA(d.city)}</div></div>
        <div class="lookup-item"><div class="lookup-item-key">Vùng</div><div class="lookup-item-val">${formatNA(d.region)}</div></div>
        <div class="lookup-item"><div class="lookup-item-key">ISP / Org</div><div class="lookup-item-val">${formatNA(d.org)}</div></div>
        <div class="lookup-item"><div class="lookup-item-key">ASN</div><div class="lookup-item-val">${formatNA(d.asn)}</div></div>
        <div class="lookup-item"><div class="lookup-item-key">Múi giờ</div><div class="lookup-item-val">${formatNA(d.timezone)}</div></div>
        <div class="lookup-item"><div class="lookup-item-key">Giờ địa phương</div><div class="lookup-item-val">${timeStr}</div></div>
        <div class="lookup-item"><div class="lookup-item-key">Tọa độ</div><div class="lookup-item-val">${d.latitude ? `${d.latitude}, ${d.longitude}` : '—'}</div></div>
      </div>`;
    resultEl.style.display = 'block';
  } catch (err) {
    resultEl.className = 'lookup-result error';
    resultEl.innerHTML = `⚠️ Không thể tra cứu: <b>${err.message}</b>`;
    resultEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Tra cứu';
  }
}

// ─── Enter key support ────────────────────────────────────────────────────────
document.getElementById('lookupInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') lookupIP();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
(async function init() {
  try {
    const data = await fetchIPData();
    renderData(data);
  } catch (err) {
    document.getElementById('ipSkeleton').style.display = 'none';
    const ipVal = document.getElementById('ipValue');
    ipVal.textContent = 'Không thể lấy IP';
    ipVal.style.display = 'block';
    ipVal.style.fontSize = '1.5rem';
    ipVal.style.background = 'none';
    ipVal.style.webkitTextFillColor = '#f43f5e';
    document.getElementById('cardsGrid').innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:20px;">⚠️ ${err.message}</p>`;
  }
})();
