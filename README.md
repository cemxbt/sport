# İbrahim Ersoran - Fitness Eğitmeni Web Sitesi

Kişisel fitness eğitmeni İbrahim Ersoran için tasarlanmış modern ve responsive web sitesi. Admin paneli ile tüm içerik dinamik olarak yönetilebilir.

## Özellikler

- **Responsive Tasarım** - Mobil, tablet ve masaüstü cihazlara tam uyumlu
- **Modüler Mimari** - CSS ve JavaScript bileşen bazlı organize edilmiş
- **Admin Panel** - Blog, paketler, değişimler, SSS ve tüm site içeriği yönetilebilir
- **REST API** - JSON tabanlı veri yönetimi
- **Hesaplayıcılar** - 8 farklı fitness hesaplayıcı (kalori, vücut yağ oranı, 1RM vb.)
- **Güvenlik** - Şifre korumalı admin panel, brute-force koruması, oturum yönetimi
- **SEO** - Admin panelden yönetilebilir meta etiketleri, Open Graph, Schema.org

## Kurulum

```bash
git clone https://github.com/cemxbt/sport.git
cd sport
npm install
npm start
```

- **Site:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Varsayılan Şifre:** `admin123` (ilk girişte değiştirin)

## Teknolojiler

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3 (Custom Properties, Grid, Flexbox), Vanilla JS (ES Modules)
- **Veri:** JSON dosya tabanlı depolama
- **Güvenlik:** bcryptjs, cookie tabanlı oturum, rate limiting
- **Fontlar:** Google Fonts (Inter, Poppins), Font Awesome 6
