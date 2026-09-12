/* ============================================================
 * SpotiX — Ses Katmanı (MAIN world) v16
 * - Çalma hızı (pitch ile): registry + play hook + ratechange
 *   bekçisi; %100 = native reset.
 * - Kalite: TEK MOD — izin verilen EN YÜKSEK format zorlanır
 *   (liste JSON olarak görünürse gerçekten kırpılır).
 * - ÖLÇER YOK (v1.5.16): kbps/telemetri tamamen söküldü.
 * Kanıt (yalnız hız): <html data-sx-dsp data-sx-applied data-sx-rate>
 * ============================================================ */
(function () {
  'use strict';

  if (window.__SX_DSP__) return;
  window.__SX_DSP__ = true;

  const KEY = 'sx-settings-v1';
  let rate = 1;
  let lastOk = 0;
  const registry = new Set(); // görülen tüm media elemanları (detached dahil)

  function read() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      rate = Math.min(Math.max((parseInt(s.playbackSpeed, 10) || 100) / 100, 0.5), 1.5);
    } catch (e) { /* yoksay */ }
  }

  function announce() {
    try {
      const ds = document.documentElement.dataset;
      ds.sxDsp = '1';
      ds.sxApplied = String(lastOk);
      ds.sxRate = String(rate);
    } catch (e) { /* yoksay */ }
  }

  /* ---------- tune: rate=1'de native'e reset ---------- */
  function tune(el) {
    try {
      registry.add(el);
      if (rate === 1) {
        el.preservesPitch = true;
        if ('mozPreservesPitch' in el) el.mozPreservesPitch = true;
        if ('webkitPreservesPitch' in el) el.webkitPreservesPitch = true;
        if (Math.abs(el.playbackRate - 1) > 0.001) el.playbackRate = 1;
      } else {
        el.preservesPitch = false;
        if ('mozPreservesPitch' in el) el.mozPreservesPitch = false;
        if ('webkitPreservesPitch' in el) el.webkitPreservesPitch = false;
        if (Math.abs(el.playbackRate - rate) > 0.001) el.playbackRate = rate;
      }
      /* ratechange bekçisi: Spotify hızı değiştirirse ANINDA geri koy */
      if (!el.__sxRc) {
        el.__sxRc = true;
        el.addEventListener('ratechange', () => {
          try {
            if (Math.abs(el.playbackRate - rate) > 0.001) {
              setTimeout(() => tune(el), 0);
            }
          } catch (e) { /* yoksay */ }
        });
      }
      el.__sxDone = rate;
      return Math.abs(el.playbackRate - rate) < 0.001;
    } catch (e) { return false; }
  }

  /* ---------- registry + DOM: hepsine uygula ---------- */
  function applyAll() {
    try { document.querySelectorAll('audio,video').forEach(tune); } catch (e) {}
    let ok = 0;
    registry.forEach((el) => {
      try {
        if (!el.parentNode && el.paused === undefined) { registry.delete(el); return; }
        if (tune(el)) ok++;
      } catch (e) { try { registry.delete(el); } catch (e2) {} }
    });
    lastOk = ok;
    announce();
    return ok;
  }

  /* ---------- detached element yakalama: play hook ---------- */
  try {
    const op = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      tune(this);
      return op.apply(this, arguments);
    };
  } catch (e) { /* yoksay */ }

  /* ---------- yakalama turu: play/playing ---------- */
  ['play', 'playing'].forEach((ev) => {
    document.addEventListener(ev, (e) => {
      const tg = e.target;
      try { if (tg && typeof tg.playbackRate === 'number') tune(tg); } catch (err) {}
    }, true);
  });

  /* ---------- Web Audio: buffer hızı da pitch ile ---------- */
  try {
    const oStart = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function () {
      try {
        if (this.playbackRate && this.playbackRate.value !== undefined) {
          this.playbackRate.value = rate;
        }
      } catch (e) {}
      return oStart.apply(this, arguments);
    };
  } catch (e) { /* yoksay */ }

  setInterval(applyAll, 800);
  document.addEventListener('visibilitychange', () => { read(); applyAll(); });

  /* ---------- kalite: SABİT en yüksek ---------- */
  function bitrate(f) {
    const m = String((f && f.format) || '').match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : 0;
  }

  function isAudioFile(f) {
    const fmt = String((f && f.format) || '');
    return /^[A-Za-z][A-Za-z0-9_]*\d+$/.test(fmt) && fmt.length >= 5 &&
      !!(f.file_id || f.fileId || f.fileid || f.url || f.uri);
  }

  function pick(list) {
    if (!Array.isArray(list) || !list.length) return null;
    let cands = list.filter(isAudioFile);
    if (!cands.length) {
      const cl = list.filter((f) => f && /^[A-Za-z][A-Za-z0-9_]*\d+$/.test(String(f.format || '')) &&
        String(f.format).length >= 5);
      const names = new Set(cl.map((f) => String(f.format)));
      if (cl.length >= 2 && names.size >= 2) cands = cl;
      else return null;
    }
    return [cands.slice().sort((a, b) => bitrate(a) - bitrate(b))[cands.length - 1]];
  }

  function filterFiles(obj, depth) {
    if (!obj || typeof obj !== 'object' || depth > 10) return false;
    let changed = false;
    for (const k in obj) {
      const v = obj[k];
      if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0] &&
          typeof v[0].format === 'string') {
        const p = pick(v);
        if (p && p[0] !== v[v.length - 1]) { obj[k] = p; changed = true; }
        continue;
      }
      if (filterFiles(v, depth + 1)) changed = true;
    }
    return changed;
  }

  try {
    const of = window.fetch;
    window.fetch = function () {
      const p = of.apply(this, arguments);
      return p.then((r) => {
        try {
          const req = arguments[0];
          const u = (typeof req === 'string' ? req : (req && req.url)) || '';
          if (!/metadata|\/tracks?|episodes?|chapter/i.test(u)) return r;
          const ct = r.headers ? (r.headers.get('content-type') || '') : '';
          if (ct && ct.indexOf('json') === -1) return r;
          return r.clone().json().then((data) => {
            if (!filterFiles(data, 0)) return r;
            return new Response(JSON.stringify(data), {
              status: r.status, statusText: r.statusText, headers: r.headers
            });
          }).catch(() => r);
        } catch (e) { return r; }
      });
    };
  } catch (e) { /* yoksay */ }

  /* ayar değişti → oku + çalan şarkıya ANINDA uygula */
  document.addEventListener('sx:settings', () => { read(); applyAll(); });
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === KEY) { read(); applyAll(); }
  });

  read();
  applyAll();
})();
