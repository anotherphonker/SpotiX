/* ============================================================
 * SpotiX — CSS Motoru
 * Renk hesabı, tema CSS'i, dokunmatik UI ölçeği ve varsayılan
 * player özelleştirmesi burada üretilir.
 * ============================================================ */
(function (g) {
  'use strict';

  /* ---------- Varsayılan ayarlar ---------- */
  const DEFAULTS = {
    enabled: true,
    bg: '#000000',        // arka plan (AMOLED siyah)
    surface: '#0d0d0d',   // kart / yüzey
    accent: '#1db954',    // vurgu rengi
    text: '#ffffff',      // metin
    scaleMode: 'auto',    // UI ölçeği modu: auto (ölç) | on (hep açık) | off
    mscale: 135,          // UI ölçeği (%) — dokunmatik cihazda uygulanır; 100 = native
    playerScale: 100,     // alt bar (player) boyutu (%) — UI ölçeğinden bağımsız
    playerCover: true,    // alt bardaki kapak resmi görünsün mü
    coverSize: 48,        // kapak resmi boyutu (px)
    thinScroll: true,     // ince kaydırma çubuğu
    hideExtras: true,     // SABİT: hep açık (v1.5.18) — banner/indir gizle
    adBlock: true,        // reklam engelleyici (ağ + DOM)
    showFab: true,        // SABİT: hep açık (v1.5.17)
    clickPlay: true,      // SABİT: hep açık (v1.5.17) — tek tık = çal
    keepAlive: true,      // kilit ekranında çalmayı canlı tut (duyulmaz ton)
    playbackSpeed: 100,   // çalma hızı % (pitch birlikte) — 80 slowed, 125 nightcore
    audioQuality: 'high', // SABİT: her zaman en yüksek zorlanır (v1.5.15)
    lang: 'auto'          // arayüz dili: auto | tr | en
  };

  /* ---------- Renk yardımcıları ---------- */
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

  function hex2rgb(h) {
    h = String(h || '').replace('#', '').trim();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return [0, 0, 0];
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16)
    ];
  }

  const rgb2hex = (r, gg, b) =>
    '#' + [r, gg, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');

  /* h1 -> h2 yönünde k kadar karıştır */
  function mix(h1, h2, k) {
    const a = hex2rgb(h1), b = hex2rgb(h2);
    return rgb2hex(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
  }
  const lighten = (h, k) => mix(h, '#ffffff', k);

  /* metin için vurgu üstü kontrast renk */
  function accentForeground(h) {
    const [r, gg, b] = hex2rgb(h);
    const lum = (0.2126 * r + 0.7152 * gg + 0.0722 * b) / 255;
    return lum > 0.55 ? '#0f0f0f' : '#ffffff';
  }

  /* ============================================================
   * TEMA CSS'i
   * ============================================================ */
  function themeCSS(c) {
    const hover = lighten(c.surface, 0.08);
    const press = lighten(c.surface, 0.16);
    const bSub = lighten(c.bg, 0.10);
    const bBase = lighten(c.bg, 0.22);
    const sub = mix(c.text, c.bg, 0.30);
    const accB = lighten(c.accent, 0.15);
    const accD = mix(c.accent, '#000000', 0.25);
    const fg = accentForeground(c.accent);

    return `
/* ===== SpotiX tema ===== */
body{background:${c.bg} !important}
:root,.encore-dark-theme{
  --sx-accent:${c.accent};
  --sx-bg:${c.bg};
  --background-base:${c.bg} !important;
  --background-highlight:${hover} !important;
  --background-press:${press} !important;
  --background-elevated-base:${c.surface} !important;
  --background-elevated-highlight:${hover} !important;
  --background-elevated-press:${press} !important;
  --background-tinted-base:${c.surface} !important;
  --background-tinted-highlight:${hover} !important;
  --background-tinted-press:${press} !important;
  --background-unsafe-for-small-text-base:${c.bg} !important;
  --background-unsafe-for-small-text-highlight:${c.surface} !important;
  --border-subdued:${bSub} !important;
  --border-base:${bBase} !important;
  --text-base:${c.text} !important;
  --text-subdued:${sub} !important;
  --text-positive:${c.accent} !important;
  --text-bright-accent:${accB} !important;
  --essential-base:${c.text} !important;
  --essential-subdued:${sub} !important;
  --essential-positive:${c.accent} !important;
  --essential-bright-accent:${accB} !important;
}
.encore-bright-accent-theme{
  --background-base:${c.accent} !important;
  --background-highlight:${accB} !important;
  --background-press:${accD} !important;
  --background-tinted-base:${accB} !important;
  --background-tinted-highlight:${lighten(c.accent, 0.30)} !important;
  --background-tinted-press:${c.accent} !important;
  --text-base:${fg} !important;
  --text-subdued:${fg} !important;
  --essential-base:${fg} !important;
  --essential-subdued:${fg} !important;
}
.main-view-container,.main-view-container__scroll-node,
section[data-testid=home-page],section[data-testid=home-page]>div{
  background:${c.bg} !important;
  background-image:none !important;
}
aside[data-testid=now-playing-bar]{background:${c.bg} !important;box-shadow:0 0 0 transparent !important;border-radius:12px 12px 0 0 !important}
html,body,.Root__top-container,.Root__bottom-bar{background:${c.bg} !important}
.Root__bottom-bar{background:${c.bg} !important;border-radius:12px 12px 0 0 !important}
.YourLibraryX{background:${c.bg} !important}
#global-nav-bar{background:${c.bg} !important}
div[data-testid=tracklist-row] button:hover{color:${c.accent} !important}
div[data-testid="tracklist-row"],div[data-testid="grid-container"]>div{transition:background .15s ease !important}
`;
  }

  /* ============================================================
   * VARSAYILAN PLAYER ÖZELLEŞTİRME (kapak göster/gizle + boyut)
   * ============================================================ */
  function playerCSS(c) {
    const cv = Math.min(Math.max(parseInt(c.coverSize, 10) || 48, 24), 120);
    const ps = Math.min(Math.max(parseInt(c.playerScale, 10) || 100, 60), 300) / 100;
    let out = '\n/* ===== SpotiX player ===== */\n';
    if (ps > 1.005 || ps < 0.995) {
      out += 'html aside[data-testid=now-playing-bar]>div:first-child{zoom:' + ps.toFixed(3) + ' !important}\n';
    }
    if (!c.playerCover) {
      out += 'html div[data-testid=now-playing-widget]>div:first-child{display:none !important}\n';
      return out;
    }
    out += 'html aside[data-testid=now-playing-bar]>div:first-child{height:auto !important;min-height:0 !important}\n'
      + 'html div[data-testid=now-playing-widget]>div:first-child{display:flex !important;align-items:center;flex-shrink:0}\n'
      + 'html div[data-testid=now-playing-widget] div[data-testid=CoverSlotCollapsed__container]{display:flex !important;align-items:center !important;flex-shrink:0 !important;margin-right:8px !important}\n'
      + 'html div[data-testid=now-playing-widget] div[data-testid=CoverSlotCollapsed__container] img,\n'
      + 'html div[data-testid=now-playing-widget] div[data-testid=CoverSlotCollapsed__container] div[style*="width"]{width:' + cv + 'px !important;height:' + cv + 'px !important;border-radius:6px !important}\n';
    return out;
  }

  /* "%p" belirtecini gerçek önekle değiştir (şablonda %p'den sonra zaten boşluk var) */
  function prefixCss(css, pre) {
    return css.split('%p').join(pre);
  }

  /* ============================================================
   * ANA ÜRETİCİ
   * ============================================================ */
  function buildCSS(userSettings) {
    const c = Object.assign({}, DEFAULTS, userSettings || {});
    if (!c.enabled) return '';

    let css = themeCSS(c);

    if (c.thinScroll) {
      css += `
/* ===== ince kaydırma çubuğu ===== */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:${lighten(c.bg, 0.22)};border-radius:2px}
::-webkit-scrollbar-track{background:transparent}
.os-scrollbar{--os-size:5px !important}
`;
    }

    if (c.hideExtras) {
      css += `
/* ===== gereksiz ögeler ===== */
div[data-encore-id=banner],#global-nav-bar a[href="/download"],button[data-testid=fullscreen-mode-button],div.main-view-container__mh-footer-container{display:none !important}
`;
    }

    if (c.adBlock) {
      css += `
/* ===== reklam ögeleri ===== */
[data-testid=advertisement],[data-testid=ad-container],[data-testid=sponsor-card],[data-testid=takeover-overlay],[data-testid=upgrade-button],[data-testid=ad-label],div[aria-label=Advertisement],div[aria-label=Sponsored],iframe[src*="doubleclick"],iframe[src*="adstudio"]{display:none !important}
`;
    }

    /* satır başı oynatma simgeleri (▶ / ⏸ / ekolayzer) — çalan şarkı renkten belli */
    css += '\nhtml div[data-testid=tracklist-row] [data-testid=playing-icon],\nhtml div[data-testid=tracklist-row] [data-testid=pause-icon],\nhtml div[data-testid=tracklist-row] [data-testid=play-icon],\nhtml div[data-testid=tracklist-row] button[data-testid=play-button],\nhtml div[data-testid=tracklist-row]>div:first-child svg,\nhtml div[data-testid=tracklist-row]>div:first-child button{display:none !important}\n';

    /* varsayılan player özelleştirme (global) */
    css += playerCSS(c);

    /* perf: ağır blur filtreleri kapalı (zayıf GPU rahatlar) */
    css += '\naside[data-testid=now-playing-bar],#global-nav-bar>div{backdrop-filter:none !important;-webkit-backdrop-filter:none !important}\n';


    /* UI ölçeği: content.js kullanıcının doğrulanmış formülüyle
       (zoom + 100vw/z + 100vh/z) html/body'ye INLINE uygular. */
    /* UI ölçeği content.js'te transform:scale ile INLINE uygulanır.
       Buradaki yardımcılar kutu zincirini TAM ekrana gerer (alt bar dipte
       kilitli) — zoom yok, birim kumarı yok, sürüm bağımsız. */
    if ((parseInt(c.mscale, 10) || 100) > 100) {
      css += '\n/* ===== SpotiX UI ölçeği (html.sx-scaled kapılı) ===== */\n' +
        'html.sx-scaled body{margin:0 !important;width:100% !important;height:100% !important;overflow:hidden !important}\n' +
        'html.sx-scaled #main,html.sx-scaled .Root__top-container{width:100% !important;height:100% !important;max-width:none !important;max-height:none !important}\n';
    }

    return css;
  }

  /* dışa aç */
  g.SX = { DEFAULTS, buildCSS, mix, lighten, hex2rgb, rgb2hex };
})(typeof globalThis !== 'undefined' ? globalThis : this);
