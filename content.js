/* ============================================================
 * SpotiX — Content Script
 * - Ayarlar + CSS enjeksiyonu + anında güncelleme
 * - Sayfa içi hızlı ayar (FAB) — klavyesiz sayı girişi
 * - Tek tıkla çal
 * - Reklam engelleyici (MAIN world enjeksiyonu + DOM + atlama)
 * - Alt gezinme çubuğu (her zaman, bağımsız ölçekli)
 * - TR/EN dil desteği (tarayıcı dilini otomatik algılar)
 * ============================================================ */
(function () {
  'use strict';

  const SX = globalThis.SX;
  const DEFAULTS = SX.DEFAULTS;

  const LS_KEY = 'sx-settings-v1';
  const FAB_POS_KEY = 'sx-fab-pos-v1';

  /* ================= MAIN WORLD ADBLOCK ENJEKSİYONU ================= */
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      const injectMain = (file) => {
        /* v1.6.0: yalnız src yolu — inline fallback CSP hatası üretiyordu,
           src enjeksiyonu saha testlerinde zaten kanıtlandı */
        const el = document.createElement('script');
        el.src = chrome.runtime.getURL(file);
        el.onload = () => el.remove();
        (document.head || document.documentElement).appendChild(el);
      };
      injectMain('sx-adblock.js');
      injectMain('sx-dsp.js');
    }
  } catch (e) { /* yoksay */ }

  /* ================= DİL ================= */
  const I18N = {
    tr: {
      extActive: 'Eklenti aktif',
      quickSettings: 'hızlı ayar',
      secColors: 'Renkler',
      bg: 'Arka plan', surface: 'Kart / yüzey', accent: 'Vurgu rengi', text: 'Metin',
      secScale: 'Ölçek', uiScale: 'UI ölçeği',
      scaleMode: 'Ölçek modu',
      smAuto: 'Otomatik', smOn: 'Hep açık', smOff: 'Kapalı',
      secInteract: 'Etkileşim',
      keepAlive: 'Kilitte çalmaya devam (canlı tutma)',
      playbackSpeed: 'Çalma hızı',
      audioQuality: 'Ses kalitesi',
      qFixedHigh: 'En yüksek (zorlanır)',
      kpSpeed: 'Çalma hızı',
      secExtras: 'Ekstralar',
      adBlock: 'Reklam engelleyici (beta)',
      playerCover: 'Kapak resmi (alt bar)',
      coverSize: 'Kapak boyutu',
      playerScale: 'Player boyutu',
      cacheTitle: 'Bakım (bu sekmenin önbelleği)',
      cacheUsage: 'Kullanım',
      cacheBtn: 'Önbelleği temizle',
      cacheSure: 'Emin misin? Önbellek sıfırlanır',
      cacheYes: 'Evet, temizle', cacheNo: 'Vazgeç',
      cacheDone: 'temizlendi 🧹', cacheFail: 'temizlenemedi',
      cacheNoTab: 'Spotify sekmesi açık olmalı',
      secOther: 'Diğer',
      thinScroll: 'İnce kaydırma çubuğu',
      langLabel: 'Dil',
      reset: 'Varsayılanlara dön',
      kpUiScale: 'UI ölçeği',
      secPresets: 'Hazır temalar',
      pAMOLED: 'AMOLED', pClassic: 'Klasik', pNight: 'Gece', pNeon: 'Neon',
      pBlood: 'Kan', pForest: 'Orman', pAprel: 'Aprel'
    },
    en: {
      extActive: 'Extension enabled',
      quickSettings: 'quick settings',
      secColors: 'Colors',
      bg: 'Background', surface: 'Card / surface', accent: 'Accent color', text: 'Text',
      secScale: 'Scale', uiScale: 'UI scale',
      scaleMode: 'Scale mode',
      smAuto: 'Auto', smOn: 'Always on', smOff: 'Off',
      secInteract: 'Interaction',
      keepAlive: 'Keep playing when locked (keep-alive)',
      playbackSpeed: 'Playback speed',
      audioQuality: 'Audio quality',
      qFixedHigh: 'Highest (forced)',
      kpSpeed: 'Playback speed',
      secExtras: 'Extras',
      adBlock: 'Ad blocker (beta)',
      playerCover: 'Cover art (bottom bar)',
      coverSize: 'Cover size',
      playerScale: 'Player size',
      cacheTitle: 'Maintenance (this tab\'s cache)',
      cacheUsage: 'Usage',
      cacheBtn: 'Clear cache',
      cacheSure: 'Are you sure? Cache will reset',
      cacheYes: 'Yes, clear', cacheNo: 'Cancel',
      cacheDone: 'cleared 🧹', cacheFail: 'failed',
      cacheNoTab: 'A Spotify tab must be open',
      secOther: 'Other',
      thinScroll: 'Slim scrollbars',
      langLabel: 'Language',
      reset: 'Reset to defaults',
      kpUiScale: 'UI scale',
      secPresets: 'Presets',
      pAMOLED: 'AMOLED', pClassic: 'Classic', pNight: 'Night', pNeon: 'Neon',
      pBlood: 'Blood', pForest: 'Forest', pAprel: 'Aprel'
    }
  };

  function langCode() {
    if (settings.lang === 'tr' || settings.lang === 'en') return settings.lang;
    try {
      return (navigator.language || 'en').toLowerCase().indexOf('tr') === 0 ? 'tr' : 'en';
    } catch (e) { return 'en'; }
  }
  function t(key) {
    const l = langCode();
    return (I18N[l] && I18N[l][key]) || I18N.en[key] || key;
  }

  /* ---------- ayar okuma/yazma ---------- */
  function readCache() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) { return null; }
  }
  function writeCache(c) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch (e) { /* yoksay */ }
  }
  function normalize(c) {
    const out = Object.assign({}, DEFAULTS);
    if (c) for (const k in out) if (c[k] !== undefined) out[k] = c[k];
    /* v1.5.17: bu özellikler HEP AÇIK — saklanan eski değerler ezilir */
    ['clickPlay', 'showFab', 'hideExtras'].forEach((k) => { out[k] = true; });
    return out;
  }

  let settings = normalize(readCache());
  let localSetAt = 0;

  const hasChrome =
    typeof chrome !== 'undefined' && !!(chrome.storage && chrome.storage.sync);

  function announce() {
    try { document.dispatchEvent(new CustomEvent('sx:settings')); } catch (e) { /* yoksay */ }
  }

  /* sync yazımı: kotanın taşması sessizce yutulur (uncaught rejection yok) */
  function syncSet(patch) {
    try {
      const r = chrome.storage.sync.set(patch);
      if (r && r.catch) r.catch(() => {});
    } catch (e) { /* yoksay */ }
  }

  function persist(patch) {
    localSetAt = Date.now();
    ['clickPlay', 'showFab', 'hideExtras'].forEach((k) => { delete patch[k]; });
    Object.assign(settings, patch);
    if (hasChrome) syncSet(patch);
    writeCache(settings);
    apply();
    announce();
  }

  let pendingPatch = null, pendingTimer = null;
  function persistLive(patch) {
    localSetAt = Date.now();
    Object.assign(settings, patch);
    writeCache(settings);
    apply();
    if (hasChrome) {
      pendingPatch = Object.assign(pendingPatch || {}, patch);
      if (pendingTimer) clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => {
        if (pendingPatch) { syncSet(pendingPatch); pendingPatch = null; }
      }, 900);
    }
    announce();
  }

  /* ---------- CSS enjeksiyonu ---------- */
  let styleEl = null;

  function ensureStyle() {
    if (styleEl && styleEl.isConnected) return styleEl;
    styleEl = document.createElement('style');
    styleEl.id = 'spotix-style';
    (document.head || document.documentElement).appendChild(styleEl);
    return styleEl;
  }

  function apply() {
    const css = SX.buildCSS(settings);
    if (!css) {
      if (styleEl) styleEl.textContent = '';
    } else {
      ensureStyle().textContent = css;
    }
    shellOk = shellPresent();
    applyScaleClass();
    renderFab();
    kaUpdate();
  }

  /* ---------- UI ölçeği ortamı: MEDİA QUERY KUMARINA SON ----------
     Masaüstü-site modunda pointer/width media query'leri güvenilmez.
     Bunun yerine gerçekleri ölçüyoruz:
       • navigator.maxTouchPoints > 0  → dokunmatik cihaz (telefon/tablet;
         masaüstü PC 0 raporlar) — pointer mediası ne derse desin.
       • innerWidth ≤ 1024             → dar mantıksal ekran.
     + yalnızca uygulama kabuğu varken (landing/giriş sayfası ASLA). */
  let shellOk = false;

  function isScaleEnv() {
    let touch = false;
    try { touch = (navigator.maxTouchPoints || 0) > 0; } catch (err) { /* yoksay */ }
    let sw = 0;
    try { sw = (screen && screen.width) || 0; } catch (err) { /* yoksay */ }
    /* 3 bağımsız sinyal: dokunma, dar pencere, telefon genişliği (masaüstü-site
       modu bunlardan birini BOZSA DİĞERİ tutar) */
    return touch || window.innerWidth <= 1024 || (sw > 0 && sw <= 820);
  }

  /* NİHAİ KARAR: manuel mod algılamayı EZER ('on' = algıya bakılmaksızın açılır) */
  function scaleActive() {
    if (!settings.enabled) return false;
    if ((parseInt(settings.mscale, 10) || 100) <= 100) return false;
    if (settings.scaleMode === 'on') return true;
    if (settings.scaleMode === 'off') return false;
    return isScaleEnv();
  }

  function shellPresent() {
    const cands = ['.Root__top-container', '.Root__globalNav', '.Root__bottom-bar',
      '.main-view-container', 'aside[data-testid=now-playing-bar]',
      '#global-nav-bar', '[data-testid=home-page]'];
    for (let i = 0; i < cands.length; i++) {
      try { if (document.querySelector(cands[i])) return true; } catch (err) { /* yoksay */ }
    }
    return false;
  }

  /* Ölçek: TRANSFORM TABANLI (zoom DEĞİL).
     Neden: modern Chromium'da kök zoom viewport'u KENDİ bölüyor; bizim
     100vw/z bölmeleriyle ÇİFT BÖLME → sayfa kısa kalır → altta boşluk.
     Eski sürümlerde bölme gerekiyordu (userscript'lerin dönemi) — yani
     zoom semantiği sürümden sürüme değişiyor. transform: scale()'ın
     davranışı ise donmuştur: layout JS ile TAM ekrana kurulur (px),
     görüntü ölçeklenir → boşluk/taşma matematiksel olarak imkansız. */
  function applyScaleClass() {
    const de = document.documentElement;
    if (!de) return;
    const on = scaleActive() && (settings.scaleMode === 'on' || shellOk);
    if (on) {
      const z = Math.min(Math.max((parseInt(settings.mscale, 10) || 100) / 100, 1), 4);
      de.classList.add('sx-scaled');
      de.style.zoom = '';
      de.style.transform = 'scale(' + z + ')';
      de.style.transformOrigin = 'top left';
      refreshScaleBox();
    } else {
      de.classList.remove('sx-scaled');
      de.style.transform = '';
      de.style.transformOrigin = '';
      de.style.zoom = '';
      de.style.width = '';
      de.style.height = '';
      de.style.overflow = '';
    }
  }

  /* Layout kutusu: mantıksal boyut = ekran/zoom (JS px — birim kumarı yok).
     Dönme/resize'da yeniden ölçülür.
     
     FIX v1.7.2: Portrait mode'da aşırı ölçeklenmeyi engelle.
     Dikey ekran'da max %150 cap — %400 kullanmaya izin verme (UI kırılıyor).
     Landscape'te limit yok (1–400% serbest).
  */
  /* Layout kutusu: mantıksal boyut = ekran/zoom (JS px — birim kumarı yok).
     Dönme/resize'da yeniden ölçülür.
     
     FIX v1.7.2: Portrait mode'da scaling VIEWPORT TAŞMASI'nı önceler.
     - Landscape: z doğru çalışır (sınır yok)
     - Portrait: max z = 1.8x (her şey sığıyor, player kaybı yok)
     
     Hesaplama:
       mscale  | z_landscape | z_portrait | Durum
       --------|-------------|------------|---------
       100%    | 1.0         | 1.0        | Normal
       150%    | 1.5         | 1.2        | Rahat
       250%    | 2.5         | 1.5        | Uyumlu
       400%    | 4.0         | 1.8        | Sığıyor ✅
  */
  function refreshScaleBox() {
    const de = document.documentElement;
    if (!de || !de.classList.contains('sx-scaled')) return;
    
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = h > w;
    
    let z = Math.min(Math.max((parseInt(settings.mscale, 10) || 100) / 100, 1), 4);
    
    /* Portrait'te viewport taşmasını engelle: z <= 1.8x hard limit */
    if (isPortrait) {
      z = Math.min(z, 1.8);
    }
    
    /* floor: 1px'lik yuvarlama tasmasi olmasin (327x3=981>9980 gibi) */
    de.style.width = Math.floor(w / z) + 'px';
    de.style.height = Math.floor(h / z) + 'px';
    de.style.overflow = 'hidden';
  }

  /* Kabuk SPA geç gelirse / ortam değişirse (dönme, pencere) yakala:
     kaba ama ucuz tarama — yalnız iki querySelector + class karşılaştırması */
  setInterval(() => {
    const now = shellPresent();
    if (now !== shellOk) { shellOk = now; applyScaleClass(); return; }
    if (shellOk) {
      if (scaleActive() !== document.documentElement.classList.contains('sx-scaled')) applyScaleClass();
      else refreshScaleBox();
    }
  }, 1500);

  function fabScale() {
    if (!scaleActive()) return 1;
    return Math.min(Math.max((parseInt(settings.mscale, 10) || 100) / 100, 1), 4);
  }

  /* ================= CANLI TUTMA (kilit ekranı çalması) =================
   * Chromium ses çalan sekmeleri arka plan kısıtlamasından MUAF tutar.
   * 19 kHz cılız bir ton (yetişkin kulağı duymaz) sekmenin "sesli"
   * durumunu korur → Spotify'ın MSE tamponu arka planda dolmaya
   * devam eder → kilit ekranında çalma kesilmez. */
  let kaCtx = null, kaOsc = null, kaGain = null, kaLock = null;

  function kaLockRequest() {
    try {
      if (kaLock || !navigator.wakeLock || !navigator.wakeLock.request) return;
      navigator.wakeLock.request('screen').then((l) => {
        kaLock = l;
        return l.released;
      }).catch(() => { /* reddedilirse sessizce yoksay */ });
    } catch (e) { /* desteklenmiyorsa yoksay */ }
  }

  function kaLockRelease() {
    try { if (kaLock) { kaLock.release(); kaLock = null; } } catch (e) {}
  }

  function kaStart() {
    if (kaCtx) {
      if (kaCtx.state === 'suspended') kaCtx.resume().catch(() => {});
      return;
    }
    kaLockRequest();
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      kaCtx = new AC();
      kaOsc = kaCtx.createOscillator();
      kaGain = kaCtx.createGain();
      kaGain.gain.value = 0.012;   // pratikte duyulmaz
      kaOsc.frequency.value = 19000; // ~19 kHz
      kaOsc.connect(kaGain);
      kaGain.connect(kaCtx.destination);
      kaOsc.start();
    } catch (e) { /* yoksay */ }
  }

  function kaStop() {
    kaLockRelease();
    try { if (kaOsc) kaOsc.stop(); } catch (e) {}
    try { if (kaCtx) kaCtx.close(); } catch (e) {}
    kaOsc = kaCtx = kaGain = null;
  }

  function kaUpdate() {
    (settings.enabled && settings.keepAlive) ? kaStart() : kaStop();
  }

  /* otomatik oynatma politikası: ilk dokunuşta başlat */
  window.addEventListener('pointerdown', () => {
    if (settings.enabled && settings.keepAlive) kaStart();
  }, { capture: true, passive: true });
  /* görünürken askıya düşmüşse canlandır */
  setInterval(() => {
    if (document.hidden) return;
    if (settings.enabled && settings.keepAlive && kaCtx && kaCtx.state === 'suspended') {
      kaCtx.resume().catch(() => {});
    }
  }, 5000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) kaUpdate();
  });
  /* Wake Lock tarayıcı tarafından bırakılırsa sessizce yeniden iste */
  setInterval(() => {
    if (document.hidden || !settings.enabled || !settings.keepAlive) return;
    if (!kaLock) kaLockRequest();
  }, 30000);

  /* ================= TEK TIKLA ÇAL ================= */
  let lastAutoPlay = 0;

  function onRowClick(e) {
    if (!settings.clickPlay || !settings.enabled) return;
    if (e.button !== 0) return;
    if (!(e.target instanceof Element)) return;
    const now = Date.now();
    if (now - lastAutoPlay < 450) return;
    const row = e.target.closest('div[data-testid="tracklist-row"]');
    if (!row) return;
    if (e.target.closest('button, a, input, [role="button"], [role="checkbox"], [role="menuitem"], [data-tippy-root]')) return;
    lastAutoPlay = now;
    row.dispatchEvent(new MouseEvent('dblclick', {
      bubbles: true, cancelable: true, view: window, detail: 2
    }));
  }

  /* ================= ÇALMA HIZI (slowed/nightcore) =================
   * İzole world'den <audio>/<video> elemanlarına DOĞRUDAN uygulanır
   * (DOM iki world tarafından paylaşılır → CSP buraya karışamaz).
   * preservesPitch=false → hız ile birlikte pitch de kayar:
   * %80 = slowed, %125 = nightcore. Spotify sıfırlarsa 0.4 sn'ye düzeltir. */

  function installInputHooks() {
    document.addEventListener('dblclick', (e) => {
      if (settings.enabled && settings.clickPlay && e.isTrusted) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }, { capture: true });

    document.addEventListener('click', onRowClick, { capture: true });
  }

  /* ================= REKLAM ATLAMA ================= */
  let sxAdFlag = false, sxUnlockTimer = null, sxRetry = 0;

  function sxIsAd() {
    if (document.querySelector('[data-testid="ad-label"], [aria-label*="Advertisement"], [aria-label*="Sponsored"]')) return true;
    const pBtn = document.querySelector('button[data-testid=control-button-playpause]');
    if (pBtn && pBtn.disabled) return true;
    const npBar = document.querySelector('aside[data-testid=now-playing-bar]');
    if (npBar && !document.querySelector('a[data-testid=context-item-link]')) return true;
    return false;
  }

  function sxSkipForward() {
    const btn = document.querySelector('button[data-testid=control-button-skip-forward]');
    if (btn && !btn.disabled) { btn.click(); return true; }
    return false;
  }

  function sxStopUnlock() {
    if (sxUnlockTimer) { clearInterval(sxUnlockTimer); sxUnlockTimer = null; }
    sxAdFlag = false; sxRetry = 0;
  }

  function sxTrigUnlock() {
    if (sxUnlockTimer) return;
    sxRetry = 0;
    sxUnlockTimer = setInterval(() => {
      if (!sxIsAd()) { sxStopUnlock(); return; }
      if (sxSkipForward()) { sxStopUnlock(); return; }
      sxRetry++;
      if (sxRetry >= 5) {
        sxStopUnlock();
        setTimeout(() => {
          if (settings.enabled && settings.adBlock && sxIsAd()) { sxAdFlag = true; sxTrigUnlock(); }
        }, 40000);
      }
    }, 3000);
  }

  setInterval(() => {
    if (document.hidden) return; // arka planda boşuna uyanma
    if (!settings.enabled || !settings.adBlock) return;
    if (!sxAdFlag && sxIsAd()) {
      sxAdFlag = true;
      setTimeout(() => {
        if (!settings.enabled || !settings.adBlock) { sxAdFlag = false; return; }
        if (sxAdFlag && sxIsAd()) {
          if (!sxSkipForward()) sxTrigUnlock();
          else sxAdFlag = false;
        } else sxAdFlag = false;
      }, 10000);
    }
  }, 2000);

  /* ================= NOW PLAYING VIEW KAPATMA ================= */
  function collapseNPV() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.endsWith(':toggleNowPlayingView')) {
          localStorage.setItem(k, 'false');
        }
      }
    } catch (e) { /* yoksay */ }
  }

  /* ================= SAYFA İÇİ HIZLI AYAR (FAB) ================= */
  let host = null, fabEl = null, panelEl = null, keypadEl = null, panelOpen = false;

  const SVG_NOTE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>';

  const PANEL_CSS = `
    :host{all:initial}
    *{box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
    .sx-fab{position:fixed;width:34px;height:34px;border-radius:50%;background:#101010;
      border:1.5px solid var(--acc,#1db954);display:flex;align-items:center;justify-content:center;
      cursor:pointer;opacity:.35;transition:opacity .15s,transform .15s;z-index:2147483647;
      box-shadow:0 2px 12px rgba(0,0,0,.55);touch-action:none}
    .sx-fab:hover{opacity:1;transform:scale(1.1)}
    .sx-fab svg{width:17px;height:17px;fill:var(--acc,#1db954);pointer-events:none}
    .sx-fab.off{border-color:#666}.sx-fab.off svg{fill:#666}
    .sx-panel{position:fixed;width:262px;max-height:76vh;overflow:auto;background:#141414;color:#eee;
      border:1px solid #2b2b2b;border-radius:14px;padding:12px 14px;z-index:2147483647;
      font-size:12.5px;line-height:1.4;box-shadow:0 14px 44px rgba(0,0,0,.65)}
    .sx-panel h3{margin:0 0 6px;font-size:13px;display:flex;align-items:center;gap:6px;color:#fff}
    .sx-panel h3 small{color:#777;font-weight:400;margin-left:auto}
    .sx-sec{margin:10px 0 2px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#8a8a8a}
    .sx-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:4px 0}
    .sx-row label{color:#ccc;cursor:default;flex:1 1 auto;min-width:0}
    input[type=color]{width:30px;height:22px;border:none;background:none;padding:0;cursor:pointer;border-radius:6px;flex:none}
    input[type=color]::-webkit-color-swatch-wrapper{padding:1px}
    input[type=color]::-webkit-color-swatch{border:1px solid #333;border-radius:6px}
    select.sx-sel{background:#000;color:#ddd;border:1px solid #2c2c2c;border-radius:8px;padding:4px 8px;font-size:12px}
    .sx-sw{position:relative;width:34px;height:19px;flex:none}
    .sx-sw input{opacity:0;width:100%;height:100%;position:absolute;margin:0;cursor:pointer;z-index:1}
    .sx-sw i{position:absolute;inset:0;background:#3a3a3a;border-radius:19px;transition:.15s}
    .sx-sw i:before{content:'';position:absolute;width:15px;height:15px;border-radius:50%;background:#fff;top:2px;left:2px;transition:.15s}
    .sx-sw input:checked + i{background:var(--acc,#1db954)}
    .sx-sw input:checked + i:before{transform:translateX(15px)}
    .sx-step{display:flex;align-items:center;gap:4px;flex:none}
    .sx-sbtn{width:28px;height:26px;flex:none;display:flex;align-items:center;justify-content:center;
      background:#000;border:1px solid #2c2c2c;color:#ddd;border-radius:6px;
      font-size:15px;line-height:1;padding:0;cursor:pointer;touch-action:manipulation}
    .sx-sbtn:active{background:#222;color:#fff}
    .sx-val{min-width:64px;height:26px;flex:none;display:flex;align-items:center;justify-content:center;
      background:#000;border:1px solid #2c2c2c;color:#fff;
      border-radius:6px;font-size:12px;padding:0 6px;cursor:pointer;touch-action:manipulation}
    .sx-val:active{background:#1a2a1f}
    .sx-keypad{position:fixed;width:234px;background:#101010;border:1px solid #2b2b2b;border-radius:14px;
      padding:10px;z-index:2147483647;box-shadow:0 14px 44px rgba(0,0,0,.65)}
    .sx-kp-head{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:#999}
    .sx-kp-head button{background:none;border:none;color:#999;font-size:15px;cursor:pointer;padding:2px 6px}
    .sx-kp-head button:hover{color:#fff}
    .sx-kp-disp{margin-top:6px;background:#000;border:1px solid #2c2c2c;border-radius:8px;
      padding:7px 10px;font-size:17px;color:#fff;text-align:right;min-height:22px}
    .sx-kp-disp small{color:#666;font-size:14px}
    .sx-kp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px}
    .sx-kp-grid button{height:38px;background:#1c1c1c;border:1px solid #2c2c2c;color:#eee;
      border-radius:8px;font-size:16px;cursor:pointer;touch-action:manipulation}
    .sx-kp-grid button:active{background:#2c2c2c}
    .sx-kp-ok{background:var(--acc,#1db954) !important;color:#04140a !important;font-weight:700}
    .sx-reset{margin-top:10px;width:100%;background:#000;color:#bbb;border:1px solid #2c2c2c;border-radius:8px;
      padding:6px 0;font-size:12px;cursor:pointer}
    .sx-reset:hover{color:#fff;border-color:var(--acc,#1db954)}
    select.sx-sel:disabled{opacity:.5}
  `;

  function panelHTML() {
    const row = (id, labelKey) =>
      `<div class="sx-row"><label for="${id}" data-i18n="${labelKey}">${t(labelKey)}</label>
        <span class="sx-sw"><input type="checkbox" id="${id}"><i></i></span></div>`;
    const color = (id, labelKey) =>
      `<div class="sx-row"><label for="${id}" data-i18n="${labelKey}">${t(labelKey)}</label><input type="color" id="${id}"></div>`;
    const stepper = (id, labelKey) =>
      `<div class="sx-row" id="${id}Row"><label data-i18n="${labelKey}">${t(labelKey)}</label>
        <span class="sx-step">
          <button type="button" class="sx-sbtn" data-step="${id}" data-dir="-1">−</button>
          <button type="button" class="sx-val" id="${id}Val" data-kp="${id}"></button>
          <button type="button" class="sx-sbtn" data-step="${id}" data-dir="1">+</button>
        </span></div>`;

    return `
      <style>${PANEL_CSS}</style>
      <div class="sx-fab" id="sx-fab" title="SpotiX">${SVG_NOTE}</div>
      <div class="sx-panel" id="sx-panel" hidden>
        <h3>🎵 SpotiX <small data-i18n="quickSettings">${t('quickSettings')}</small></h3>
        ${row('sx-enabled', 'extActive')}
        <div class="sx-sec" data-i18n="secColors">${t('secColors')}</div>
        ${color('sx-bg', 'bg')}
        ${color('sx-surface', 'surface')}
        ${color('sx-accent', 'accent')}
        ${color('sx-text', 'text')}
        <div class="sx-sec" data-i18n="secScale">${t('secScale')}</div>
        ${stepper('sx-ms', 'uiScale')}
        <div class="sx-row"><label for="sx-scaleMode" data-i18n="scaleMode">${t('scaleMode')}</label>
          <select id="sx-scaleMode" class="sx-sel">
            <option value="auto" data-i18n="smAuto">${t('smAuto')}</option>
            <option value="on" data-i18n="smOn">${t('smOn')}</option>
            <option value="off" data-i18n="smOff">${t('smOff')}</option>
          </select>
        </div>
        <div class="sx-sec" data-i18n="secInteract">${t('secInteract')}</div>
        ${row('sx-keepAlive', 'keepAlive')}
        <div class="sx-sec" data-i18n="secExtras">${t('secExtras')}</div>
        ${row('sx-adBlock', 'adBlock')}
        ${row('sx-playerCover', 'playerCover')}
        ${stepper('sx-cv', 'coverSize')}
        ${stepper('sx-ps', 'playerScale')}
        ${stepper('sx-sp', 'playbackSpeed')}
        <div class="sx-row"><label data-i18n="audioQuality">${t('audioQuality')}</label>
          <select class="sx-sel" disabled><option data-i18n="qFixedHigh">${t('qFixedHigh')}</option></select>
        </div>
        <div class="sx-sec" data-i18n="secOther">${t('secOther')}</div>
        ${row('sx-thinScroll', 'thinScroll')}
        <div class="sx-row"><label for="sx-lang" data-i18n="langLabel">${t('langLabel')}</label>
          <select id="sx-lang" class="sx-sel">
            <option value="auto">Auto</option>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>
        <button class="sx-reset" id="sx-reset" data-i18n="reset">${t('reset')}</button>
      </div>
      <div class="sx-keypad" id="sx-keypad" hidden>
        <div class="sx-kp-head"><span id="sx-kp-title"></span>
          <button type="button" id="sx-kp-close" title="✕">✕</button></div>
        <div class="sx-kp-disp" id="sx-kp-disp"></div>
        <div class="sx-kp-grid">
          <button type="button" data-k="1">1</button><button type="button" data-k="2">2</button><button type="button" data-k="3">3</button>
          <button type="button" data-k="4">4</button><button type="button" data-k="5">5</button><button type="button" data-k="6">6</button>
          <button type="button" data-k="7">7</button><button type="button" data-k="8">8</button><button type="button" data-k="9">9</button>
          <button type="button" data-k="back">⌫</button><button type="button" data-k="0">0</button><button type="button" data-k="ok" class="sx-kp-ok">✓</button>
        </div>
      </div>
    `;
  }

  function applyI18n() {
    if (!host || !host.isConnected) return;
    const root = host.shadowRoot;
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  }

  function fabPos() {
    try {
      const p = JSON.parse(localStorage.getItem(FAB_POS_KEY) || 'null');
      if (p && typeof p.x === 'number' && typeof p.y === 'number') return p;
    } catch (e) { /* yoksay */ }
    return null;
  }

  function placeFab() {
    if (!fabEl) return;
    const fz = fabScale() || 1;
    /* p.x/p.y CSS-px (zoom'suz) → sınırlar da CSS-px uzayında kıyaslanır */
    const maxX = Math.max(4, window.innerWidth / fz - 34 - 4);
    const maxY = Math.max(4, window.innerHeight / fz - 34 - 4);
    const p = fabPos();
    if (p) {
      const x = Math.min(Math.max(4, p.x), maxX);
      const y = Math.min(Math.max(4, p.y), maxY);
      fabEl.style.left = x + 'px';
      fabEl.style.top = y + 'px';
      fabEl.style.right = 'auto';
      fabEl.style.bottom = 'auto';
    } else {
      fabEl.style.left = 'auto';
      fabEl.style.right = '12px';
      fabEl.style.top = 'auto';
      fabEl.style.bottom = '110px';
    }
  }

  /* ---------- tuş takımı ---------- */
  const LIMITS = {
    'sx-ms': { min: 100, max: 400, step: 1, key: 'mscale', unit: '%', tk: 'kpUiScale' },
    'sx-ps': { min: 60, max: 300, step: 5, key: 'playerScale', unit: '%', tk: 'kpPlayerScale' },
    'sx-sp': { min: 50, max: 150, step: 5, key: 'playbackSpeed', unit: '%', tk: 'kpSpeed' },
    'sx-cv': { min: 24, max: 120, step: 2, key: 'coverSize', unit: 'px', tk: 'kpCoverSize' }
  };

  let kpState = null;

  function fmtVal(id, v) {
    return v + (LIMITS[id].unit === '%' ? '%' : (LIMITS[id].unit || ''));
  }

  function renderKeypad() {
    if (!kpState || !keypadEl) return;
    const root = keypadEl.getRootNode();
    const disp = root.getElementById('sx-kp-disp');
    const title = root.getElementById('sx-kp-title');
    title.textContent = t(LIMITS[kpState.id].tk);
    if (kpState.buf === '') {
      const cur = settings[LIMITS[kpState.id].key];
      disp.innerHTML = '<small>' + cur + LIMITS[kpState.id].unit + ' →</small>';
    } else {
      disp.textContent = kpState.buf + LIMITS[kpState.id].unit;
    }
  }

  function openKeypad(id) {
    kpState = { id, buf: '' };
    keypadEl.hidden = false;
    renderKeypad();
    positionKeypad();
  }

  function closeKeypad() {
    kpState = null;
    if (keypadEl) keypadEl.hidden = true;
  }

  function keypadPress(k) {
    if (!kpState) return;
    if (k === 'back') { kpState.buf = kpState.buf.slice(0, -1); }
    else if (k === 'ok') { keypadCommit(); return; }
    else if (kpState.buf.length < 4) { kpState.buf += k; }
    renderKeypad();
  }

  function keypadCommit() {
    if (!kpState) { closeKeypad(); return; }
    const L = LIMITS[kpState.id];
    let v = parseInt(kpState.buf, 10);
    if (isNaN(v)) v = settings[L.key];
    v = Math.min(Math.max(v, L.min), L.max);
    persist({ [L.key]: v });
    closeKeypad();
  }

  function bindStepper(root, btn) {
    const id = btn.dataset.step;
    const dir = parseInt(btn.dataset.dir, 10);
    const L = LIMITS[id];
    let tm = null, rep = null;

    const stop = () => { if (tm) clearTimeout(tm); if (rep) clearInterval(rep); tm = rep = null; };
    const tick = () => {
      const cur = settings[L.key];
      const v = Math.min(Math.max(cur + dir * L.step, L.min), L.max);
      if (v !== cur) {
        persistLive({ [L.key]: v });
        const valBtn = root.getElementById(id + 'Val');
        if (valBtn) valBtn.textContent = fmtVal(id, v);
      }
    };
    btn.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return;
      e.preventDefault();
      tick();
      tm = setTimeout(() => { rep = setInterval(tick, 90); }, 420);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => btn.addEventListener(ev, stop));
  }

  function ensureHost() {
    if (host && host.isConnected) return host;
    host = document.createElement('div');
    host.id = 'spotix-fab-host';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = panelHTML();
    (document.documentElement || document.body).appendChild(host);

    fabEl = root.getElementById('sx-fab');
    panelEl = root.getElementById('sx-panel');
    keypadEl = root.getElementById('sx-keypad');

    root.addEventListener('pointerdown', (e) => {
      const b = e.target.closest && e.target.closest('button');
      if (b) e.preventDefault();
    });

    /* --- sürüklenebilir FAB --- */
    let drag = null;
    fabEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const r = fabEl.getBoundingClientRect();
      drag = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, w: r.width, h: r.height, moved: false, id: e.pointerId };
      fabEl.setPointerCapture(e.pointerId);
    });
    fabEl.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      const fz = fabScale() || 1;
      const x = Math.min(Math.max(4, drag.ox + dx), window.innerWidth - drag.w - 4);
      const y = Math.min(Math.max(4, drag.oy + dy), window.innerHeight - drag.h - 4);
      fabEl.style.left = (x / fz) + 'px';
      fabEl.style.top = (y / fz) + 'px';
      fabEl.style.right = 'auto';
      fabEl.style.bottom = 'auto';
    });
    fabEl.addEventListener('pointerup', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) {
        const r = fabEl.getBoundingClientRect();
        const fz = fabScale() || 1;
        try { localStorage.setItem(FAB_POS_KEY, JSON.stringify({ x: r.left / fz, y: r.top / fz })); } catch (err) {}
      } else {
        togglePanel();
      }
      drag = null;
    });
    fabEl.addEventListener('pointercancel', () => { drag = null; });

    root.querySelectorAll('.sx-sbtn').forEach((btn) => bindStepper(root, btn));
    root.querySelectorAll('.sx-val').forEach((btn) =>
      btn.addEventListener('click', () => openKeypad(btn.dataset.kp)));
    root.querySelectorAll('.sx-keypad [data-k]').forEach((btn) =>
      btn.addEventListener('click', () => keypadPress(btn.dataset.k)));
    root.getElementById('sx-kp-close').addEventListener('click', closeKeypad);

    /* --- panel kontrolleri --- */
    const bindSwitch = (id, key) => {
      const el = root.getElementById(id);
      el.addEventListener('change', () => persist({ [key]: el.checked }));
    };
    const bindColor = (id, key) => {
      const el = root.getElementById(id);
      el.addEventListener('input', () => persist({ [key]: el.value }));
    };

    bindSwitch('sx-enabled', 'enabled');
    bindColor('sx-bg', 'bg');
    bindColor('sx-surface', 'surface');
    bindColor('sx-accent', 'accent');
    bindColor('sx-text', 'text');

    bindSwitch('sx-thinScroll', 'thinScroll');
    bindSwitch('sx-keepAlive', 'keepAlive');
    bindSwitch('sx-adBlock', 'adBlock');
    bindSwitch('sx-playerCover', 'playerCover');

    root.getElementById('sx-scaleMode').addEventListener('change', (e) =>
      persist({ scaleMode: e.target.value }));

    root.getElementById('sx-lang').addEventListener('change', (e) =>
      persist({ lang: e.target.value }));

    root.getElementById('sx-reset').addEventListener('click', () => {
      persist(Object.assign({}, DEFAULTS));
      syncPanel();
    });

    document.addEventListener('pointerdown', (e) => {
      if (!panelOpen) return;
      const path = e.composedPath ? e.composedPath() : [];
      if (!path.includes(host)) { togglePanel(false); closeKeypad(); }
    }, true);

    return host;
  }

  function syncPanel() {
    if (!host || !host.isConnected) return;
    const root = host.shadowRoot;
    const set = (id, val) => { const el = root.getElementById(id); if (el) el.value = val; };
    const chk = (id, val) => { const el = root.getElementById(id); if (el) el.checked = !!val; };

    chk('sx-enabled', settings.enabled);
    set('sx-bg', settings.bg);
    set('sx-surface', settings.surface);
    set('sx-accent', settings.accent);
    set('sx-text', settings.text);
    root.getElementById('sx-msVal').textContent = fmtVal('sx-ms', settings.mscale);
    chk('sx-thinScroll', settings.thinScroll);
    chk('sx-keepAlive', settings.keepAlive);
    chk('sx-adBlock', settings.adBlock);
    chk('sx-playerCover', settings.playerCover);
    root.getElementById('sx-cvVal').textContent = fmtVal('sx-cv', settings.coverSize);
    root.getElementById('sx-psVal').textContent = fmtVal('sx-ps', settings.playerScale);
    root.getElementById('sx-spVal').textContent = fmtVal('sx-sp', settings.playbackSpeed);
    root.getElementById('sx-cvRow').style.display = settings.playerCover ? '' : 'none';
    set('sx-scaleMode', settings.scaleMode || 'auto');
    set('sx-lang', settings.lang);

    fabEl.classList.toggle('off', !settings.enabled);
    fabEl.style.setProperty('--acc', settings.accent);
    panelEl.style.setProperty('--acc', settings.accent);
    keypadEl.style.setProperty('--acc', settings.accent);
  }

  function positionPanel() {
    if (!fabEl || !panelEl) return;
    const fz = fabScale() || 1;
    const r = fabEl.getBoundingClientRect();
    const p = panelEl.getBoundingClientRect();
    let left = Math.min(Math.max(8, r.left + r.width / 2 - p.width / 2), Math.max(8, window.innerWidth - p.width - 8));
    let top = r.top - p.height - 10;
    if (top < 8) top = r.bottom + 10;
    top = Math.max(8, Math.min(top, Math.max(8, window.innerHeight - p.height - 8)));
    left = Math.max(8, left);
    panelEl.style.left = (left / fz) + 'px';
    panelEl.style.top = (top / fz) + 'px';
  }

  function positionKeypad() {
    if (!keypadEl || keypadEl.hidden || !panelEl) return;
    const fz = fabScale() || 1;
    const pr = panelEl.getBoundingClientRect();
    const kw = 234 * fz, kh = 320 * fz;
    const left = Math.max(8, Math.min(Math.max(8, pr.left + (pr.width - kw) / 2), window.innerWidth - kw - 8));
    const top = Math.max(8, Math.min(pr.top + 44, Math.max(8, window.innerHeight - kh - 8)));
    keypadEl.style.left = (left / fz) + 'px';
    keypadEl.style.top = (top / fz) + 'px';
  }

  function togglePanel(force) {
    panelOpen = force !== undefined ? force : !panelOpen;
    if (panelOpen) {
      ensureHost();
      syncPanel();
      panelEl.hidden = false;
      positionPanel();
    } else {
      closeKeypad();
      panelEl.hidden = true;
    }
  }

  function renderFab() {
    const visible = settings.enabled && settings.showFab;
    if (!visible) {
      if (host) host.style.display = 'none';
      return;
    }
    ensureHost();
    host.style.display = '';
    const fz = fabScale();
    /* görsel ölçek html zoom'undan gelir — fab/panel'e ikinci zoom VURULMAZ */
    /* zoom ile çarpılan max-height'ı telafi et: görsel yükseklik ~76vh kalır */
    panelEl.style.maxHeight = (76 / (fz || 1)) + 'vh';
    placeFab();
    syncPanel();
    applyI18n();
    if (panelOpen) {
      panelEl.hidden = false;
      positionPanel();
      positionKeypad();
    }
  }

  /* ================= BAŞLAT ================= */

  /* ---------- BAKIM: Spotify önbelleği (sayfa origin'i üzerinden) ---------- */
  if (hasChrome && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, snd, sendResponse) => {
      if (!msg || typeof msg.type !== 'string') return;
      const est = async () => {
        try { const e = await navigator.storage.estimate(); return e.usage || 0; } catch (e) { return 0; }
      };
      if (msg.type === 'sx-cache-estimate') {
        (async () => {
          try {
            const usage = await est();
            let cnt = 0;
            try { if (window.caches) cnt = (await caches.keys()).length; } catch (e) {}
            sendResponse({ ok: true, usage, caches: cnt });
          } catch (e) { sendResponse({ ok: false }); }
        })();
        return true;
      }
      if (msg.type === 'sx-cache-clear') {
        (async () => {
          try {
            const before = await est();
            let n = 0;
            try {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
              n = keys.length;
            } catch (e) {}
            const after = await est();
            sendResponse({ ok: true, cleared: n, freed: Math.max(0, before - after) });
          } catch (e) { sendResponse({ ok: false }); }
        })();
        return true;
      }
    });
  }

  apply();
  installInputHooks();
  collapseNPV();
  announce();
  document.addEventListener('DOMContentLoaded', () => { shellOk = shellPresent(); applyScaleClass(); });
  window.addEventListener('load', () => { shellOk = shellPresent(); applyScaleClass(); });

  if (hasChrome) {
    chrome.storage.sync.get(DEFAULTS, (stored) => {
      settings = normalize(stored);
      writeCache(settings);
      apply();
      announce();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      for (const k in settings) {
        if (changes[k] && changes[k].newValue !== undefined) settings[k] = changes[k].newValue;
      }
      ['clickPlay', 'showFab', 'hideExtras'].forEach((k) => { settings[k] = true; });
      writeCache(settings);
      apply();
      announce();
      if (Date.now() - localSetAt > 300) syncPanel();
    });
  }

  /* açılış: hız ≠100 ise uygula ve kısaca bildir */
  if ((parseInt(settings.playbackSpeed, 10) || 100) !== 100) {
  }

  /* döndürme/boyut değişiminde FAB + panel yerinde kalsın */
  window.addEventListener('resize', () => {
    refreshScaleBox();
    if (!host || !host.isConnected) return;
    placeFab();
    if (panelOpen) { positionPanel(); positionKeypad(); }
  });
})();
