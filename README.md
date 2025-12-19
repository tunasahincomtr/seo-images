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

`````env
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

Ana layout dosyanızın (`resources/views/layouts/app.blade.php` gibi) tam bir örneği:

````blade
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">

    <!-- CSRF Token (ÖNEMLİ: AJAX istekleri için gerekli) -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>@yield('title', 'Laravel App')</title>

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"
          integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM"
          crossorigin="anonymous">

    <!-- Bootstrap Icons (Opsiyonel) -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">

    <!-- SEO Images Scripts (HEAD bölümüne ekleyin) -->
    @seoimagesScripts

    <!-- Custom CSS (Opsiyonel) -->
    @stack('styles')
</head>
<body>
    <!-- Navigation (Opsiyonel) -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="{{ url('/') }}">Laravel App</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="{{ url('/') }}">Ana Sayfa</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Main Content -->
    <main class="py-4">
        <div class="container">
            @if(session('success'))
                <div class="alert alert-success alert-dismissible fade show" role="alert">
                    {{ session('success') }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            @endif

            @if(session('error'))
                <div class="alert alert-danger alert-dismissible fade show" role="alert">
                    {{ session('error') }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            @endif

            @yield('content')
        </div>
    </main>

    <!-- Footer (Opsiyonel) -->
    <footer class="bg-light py-4 mt-5">
        <div class="container text-center text-muted">
            <p class="mb-0">&copy; {{ date('Y') }} Laravel App. Tüm hakları saklıdır.</p>
        </div>
    </footer>

    <!-- jQuery (Bootstrap'ten önce yüklenmeli) -->
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"
            integrity="sha256-2Pm10CIsheKjQhBMd5W5lAMb6gQWO2TO4q8W8URnYQM="
            crossorigin="anonymous"></script>

    <!-- Bootstrap 5 JS Bundle -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
            integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz"
            crossorigin="anonymous"></script>

    <!-- SEO Images Modal (Sayfanın sonuna ekleyin) -->
    @include('seo-images::modal')

    <!-- Custom Scripts (Opsiyonel) -->
    @stack('scripts')
</body>
</html>
`````

**Önemli Notlar:**

- `@seoimagesScripts` directive'i `<head>` bölümüne eklenmelidir
- CSRF token meta tag'i mutlaka eklenmelidir (AJAX istekleri için)
- jQuery Bootstrap'ten önce yüklenmelidir
- Modal'ı sayfanın sonuna (`</body>` öncesine) ekleyin
- Bootstrap 5 JS bundle'ı sayfanın sonuna eklenmelidir

### Adım 2: Form'unuzda Görsel Seçimi Ekleyin

Tam bir form örneği:

```blade
@extends('layouts.app')

@section('title', 'Yeni Yazı Oluştur')

@section('content')
<div class="row justify-content-center">
    <div class="col-md-8">
        <div class="card shadow-sm">
            <div class="card-header bg-primary text-white">
                <h4 class="mb-0">
                    <i class="bi bi-file-earmark-image"></i> Yeni Yazı Oluştur
                </h4>
            </div>
            <div class="card-body">
                <form method="POST" action="{{ route('posts.store') }}" enctype="multipart/form-data">
                    @csrf

                    <!-- Başlık -->
                    <div class="mb-4">
                        <label for="title" class="form-label fw-bold">
                            Başlık <span class="text-danger">*</span>
                        </label>
                        <input type="text"
                               class="form-control @error('title') is-invalid @enderror"
                               id="title"
                               name="title"
                               value="{{ old('title') }}"
                               required>
                        @error('title')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <!-- Kapak Görseli -->
                    <div class="mb-4">
                        <label class="form-label fw-bold">
                            <i class="bi bi-image"></i> Kapak Görseli
                        </label>
                        <p class="text-muted small mb-2">Yazınız için bir kapak görseli seçin</p>
                        @seoinput('cover_image')
                        @error('cover_image')
                            <div class="text-danger small mt-1">{{ $message }}</div>
                        @enderror
                    </div>

                    <!-- Galeri Görselleri -->
                    <div class="mb-4">
                        <label class="form-label fw-bold">
                            <i class="bi bi-images"></i> Galeri Görselleri
                        </label>
                        <p class="text-muted small mb-2">Yazınız için birden fazla görsel ekleyebilirsiniz</p>
                        @seoinput('gallery', 'multiple')
                        @error('gallery')
                            <div class="text-danger small mt-1">{{ $message }}</div>
                        @enderror
                    </div>

                    <!-- İçerik -->
                    <div class="mb-4">
                        <label for="content" class="form-label fw-bold">
                            İçerik <span class="text-danger">*</span>
                        </label>
                        <textarea class="form-control @error('content') is-invalid @enderror"
                                  id="content"
                                  name="content"
                                  rows="10"
                                  required>{{ old('content') }}</textarea>
                        @error('content')
                            <div class="invalid-feedback">{{ $message }}</div>
                        @enderror
                    </div>

                    <!-- Form Butonları -->
                    <div class="d-flex justify-content-between align-items-center">
                        <a href="{{ route('posts.index') }}" class="btn btn-secondary">
                            <i class="bi bi-arrow-left"></i> İptal
                        </a>
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-check-circle"></i> Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
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

Detay sayfasında görselleri gösterme örneği:

```blade
@extends('layouts.app')

@section('title', $post->title)

@section('content')
<article class="mb-5">
    <!-- Başlık -->
    <header class="mb-4">
        <h1 class="display-4 fw-bold">{{ $post->title }}</h1>
        <p class="text-muted">
            <i class="bi bi-calendar"></i> {{ $post->created_at->format('d F Y') }}
        </p>
    </header>

    <!-- Kapak Görseli -->
    @if($post->cover_image)
        <div class="mb-4">
            @seoimages($post->cover_image, [
                'class' => 'img-fluid rounded shadow-lg',
                'alt' => $post->title,
                'loading' => 'eager',
                'fetchpriority' => 'high',
            ])
        </div>
    @endif

    <!-- İçerik -->
    <div class="content mb-5">
        {!! nl2br(e($post->content)) !!}
    </div>

    <!-- Galeri Görselleri -->
    @if($post->gallery)
        <section class="mt-5">
            <h2 class="h4 mb-4">
                <i class="bi bi-images"></i> Galeri
            </h2>
            <div class="row g-3">
                @foreach(json_decode($post->gallery, true) as $imagePath)
                    <div class="col-md-4 col-sm-6">
                        <div class="card shadow-sm h-100">
                            <div class="card-body p-2">
                                @seoimages($imagePath, [
                                    'class' => 'img-fluid rounded',
                                    'loading' => 'lazy',
                                ])
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        </section>
    @endif
</article>

<!-- İlgili Yazılar (Opsiyonel) -->
<div class="mt-5 pt-4 border-top">
    <h3 class="h5 mb-3">İlgili Yazılar</h3>
    <div class="row">
        <!-- İlgili yazılar buraya -->
    </div>
</div>
@endsection
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
