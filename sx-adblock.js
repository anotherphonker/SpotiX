/* ============================================================
 * SpotiX — Reklam engelleyici (ağ katmanı)
 * Bu script MAIN world'de çalışır (sayfanın kendi JS bağlamı):
 * fetch/XHR isteklerini reklam alan adlarına göre keser.
 * Aç/kapa: content.js ile aynı localStorage anahtarı üzerinden;
 * aynı sekmede 'sx:settings' DOM olayıyla canlı senkron olur.
 * ============================================================ */
(function () {
  'use strict';

  const KEY = 'sx-settings-v1';

  const AD_DOMAINS = [
    'adstudio-assets.scdn.co', 'adxcel.com', 'amillionads.com',
    'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
    'ads.spotify.com', 'heads.sp.advertising.com', 'akamaized.net/audio/',
    'pixel.spotify.com', 'analytics.spotify.com', 'spclient.wg.spotify.com/ad-logic',
    'spclient.wg.spotify.com/ads', 'spclient.wg.spotify.com/budgets',
    'api.spotify.com/v1/ads', 'adeventtracker.spotify.com'
  ];

  function isAdUrl(url) {
    try {
      const s = typeof url === 'string' ? url : url.toString();
      for (const d of AD_DOMAINS) if (s.includes(d)) return true;
    } catch (e) { /* yoksay */ }
    return false;
  }

  let hooked = false;
  let _fetch = null, _xhrOpen = null, _xhrSend = null;

  function install() {
    if (hooked || typeof window.fetch !== 'function') return;
    hooked = true;

    _fetch = window.fetch;
    window.fetch = function (input, init) {
      if (isAdUrl(input)) return Promise.resolve(new Response('', { status: 200 }));
      return _fetch.apply(this, arguments);
    };

    _xhrOpen = XMLHttpRequest.prototype.open;
    _xhrSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      if (isAdUrl(url)) this.__sxBlocked = true;
      return _xhrOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      if (this.__sxBlocked) return;
      return _xhrSend.apply(this, arguments);
    };
  }

  function uninstall() {
    if (!hooked) return;
    hooked = false;
    try {
      if (_fetch) window.fetch = _fetch;
      if (_xhrOpen) XMLHttpRequest.prototype.open = _xhrOpen;
      if (_xhrSend) XMLHttpRequest.prototype.send = _xhrSend;
    } catch (e) { /* yoksay */ }
  }

  function refresh() {
    let want = false;
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || 'null');
      want = !!(s && s.adBlock);
    } catch (e) { /* yoksay */ }
    if (want) install(); else uninstall();
  }

  /* diğer sekmelerden gelen localStorage değişikliği */
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key === KEY) refresh();
  });
  /* aynı sekmede content script'in bildirdiği ayar değişikliği */
  document.addEventListener('sx:settings', refresh);

  refresh();
})();
