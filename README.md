# SEO Images - Laravel Paketi

Laravel projelerinde görsel yönetimi için SEO uyumlu paket. Görselleri otomatik olarak JPG, WebP ve AVIF formatlarına dönüştürür ve responsive `<picture>` etiketleri üretir.

## ✨ Özellikler

- ✅ Otomatik format dönüştürme (JPG, WebP, AVIF)
- ✅ Responsive görsel boyutları (480, 768, 1200, 1920px)
- ✅ Drag & Drop yükleme
- ✅ Toplu görsel yükleme
- ✅ Blade directive'leri
- ✅ SEO optimizasyonu (decoding, fetchpriority, sizes)
- ✅ Dashboard istatistikleri

## 📦 Kurulum

```bash
composer require tunasahincomtr/seo-images:dev-main
```

### Config Yayınlama

```bash
php artisan vendor:publish --tag=seo-images-config
```

### Migration Yayınlama ve Çalıştırma

```bash
php artisan vendor:publish --tag=seo-images-migrations
php artisan migrate
```

### Asset Yayınlama

```bash
php artisan vendor:publish --tag=seo-images-assets
```

### Storage Link

```bash
php artisan storage:link
```

## 🚀 Kullanım

### Test Sayfası

**Önemli:** Test sayfasını kullanmak için `config/seo-images.php` dosyasında middleware ayarını güncelleyin:

```php
'route_middleware' => ['web'], // 'auth' kaldırıldı
```

`resources/views/test-seo-images.blade.php` dosyası oluşturun:

```blade
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>SEO Images Test</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    @seoimagesScripts
</head>
<body>
    <div class="container py-5">
        <h1 class="mb-4">SEO Images Test Sayfası</h1>

        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Tekli Görsel Seçimi</h5>
            </div>
            <div class="card-body">
                @seoinput('cover_image')
            </div>
        </div>

        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">Galeri (Çoklu Görsel)</h5>
            </div>
            <div class="card-body">
                @seoinput('gallery', 'multiple')
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Görsel Gösterimi</h5>
            </div>
            <div class="card-body">
                @seoimages('2025/12/18/resim', [
                    'class' => 'img-fluid rounded',
                    'alt' => 'Örnek görsel'
                ])
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    @include('seo-images::modal')
</body>
</html>
```

### Route Ekleme

`routes/web.php`:

```php
Route::get('/test-seo-images', function () {
    return view('test-seo-images');
});
```

## 📝 Blade Directive'leri

### @seoinput - Görsel Seçimi

Formlarda görsel seçimi için kullanılır.

**Tekli Görsel:**

```blade
@seoinput('cover_image')
```

**Çoklu Görsel:**

```blade
@seoinput('gallery', 'multiple')
```

### @seoimages - Görsel Gösterimi

SEO uyumlu `<picture>` etiketi ile görsel gösterir.

**Basit Kullanım:**

```blade
@seoimages('2025/12/18/resim')
```

**Gelişmiş Kullanım:**

```blade
@seoimages('2025/12/18/resim', [
    'class' => 'img-fluid rounded',
    'alt' => 'Alt metni',
    'title' => 'Başlık',
    'loading' => 'lazy',
    'width' => 1200,
    'height' => 800,
    'fetchpriority' => 'high',
    'decoding' => 'async',
    'sizes' => '(max-width: 768px) 100vw, 50vw'
])
```

### @seoimagesScripts - CSS ve JS Yükleme

Paketin CSS ve JavaScript dosyalarını yükler. `<head>` bölümüne eklenmelidir.

```blade
<head>
    @seoimagesScripts
</head>
```

## ⚙️ Yapılandırma

`.env` dosyasına ekleyin:

```env
SEO_IMAGES_DISK=public
SEO_IMAGES_QUALITY_JPG=80
SEO_IMAGES_QUALITY_WEBP=80
SEO_IMAGES_QUALITY_AVIF=60
SEO_IMAGES_MAX_UPLOAD_SIZE=5120
SEO_IMAGES_PRIMARY_COLOR=#0d6efd
SEO_IMAGES_CACHE_ENABLED=true
SEO_IMAGES_CACHE_TTL=3600
```

## 🔌 API Endpoints

Tüm endpoint'ler `/seo-images` prefix'i ile çalışır.

- `GET /seo-images/list` - Görselleri listele
- `POST /seo-images/upload` - Görsel yükle
- `POST /seo-images/{id}/update-meta` - Meta güncelle
- `DELETE /seo-images/{id}` - Görsel sil
- `GET /seo-images/dashboard` - Dashboard istatistikleri
- `POST /seo-images/render` - Görsel render et

## 📝 Notlar

- Görseller otomatik olarak benzersiz slug'lar ile saklanır
- AVIF formatı Intervention Image v2.7'de tam desteklenmeyebilir
- Dashboard otomatik cache'lenir
- Tüm route'lar `auth` middleware'i ile korunur
