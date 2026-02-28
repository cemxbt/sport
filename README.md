# İbrahim Ersoran - Fitness Eğitmeni Web Sitesi

Kişisel fitness eğitmeni İbrahim Ersoran için tasarlanmış modern ve responsive web sitesi.

## Özellikler

- **Responsive Tasarım** - Mobil, tablet ve masaüstü cihazlara tam uyumlu
- **Modüler Mimari** - CSS ve JavaScript bileşen bazlı organize edilmiş
- **ES Modules** - Modern JavaScript modül sistemi
- **Performans Odaklı** - Intersection Observer, requestAnimationFrame ve lazy loading
- **Koyu Tema** - Elit ve profesyonel görünüm

## Proje Yapısı

```
sport/
├── index.html
├── css/
│   ├── main.css                 # Ana CSS giriş noktası
│   ├── base/
│   │   ├── variables.css        # CSS değişkenleri ve tema renkleri
│   │   ├── reset.css            # CSS reset ve temel stiller
│   │   └── typography.css       # Tipografi ve layout kuralları
│   ├── components/
│   │   ├── announcement.css     # Duyuru barı
│   │   ├── navbar.css           # Navigasyon
│   │   ├── hero.css             # Hero section
│   │   ├── packages.css         # Paket kartları
│   │   ├── details.css          # Paket detayları
│   │   ├── video-call.css       # Görüntülü görüşme
│   │   ├── app.css              # Mobil uygulama
│   │   ├── transformations.css  # Değişim galerisi
│   │   ├── blog.css             # Blog kartları
│   │   ├── calculators.css      # Hesaplayıcılar
│   │   ├── about.css            # Hakkımda
│   │   ├── social.css           # Sosyal medya
│   │   ├── videos.css           # Video kartları
│   │   ├── faq.css              # Sıkça sorulan sorular
│   │   ├── contact.css          # İletişim formu
│   │   ├── footer.css           # Footer
│   │   └── floating.css         # WhatsApp ve yukarı çık butonları
│   ├── utilities/
│   │   ├── buttons.css          # Buton stilleri
│   │   └── animations.css       # Animasyon sınıfları
│   └── responsive.css           # Responsive breakpoint'ler
├── js/
│   ├── app.js                   # Ana JS giriş noktası
│   └── modules/
│       ├── countdown.js         # Geri sayım zamanlayıcı
│       ├── navigation.js        # Navigasyon ve smooth scroll
│       ├── faq.js               # FAQ akordeon
│       ├── animations.js        # Scroll animasyonları ve parallax
│       └── form.js              # İletişim formu işlemleri
└── assets/
    └── images/
        └── trainer.png          # Eğitmen fotoğrafı
```

## Teknolojiler

- HTML5
- CSS3 (Custom Properties, Grid, Flexbox)
- Vanilla JavaScript (ES Modules)
- Font Awesome 6
- Google Fonts (Inter, Poppins)

## Kurulum

Projeyi klonlayın ve bir HTTP sunucusu ile çalıştırın:

```bash
git clone https://github.com/cemxbt/sport.git
cd sport
python3 -m http.server 8080
```

Tarayıcınızda `http://localhost:8080` adresini açın.

## Canlı Demo

[https://cemxbt.github.io/sport](https://cemxbt.github.io/sport)
