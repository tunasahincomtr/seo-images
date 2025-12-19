# SEO Images - Laravel Paketi

Laravel projelerinde kullanılacak, tam çalışan, stabil bir medya kütüphanesi. Görselleri otomatik olarak JPG, WebP ve AVIF formatlarına dönüştürür ve SEO uyumlu `<picture>` etiketleri ile responsive çıktı üretir.

**Yazar:** Tuna Şahin

## 📋 İçindekiler

- [Özellikler](#özellikler)
- [Gereksinimler](#gereksinimler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Blade Directive'leri](#blade-directiveleri)
- [Yapılandırma](#yapılandırma)
- [API Endpoints](#api-endpoints)
- [Sık Sorulan Sorular](#sık-sorulan-sorular)

## ✨ Özellikler

- ✅ **Otomatik format dönüştürme** - JPG, WebP ve AVIF formatlarında otomatik üretim
- ✅ **Çoklu boyut desteği** - 480, 768, 1200, 1920px boyutlarında otomatik varyasyonlar
- ✅ **Drag & Drop yükleme** - Sürükle-bırak ile kolay dosya yükleme
- ✅ **Toplu yükleme** - Birden fazla görseli aynı anda yükleme
- ✅ **Tekli ve çoklu görsel seçimi** - Formlarda esnek görsel seçimi
- ✅ **Meta veri yönetimi** - Alt text ve title yönetimi
- ✅ **Blade directive'leri** - Kolay kullanım için özel Blade direktifleri
- ✅ **Tam çalışan frontend** - Bootstrap 5 + jQuery ile modern arayüz
- ✅ **Responsive çıktı** - SEO uyumlu `<picture>` etiketleri
- ✅ **SEO optimizasyonu** - `decoding="async"`, `fetchpriority`, `sizes` attributes
- ✅ **Memory optimizasyonu** - Büyük dosyalar için otomatik bellek yönetimi
- ✅ **Full screen modal** - Geniş çalışma alanı
- ✅ **Dashboard** - Görsel istatistikleri ve analiz

## 🔧 Gereksinimler

- Laravel 10+ veya 11+
- PHP 8.1+
- Intervention Image v2.7
- Bootstrap 5 (CDN veya local)
- jQuery 3.x (CDN veya local)

## 📦 Kurulum

### Adım 1: Paketi Yükleyin

```bash
composer require tunasahincomtr/seo-images:dev-main
```

Eğer paket local development için kullanılıyorsa, `composer.json` dosyanıza repository ekleyin:

```json
{
  "repositories": [
    {
      "type": "path",
      "url": "packages/tunasahin/seo-images"
    }
  ],
  "require": {
    "tunasahin/seo-images": "*"
  }
}
```

### Adım 2: Service Provider'ı Kaydedin

Laravel 10+ için `config/app.php` dosyasına ekleyin:

```php
'providers' => [
    // ...
    TunaSahin\SeoImages\SeoImagesServiceProvider::class,
],
```

**Not:** Laravel 11+ için otomatik keşif yapılır, manuel ekleme gerekmez.

### Adım 3: Config Dosyasını Yayınlayın

```bash
php artisan vendor:publish --tag=seo-images-config
```

Bu komut `config/seo-images.php` dosyasını oluşturur.

### Adım 4: Migration Dosyalarını Yayınlayın ve Çalıştırın

```bash
# Migration dosyalarını yayınla
php artisan vendor:publish --tag=seo-images-migrations

# Migration'ları çalıştır
php artisan migrate
```

### Adım 5: Asset Dosyalarını Yayınlayın

```bash
php artisan vendor:publish --tag=seo-images-assets
```

Bu komut CSS ve JavaScript dosyalarını `public/vendor/seo-images/` klasörüne kopyalar.

### Adım 6: Storage Link Oluşturun

Eğer `public` disk kullanıyorsanız (varsayılan), storage link oluşturun:

```bash
php artisan storage:link
```

Bu komut `public/storage` klasörünü `storage/app/public` klasörüne sembolik link olarak bağlar. Bu sayede görseller `http://yourdomain.com/storage/...` URL'i ile erişilebilir olur.

**Önemli:** Bu adımı atlamayın, aksi halde görseller 404 hatası verecektir.

### Adım 7: Config Ayarlarını Yapın

`.env` dosyanıza aşağıdaki ayarları ekleyin:

````env
# Storage Disk (varsayılan: public)
SEO_IMAGES_DISK=public

# Kalite Ayarları (0-100)
SEO_IMAGES_QUALITY_JPG=80
SEO_IMAGES_QUALITY_WEBP=80
SEO_IMAGES_QUALITY_AVIF=60

# Maksimum Yükleme Boyutu (KB)
SEO_IMAGES_MAX_UPLOAD_SIZE=5120

# Primary Color (Modal ve input renkleri için)
SEO_IMAGES_PRIMARY_COLOR=#0d6efd

# Cache Ayarları
SEO_IMAGES_CACHE_ENABLED=true
SEO_IMAGES_CACHE_TTL=3600

## 🚀 Kullanım

### Adım 1: Layout Dosyanıza Script'leri Ekleyin

Ana layout dosyanızın (`resources/views/layouts/app.blade.php` gibi) `<head>` bölümüne aşağıdakileri ekleyin:

```blade
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- CSRF Token (ÖNEMLİ: AJAX istekleri için gerekli) -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- jQuery (Bootstrap'ten önce yüklenmeli) -->
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- SEO Images Scripts (HEAD bölümüne ekleyin) -->
    @seoimagesScripts
</head>
<body>
    <!-- İçerik -->

    <!-- Modal'ı sayfanın sonuna ekleyin -->
    @include('seo-images::modal')
</body>
</html>
````

**Önemli Notlar:**

- `@seoimagesScripts` directive'i `<head>` bölümüne eklenmelidir
- CSRF token meta tag'i mutlaka eklenmelidir (AJAX istekleri için)
- Modal'ı sayfanın sonuna (`</body>` öncesine) ekleyin

### Adım 2: Form'unuzda Görsel Seçimi Ekleyin

```blade
<form method="POST" action="{{ route('posts.store') }}">
    @csrf

    <div class="mb-3">
        <label>Kapak Görseli</label>
        @seoinput('cover_image')
    </div>

    <div class="mb-3">
        <label>Galeri Görselleri</label>
        @seoinput('gallery', 'multiple')
    </div>

    <button type="submit" class="btn btn-primary">Kaydet</button>
</form>
```

### Adım 3: Controller'da Görselleri Kaydedin

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PostController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'cover_image' => 'nullable|string',
            'gallery' => 'nullable|string', // JSON string olarak gelir
        ]);

        $post = Post::create([
            'title' => $validated['title'],
            'cover_image' => $validated['cover_image'], // "2025/12/10/x" formatında
            'gallery' => $validated['gallery'], // JSON string: '["2025/12/10/x","2025/12/11/y"]'
        ]);

        return redirect()->route('posts.show', $post);
    }
}
```

### Adım 4: Görselleri Sayfada Gösterin

```blade
<!-- Tekli görsel -->
@if($post->cover_image)
    @seoimages($post->cover_image, [
        'class' => 'img-fluid rounded shadow',
        'alt' => $post->title,
        'loading' => 'eager', // Above the fold için
        'fetchpriority' => 'high', // Kritik görsel için
    ])
@endif

<!-- Galeri görselleri -->
@if($post->gallery)
    <div class="row">
        @foreach(json_decode($post->gallery, true) as $imagePath)
            <div class="col-md-4 mb-3">
                @seoimages($imagePath, [
                    'class' => 'img-fluid rounded',
                    'loading' => 'lazy',
                ])
            </div>
        @endforeach
    </div>
@endif
```

## 📝 Blade Directive'leri

### @seoinput - Görsel Seçimi

Formlarda görsel seçimi için kullanılır.

**Tekli Görsel:**

```blade
@seoinput('cover_image')
```

**Çoklu Görsel (Galeri):**

```blade
@seoinput('gallery', 'multiple')
```

### @seoimages - Görsel Gösterimi

SEO uyumlu `<picture>` etiketi ile görsel gösterir.

**Basit Kullanım:**

```blade
@seoimages('2025/12/10/x')
```

**Gelişmiş Kullanım (SEO Optimizasyonu):**

```blade
@seoimages('2025/12/10/x', [
    'class' => 'img-fluid rounded shadow',
    'alt' => 'Özel alt metni',
    'title' => 'Özel başlık',
    'loading' => 'lazy', // lazy veya eager
    'width' => 1200,
    'height' => 800,
    'fetchpriority' => 'high', // high, low veya auto (kritik görseller için)
    'decoding' => 'async', // async, sync veya auto (varsayılan: async)
    'sizes' => '(max-width: 768px) 100vw, 50vw', // Responsive için (otomatik üretilir)
])
```

**SEO Performans Attributes:**

- `decoding="async"` - Varsayılan olarak eklenir (performans için)
- `fetchpriority` - Sadece kritik görseller için `high` kullanın
- `sizes` - Responsive görseller için otomatik üretilir

**Çıktı Örneği:**

```html
<picture>
  <source srcset="..." type="image/avif" />
  <source srcset="..." type="image/webp" />
  <img
    src="..."
    alt="Özel alt metni"
    title="Özel başlık"
    width="1200"
    height="800"
    loading="lazy"
    decoding="async"
    fetchpriority="high"
    sizes="(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px"
    class="img-fluid rounded shadow"
  />
</picture>
```

### @seoimagesScripts - CSS ve JS Yükleme

Paketin CSS ve JavaScript dosyalarını yükler. `<head>` bölümüne eklenmelidir.

```blade
<head>
    @seoimagesScripts
</head>
```

## ⚙️ Yapılandırma

Config dosyası: `config/seo-images.php`

### Tüm Ayarlar

```php
return [
    // Primary Color (Modal ve input renkleri için)
    'primary_color' => env('SEO_IMAGES_PRIMARY_COLOR', '#0d6efd'),

    // Storage disk adı
    'disk' => env('SEO_IMAGES_DISK', 'public'),

    // Üretilecek görsel boyutları (genişlik piksel cinsinden)
    'sizes' => [480, 768, 1200, 1920],

    // Kalite ayarları (0-100 arası)
    'quality_jpg' => env('SEO_IMAGES_QUALITY_JPG', 80),
    'quality_webp' => env('SEO_IMAGES_QUALITY_WEBP', 80),
    'quality_avif' => env('SEO_IMAGES_QUALITY_AVIF', 60),

    // Route middleware'leri
    'route_middleware' => ['web', 'auth'],

    // Maksimum yükleme boyutu (kilobayt cinsinden)
    'max_upload_size' => env('SEO_IMAGES_MAX_UPLOAD_SIZE', 5120), // 5MB

    // Cache ayarları
    'cache' => [
        'enabled' => env('SEO_IMAGES_CACHE_ENABLED', true),
        'ttl' => env('SEO_IMAGES_CACHE_TTL', 3600), // 1 saat
        'prefix' => 'seo_images_',
    ],
];
```

## 🔌 API Endpoints

Tüm endpoint'ler `/seo-images` prefix'i ile çalışır ve `web` + `auth` middleware'leri ile korunur.

### GET /seo-images/list

Görselleri sayfalı olarak listeler.

**Query Parametreleri:**

- `page` (int, varsayılan: 1)
- `per_page` (int, varsayılan: 9)
- `search` (string, opsiyonel)

### POST /seo-images/upload

Yeni bir görsel yükler.

**Request:**

- `file` (required) - Yüklenecek görsel dosyası

### POST /seo-images/{id}/update-meta

Görselin meta verilerini (alt text ve title) günceller.

### DELETE /seo-images/{id}

Görseli ve tüm varyasyonlarını siler.

### GET /seo-images/dashboard

Dashboard istatistiklerini döndürür (cache'li).

## ❓ Sık Sorulan Sorular

### Görsel yükleme sırasında "Memory exhausted" hatası alıyorum

1. PHP `memory_limit` değerini artırın
2. Config'de `max_upload_size` değerini düşürün
3. Büyük dosyalar için paket otomatik memory yönetimi yapar

### Görseller görünmüyor (404 hatası)

1. `php artisan storage:link` komutunu çalıştırdığınızdan emin olun
2. `.env` dosyasında `APP_URL` değerinin doğru olduğundan emin olun
3. Storage disk'inin doğru yapılandırıldığından emin olun

### Modal açılmıyor

1. Bootstrap 5 ve jQuery'nin yüklendiğinden emin olun
2. `@seoimagesScripts` directive'inin `<head>` bölümünde olduğundan emin olun
3. CSRF token meta tag'inin eklendiğinden emin olun
4. `@include('seo-images::modal')` satırının sayfanın sonunda olduğundan emin olun

## 📝 Notlar

- **AVIF Desteği:** Intervention Image v2.7'de AVIF formatı tam desteklenmeyebilir. Bu durumda WebP formatına fallback yapılır.
- **Slug Üretimi:** Görseller otomatik olarak benzersiz slug'lar ile saklanır. Çakışma durumunda `-1`, `-2` gibi ekler eklenir.
- **Soft Delete:** Görseller soft delete ile silinir.
- **Memory Yönetimi:** Paket büyük dosyalar için otomatik memory yönetimi yapar.
- **Cache:** Dashboard otomatik cache'lenir. Görsel eklendiğinde/silindiğinde otomatik temizlenir.

## 🔒 Güvenlik

- Tüm route'lar varsayılan olarak `auth` middleware'i ile korunur
- Dosya tipi validasyonu yapılır
- Dosya boyutu limiti vardır
- CSRF koruması aktif
- XSS koruması (tüm output escape edilir)
