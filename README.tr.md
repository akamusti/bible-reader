# Söz

**Masaüstü için sakin, çevrimdışı bir Kutsal Kitap okuyucusu — Türkçe ve İngilizce, eşit koşullarda.**

[English](README.md) · **Türkçe**

[![CI](https://github.com/akamusti/bible-reader/actions/workflows/ci.yml/badge.svg)](https://github.com/akamusti/bible-reader/actions/workflows/ci.yml)
[![Lisans: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform: Linux](https://img.shields.io/badge/platform-Linux-informational)](https://github.com/akamusti/bible-reader/releases)

**Söz**, dikkat dağıtmadan Kutsal Kitap okumak için yazılmış küçük bir Tauri 2
masaüstü uygulamasıdır. Türkçe YTC Kitabı'nın tamamını ve İngilizce KJV ile WEB
metinlerini içerir; tüm ayetler statik JSON olarak paketlenir ve uygulama
çalışırken ağa hiç erişmez — hesap yok, telemetri yok, reklam yok.

## Tasarım ilkeleri

- **Önce okuma.** Kutsal metin için Literata, arayüz için Inter, 716 px satır
  genişliği ve uzun okuma oturumları için ayarlanmış üç tema.
- **Varsayılan olarak çevrimdışı.** Metin depoya dahildir ve diskten okunur.
  Eşitlenecek bir şey, dışarıya bilgi gönderen bir servis yok.
- **Sonradan eklenmiş bir çeviri değil, gerçek iki dillilik.** Türkçe ve
  İngilizce eşit konumdadır; arayüz ve metin birlikte, anında değişir.
- **Bilinçli olarak dar kapsam.** Tek pencere, eklenti yok, bulut yok. v0.1
  okumada durur ve asıl amaç budur.

## Özellikler

- 66 kitabın tamamı — her çeviride 1.189 bölüm.
- Ahit sekmeleriyle kitap listesi, bölüm ızgarası ve kitap sınırlarını aşan
  önceki/sonraki bölüm gezinmesi.
- Paragraf veya ayet-ayet düzeni.
- Açık, sepya ve koyu temalar; 15–30 px yazı boyutu.
- İsa'nın sözleri için isteğe bağlı kırmızı harf, KJV çevirmen eklemeleri için
  italik, Tanrı adı için küçük büyük harf.
- Çeviriyi, kitabı, bölümü, temayı ve düzeni uygulama kapanıp açıldığında
  hatırlar.
- Klavye öncelikli: `←` / `→` bölüm, `B` kenar çubuğu, `T` tema, `Esc` iletişim
  kutularını kapatır.

## Çeviriler

| Kimlik   | Dil       | Çeviri                          | Kısaltma | Lisans                              |
| -------- | --------- | ------------------------------- | -------- | ----------------------------------- |
| `tr-ytc` | Türkçe    | Yorumsuz Türkçe Çeviri          | YTC      | CC BY-ND 4.0                        |
| `en-kjv` | İngilizce | King James Version              | KJV      | Kamu malı (Birleşik Krallık dışında) |
| `en-web` | İngilizce | World English Bible (Protestan) | WEB      | Kamu malı                           |

Depo yalnızca serbestçe dağıtılabilen metinleri içerir. Telifli çeviriler (NIV,
ESV, NLT vb.) bilerek dahil edilmemiştir. Kaynaklar, telif satırları ve her
metne uygulanan dönüşümler için
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) dosyasına bakın.

## Kurulum

En güncel paketleri [Releases](https://github.com/akamusti/bible-reader/releases)
sayfasından indirin:

```bash
# AppImage — doğrudan çalıştırın
chmod +x Soz_*_amd64.AppImage
./Soz_*_amd64.AppImage

# Debian / Ubuntu / KDE Neon
sudo apt install ./Soz_*_amd64.deb

# Fedora
sudo dnf install ./Soz_*_x86_64.rpm
```

AppImage, sistemde **WebKitGTK 4.1** ve **GTK 3** bekler (Fedora:
`webkit2gtk4.1`, `gtk3`). deb ve rpm paketleri bağımlılıklarını kendileri
bildirir.

## Geliştirme

### Gereksinimler

- Node.js 22+
- Rust stable
- Tauri 2 sistem bağımlılıkları: `webkit2gtk-4.1`, `gtk3`, `libsoup-3.0`,
  `librsvg2`, `patchelf` (paketleme için ayrıca `libayatana-appindicator3`).

Fedora'da:

```bash
sudo dnf install webkit2gtk4.1-devel gtk3-devel libsoup3-devel librsvg2-devel \
  libappindicator-gtk3-devel patchelf
```

### Komutlar

| Komut             | Açıklama                                                 |
| ----------------- | -------------------------------------------------------- |
| `npm ci`          | JavaScript bağımlılıklarını kurar                         |
| `npm run dev`     | Yalnızca Vite geliştirme sunucusu → <http://localhost:1420> |
| `npm run desktop` | Tauri penceresi (Vite'ı kendisi başlatır)                 |
| `npm run check`   | TypeScript denetimi ve çevrimdışı veri doğrulaması        |
| `npm run build`   | Tip denetimi ve üretim web paketi                         |
| `npm run bundle`  | AppImage, deb ve rpm paketlerini üretir                   |
| `npm run data`    | `public/data` verisini yeniden indirip üretir (ağ gerekir) |

`public/data/` depoya dahildir; yeni bir klon ağa çıkmadan derlenir ve çalışır.

### Metni yeniden üretmek

```bash
npm run data
```

Kaynaklar `scripts/build-bible-data.mjs` içinde SHA-256 ile sabitlenmiştir;
kaynak arşiv değişirse derleme sessizce metni değiştirmek yerine başarısız olur.
Yeniden üretimden sonra `npm run check` çalıştırın ve
`git diff --stat public/data` çıktısını gözden geçirin.

### Proje yapısı

```text
src/                    React 19 + TypeScript arayüzü
  App.tsx               ayarlar, gezinme, veri yükleme, kısayollar
  components/           Sidebar, Reader, ChapterPicker, SettingsPanel, Icons
  data.ts               manifest ve çeviri yükleme (fetch + bellek önbelleği)
  storage.ts            localStorage ayarları
  i18n.ts               Türkçe ve İngilizce arayüz metinleri
  styles.css            tasarım belirteçleri, yerleşim, tipografi
public/data/            üretilmiş Kutsal Kitap JSON'u (depoda)
scripts/                USFM → JSON hattı, veri doğrulama
src-tauri/              Tauri 2 kabuğu (Rust)
.github/workflows/      CI ve sürüm otomasyonu
```

Mimari notlar, veri modeli ve katkı kuralları için **[AGENTS.md](AGENTS.md)**
dosyasına bakın.

## Katkı

Hata bildirimleri ve pull request'ler memnuniyetle karşılanır. PR açmadan önce:

```bash
npm run check
npm run build
```

Değişikliklerin yukarıdaki ilkelerle uyumlu olmasına dikkat edin: okuma
konforu, çevrimdışı çalışma, küçük paket ve Türkçe ile İngilizce arasında denge.
Ayet metnini elle düzenlemeyin — metni üretim hattıyla yeniden oluşturun.

## Lisans

- **Kod:** MIT — bkz. [LICENSE](LICENSE).
- **Kutsal metin:** YTC, CC BY-ND 4.0; KJV ve WEB kamu malı. Bkz.
  [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
- **Yazı tipleri:** Literata ve Inter, SIL Open Font License 1.1.
