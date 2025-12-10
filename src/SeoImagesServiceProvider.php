<?php

namespace Tunasahin\SeoImages;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Route;

class SeoImagesServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Config dosyasını merge et
        $this->mergeConfigFrom(
            __DIR__.'/../config/seo-images.php',
            'seo-images'
        );

        // PictureService'i singleton olarak kaydet
        $this->app->singleton('seo-images.picture', function ($app) {
            return new \Tunasahin\SeoImages\Services\PictureService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Migration dosyalarını yayınla
        $this->loadMigrationsFrom(__DIR__.'/Database/Migrations');

        // View dosyalarını yayınla
        $this->loadViewsFrom(__DIR__.'/resources/views', 'seo-images');

        // Asset dosyalarını yayınla
        $this->publishes([
            __DIR__.'/../config/seo-images.php' => config_path('seo-images.php'),
            __DIR__.'/resources/views' => resource_path('views/vendor/seo-images'),
            __DIR__.'/resources/js' => public_path('vendor/seo-images/js'),
            __DIR__.'/resources/css' => public_path('vendor/seo-images/css'),
        ], 'seo-images');

        // Blade direktiflerini kaydet
        $this->registerBladeDirectives();

        // Route'ları yükle
        $this->loadRoutes();
    }

    /**
     * Blade direktiflerini kaydet
     */
    protected function registerBladeDirectives(): void
    {
        // @imageInput direktifi
        // Kullanım: @imageInput('field_name') veya @imageInput('field_name', true) (çoklu seçim için)
        Blade::directive('imageInput', function ($expression) {
            // Expression'ı parse et
            // Örnek: ('image_path') veya ('image_path', true)
            $expression = trim($expression, '()');
            
            // Eğer boşsa varsayılan değer
            if (empty($expression)) {
                return "<?php echo view('seo-images::components.image-input', [
                    'name' => 'image_path',
                    'multiple' => false
                ])->render(); ?>";
}

// Parametreleri parse et
$params = array_map('trim', explode(',', $expression));

// İlk parametre name (string)
$nameParam = $params[0] ?? "'image_path'";
// Tırnak işaretlerini temizle ve tekrar ekle (güvenli string için)
$nameParam = trim($nameParam, " '\"");
$name = "'" . addslashes($nameParam) . "'";

// İkinci parametre multiple (boolean, varsayılan false)
$multiple = isset($params[1]) ? trim($params[1]) : 'false';
// Boolean değerleri kontrol et
if (strtolower($multiple) === 'true' || $multiple === '1') {
$multiple = 'true';
} else {
$multiple = 'false';
}

return "<?php echo view('seo-images::components.image-input', [
                'name' => {$name},
                'multiple' => {$multiple}
            ])->render(); ?>";
});

// @seopicture direktifi
// Kullanım: 
// - @seopicture('path') - Sadece path (alt text ve title veritabanından alınır)
// - @seopicture('path', 'img-class') - Path ve img class
// - @seopicture('path', 'img-class', 'img-id') - Path, img class ve img id
// - @seopicture('path', 'img-class', 'img-id', 'picture-class', 'picture-id') - Tüm class ve id'ler
Blade::directive('seopicture', function ($expression) {
// Expression boşsa veya sadece path varsa
if (empty(trim($expression))) {
return "<?php echo ''; ?>";
}

// Expression'ı parse et
return "<?php 
                \$params = [{$expression}];
                \$path = \$params[0] ?? '';
                \$imgClass = \$params[1] ?? null;
                \$imgId = \$params[2] ?? null;
                \$pictureClass = \$params[3] ?? null;
                \$pictureId = \$params[4] ?? null;
                
                echo app('seo-images.picture')->render(
                    \$path, 
                    \$imgClass, 
                    \$imgId, 
                    \$pictureClass, 
                    \$pictureId
                );
            ?>";
});
}

/**
* Route'ları yükle
*/
protected function loadRoutes(): void
{
Route::middleware(['web'])
->prefix('seo-images')
->name('seo-images.')
->group(function () {
require __DIR__.'/../routes/web.php';
});
}
}
