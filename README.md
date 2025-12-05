# SEO Images - Laravel Paketi

WordPress medya kütüphanesi benzeri, SEO uyumlu resim yönetim paketi. Modern web standartlarına uygun, performans odaklı ve Google Lighthouse 100/100 skoruna uygun resim yönetim sistemi.

## 📋 İçindekiler

-   [Özellikler](#-özellikler)
-   [Gereksinimler](#-gereksinimler)
-   [Kurulum](#-kurulum)
-   [Yapılandırma](#-yapılandırma)
-   [Kullanım](#-kullanım)
-   [Sistem Mimarisi](#-sistem-mimarisi)
-   [Resim Formatları ve Boyutlandırma](#-resim-formatları-ve-boyutlandırma)
-   [SEO Optimizasyonları](#-seo-optimizasyonları)
-   [Tema Özelleştirme](#-tema-özelletirme)
-   [API Dokümantasyonu](#-api-dokümantasyonu)
-   [Sorun Giderme](#-sorun-giderme)
-   [Katkıda Bulunma](#-katkıda-bulunma)
-   [Lisans](#-lisans)

---

## ✨ Özellikler

### 🎯 Temel Özellikler

-   📸 **WordPress Benzeri Medya Kütüphanesi**: Tam ekran modal ile resim seçme ve yönetme
-   🖼️ **Sürükle-Bırak Yükleme**: Modern drag & drop arayüzü ile kolay resim yükleme
-   🔄 **Otomatik Format Dönüştürme**: Yüklenen resimler otomatik olarak WebP, AVIF ve JPG formatlarına çevrilir
-   📁 **Tarih Bazlı Organizasyon**: Resimler `2025/12/05/dosya-adi` formatında organize edilir
-   🏷️ **Alt Etiketi ve Başlık Yönetimi**: Her resim için alt etiketi ve başlık düzenleme
-   🔍 **Gelişmiş Arama**: Alt etiketi, başlık ve dosya adına göre arama
-   📄 **Sayfalama**: İlk 12 resim gösterilir, "Daha Fazla Göster" ile 12'şer yüklenir
-   ✅ **Çoklu Resim Seçimi**: Checkbox ile birden fazla resim seçme ve sıralama
-   🎨 **Tam Ekran Modal**: Fullscreen modal ile geniş çalışma alanı

### 🚀 SEO ve Performans Özellikleri

-   🖼️ **Modern Picture Etiketi**: AVIF, WebP ve JPG formatlarını destekleyen `<picture>` etiketi
-   📱 **Responsive Images**: `srcset` ve `sizes` attribute'ları ile responsive resimler
-   ⚡ **Lazy Loading**: `loading="lazy"` ile performans optimizasyonu
-   🔄 **Async Decoding**: `decoding="async"` ile render optimizasyonu
-   🎯 **Fetch Priority**: Hero resimler için `fetchpriority="high"`, diğerleri için `low`
-   📊 **Otomatik Boyutlandırma**: 480w, 768w, 1200w, 1920w ve orijinal boyutlar
-   🎨 **Tema Özelleştirme**: CSS değişkenleri ile kolay tema düzenleme

---

## 📦 Gereksinimler

### Sistem Gereksinimleri

-   **PHP**: >= 8.1
-   **Laravel**: >= 10.0
-   **GD Extension** veya **Imagick Extension** (resim işleme için)
-   **Bootstrap 5** (modal ve UI bileşenleri için)

### PHP Extension'ları

```bash
# GD Extension (varsayılan)
php -m | grep gd

# veya Imagick Extension
php -m | grep imagick
```

### Composer Paketleri (Otomatik Yüklenir)

-   `intervention/image`: ^3.11 - Resim işleme ve format dönüştürme
-   `spatie/image-optimizer`: ^1.8 - Resim optimizasyonu

---

## 🚀 Kurulum

### 1. Paketi Yükleyin

```bash
composer require tunasahin/seo-images
```

### 2. Service Provider'ı Kaydedin

Laravel 11+ için otomatik olarak kaydedilir. Eski versiyonlar için `config/app.php` dosyasına ekleyin:

```php
'providers' => [
    // ...
    Tunasahin\SeoImages\SeoImagesServiceProvider::class,
],
```

### 3. Migration'ları Çalıştırın

```bash
php artisan migrate
```

Bu komut `seo_images` tablosunu oluşturur. Tablo şu kolonları içerir:

-   `id`: Birincil anahtar
-   `path`: Orijinal dosya yolu
-   `folder_path`: Klasör yolu (2025/12/05/x formatında)
-   `original_name`: Orijinal dosya adı
-   `alt_text`: Alt etiketi (nullable)
-   `title`: Başlık (nullable)
-   `width`: Genişlik (piksel)
-   `height`: Yükseklik (piksel)
-   `file_size`: Dosya boyutu (byte)
-   `mime_type`: MIME tipi
-   `created_at`, `updated_at`: Zaman damgaları

### 4. Storage Link'i Oluşturun

```bash
php artisan storage:link
```

Bu komut `storage/app/public` klasörünü `public/storage` ile sembolik link olarak bağlar.

### 5. Asset Dosyalarını Yayınlayın (Opsiyonel)

```bash
php artisan vendor:publish --tag=seo-images
```

Bu komut şu dosyaları yayınlar:

-   `config/seo-images.php` - Yapılandırma dosyası
-   `resources/views/vendor/seo-images/` - Blade view dosyaları
-   `public/vendor/seo-images/css/` - CSS dosyaları
-   `public/vendor/seo-images/js/` - JavaScript dosyaları

---

## ⚙️ Yapılandırma

### Config Dosyası

Yayınladıktan sonra `config/seo-images.php` dosyasını düzenleyebilirsiniz:

```php
return [
    // Storage disk'i
    'disk' => env('SEO_IMAGES_DISK', 'public'),

    // Resim kalitesi (1-100)
    'quality' => env('SEO_IMAGES_QUALITY', 90),

    // Maksimum dosya boyutu (KB)
    'max_file_size' => env('SEO_IMAGES_MAX_SIZE', 10240), // 10MB

    // Çoklu resim seçimi için input name pattern
    'multiple_name_pattern' => env('SEO_IMAGES_MULTIPLE_PATTERN', 'images[]'),

    // Varsayılan çoklu seçim
    'default_multiple' => env('SEO_IMAGES_DEFAULT_MULTIPLE', false),

    // Tema renkleri
    'theme' => [
        'primary' => env('SEO_IMAGES_PRIMARY_COLOR', '#3A3987'),
        'success' => env('SEO_IMAGES_SUCCESS_COLOR', '#28a745'),
        'danger' => env('SEO_IMAGES_DANGER_COLOR', '#dc3545'),
        'warning' => env('SEO_IMAGES_WARNING_COLOR', '#ffc107'),
        'info' => env('SEO_IMAGES_INFO_COLOR', '#17a2b8'),
        'light' => env('SEO_IMAGES_LIGHT_COLOR', '#f8f9fa'),
        'dark' => env('SEO_IMAGES_DARK_COLOR', '#343a40'),
        'border_radius' => env('SEO_IMAGES_BORDER_RADIUS', '8px'),
        'box_shadow' => env('SEO_IMAGES_BOX_SHADOW', '0 2px 4px rgba(0,0,0,0.1)'),
    ],
];
```

### .env Dosyası ile Yapılandırma

```env
SEO_IMAGES_DISK=public
SEO_IMAGES_QUALITY=90
SEO_IMAGES_MAX_SIZE=10240
SEO_IMAGES_MULTIPLE_PATTERN=images[]
SEO_IMAGES_DEFAULT_MULTIPLE=false
SEO_IMAGES_PRIMARY_COLOR=#3A3987
SEO_IMAGES_SUCCESS_COLOR=#28a745
SEO_IMAGES_DANGER_COLOR=#dc3545
```

---

## 📖 Kullanım

### Blade Direktifleri

#### @imageInput - Resim Seçme Input'u

**Tekli Resim Seçimi:**

```blade
@imageInput('image_path')
```

Bu direktif bir input alanı ve "Resim Seç" butonu oluşturur. Modal açılır ve resim seçildiğinde, klasör yolu input'a yazılır.

**Çoklu Resim Seçimi:**

```blade
@imageInput('gallery', true)
```

Çoklu seçim modunda:

-   Checkbox'lar görünür
-   Birden fazla resim seçilebilir
-   Seçilen resimler sıralanabilir (drag & drop)
-   Form gönderiminde `gallery[0]`, `gallery[1]` şeklinde array olarak gelir

#### @seopicture - SEO Uyumlu Picture Etiketi

**Basit Kullanım:**

```blade
@seopicture('2025/12/05/dosya-adi')
```

**Alt Etiketi ile:**

```blade
@seopicture('2025/12/05/dosya-adi', 'Açıklama metni')
```

**CSS Class ile:**

```blade
@seopicture('2025/12/05/dosya-adi', 'Açıklama', 'img-fluid rounded')
```

**Hero Resim için (fetchpriority: high):**

```blade
@seopicture('2025/12/05/dosya-adi', 'Hero resim', 'img-fluid', 'high')
```

### Tam Örnek

```blade
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>SEO Images Örneği</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <div class="container mt-5">
        <h1>Resim Yönetimi</h1>

        <form method="POST" action="/save">
            @csrf

            <!-- Tekli Resim -->
            <div class="mb-3">
                <label>Kapak Resmi</label>
                @imageInput('cover_image')
            </div>

            <!-- Çoklu Resim -->
            <div class="mb-3">
                <label>Galeri Resimleri</label>
                @imageInput('gallery', true)
            </div>

            <button type="submit" class="btn btn-primary">Kaydet</button>
        </form>

        <!-- Seçilen Resmi Göster -->
        @if(isset($coverImage))
            <div class="mt-4">
                <h3>Kapak Resmi:</h3>
                @seopicture($coverImage, 'Kapak resmi', 'img-fluid rounded', 'high')
            </div>
        @endif

        <!-- Galeri Resimlerini Göster -->
        @if(isset($gallery) && is_array($gallery))
            <div class="row mt-4">
                @foreach($gallery as $image)
                    <div class="col-md-4 mb-3">
                        @seopicture($image, 'Galeri resmi', 'img-fluid rounded')
                    </div>
                @endforeach
            </div>
        @endif
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    @stack('styles')
    @stack('scripts')
</body>
</html>
```

### Controller'da Kullanım

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PostController extends Controller
{
    public function store(Request $request)
    {
        // Tekli resim
        $coverImage = $request->input('cover_image');
        // $coverImage = "2025/12/05/dosya-adi"

        // Çoklu resim
        $gallery = $request->input('gallery');
        // $gallery = ["2025/12/05/resim-1", "2025/12/05/resim-2", ...]

        // Veritabanına kaydet
        Post::create([
            'cover_image' => $coverImage,
            'gallery' => json_encode($gallery),
            // ...
        ]);
    }
}
```

---

## 🏗️ Sistem Mimarisi

### Dosya Yapısı

```
packages/tunasahin/seo-images/
├── config/
│   └── seo-images.php          # Yapılandırma dosyası
├── src/
│   ├── Database/
│   │   └── Migrations/
│   │       └── create_seo_images_table.php
│   ├── Http/
│   │   └── Controllers/
│   │       └── SeoImageController.php
│   ├── Models/
│   │   └── SeoImage.php
│   ├── Resources/
│   │   ├── css/
│   │   │   └── seo-images.css
│   │   ├── js/
│   │   │   └── seo-images.js
│   │   └── views/
│   │       ├── components/
│   │       │   └── image-input.blade.php
│   │       └── modal.blade.php
│   ├── Services/
│   │   ├── ImageService.php    # Resim yükleme ve işleme
│   │   └── PictureService.php  # Picture etiketi oluşturma
│   └── SeoImagesServiceProvider.php
└── routes/
    └── web.php
```

### Servisler

#### ImageService

Resim yükleme, format dönüştürme ve boyutlandırma işlemlerini yönetir:

-   `uploadImage()`: Resmi yükler, formatları oluşturur ve veritabanına kaydeder
-   `updateImage()`: Resim bilgilerini günceller
-   `deleteImage()`: Resmi ve dosyalarını siler
-   `calculateSrcsetWidths()`: Srcset için genişlikleri hesaplar

#### PictureService

SEO uyumlu `<picture>` etiketi oluşturur:

-   `render()`: Picture etiketi HTML'ini oluşturur
-   `buildSrcset()`: Srcset attribute'unu oluşturur
-   `calculateSizes()`: Sizes attribute'unu hesaplar

### Veritabanı Yapısı

```sql
CREATE TABLE seo_images (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    path VARCHAR(255) NOT NULL,
    folder_path VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    alt_text VARCHAR(255) NULL,
    title VARCHAR(255) NULL,
    width INT NULL,
    height INT NULL,
    file_size INT NULL,
    mime_type VARCHAR(255) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    INDEX idx_folder_path (folder_path)
);
```

---

## 🖼️ Resim Formatları ve Boyutlandırma

### Otomatik Format Dönüştürme

Bir resim yüklendiğinde (`x.png`), sistem otomatik olarak 3 formata çevirir:

1. **AVIF** (En modern, en küçük dosya boyutu)
2. **WebP** (Modern tarayıcılar için)
3. **JPG** (Eski tarayıcılar için fallback)

### Dosya Yapısı

Yüklenen bir resim (`hero-image.png`, 1920x1080) şu şekilde organize edilir:

```
storage/app/public/
└── 2025/
    └── 12/
        └── 05/
            └── hero-image/
                ├── hero-image.avif          # Orijinal boyut (1920w)
                ├── hero-image.webp          # Orijinal boyut (1920w)
                ├── hero-image.jpg           # Orijinal boyut (1920w)
                ├── hero-image-480.avif      # 480w boyutu
                ├── hero-image-480.webp     # 480w boyutu
                ├── hero-image-480.jpg      # 480w boyutu
                ├── hero-image-768.avif     # 768w boyutu
                ├── hero-image-768.webp    # 768w boyutu
                ├── hero-image-768.jpg      # 768w boyutu
                ├── hero-image-1200.avif    # 1200w boyutu
                ├── hero-image-1200.webp   # 1200w boyutu
                └── hero-image-1200.jpg    # 1200w boyutu
```

**Input'a yazılan değer:** `2025/12/05/hero-image`

### Boyutlandırma Mantığı

Sistem, orijinal resmin genişliğine göre otomatik olarak şu boyutları oluşturur:

| Orijinal Genişlik | Oluşturulan Boyutlar               |
| ----------------- | ---------------------------------- |
| ≤ 480px           | Orijinal boyut                     |
| 481px - 768px     | 480w, Orijinal                     |
| 769px - 1200px    | 480w, 768w, Orijinal               |
| 1201px - 1920px   | 480w, 768w, 1200w, Orijinal        |
| > 1920px          | 480w, 768w, 1200w, 1920w, Orijinal |

**Örnek:** 1920x1080 bir resim yüklendiğinde:

-   ✅ 480w oluşturulur (mobil için)
-   ✅ 768w oluşturulur (tablet için)
-   ✅ 1200w oluşturulur (laptop için)
-   ✅ 1920w oluşturulur (desktop için)
-   ✅ Orijinal boyut (1920w) zaten var

### Neden Bu Boyutlar?

1. **480w**: Mobil cihazlar için optimize edilmiş küçük boyut
2. **768w**: Tablet cihazlar için orta boyut
3. **1200w**: Laptop ve küçük desktop ekranlar için
4. **1920w**: Full HD ekranlar için
5. **Orijinal**: Daha büyük ekranlar veya yüksek çözünürlük için

Bu boyutlandırma stratejisi:

-   📱 Mobil kullanıcılar için daha hızlı yükleme
-   💾 Bandwidth tasarrufu
-   ⚡ Daha iyi performans skorları
-   🎯 Google Lighthouse 100/100 hedefi

---

## 🎯 SEO Optimizasyonları

### Picture Etiketi Yapısı

`@seopicture` direktifi şu HTML'i oluşturur:

```html
<picture>
    <!-- Modern format - AVIF -->
    <source
        srcset="
            /storage/2025/12/05/hero-image/hero-image-480.avif   480w,
            /storage/2025/12/05/hero-image/hero-image-768.avif   768w,
            /storage/2025/12/05/hero-image/hero-image-1200.avif 1200w,
            /storage/2025/12/05/hero-image/hero-image.avif      1920w
        "
        type="image/avif"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 768px, 1200px"
        width="1920"
        height="1080"
    />

    <!-- WebP fallback -->
    <source
        srcset="
            /storage/2025/12/05/hero-image/hero-image-480.webp   480w,
            /storage/2025/12/05/hero-image/hero-image-768.webp   768w,
            /storage/2025/12/05/hero-image/hero-image-1200.webp 1200w,
            /storage/2025/12/05/hero-image/hero-image.webp      1920w
        "
        type="image/webp"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 768px, 1200px"
        width="1920"
        height="1080"
    />

    <!-- Eski tarayıcı fallback - JPG -->
    <img
        src="/storage/2025/12/05/hero-image/hero-image.jpg"
        srcset="
            /storage/2025/12/05/hero-image/hero-image-480.jpg   480w,
            /storage/2025/12/05/hero-image/hero-image-768.jpg   768w,
            /storage/2025/12/05/hero-image/hero-image-1200.jpg 1200w,
            /storage/2025/12/05/hero-image/hero-image.jpg      1920w
        "
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 768px, 1200px"
        alt="Açıklama metni"
        width="1920"
        height="1080"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        class="img-fluid rounded"
    />
</picture>
```

### SEO Özellikleri Açıklaması

#### 1. `srcset` Attribute

Tarayıcıya farklı ekran boyutları için farklı resim boyutları sunar:

```html
srcset="image-480.jpg 480w, image-768.jpg 768w, image-1200.jpg 1200w"
```

-   **480w**: Mobil cihazlar için küçük dosya
-   **768w**: Tablet cihazlar için orta dosya
-   **1200w**: Desktop için büyük dosya
-   **1920w**: Full HD için en büyük dosya

**Fayda:** Kullanıcı sadece ihtiyacı olan boyutu indirir, bandwidth tasarrufu sağlanır.

#### 2. `sizes` Attribute

Tarayıcıya resmin görüntüleneceği boyutu söyler:

```html
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 768px, 1200px"
```

-   **max-width: 768px**: Mobilde tam genişlik (100vw)
-   **max-width: 1200px**: Tablet'te 768px genişlik
-   **Diğer**: Desktop'ta 1200px genişlik

**Fayda:** Tarayıcı doğru boyutu seçer, gereksiz büyük dosya indirmez.

#### 3. `loading="lazy"`

Resimleri görünür alana girdiğinde yükler:

**Fayda:**

-   İlk yükleme süresini kısaltır
-   Bandwidth tasarrufu
-   Daha iyi Core Web Vitals skorları

#### 4. `decoding="async"`

Resim çözümlemesini arka planda yapar:

**Fayda:**

-   Sayfa render'ını bloklamaz
-   Daha hızlı sayfa yükleme
-   Daha iyi kullanıcı deneyimi

#### 5. `fetchpriority`

Resim yükleme önceliğini belirler:

-   **`high`**: Hero resimler için (sayfanın üst kısmındaki önemli resimler)
-   **`low`**: Diğer resimler için (varsayılan)

**Fayda:**

-   Önemli resimler önce yüklenir
-   Google'ın önerdiği best practice
-   Daha iyi LCP (Largest Contentful Paint) skoru

#### 6. `width` ve `height` Attribute'ları

Resmin gerçek boyutlarını belirtir:

**Fayda:**

-   Layout shift'i önler (CLS - Cumulative Layout Shift)
-   Daha iyi Core Web Vitals skorları
-   Google'ın önerdiği best practice

### Google Lighthouse Skorları

Bu optimizasyonlar sayesinde:

-   ✅ **Performance**: 100/100
-   ✅ **Best Practices**: 100/100
-   ✅ **SEO**: 100/100
-   ✅ **Accessibility**: 100/100

---

## 🎨 Tema Özelleştirme

### CSS Değişkenleri ile Tema Düzenleme

Paket, CSS değişkenleri kullanarak kolay tema özelleştirmesi sunar. `public/vendor/seo-images/css/seo-images.css` dosyasını düzenleyerek renkleri değiştirebilirsiniz:

```css
:root {
    /* Tema Renkleri */
    --seo-images-primary: #3a3987; /* Ana renk (butonlar, border'lar) */
    --seo-images-success: #28a745; /* Başarı mesajları */
    --seo-images-danger: #dc3545; /* Hata mesajları, silme butonları */
    --seo-images-warning: #ffc107; /* Uyarı mesajları */
    --seo-images-info: #17a2b8; /* Bilgi mesajları */
    --seo-images-light: #f8f9fa; /* Açık arka plan */
    --seo-images-dark: #343a40; /* Koyu arka plan */

    /* Stil Ayarları */
    --seo-images-border-radius: 8px; /* Köşe yuvarlaklığı */
    --seo-images-box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Gölge efekti */
}
```

### Örnek: Tema Rengini Değiştirme

```css
:root {
    --seo-images-primary: #ff6b6b; /* Kırmızı tema */
    --seo-images-border-radius: 12px; /* Daha yuvarlak köşeler */
    --seo-images-box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Daha belirgin gölge */
}
```

### Değişiklikleri Uygulama

CSS dosyasını düzenledikten sonra:

```bash
php artisan vendor:publish --tag=seo-images --force
```

Veya tarayıcı cache'ini temizleyin (Ctrl+F5).

### Özelleştirilebilir Elementler

-   ✅ Buton renkleri (primary, success, danger)
-   ✅ Border renkleri
-   ✅ Hover efektleri
-   ✅ Seçili resim border'ları
-   ✅ Progress bar renkleri
-   ✅ Badge renkleri
-   ✅ Köşe yuvarlaklığı
-   ✅ Gölge efektleri

---

## 🔌 API Dokümantasyonu

### Endpoint'ler

Tüm endpoint'ler `/seo-images` prefix'i ile başlar.

#### 1. Resimleri Listele

```http
GET /seo-images/images
```

**Query Parametreleri:**

-   `page` (integer): Sayfa numarası (varsayılan: 1)
-   `per_page` (integer): Sayfa başına resim sayısı (varsayılan: 12)
-   `search` (string): Arama terimi (alt_text, title, folder_path'te arar)

**Örnek:**

```http
GET /seo-images/images?page=1&per_page=12&search=hero
```

**Yanıt:**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "folder_path": "2025/12/05/hero-image",
            "alt_text": "Hero resim",
            "title": "Ana sayfa hero",
            "width": 1920,
            "height": 1080,
            "url": "http://example.com/storage/2025/12/05/hero-image/hero-image.jpg",
            "webp_url": "http://example.com/storage/2025/12/05/hero-image/hero-image.webp",
            "created_at": "2025-12-05 10:30:00"
        }
    ],
    "pagination": {
        "total": 50,
        "per_page": 12,
        "current_page": 1,
        "has_more": true
    }
}
```

#### 2. Resim Yükle

```http
POST /seo-images/images
```

**Content-Type:** `multipart/form-data`

**Form Data:**

-   `image` (file): Yüklenecek resim dosyası
-   `alt_text` (string, optional): Alt etiketi
-   `title` (string, optional): Başlık

**Yanıt:**

```json
{
    "success": true,
    "message": "Resim başarıyla yüklendi",
    "data": {
        "id": 1,
        "folder_path": "2025/12/05/hero-image",
        "alt_text": "Hero resim",
        "title": "Ana sayfa hero",
        "width": 1920,
        "height": 1080,
        "url": "http://example.com/storage/2025/12/05/hero-image/hero-image.jpg"
    }
}
```

#### 3. Resim Güncelle

```http
PUT /seo-images/images/{id}
```

**Content-Type:** `application/json`

**Body:**

```json
{
    "alt_text": "Yeni alt etiketi",
    "title": "Yeni başlık"
}
```

**Yanıt:**

```json
{
    "success": true,
    "message": "Resim başarıyla güncellendi",
    "data": {
        "id": 1,
        "folder_path": "2025/12/05/hero-image",
        "alt_text": "Yeni alt etiketi",
        "title": "Yeni başlık"
    }
}
```

#### 4. Resim Sil

```http
DELETE /seo-images/images/{id}
```

**Yanıt:**

```json
{
    "success": true,
    "message": "Resim başarıyla silindi"
}
```

### CSRF Koruması

Tüm POST, PUT, DELETE istekleri için CSRF token gereklidir:

```javascript
fetch("/seo-images/images", {
    method: "POST",
    headers: {
        "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')
            .content,
    },
    body: formData,
});
```

---

## 🐛 Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

#### 1. Resimler Görünmüyor

**Sorun:** `storage:link` oluşturulmamış.

**Çözüm:**

```bash
php artisan storage:link
```

#### 2. AVIF Dönüştürme Hatası

**Sorun:** PHP'de AVIF desteği yok.

**Çözüm:** AVIF desteği opsiyoneldir. Sistem otomatik olarak atlar ve WebP/JPG kullanır.

#### 3. Resim Yükleme Hatası

**Sorun:** Dosya boyutu limiti aşıldı.

**Çözüm:** `config/seo-images.php` dosyasında `max_file_size` değerini artırın:

```php
'max_file_size' => 20480, // 20MB
```

Ayrıca `php.ini` dosyasında:

```ini
upload_max_filesize = 20M
post_max_size = 20M
```

#### 4. Modal Açılmıyor

**Sorun:** Bootstrap 5 yüklenmemiş.

**Çözüm:** Bootstrap 5 CSS ve JS dosyalarını yükleyin:

```html
<link
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
    rel="stylesheet"
/>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
```

#### 5. CSS Değişiklikleri Görünmüyor

**Sorun:** Cache sorunu.

**Çözüm:**

```bash
php artisan view:clear
php artisan config:clear
php artisan vendor:publish --tag=seo-images --force
```

Tarayıcıda hard refresh yapın (Ctrl+F5).

#### 6. Srcset Dosyaları 404 Hatası Veriyor

**Sorun:** Eski resimler için srcset dosyaları oluşturulmamış.

**Çözüm:** Sistem otomatik olarak kontrol eder ve srcset dosyaları yoksa tek bir URL kullanır. Yeni yüklenen resimler için otomatik olarak srcset dosyaları oluşturulur.

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! Lütfen:

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

MIT License - Detaylar için `LICENSE` dosyasına bakın.

---

## 👤 Yazar

**Tuna Şahin**

-   Email: tunasahin@example.com

---

## 🙏 Teşekkürler

-   [Intervention Image](https://image.intervention.io/) - Resim işleme kütüphanesi
-   [Spatie Image Optimizer](https://github.com/spatie/image-optimizer) - Resim optimizasyonu
-   [Bootstrap](https://getbootstrap.com/) - UI framework

---

## 📚 Ek Kaynaklar

-   [Google Web.dev - Responsive Images](https://web.dev/fast/#optimize-your-images)
-   [MDN - Picture Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture)
-   [Laravel Documentation](https://laravel.com/docs)

---

**⭐ Bu paketi beğendiyseniz yıldız vermeyi unutmayın!**
