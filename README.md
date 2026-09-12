# SpotiX 🎵

**Spotify Web Player** için Vivaldi (Masaüstü **ve** Android) + Chrome tabanlı tarayıcı eklentisi: renk temaları, dokunmatik UI ölçeği, pitch'li çalma hızı, zorlanmış en yüksek ses kalitesi, kilitte çalmaya devam ve dahası — **Türkçe/İngilizce** arayüz.

> Extensions for Spotify Web Player: themes, touch UI scale (100–400%), real slowed/nightcore speed, forced-highest audio quality, keep-playing-on-lock. TR/EN UI.

---

## ✨ Özellikler

- 🎨 **Temalar**: AMOLED, Klasik, Aprel, Gece, Neon, Kan, Orman + özel renkler (bg/yüzey/vurgu/metin)
- 📱 **UI ölçeği %100–400**: telefon/tablet'te arayüz büyütme (masaüstü site modu dahil) — masaüstü düzeni hiç bozulmaz; Spotify Connect, kuyruk ve çalma listeleri native akışında çalışır · büyütülen arayüz **ekranı tam doldurur**, sağa sola/aşağı taşmaz (native tarayıcı zoomu gibi akar) · **Ölçek modu**: Otomatik / Hep açık / Kapalı — cihaz algılamazsa "Hep açık" garantidir
- 🖼️ **Player**: kapak göster/gizle, kapak boyutu 24–120 px, player ölçeği %60–300
- 🐌 **Çalma hızı %50–150** — pitch birlikte değişir (gerçek slowed/nightcore), %100 = tam native reset, kilitte/sekme değişiminde hız geri konur
- 🔊 **Ses kalitesi**: sabit mod — **hesabına izin verilen EN YÜKSEK format zorlanır** (arayüzde grili "En yüksek (zorlanır)")
- 🔒 **Kilitte çalmaya devam**: duyulmaz ton + Wake Lock (Nothing OS CMF Phone 1 üzerinde test edildi; Vivaldi pil ayarı "kısıtlanmamış" önerilir)
- 👆 **Satıra tek tıkla çal** (daima açık) • **Serbest zoom**: sayfa ölçekleme engellenmez, tarayıcı zoom'u tamamen senin kontrolünde
- 🧹 **Bakım**: Spotify önbelleğini eklenti içinden temizle — önce **"Emin misin?"** onayı (Spotify sekmesi açık olmalı)
- ⚡ **Performans**: arka plan sekmede boşa dönen döngüler durdurulur, ağır blur filtreleri kapatılır, ölü kod ayıklanmıştır
- 🖤 **Kenar şeritsiz tuval**: sayfanın alt zemini tema rengine boyanır; player köşeleri yuvarlak — siyah çerçeve kalıntısı yok
- 🚫 **Reklam engelleyici (BETA)** + banner/"İndir" çağrılarını gizleme (daima açık)
- 🎛️ Ayarlar hem **popup**'ta hem sayfa içi **FAB panelinde**; keypad ile hassas giriş

### ⚠️ Ses kalitesi gerçeği (web)
Web player'da tavan: **Free ≈128 kbps, Premium ≈256 kbps** (320 web'de sunucu tarafından verilmez). "En yüksek zorlanır" = hesabının izin verdiğinin tepesini talep eder; sunucu kotasının üstüne çıkmak hiçbir eklentinin eli değmez.

### 💡 Adblocker önerisi
SpotiX'in reklam engelleyicisi **BETA**'dır. En iyi sonuç için ek olarak **uBlock Origin Lite** veya **AdGuard** kurup, filtre listelerinde Spotify için **finetuning** yapmanız çok daha faydalı olacaktır. İkisi birlikte sorunsuz çalışır.

---

## 📦 Kurulum (Vivaldi — Masaüstü & Android)

1. Bu depoyu indir/klonla → `SpotiX` klasörü
2. `vivaldi://extensions` → **Geliştirici modu** aç → **Yüklü olmayan paket yükle** → `SpotiX` klasörünü seç
3. `open.spotify.com` sekmesini yenile

**Güncelleme**: klasörü üzerine kopyala → `vivaldi://extensions` → ↻ → Spotify sekmesini yenile. Ayarlar korunur (chrome.storage.sync).

## 🧹 Önbellek temizleme
Popup → **Bakım** → kullanım görürsün → **Önbelleği temizle** → **"Emin misin?"** onayı → Cache Storage sıfırlanır. Giriş durumun/ayarların silinmez. İşlem için en az bir Spotify sekmesi açık olmalı.

## 🔒 Gizlilik
Hiçbir veri toplanmaz, hiçbir yere gönderilmez. Ayarlar yalnızca senkron depoda saklanır.

## 📄 Lisans — MIT
