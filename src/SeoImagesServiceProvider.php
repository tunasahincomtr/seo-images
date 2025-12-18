<?php

namespace TunaSahin\SeoImages;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class SeoImagesServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . '/../config/seo-images.php',
            'seo-images'
        );

        // Bind directive service
        $this->app->singleton('seo-images.directive', function ($app) {
            return new Directives\SeoImagesDirective();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Register commands
        if ($this->app->runningInConsole()) {
            $this->commands([
                Console\SyncAvailableFormatsCommand::class,
            ]);
        }

        // Publish config
        $this->publishes([
            __DIR__ . '/../config/seo-images.php' => config_path('seo-images.php'),
        ], 'seo-images-config');

        // Publish migrations
        $this->publishes([
            __DIR__ . '/../database/migrations' => database_path('migrations'),
        ], 'seo-images-migrations');

        // Publish views
        $this->publishes([
            __DIR__ . '/../resources/views' => resource_path('views/vendor/seo-images'),
        ], 'seo-images-views');

        // Publish assets
        $this->publishes([
            __DIR__ . '/../resources/assets' => public_path('vendor/seo-images'),
        ], 'seo-images-assets');

        // Load views
        $this->loadViewsFrom(__DIR__ . '/../resources/views', 'seo-images');

        // Register routes
        $this->registerRoutes();

        // Register Blade directives
        $this->registerBladeDirectives();
    }

    /**
     * Register package routes.
     */
    protected function registerRoutes(): void
    {
        Route::middleware(config('seo-images.route_middleware', ['web', 'auth']))
            ->prefix('seo-images')
            ->group(function () {
                Route::get('/list', [Controllers\SeoImagesController::class, 'list'])
                    ->name('seo-images.list');
                
                Route::post('/upload', [Controllers\SeoImagesController::class, 'upload'])
                    ->name('seo-images.upload');
                
                Route::post('/{id}/update-meta', [Controllers\SeoImagesController::class, 'updateMeta'])
                    ->name('seo-images.update-meta');
                
                Route::delete('/{id}', [Controllers\SeoImagesController::class, 'delete'])
                    ->name('seo-images.delete');

                Route::post('/render', [Controllers\SeoImagesController::class, 'render'])
                    ->name('seo-images.render');

                // Test route
                Route::get('/test', function () {
                    return view('seo-images::test');
                })->name('seo-images.test');
            });
    }

    /**
     * Register Blade directives.
     */
    protected function registerBladeDirectives(): void
    {
        // @seoinput directive
        \Blade::directive('seoinput', function ($expression) {
            if (empty($expression)) {
                return "<?php echo ''; ?>";
}

// Remove outer parentheses if present
$expression = trim($expression, '()');

// Check if we have multiple arguments (comma separated)
if (strpos($expression, ',') !== false) {
// Split by comma
$pos = strpos($expression, ',');
$inputNamePart = trim(substr($expression, 0, $pos));
$modePart = trim(substr($expression, $pos + 1));

return "<?php 
                    \$inputName = {$inputNamePart};
                    \$mode = {$modePart};
                    if (is_string(\$inputName)) {
                        \$inputName = trim(\$inputName, ' \\'\"');
                    }
                    if (is_string(\$mode)) {
                        \$mode = trim(\$mode, ' \\'\"');
                    } else {
                        \$mode = 'single';
                    }
                    echo app('seo-images.directive')->renderSeoInput(\$inputName, \$mode); 
                ?>";
} else {
// Single argument
return "<?php 
                    \$inputName = {$expression};
                    if (is_string(\$inputName)) {
                        \$inputName = trim(\$inputName, ' \\'\"');
                    }
                    echo app('seo-images.directive')->renderSeoInput(\$inputName, 'single'); 
                ?>";
}
});

// @seoimages directive
\Blade::directive('seoimages', function ($expression) {
// Laravel Blade passes the expression as a string
// Expression format: 'path' or 'path', ['options']
if (empty($expression)) {
return "<?php echo ''; ?>";
}

// Remove outer parentheses if present
$expression = trim($expression, '()');

// Check if we have multiple arguments (comma separated)
if (strpos($expression, ',') !== false) {
// Split by comma, handling array syntax carefully
$pos = strpos($expression, ',');
$folderPathPart = substr($expression, 0, $pos);
$optionsPart = trim(substr($expression, $pos + 1));

return "<?php 
                    \$folderPath = {$folderPathPart};
                    \$options = {$optionsPart};
                    if (is_string(\$folderPath)) {
                        \$folderPath = trim(\$folderPath, ' \\'\"');
                    }
                    if (!is_array(\$options)) {
                        \$options = [];
                    }
                    echo app('seo-images.directive')->renderSeoImages(\$folderPath, \$options); 
                ?>";
} else {
// Single argument
return "<?php 
                    \$folderPath = {$expression};
                    if (is_string(\$folderPath)) {
                        \$folderPath = trim(\$folderPath, ' \\'\"');
                    }
                    echo app('seo-images.directive')->renderSeoImages(\$folderPath, []); 
                ?>";
}
});

// @seoimagesScripts directive
\Blade::directive('seoimagesScripts', function () {
return "<?php echo app('seo-images.directive')->renderScripts(); ?>";
});
}
}