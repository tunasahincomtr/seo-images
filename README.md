# SEO Images - Laravel Paketi

Laravel projelerinde kullanılacak, tam çalışan, stabil bir medya kütüphanesi. Görselleri otomatik olarak JPG, WebP ve AVIF formatlarına dönüştürür ve SEO uyumlu `<picture>` etiketleri ile responsive çıktı üretir.

**Yazar:** Tuna Şahin

## 📋 İçindekiler

-   [Özellikler](#özellikler)
-   [Gereksinimler](#gereksinimler)
-   [Kurulum](#kurulum)
-   [Kullanım](#kullanım)
-   [Blade Directive'leri](#blade-directiveleri)
-   [Yapılandırma](#yapılandırma)
-   [API Endpoints](#api-endpoints)
-   [Test Sayfası](#test-sayfası)
-   [Dosya Yapısı](#dosya-yapısı)
-   [Sık Sorulan Sorular](#sık-sorulan-sorular)
-   [Notlar](#notlar)

## ✨ Özellikler

-   ✅ **Otomatik format dönüştürme** - JPG, WebP ve AVIF formatlarında otomatik üretim
-   ✅ **Çoklu boyut desteği** - 480, 768, 1200, 1920px boyutlarında otomatik varyasyonlar
-   ✅ **Drag & Drop yükleme** - Sürükle-bırak ile kolay dosya yükleme
-   ✅ **Toplu yükleme** - Birden fazla görseli aynı anda yükleme
-   ✅ **Tekli ve çoklu görsel seçimi** - Formlarda esnek görsel seçimi
-   ✅ **Meta veri yönetimi** - Alt text ve title yönetimi
-   ✅ **Blade directive'leri** - Kolay kullanım için özel Blade direktifleri
-   ✅ **Tam çalışan frontend** - Bootstrap 5 + jQuery ile modern arayüz
-   ✅ **Responsive çıktı** - SEO uyumlu `<picture>` etiketleri
-   ✅ **Memory optimizasyonu** - Büyük dosyalar için otomatik bellek yönetimi
-   ✅ **Full screen modal** - Geniş çalışma alanı
-   ✅ **Format ve varyasyon görüntüleme** - Tüm formatları detaylı görüntüleme

## 🔧 Gereksinimler

-   Laravel 10+ veya 11+
-   PHP 8.1+
-   Intervention Image v2.7
-   Bootstrap 5 (CDN veya local)
-   jQuery 3.x (CDN veya local)

## 📦 Kurulum

### 1. Paketi Yükleyin

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
TunaSahin\SeoImages\SeoImagesServiceProvider::class,
### 2. Yayınlama ve Migrasyon

Config dosyasını yayınlayın:

```bash
php artisan vendor:publish --tag=seo-images-config
```

Migration dosyalarını yayınlayın:

```bash
php artisan vendor:publish --tag=seo-images-migrations
```

Asset dosyalarını (JS ve CSS) yayınlayın:

```bash
php artisan vendor:publish --tag=seo-images-assets
```

View dosyalarını yayınlayın (opsiyonel):

```bash
php artisan vendor:publish --tag=seo-images-views
```

Migration'ları çalıştırın:

```bash
php artisan migrate
```

### 3. Storage Link Oluşturun

Eğer `public` disk kullanıyorsanız, storage link oluşturun:

```bash
php artisan storage:link
```

Bu komut `public/storage` klasörünü `storage/app/public` klasörüne bağlar.

## 🚀 Kullanım

### Temel Kurulum

1. **Layout dosyanıza script'leri ekleyin:**

```blade
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

    <!-- jQuery -->
    <script src="https://code.jquery.com/jquery-3.7.0.min.js"></script>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- SEO Images Scripts -->
    @seoimagesScripts
</head>
<body>
    <!-- İçerik -->


        <form method="POST" action="/save">
            @csrf

            <!-- Tekli Resim -->
            <div class="mb-3">
                <label>Kapak Resmi</label>
                @seoinput('cover_image')
            </div>

            <!-- Çoklu Resim -->
            <div class="mb-3">
                <label>Galeri Resimleri</label>
                @seoinput('gallery', true)
            </div>

            <button type="submit" class="btn btn-primary">Kaydet</button>
        </form>

        <!-- Seçilen Resmi Göster -->
        @if(isset($coverImage))
            <div class="mt-4">
                <h3>Kapak Resmi:</h3>
                @seopicture($coverImage, 'img-fluid rounded', 'cover-image')
            </div>
        @endif

        <!-- Galeri Resimlerini Göster -->
        @if(isset($gallery) && is_array($gallery))
            <div class="row mt-4">
                @foreach($gallery as $image)
                    <div class="col-md-4 mb-3">
                        @seopicture($image, 'img-fluid rounded')
                    </div>
                @endforeach
            </div>
        @endif
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    @stack('styles')
    @stack('scripts')
    @stack('modals')
    <!-- Modal'ı ekleyin -->
    @include('seo-images::modal')
</body>
</html>
```

2. **Formunuzda görsel seçimi ekleyin:**

```blade
<form method="POST" action="/your-route">
    @csrf

    <div class="mb-3">
        <label>Kapak Görseli</label>
        @seoinput('cover_image')
    </div>

    <div class="mb-3">
        <label>Galeri</label>
        @seoinput('gallery', 'multiple')
    </div>

    <button type="submit" class="btn btn-primary">Kaydet</button>
</form>
```

3. **Form gönderildiğinde görselleri kullanın:**

```php
// Controller'da
public function store(Request $request)
{
    $coverImage = $request->input('cover_image'); // "2025/12/10/x" formatında
    $gallery = json_decode($request->input('gallery'), true); // Array formatında

    // Veritabanına kaydedin
    Post::create([
        'cover_image' => $coverImage,
        'gallery' => $gallery,
    ]);

    return redirect()->back();
}
```

4. **Görselleri sayfada gösterin:**

```blade
<!-- Tekli görsel -->
@seoimages($post->cover_image, [
    'class' => 'img-fluid rounded',
    'alt' => $post->title,
])

<!-- Galeri görselleri -->
@foreach($post->gallery as $imagePath)
    <div class="col-md-4 mb-3">
        @seoimages($imagePath, [
            'class' => 'img-fluid rounded',
            'loading' => 'lazy',
        ])
    </div>
@endforeach
```

## 📝 Blade Directive'leri

### @seoinput - Görsel Seçimi

Formlarda görsel seçimi için kullanılır. İki modu vardır: tekli ve çoklu.

#### Tekli Görsel Seçimi

```blade
@seoinput('cover_image')
```

Bu directive şunları oluşturur:

-   Hidden input: `name="cover_image"` (değer: `"2025/12/10/x"` formatında)
-   Önizleme alanı
-   "Resim Seç" butonu

**Kullanım Senaryosu:**

-   Blog yazısı kapak görseli
-   Ürün ana görseli
-   Profil fotoğrafı

#### Çoklu Görsel Seçimi (Galeri)

```blade
@seoinput('gallery', 'multiple')
```

Bu directive şunları oluşturur:

-   Hidden input: `name="gallery"` (değer: `'["2025/12/10/x","2025/12/11/y"]'` JSON formatında)
-   Önizleme grid'i
-   "Galeri Seç" butonu
-   Her görsel için silme butonu

**Kullanım Senaryosu:**

-   Ürün galerisi
-   Blog yazısı görselleri
-   Portfolio görselleri

### @seoimages - Görsel Gösterimi

Görseli SEO uyumlu `<picture>` etiketi ile gösterir.

#### Basit Kullanım

```blade
@seoimages('2025/12/10/x')
```

#### Gelişmiş Kullanım

```blade
@seoimages('2025/12/10/x', [
    'class' => 'img-fluid rounded shadow',
    'alt' => 'Özel alt metni',
    'title' => 'Özel başlık',
    'loading' => 'lazy',
    'width' => 1200,
    'height' => 800,
])
```

**Parametreler:**

-   `class` - CSS class'ları
-   `alt` - Alt text (veritabanındaki değer yerine kullanılır)
-   `title` - Title attribute (veritabanındaki değer yerine kullanılır)
-   `loading` - Lazy loading (`lazy` veya `eager`)
-   `width` - Görsel genişliği
-   `height` - Görsel yüksekliği

**Çıktı Örneği:**

```html
<picture>
    <source
        srcset="
            /storage/2025/12/10/x/x-480.avif   480w,
            /storage/2025/12/10/x/x-768.avif   768w,
            /storage/2025/12/10/x/x-1200.avif 1200w,
            /storage/2025/12/10/x/x.avif      1920w
        "
        type="image/avif"
    />
    <source
        srcset="
            /storage/2025/12/10/x/x-480.webp   480w,
            /storage/2025/12/10/x/x-768.webp   768w,
            /storage/2025/12/10/x/x-1200.webp 1200w,
            /storage/2025/12/10/x/x.webp      1920w
        "
        type="image/webp"
    />
    <img
        src="/storage/2025/12/10/x/x.jpg"
        alt="Özel alt metni"
        title="Özel başlık"
        width="1200"
        height="800"
        loading="lazy"
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

    // Queue kullanımı (true ise görsel dönüştürme queue ile yapılır)
    'use_queue' => env('SEO_IMAGES_USE_QUEUE', false),

    // Maksimum yükleme boyutu (kilobayt cinsinden)
    'max_upload_size' => env('SEO_IMAGES_MAX_UPLOAD_SIZE', 5120), // 5MB

    // İzin verilen MIME tipleri
    'allowed_mime_types' => [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif',
        'image/heic',
        'image/heif',
    ],
];
```

### .env Dosyası Örnekleri

```env
SEO_IMAGES_DISK=public
SEO_IMAGES_QUALITY_JPG=80
SEO_IMAGES_QUALITY_WEBP=80
SEO_IMAGES_QUALITY_AVIF=60
SEO_IMAGES_USE_QUEUE=false
SEO_IMAGES_MAX_UPLOAD_SIZE=5120
```

## 🔌 API Endpoints

Tüm endpoint'ler `/seo-images` prefix'i ile çalışır ve `web` + `auth` middleware'leri ile korunur (config'den değiştirilebilir).

### GET /seo-images/list

Görselleri sayfalı olarak listeler.

**Query Parametreleri:**

-   `page` (int, varsayılan: 1) - Sayfa numarası
-   `per_page` (int, varsayılan: 9) - Sayfa başına görsel sayısı
-   `search` (string, opsiyonel) - Arama terimi

**Response:**

```json
{
    "data": [
        {
            "id": 1,
            "folder_path": "2025/12/10/x",
            "basename": "x",
            "preview_url": "http://example.com/storage/2025/12/10/x/x-480.webp",
            "alt": "Görsel açıklaması",
            "title": "Görsel başlığı",
            "width": 1920,
            "height": 1080,
            "formats": [
                {
                    "format": "jpg",
                    "original": {
                        "exists": true,
                        "url": "http://example.com/storage/2025/12/10/x/x.jpg",
                        "size": 245760
                    },
                    "sizes": [
                        {
                            "width": 480,
                            "url": "http://example.com/storage/2025/12/10/x/x-480.jpg",
                            "exists": true
                        }
                    ]
                }
            ]
        }
    ],
    "meta": {
        "current_page": 1,
        "last_page": 5,
        "total": 45
    }
}
```

### POST /seo-images/upload

Yeni bir görsel yükler ve tüm formatları oluşturur.

**Request:**

-   `file` (required) - Yüklenecek görsel dosyası

**Response (Başarılı):**

```json
{
    "id": 1,
    "folder_path": "2025/12/10/x",
    "basename": "x",
    "preview_url": "http://example.com/storage/2025/12/10/x/x-480.webp",
    "alt": "",
    "title": "",
    "width": 1920,
    "height": 1080
}
```

**Response (Hata):**

```json
{
    "error": true,
    "message": "Dosya boyutu çok büyük. Maksimum: 5120 KB"
}
```

### POST /seo-images/{id}/update-meta

Görselin meta verilerini (alt text ve title) günceller.

**Request:**

```json
{
    "alt": "Yeni alt metni",
    "title": "Yeni başlık"
}
```

**Response:**

```json
{
    "status": "ok",
    "data": {
        "id": 1,
        "folder_path": "2025/12/10/x",
        "basename": "x",
        "alt": "Yeni alt metni",
        "title": "Yeni başlık"
    }
}
```

### DELETE /seo-images/{id}

Görseli ve tüm varyasyonlarını siler.

**Response:**

```json
{
    "status": "ok"
}
```

### POST /seo-images/render

Görselin HTML çıktısını döndürür (AJAX için).

**Request:**

```json
{
    "folder_path": "2025/12/10/x",
    "options": {
        "class": "img-fluid",
        "style": "max-width: 100px;"
    }
}
```

**Response:**

```json
{
    "html": "<picture>...</picture>"
}
```

## 🧪 Test Sayfası

Paket, test için bir demo sayfası içerir:

```
/seo-images/test
```

Bu sayfada şunları test edebilirsiniz:

-   ✅ Tekli görsel seçimi
-   ✅ Çoklu görsel seçimi (galeri)
-   ✅ Görsel yükleme (drag & drop ve dosya seç)
-   ✅ Toplu görsel yükleme
-   ✅ Meta veri güncelleme
-   ✅ Görsel silme
-   ✅ Format ve varyasyon görüntüleme
-   ✅ @seoimages directive çıktısı

**Not:** Test sayfasına erişmek için authentication gerekebilir (config'den değiştirilebilir).

## 📁 Dosya Yapısı

Yüklenen görseller şu yapıda saklanır:

```
storage/app/public/
  2025/
    12/
      10/
        x/
          x.jpg              # Orijinal JPG
          x.webp             # Orijinal WebP
          x.avif             # Orijinal AVIF
          x-480.jpg          # 480px JPG
          x-480.webp         # 480px WebP
          x-480.avif         # 480px AVIF
          x-768.jpg          # 768px JPG
          x-768.webp         # 768px WebP
          x-768.avif         # 768px AVIF
          x-1200.jpg         # 1200px JPG
          x-1200.webp        # 1200px WebP
          x-1200.avif        # 1200px AVIF
          x-1920.jpg         # 1920px JPG
          x-1920.webp        # 1920px WebP
          x-1920.avif        # 1920px AVIF
```

**Klasör Yapısı:**

-   `{YIL}/{AY}/{GÜN}/{SLUG}/` formatında
-   Her görsel kendi klasöründe saklanır
-   Slug çakışırsa otomatik olarak `-1`, `-2` eklenir

## 💡 Kullanım Örnekleri

### Örnek 1: Blog Yazısı Formu

```blade
<form method="POST" action="{{ route('posts.store') }}">
    @csrf

    <div class="mb-3">
        <label>Başlık</label>
        <input type="text" name="title" class="form-control">
    </div>

    <div class="mb-3">
        <label>Kapak Görseli</label>
        @seoinput('cover_image')
    </div>

    <div class="mb-3">
        <label>İçerik Görselleri</label>
        @seoinput('content_images', 'multiple')
    </div>

    <button type="submit" class="btn btn-primary">Kaydet</button>
</form>
```

### Örnek 2: Ürün Formu

```blade
<form method="POST" action="{{ route('products.store') }}">
    @csrf

    <div class="row">
        <div class="col-md-6">
            <div class="mb-3">
                <label>Ürün Adı</label>
                <input type="text" name="name" class="form-control">
            </div>
        </div>
        <div class="col-md-6">
            <div class="mb-3">
                <label>Ana Görsel</label>
                @seoinput('main_image')
            </div>
        </div>
    </div>

    <div class="mb-3">
        <label>Ürün Galerisi</label>
        @seoinput('gallery', 'multiple')
    </div>

    <button type="submit" class="btn btn-primary">Kaydet</button>
</form>
```

### Örnek 3: Görselleri Gösterme

```blade
<!-- Blog yazısı detay sayfası -->
<article>
    <h1>{{ $post->title }}</h1>

    <!-- Kapak görseli -->
    @if($post->cover_image)
        <div class="mb-4">
            @seoimages($post->cover_image, [
                'class' => 'img-fluid rounded shadow',
                'alt' => $post->title,
                'loading' => 'eager',
            ])
        </div>
    @endif

    <!-- İçerik -->
    <div class="content">
        {!! $post->content !!}
    </div>

    <!-- İçerik görselleri -->
    @if($post->content_images)
        <div class="row mt-4">
            @foreach(json_decode($post->content_images, true) as $imagePath)
                <div class="col-md-6 mb-3">
                    @seoimages($imagePath, [
                        'class' => 'img-fluid rounded',
                        'loading' => 'lazy',
                    ])
                </div>
            @endforeach
        </div>
    @endif
</article>
```

### Örnek 4: Controller'da Kullanım

```php
<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'cover_image' => 'nullable|string',
            'content_images' => 'nullable|string',
        ]);

        $post = Post::create([
            'title' => $validated['title'],
            'cover_image' => $validated['cover_image'], // "2025/12/10/x" formatında
            'content_images' => $validated['content_images'], // JSON string
        ]);

        return redirect()->route('posts.show', $post);
    }

    public function show(Post $post)
    {
        return view('posts.show', compact('post'));
    }
}
```

## ❓ Sık Sorulan Sorular

### Görsel yükleme sırasında "Memory exhausted" hatası alıyorum

Paket otomatik olarak memory limit kontrolü yapar ve büyük dosyalar için geçici olarak limit artırır. Eğer hala sorun yaşıyorsanız:

1. PHP memory_limit değerini artırın (`php.ini` dosyasında)
2. Config'de `max_upload_size` değerini düşürün
3. `use_queue` ayarını `true` yapın (queue kullanımı için queue worker çalıştırmanız gerekir)

### AVIF formatı oluşturulmuyor

Intervention Image v2.7'de AVIF desteği sınırlıdır. Paket otomatik olarak WebP'ye fallback yapar. AVIF desteği için Intervention Image v3 kullanmanız gerekebilir.

### Görseller görünmüyor (404 hatası)

1. `php artisan storage:link` komutunu çalıştırdığınızdan emin olun
2. `.env` dosyasında `APP_URL` değerinin doğru olduğundan emin olun
3. Storage disk'inin (`public`) doğru yapılandırıldığından emin olun

### Modal açılmıyor

1. Bootstrap 5 ve jQuery'nin yüklendiğinden emin olun
2. `@seoimagesScripts` directive'inin `<head>` bölümünde olduğundan emin olun
3. `@include('seo-images::modal')` satırının sayfanın sonunda olduğundan emin olun
4. Browser console'da hata olup olmadığını kontrol edin

### Çoklu görsel seçiminde görseller görünmüyor

1. Hidden input'un değerinin JSON formatında olduğundan emin olun
2. `@seoimagesScripts` directive'inin yüklendiğinden emin olun
3. Browser console'da JavaScript hatalarını kontrol edin

### Form gönderildiğinde görsel değerleri boş geliyor

1. Hidden input'ların form içinde olduğundan emin olun
2. Input name'lerinin doğru olduğundan emin olun
3. Form submit edilmeden önce görsel seçildiğinden emin olun

## 📝 Notlar

-   **AVIF Desteği:** Intervention Image v2.7'de AVIF formatı tam desteklenmeyebilir. Bu durumda WebP formatına fallback yapılır.
-   **Slug Üretimi:** Görseller otomatik olarak benzersiz slug'lar ile saklanır. Çakışma durumunda `-1`, `-2` gibi ekler eklenir.
-   **Soft Delete:** Görseller soft delete ile silinir. `deleted_at` alanı kullanılır.
-   **Memory Yönetimi:** Paket büyük dosyalar için otomatik memory yönetimi yapar.
-   **URL Yapısı:** Tüm URL'ler `.env` dosyasındaki `APP_URL` değerini kullanır.
-   **Toplu Yükleme:** Birden fazla görsel seçildiğinde sıralı olarak yüklenir (memory için).

## 🔒 Güvenlik

-   Tüm route'lar varsayılan olarak `auth` middleware'i ile korunur
-   Dosya tipi validasyonu yapılır
-   Dosya boyutu limiti vardır
-   CSRF koruması aktif

## 🐛 Hata Ayıklama

### Log Dosyalarını Kontrol Edin

```bash
tail -f storage/logs/laravel.log
```

### Config Cache'i Temizleyin

```bash
php artisan config:clear
php artisan cache:clear
php artisan view:clear
```

### Route'ları Kontrol Edin

```bash
php artisan route:list --path=seo-images
```

## 📄 Lisans

MIT License

**Yazar:** Tuna Şahin

## 🤝 Katkıda Bulunma

Bu paket açık kaynaklıdır. Katkılarınızı bekliyoruz!

## 📞 Destek

Sorularınız için issue açabilir veya yazara ulaşabilirsiniz.

---

**Versiyon:** 1.0.0  
**Son Güncelleme:** 2025
