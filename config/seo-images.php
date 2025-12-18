<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Primary Color
    |--------------------------------------------------------------------------
    |
    | Modal ve input elementleri için kullanılacak ana renk.
    | Örnek: #0d6efd (Bootstrap primary), #28a745 (yeşil), #dc3545 (kırmızı)
    |
    */
    'primary_color' => env('SEO_IMAGES_PRIMARY_COLOR', '#0d6efd'),

    /*
    |--------------------------------------------------------------------------
    | Storage Disk
    |--------------------------------------------------------------------------
    |
    | Laravel storage disk adı. Varsayılan olarak 'public' kullanılır.
    |
    */
    'disk' => env('SEO_IMAGES_DISK', 'public'),

    /*
    |--------------------------------------------------------------------------
    | Image Sizes
    |--------------------------------------------------------------------------
    |
    | Üretilecek görsel boyutları (genişlik piksel cinsinden).
    |
    */
    'sizes' => [480, 768, 1200, 1920],

    /*
    |--------------------------------------------------------------------------
    | Image Quality
    |--------------------------------------------------------------------------
    |
    | Her format için kalite ayarları (0-100 arası).
    |
    */
    'quality_jpg' => env('SEO_IMAGES_QUALITY_JPG', 80),
    'quality_webp' => env('SEO_IMAGES_QUALITY_WEBP', 80),
    'quality_avif' => env('SEO_IMAGES_QUALITY_AVIF', 60),

    /*
    |--------------------------------------------------------------------------
    | Route Middleware
    |--------------------------------------------------------------------------
    |
    | API route'ları için kullanılacak middleware'ler.
    |
    */
    'route_middleware' => ['web', 'auth'],

    /*
    |--------------------------------------------------------------------------
    | Use Queue
    |--------------------------------------------------------------------------
    |
    | Görsel dönüştürme işlemlerini queue ile yapmak için true yapın.
    |
    */
    'use_queue' => env('SEO_IMAGES_USE_QUEUE', false),

    /*
    |--------------------------------------------------------------------------
    | Max Upload Size
    |--------------------------------------------------------------------------
    |
    | Maksimum yükleme boyutu (kilobayt cinsinden).
    |
    */
    'max_upload_size' => env('SEO_IMAGES_MAX_UPLOAD_SIZE', 5120), // 5MB

    /*
    |--------------------------------------------------------------------------
    | Allowed Mime Types
    |--------------------------------------------------------------------------
    |
    | İzin verilen görsel MIME tipleri.
    |
    */
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