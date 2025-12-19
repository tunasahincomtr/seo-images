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
```

**Not:** Config ayarlarını yaptıktan sonra cache'i temizlemek için:
```bash
php artisan config:clear
php artisan cache:clear
```

---

## 🚀 Kullanım

### Test Sayfası

Paketi test etmek için aşağıdaki tek sayfayı oluşturun. Bu sayfa tüm özellikleri içerir:

**Test Sayfası Oluşturun** (`resources/views/test-seo-images.blade.php`):

```blade
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">

    <!-- CSRF Token (ÖNEMLİ: AJAX istekleri için gerekli) -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>SEO Images Test Sayfası</title>

    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"
          integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM"
          crossorigin="anonymous">

    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">

    <!-- SEO Images Scripts (HEAD bölümüne ekleyin) -->
    @seoimagesScripts
</head>
<body>
    <div class="container py-5">
        <h1 class="mb-4">SEO Images Paket Test Sayfası</h1>

        <div class="alert alert-info mb-4">
            <i class="bi bi-info-circle"></i> Bu sayfa paketin tüm özelliklerini test etmek için hazırlanmıştır.
        </div>

        <!-- Test Formu -->
        <div class="card shadow-sm mb-4">
            <div class="card-header bg-primary text-white">
                <h4 class="mb-0">Görsel Seçimi Testi</h4>
            </div>
            <div class="card-body">
                <form method="POST" action="#" id="test-form">
                    @csrf

                    <div class="row">
                        <div class="col-md-6 mb-4">
                            <h5 class="mb-3">Tekli Görsel Seçimi</h5>
                            <p class="text-muted small">@seoinput directive kullanımı</p>
                            @seoinput('cover_image')
                        </div>

                        <div class="col-md-6 mb-4">
                            <h5 class="mb-3">Galeri (Çoklu Görsel)</h5>
                            <p class="text-muted small">@seoinput('gallery', 'multiple') directive kullanımı</p>
                            @seoinput('gallery', 'multiple')
                        </div>
                    </div>

                    <hr class="my-4">

                    <!-- Seçilen Görselleri Gösterme -->
                    <div class="mb-4">
                        <h5 class="mb-3">Seçilen Görseller</h5>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Kapak Görseli:</label>
                            <div id="cover-preview" class="border rounded p-3 bg-light">
                                <p class="text-muted mb-0">Henüz görsel seçilmedi</p>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label fw-bold">Galeri Görselleri:</label>
                            <div id="gallery-preview" class="border rounded p-3 bg-light">
                                <p class="text-muted mb-0">Henüz görsel seçilmedi</p>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">Test Et</button>
                        <button type="button" class="btn btn-secondary" onclick="clearForm()">Temizle</button>
                    </div>
                </form>

                <!-- Form Verileri -->
                <div class="mt-4">
                    <h5 class="mb-3">Form Verileri</h5>
                    <pre id="form-data" class="bg-dark text-light p-3 rounded" style="min-height: 100px; max-height: 300px; overflow-y: auto;">Form gönderildiğinde burada görünecek...</pre>
                </div>
            </div>
        </div>

        <!-- @seoimages Directive Testi -->
        <div class="card shadow-sm">
            <div class="card-header bg-success text-white">
                <h4 class="mb-0">@seoimages Directive Testi</h4>
            </div>
            <div class="card-body">
                <p class="text-muted mb-3">
                    Aşağıdaki alana bir görsel yükleyip folder_path'ini girin:
                </p>
                <div class="input-group mb-3">
                    <input type="text" class="form-control" id="example-folder-path"
                           placeholder="Örn: 2025/12/18/resim">
                    <button class="btn btn-outline-primary" type="button" onclick="loadExampleImage()">
                        <i class="bi bi-search"></i> Yükle
                    </button>
                </div>
                <div id="example-image-container" class="text-center p-4 border rounded bg-light">
                    <p class="text-muted mb-0">Yukarıdaki alana folder_path girin ve yükle butonuna basın</p>
                </div>
            </div>
        </div>
    </div>

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

    <script>
        // Form submit handler (test için)
        $('#test-form').on('submit', function(e) {
            e.preventDefault();
            var formData = {
                cover_image: $('input[name="cover_image"]').val(),
                gallery: $('input[name="gallery"]').val()
            };
            $('#form-data').text(JSON.stringify(formData, null, 2));

            if (typeof window.SeoImagesManager !== 'undefined') {
                window.SeoImagesManager.showToast('Form verileri konsola yazdırıldı!', 'success');
            }
        });

        // Form temizleme
        function clearForm() {
            $('input[name="cover_image"]').val('');
            $('input[name="gallery"]').val('[]');
            $('#cover-preview').html('<p class="text-muted mb-0">Henüz görsel seçilmedi</p>');
            $('#gallery-preview').html('<p class="text-muted mb-0">Henüz görsel seçilmedi</p>');
            $('#form-data').text('Form gönderildiğinde burada görünecek...');
        }

        // Örnek görsel yükleme
        function loadExampleImage() {
            var folderPath = $('#example-folder-path').val();
            if (!folderPath) {
                alert('Lütfen bir folder_path girin');
                return;
            }

            $('#example-image-container').html('<div class="spinner-border" role="status"></div>');

            $.ajax({
                url: '/seo-images/list',
                method: 'GET',
                data: { per_page: 100 },
                success: function(response) {
                    var image = response.data.find(function(img) {
                        return img.folder_path === folderPath;
                    });

                    if (image) {
                        $.ajax({
                            url: '/seo-images/render',
                            method: 'POST',
                            data: {
                                folder_path: folderPath,
                                options: {
                                    class: 'img-fluid rounded shadow-sm',
                                    alt: image.alt || 'Test görseli'
                                }
                            },
                            success: function(renderResponse) {
                                var html = '<p class="small text-muted mb-2">Folder Path: <code>' + image.folder_path + '</code></p>';
                                html += '<div class="border rounded p-2 bg-white">' + renderResponse.html + '</div>';
                                $('#example-image-container').html(html);
                            },
                            error: function() {
                                $('#example-image-container').html('<p class="text-danger">Görsel render edilemedi</p>');
                            }
                        });
                    } else {
                        $('#example-image-container').html('<p class="text-danger">Görsel bulunamadı. Lütfen geçerli bir folder_path girin.</p>');
                    }
                },
                error: function() {
                    $('#example-image-container').html('<p class="text-danger">Görsel listesi alınamadı</p>');
                }
            });
        }

        // Input değişikliklerini dinle
        $(document).on('change', 'input[name="cover_image"]', function() {
            var folderPath = $(this).val();
            if (folderPath) {
                $('#cover-preview').html('<p class="text-success mb-0"><i class="bi bi-check-circle"></i> Seçildi: <code>' + folderPath + '</code></p>');
            } else {
                $('#cover-preview').html('<p class="text-muted mb-0">Henüz görsel seçilmedi</p>');
            }
        });

        $(document).on('change', 'input[name="gallery"]', function() {
            var gallery = $(this).val();
            try {
                var paths = JSON.parse(gallery || '[]');
                if (paths.length > 0) {
                    var html = '<p class="text-success mb-2"><i class="bi bi-check-circle"></i> ' + paths.length + ' görsel seçildi:</p>';
                    html += '<ul class="list-unstyled mb-0">';
                    paths.forEach(function(path) {
                        html += '<li><code>' + path + '</code></li>';
                    });
                    html += '</ul>';
                    $('#gallery-preview').html(html);
                } else {
                    $('#gallery-preview').html('<p class="text-muted mb-0">Henüz görsel seçilmedi</p>');
                }
            } catch (e) {
                $('#gallery-preview').html('<p class="text-muted mb-0">Henüz görsel seçilmedi</p>');
            }
        });
    </script>
</body>
</html>
```
<div class="container py-4">
    <div class="row">
        <div class="col-12">
            <div class="card shadow-sm mb-4">
                <div class="card-header bg-primary text-white">
                    <h3 class="mb-0">
                        <i class="bi bi-images"></i> SEO Images Paket Test Sayfası
                    </h3>
                </div>
                <div class="card-body">
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i> Bu sayfa paketin tüm özelliklerini test etmek için hazırlanmıştır.
                    </div>

                    <!-- Test Formu -->
                    <form method="POST" action="#" id="test-form">
                        @csrf

                        <div class="row">
                            <div class="col-md-6 mb-4">
                                <h5 class="mb-3">
                                    <i class="bi bi-image"></i> Tekli Görsel Seçimi
                                </h5>
                                <p class="text-muted small">Kapak görseli seçmek için kullanın</p>
                                @seoinput('cover_image')
                            </div>

                            <div class="col-md-6 mb-4">
                                <h5 class="mb-3">
                                    <i class="bi bi-images"></i> Galeri (Çoklu Görsel)
                                </h5>
                                <p class="text-muted small">Birden fazla görsel seçmek için kullanın</p>
                                @seoinput('gallery', 'multiple')
                            </div>
                        </div>

                        <hr class="my-4">

                        <!-- Seçilen Görselleri Gösterme -->
                        <div class="mb-4">
                            <h5 class="mb-3">
                                <i class="bi bi-eye"></i> Seçilen Görselleri Önizle
                            </h5>

                            <!-- Kapak Görseli Önizleme -->
                            <div class="mb-3">
                                <label class="form-label fw-bold">Kapak Görseli:</label>
                                <div id="cover-preview" class="border rounded p-3 bg-light">
                                    <p class="text-muted mb-0">Henüz görsel seçilmedi</p>
                                </div>
                            </div>

                            <!-- Galeri Önizleme -->
                            <div class="mb-3">
                                <label class="form-label fw-bold">Galeri Görselleri:</label>
                                <div id="gallery-preview" class="border rounded p-3 bg-light">
                                    <p class="text-muted mb-0">Henüz görsel seçilmedi</p>
                                </div>
                            </div>
                        </div>

                        <hr class="my-4">

                        <!-- Form Butonları -->
                        <div class="d-flex gap-2">
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-check-circle"></i> Test Et
                            </button>
                            <button type="button" class="btn btn-secondary" onclick="clearForm()">
                                <i class="bi bi-x-circle"></i> Temizle
                            </button>
                        </div>
                    </form>

                    <!-- Form Verileri (Test için) -->
                    <div class="mt-4">
                        <h5 class="mb-3">
                            <i class="bi bi-code-slash"></i> Form Verileri
                        </h5>
                        <pre id="form-data" class="bg-dark text-light p-3 rounded" style="min-height: 100px; max-height: 300px; overflow-y: auto;">Form gönderildiğinde burada görünecek...</pre>
                    </div>
                </div>
            </div>

            <!-- Örnek Görsel Gösterimi -->
            <div class="card shadow-sm">
                <div class="card-header bg-success text-white">
                    <h5 class="mb-0">
                        <i class="bi bi-display"></i> @seoimages Directive Örneği
                    </h5>
                </div>
                <div class="card-body">
                    <p class="text-muted mb-3">
                        Aşağıdaki alana bir görsel yükleyip folder_path'ini girin, görseli görmek için:
                    </p>
                    <div class="input-group mb-3">
                        <input type="text" class="form-control" id="example-folder-path"
                               placeholder="Örn: 2025/12/18/resim">
                        <button class="btn btn-outline-primary" type="button" onclick="loadExampleImage()">
                            <i class="bi bi-search"></i> Yükle
                        </button>
                    </div>
                    <div id="example-image-container" class="text-center p-4 border rounded bg-light">
                        <p class="text-muted mb-0">Yukarıdaki alana folder_path girin ve yükle butonuna basın</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@push('scripts')
<script>
    // Form submit handler (test için)
    $('#test-form').on('submit', function(e) {
        e.preventDefault();
        var formData = {
            cover_image: $('input[name="cover_image"]').val(),
            gallery: $('input[name="gallery"]').val()
        };
        $('#form-data').text(JSON.stringify(formData, null, 2));

        // Toast notification göster
        if (typeof window.SeoImagesManager !== 'undefined') {
            window.SeoImagesManager.showToast('Form verileri konsola yazdırıldı!', 'success');
        }
    });

    // Form temizleme
    function clearForm() {
        $('input[name="cover_image"]').val('');
        $('input[name="gallery"]').val('[]');
        $('#cover-preview').html('<p class="text-muted mb-0">Henüz görsel seçilmedi</p>');
        $('#gallery-preview').html('<p class="text-muted mb-0">Henüz görsel seçilmedi</p>');
        $('#form-data').text('Form gönderildiğinde burada görünecek...');
    }

    // Örnek görsel yükleme
    function loadExampleImage() {
        var folderPath = $('#example-folder-path').val();
        if (!folderPath) {
            alert('Lütfen bir folder_path girin');
            return;
        }

        $('#example-image-container').html('<div class="spinner-border" role="status"></div>');

        // AJAX ile görsel bilgilerini al
        $.ajax({
            url: '/seo-images/list',
            method: 'GET',
            data: { per_page: 100 },
            success: function(response) {
                var image = response.data.find(function(img) {
                    return img.folder_path === folderPath;
                });

                if (image) {
                    // @seoimages directive kullanarak görseli göster
                    var html = '<div class="mb-2">';
                    html += '<p class="small text-muted mb-2">Folder Path: <code>' + image.folder_path + '</code></p>';
                    html += '<div class="border rounded p-2 bg-white">';
                    // Görseli @seoimages ile render etmek için AJAX çağrısı yap
                    $.ajax({
                        url: '/seo-images/render',
                        method: 'POST',
                        data: {
                            folder_path: folderPath,
                            options: {
                                class: 'img-fluid rounded shadow-sm',
                                alt: image.alt || 'Test görseli'
                            }
                        },
                        success: function(renderResponse) {
                            $('#example-image-container').html(html + renderResponse.html + '</div></div>');
                        },
                        error: function() {
                            $('#example-image-container').html('<p class="text-danger">Görsel render edilemedi</p>');
                        }
                    });
                } else {
                    $('#example-image-container').html(
                        '<p class="text-danger">Görsel bulunamadı. Lütfen geçerli bir folder_path girin.</p>'
                    );
                }
            },
            error: function() {
                $('#example-image-container').html('<p class="text-danger">Görsel listesi alınamadı</p>');
            }
        });
    }

    // Input değişikliklerini dinle (preview için)
    $(document).on('change', 'input[name="cover_image"]', function() {
        var folderPath = $(this).val();
        if (folderPath) {
            $('#cover-preview').html(
                '<p class="text-success mb-0"><i class="bi bi-check-circle"></i> Seçildi: <code>' + folderPath + '</code></p>'
            );
        } else {
            $('#cover-preview').html('<p class="text-muted mb-0">Henüz görsel seçilmedi</p>');
        }
    });

    $(document).on('change', 'input[name="gallery"]', function() {
        var gallery = $(this).val();
        try {
            var paths = JSON.parse(gallery || '[]');
            if (paths.length > 0) {
                var html = '<p class="text-success mb-2"><i class="bi bi-check-circle"></i> ' + paths.length + ' görsel seçildi:</p>';
                html += '<ul class="list-unstyled mb-0">';
                paths.forEach(function(path) {
                    html += '<li><code>' + path + '</code></li>';
                });
                html += '</ul>';
                $('#gallery-preview').html(html);
            } else {
                $('#gallery-preview').html('<p class="text-muted mb-0">Henüz görsel seçilmedi</p>');
            }
        } catch (e) {
            $('#gallery-preview').html('<p class="text-muted mb-0">Henüz görsel seçilmedi</p>');
        }
    });
</script>
@endpush
@endsection
```

**3. Route Ekleyin** (`routes/web.php`):

```php
Route::get('/test-seo-images', function () {
    return view('test-seo-images');
})->name('test.seo-images');
```

**4. Test Sayfasına Erişin:**

Tarayıcınızda şu URL'yi açın:

```
http://yourdomain.com/test-seo-images
```

Bu sayfada şunları test edebilirsiniz:

- ✅ Tekli görsel seçimi
- ✅ Çoklu görsel seçimi (galeri)
- ✅ Görsel yükleme
- ✅ Görsel önizleme
- ✅ @seoimages directive kullanımı
- ✅ Form verilerini görüntüleme

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
````
