# Söz

Türkçe ve İngilizce, çevrimdışı çalışan masaüstü Kutsal Kitap okuyucusu.

**Söz**, okumaya odaklanır: sakin tipografi, geniş kenar boşlukları, üç tema ve
iki dil. Hesap yok, reklam yok, çalışırken ağ erişimi yok.

| | |
| --- | --- |
| Türkçe metin | **YTC** — Yorumsuz Türkçe Çeviri (tam Kitap, 66 kitap) |
| İngilizce metin | **KJV** — King James Version · **WEB** — World English Bible |
| Arayüz | Türkçe ve İngilizce (anında geçiş) |
| Platform | Linux (AppImage / deb / rpm); Tauri sayesinde macOS ve Windows'a taşınabilir |

## Özellikler

- 1.189 bölümün tamamı, çevrimdışı.
- Kitap listesi, bölüm ızgarası ve önceki/sonraki bölüm gezinmesi.
- Paragraf veya ayet-ayet düzeni; üç tema (açık, sepya, koyu); 15–30 px yazı
  boyutu.
- İsa'nın sözleri isteğe bağlı kırmızı; KJV'deki çevirmen eklemeleri italik,
  Tanrı adı küçük büyük harflerle.
- Okuma konumunu, çeviriyi, temayı ve düzeni hatırlar.
- Klavye: `←` / `→` bölüm, `B` kenar çubuğu, `T` tema, `Esc` kapat.

## Kurulum

[Releases](https://github.com/akamusti/bible-reader/releases) sayfasından
indirin:

```bash
# AppImage
chmod +x Soz_*_amd64.AppImage
./Soz_*_amd64.AppImage

# Debian / Ubuntu / KDE Neon
sudo apt install ./Soz_*_amd64.deb

# Fedora
sudo dnf install ./Soz_*_x86_64.rpm
```

AppImage için sistemde **WebKitGTK 4.1** ve **GTK 3** bulunmalıdır
(Fedora: `webkit2gtk4.1`, `gtk3`).

## Geliştirme

Gereksinimler: Node 22+, Rust stable ve Tauri 2 sistem bağımlılıkları
(`webkit2gtk-4.1`, `gtk3`, `libsoup-3.0`, `librsvg2`, `patchelf`).

```bash
npm ci
npm run dev        # yalnızca tarayıcı → http://localhost:1420
npm run desktop    # Tauri penceresi
npm run check      # TypeScript + veri doğrulama
npm run build      # üretim web paketi
npm run bundle     # AppImage + deb + rpm
```

Metni yeniden üretmek (ağ gerekir; kaynaklar SHA-256 ile sabitlenmiştir):

```bash
npm run data
```

Ayrıntılı mimari, veri modeli ve katkı kuralları için **[AGENTS.md](AGENTS.md)**
dosyasına bakın.

## Veri ve lisans

- Kod: **MIT** ([LICENSE](LICENSE)).
- Metinler: YTC **CC BY-ND 4.0**; KJV ve WEB **public domain**. Kaynaklar,
  telif satırları ve yapılan biçim dönüşümleri için
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- Yazı tipleri: Literata ve Inter, SIL Open Font License 1.1.

Bu depo yalnızca serbestçe dağıtılabilen çevirileri içerir. Telifli çeviriler
(NIV, ESV, NLT vb.) bilerek dahil edilmemiştir.

---

## English

**Söz** is a quiet, offline Bible reader for the desktop, built with Tauri 2,
React and TypeScript. It ships the Turkish YTC Bible and the English KJV and WEB,
with a Turkish-first interface that switches to English instantly.

- Full 66-book text, no network at runtime.
- Book picker, chapter grid, chapter navigation, remembered reading position.
- Paragraph or verse-per-line layout, light/sepia/dark themes, adjustable text
  size, optional red letters.
- Keyboard: `←`/`→` chapter, `B` sidebar, `T` theme, `Esc` close.

Build with `npm ci && npm run desktop`. See [AGENTS.md](AGENTS.md) for the
architecture and data pipeline, and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
for text licensing.
