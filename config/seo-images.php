<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Storage Disk
    |--------------------------------------------------------------------------
    |
    | Resimlerin kaydedileceği storage disk'i
    |
    */
    'disk' => env('SEO_IMAGES_DISK', 'public'),

    /*
    |--------------------------------------------------------------------------
    | Image Quality
    |--------------------------------------------------------------------------
    |
    | Resim formatlarına çevirirken kullanılacak kalite (1-100)
    |
    */
    'quality' => env('SEO_IMAGES_QUALITY', 90),

    /*
    |--------------------------------------------------------------------------
    | Max File Size
    |--------------------------------------------------------------------------
    |
    | Yüklenebilecek maksimum dosya boyutu (KB)
    |
    */
    'max_file_size' => env('SEO_IMAGES_MAX_SIZE', 10240), // 10MB

    /*
    |--------------------------------------------------------------------------
    | Multiple Images Input Name Pattern
    |--------------------------------------------------------------------------
    |
    | Çoklu resim seçimi için input name pattern'i
    | Örnek: 'images[]' veya 'gallery[]'
    | Form gönderiminde array olarak algılanır
    |
    */
    'multiple_name_pattern' => env('SEO_IMAGES_MULTIPLE_PATTERN', 'images[]'),

    /*
    |--------------------------------------------------------------------------
    | Default Multiple Selection
    |--------------------------------------------------------------------------
    |
    | Varsayılan olarak çoklu seçim aktif mi?
    |
    */
    'default_multiple' => env('SEO_IMAGES_DEFAULT_MULTIPLE', false),

    /*
    |--------------------------------------------------------------------------
    | Theme Colors
    |--------------------------------------------------------------------------
    |
    | Eklenti için tema renkleri. CSS değişkenleri olarak kullanılır.
    | Bootstrap renklerini veya özel renkler kullanabilirsiniz.
    | .env dosyasından da değiştirilebilir (opsiyonel).
    |
    */
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
