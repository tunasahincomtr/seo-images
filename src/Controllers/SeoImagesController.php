<?php

namespace TunaSahin\SeoImages\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use TunaSahin\SeoImages\Models\SeoImage;
use TunaSahin\SeoImages\Services\ImageConverterService;
use Exception;

class SeoImagesController
{
    protected ImageConverterService $converter;

    public function __construct(ImageConverterService $converter)
    {
        $this->converter = $converter;
    }

    /**
     * List images with pagination.
     */
    public function list(Request $request): JsonResponse
    {
        $perPage = $request->get('per_page', 9);
        $page = $request->get('page', 1);
        $search = $request->get('search');

        $query = SeoImage::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('basename', 'like', "%{$search}%")
                  ->orWhere('alt', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%");
            });
        }

        $images = $query->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $images->map(function ($image) {
                // Get all available formats and sizes
                $formats = [];
                $sizes = config('seo-images.sizes', [480, 768, 1200, 1920]);
                
                foreach (['jpg', 'webp', 'avif'] as $format) {
                    $formatData = [
                        'format' => $format,
                        'original' => [
                            'exists' => $image->exists($format),
                            'url' => $image->exists($format) ? $image->getUrl($format) : null,
                            'size' => $format === 'jpg' ? $image->file_size_jpg : ($format === 'webp' ? $image->file_size_webp : $image->file_size_avif),
                        ],
                        'sizes' => []
                    ];
                    
                    foreach ($sizes as $size) {
                        if ($image->exists($format, $size)) {
                            $formatData['sizes'][] = [
                                'width' => $size,
                                'url' => $image->getUrl($format, $size),
                                'exists' => true,
                            ];
                        }
                    }
                    
                    $formats[] = $formatData;
                }
                
                return [
                    'id' => $image->id,
                    'folder_path' => $image->folder_path,
                    'basename' => $image->basename,
                    'preview_url' => $image->preview_url,
                    'alt' => $image->alt,
                    'title' => $image->title,
                    'width' => $image->width,
                    'height' => $image->height,
                    'formats' => $formats,
                ];
            }),
            'meta' => [
                'current_page' => $images->currentPage(),
                'last_page' => $images->lastPage(),
                'total' => $images->total(),
            ],
        ]);
    }

    /**
     * Get dashboard statistics.
     */
    public function dashboard(): JsonResponse
    {
        $cacheEnabled = config('seo-images.cache.enabled', true);
        $cacheKey = config('seo-images.cache.prefix', 'seo_images_') . 'dashboard_stats';
        $ttl = config('seo-images.cache.ttl', 3600);

        $stats = $cacheEnabled 
            ? Cache::remember($cacheKey, $ttl, function () {
                return $this->calculateDashboardStats();
            })
            : $this->calculateDashboardStats();

        return response()->json($stats);
    }

    /**
     * Calculate dashboard statistics.
     */
    protected function calculateDashboardStats(): array
    {
        try {
            // Total images count
            $totalImages = SeoImage::count();

            // Total storage calculation
            $totalStorage = (float)(SeoImage::selectRaw('SUM(COALESCE(file_size_jpg, 0) + COALESCE(file_size_webp, 0) + COALESCE(file_size_avif, 0)) as total')
                ->value('total') ?? 0);

            // Format distribution
            $formatDistribution = $this->getFormatDistribution();

            // Recent uploads (last 7 days)
            $recentUploads = $this->getRecentUploads(7);

            // Largest images (top 5)
            $largestImages = $this->getLargestImages(5);

            // Format sizes breakdown
            $formatSizes = $this->getFormatSizes();

            return [
                'total_images' => $totalImages,
                'total_storage_mb' => round($totalStorage / (1024 * 1024), 2),
                'total_storage_gb' => round($totalStorage / (1024 * 1024 * 1024), 2),
                'format_distribution' => $formatDistribution,
                'recent_uploads' => $recentUploads,
                'largest_images' => $largestImages,
                'format_sizes' => $formatSizes,
            ];
        } catch (Exception $e) {
            return [
                'error' => true,
                'message' => 'İstatistikler hesaplanırken bir hata oluştu: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get format distribution.
     */
    protected function getFormatDistribution(): array
    {
        try {
            $images = SeoImage::select('available_formats')->get();
            
            $distribution = [
                'jpg' => 0,
                'webp' => 0,
                'avif' => 0,
            ];

            foreach ($images as $image) {
                $formats = $image->available_formats ?? [];
                if (is_array($formats)) {
                    if (isset($formats['jpg']) && is_array($formats['jpg']) && !empty($formats['jpg'])) {
                        $distribution['jpg']++;
                    }
                    if (isset($formats['webp']) && is_array($formats['webp']) && !empty($formats['webp'])) {
                        $distribution['webp']++;
                    }
                    if (isset($formats['avif']) && is_array($formats['avif']) && !empty($formats['avif'])) {
                        $distribution['avif']++;
                    }
                }
            }

            $total = array_sum($distribution);
            if ($total > 0) {
                return [
                    'jpg' => [
                        'count' => $distribution['jpg'],
                        'percentage' => round(($distribution['jpg'] / $total) * 100, 1),
                    ],
                    'webp' => [
                        'count' => $distribution['webp'],
                        'percentage' => round(($distribution['webp'] / $total) * 100, 1),
                    ],
                    'avif' => [
                        'count' => $distribution['avif'],
                        'percentage' => round(($distribution['avif'] / $total) * 100, 1),
                    ],
                ];
            }

            return [
                'jpg' => ['count' => 0, 'percentage' => 0],
                'webp' => ['count' => 0, 'percentage' => 0],
                'avif' => ['count' => 0, 'percentage' => 0],
            ];
        } catch (Exception $e) {
            // Return empty distribution on error
            return [
                'jpg' => ['count' => 0, 'percentage' => 0],
                'webp' => ['count' => 0, 'percentage' => 0],
                'avif' => ['count' => 0, 'percentage' => 0],
            ];
        }
    }

    /**
     * Get recent uploads for last N days.
     */
    protected function getRecentUploads(int $days): array
    {
        try {
            $data = [];
            for ($i = $days - 1; $i >= 0; $i--) {
                $date = now()->subDays($i)->format('Y-m-d');
                $count = SeoImage::whereDate('created_at', $date)->count();
                $data[] = [
                    'date' => $date,
                    'count' => $count,
                ];
            }
            return $data;
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Get largest images.
     */
    protected function getLargestImages(int $limit): array
    {
        try {
            return SeoImage::select('id', 'basename', 'folder_path', 'width', 'height', 'file_size_jpg', 'file_size_webp', 'file_size_avif')
                ->orderByRaw('(COALESCE(file_size_jpg, 0) + COALESCE(file_size_webp, 0) + COALESCE(file_size_avif, 0)) DESC')
                ->limit($limit)
                ->get()
                ->map(function ($image) {
                    $totalSize = ($image->file_size_jpg ?? 0) + ($image->file_size_webp ?? 0) + ($image->file_size_avif ?? 0);
                    return [
                        'id' => $image->id,
                        'basename' => $image->basename ?? '',
                        'folder_path' => $image->folder_path ?? '',
                        'width' => $image->width ?? 0,
                        'height' => $image->height ?? 0,
                        'total_size_mb' => round($totalSize / (1024 * 1024), 2),
                        'preview_url' => $image->preview_url ?? '',
                    ];
                })
                ->toArray();
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Get format sizes breakdown.
     */
    protected function getFormatSizes(): array
    {
        try {
            $jpgTotal = (float)(SeoImage::sum('file_size_jpg') ?? 0);
            $webpTotal = (float)(SeoImage::sum('file_size_webp') ?? 0);
            $avifTotal = (float)(SeoImage::sum('file_size_avif') ?? 0);

            return [
                'jpg' => [
                    'total_mb' => round($jpgTotal / (1024 * 1024), 2),
                    'total_gb' => round($jpgTotal / (1024 * 1024 * 1024), 2),
                ],
                'webp' => [
                    'total_mb' => round($webpTotal / (1024 * 1024), 2),
                    'total_gb' => round($webpTotal / (1024 * 1024 * 1024), 2),
                ],
                'avif' => [
                    'total_mb' => round($avifTotal / (1024 * 1024), 2),
                    'total_gb' => round($avifTotal / (1024 * 1024 * 1024), 2),
                ],
            ];
        } catch (Exception $e) {
            return [
                'jpg' => ['total_mb' => 0, 'total_gb' => 0],
                'webp' => ['total_mb' => 0, 'total_gb' => 0],
                'avif' => ['total_mb' => 0, 'total_gb' => 0],
            ];
        }
    }

    /**
     * Upload image.
     */
    public function upload(Request $request): JsonResponse
    {
        $maxSize = config('seo-images.max_upload_size', 5120);
        
        $validator = Validator::make($request->all(), [
            'file' => [
                'required',
                'image',
                'max:' . $maxSize,
                'mimes:' . implode(',', ['jpeg', 'jpg', 'png', 'gif', 'webp', 'heic', 'heif']),
            ],
        ], [
            'file.max' => "Dosya boyutu çok büyük. Maksimum: {$maxSize} KB",
            'file.image' => 'Lütfen geçerli bir görsel dosyası seçin.',
            'file.mimes' => 'Desteklenmeyen dosya formatı. Desteklenen formatlar: JPG, PNG, GIF, WebP, HEIC',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'message' => $validator->errors()->first('file'),
            ], 422);
        }

        try {
            $file = $request->file('file');
            
            // Additional file size check (in bytes)
            $maxSizeBytes = $maxSize * 1024;
            if ($file->getSize() > $maxSizeBytes) {
                return response()->json([
                    'error' => true,
                    'message' => "Dosya boyutu çok büyük. Maksimum: {$maxSize} KB",
                ], 422);
            }
            
            // Check MIME type
            $allowedMimes = config('seo-images.allowed_mime_types', []);
            if (!empty($allowedMimes) && !in_array($file->getMimeType(), $allowedMimes)) {
                return response()->json([
                    'error' => true,
                    'message' => 'Geçersiz dosya tipi.',
                ], 422);
            }

            // Increase memory limit temporarily if needed
            $originalMemoryLimit = ini_get('memory_limit');
            $memoryLimit = $this->getMemoryLimit();
            $fileSize = $file->getSize();
            
            // If file is large, temporarily increase memory limit
            if ($fileSize > 10 * 1024 * 1024) { // > 10MB
                $estimatedNeeded = $fileSize * 5; // Rough estimate
                if ($estimatedNeeded > $memoryLimit) {
                    $newLimit = ceil($estimatedNeeded / (1024 * 1024)) . 'M';
@ini_set('memory_limit', $newLimit);
                }
            }

            try {
                $seoImage = $this->converter->convert($file);
                
                // Clear cache after successful upload
                SeoImage::clearCache();
            } finally {
                // Restore original memory limit
                if ($originalMemoryLimit) {
@ini_set('memory_limit', $originalMemoryLimit);
                }
            }

            return response()->json([
                'id' => $seoImage->id,
                'folder_path' => $seoImage->folder_path,
                'basename' => $seoImage->basename,
                'preview_url' => $seoImage->preview_url,
                'alt' => $seoImage->alt,
                'title' => $seoImage->title,
                'width' => $seoImage->width,
                'height' => $seoImage->height,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get PHP memory limit in bytes.
     */
    protected function getMemoryLimit(): int
    {
        $memoryLimit = ini_get('memory_limit');
        if ($memoryLimit == -1) {
            return PHP_INT_MAX; // Unlimited
        }
        
        $memoryLimit = trim($memoryLimit);
        $last = strtolower($memoryLimit[strlen($memoryLimit) - 1]);
        $value = (int) $memoryLimit;
        
        switch ($last) {
            case 'g':
                $value *= 1024;
                // fall through
            case 'm':
                $value *= 1024;
                // fall through
            case 'k':
                $value *= 1024;
                break;
            default:
                // No unit, assume bytes
                break;
        }
        
        return $value;
    }

    /**
     * Update image metadata.
     */
    public function updateMeta(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'alt' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        try {
            $image = SeoImage::findOrFail($id);
            
            $image->update([
                'alt' => $request->input('alt'),
                'title' => $request->input('title'),
            ]);

            return response()->json([
                'status' => 'ok',
                'data' => [
                    'id' => $image->id,
                    'folder_path' => $image->folder_path,
                    'basename' => $image->basename,
                    'alt' => $image->alt,
                    'title' => $image->title,
                ],
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete image.
     */
    public function delete(int $id): JsonResponse
    {
        try {
            $image = SeoImage::findOrFail($id);
            
            // Delete files
            $this->converter->deleteFiles($image);
            
            // Delete database record
            $image->delete();
            
            // Clear cache after deletion
            SeoImage::clearCache();

            return response()->json([
                'status' => 'ok',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Render image HTML using @seoimages directive.
     */
    public function render(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'folder_path' => 'required|string',
            'options' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        try {
            $folderPath = $request->input('folder_path');
            $options = $request->input('options', []);

            // Use the directive to render HTML
            $directive = app('seo-images.directive');
            $html = $directive->renderSeoImages($folderPath, $options);

            return response()->json([
                'html' => $html,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => true,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate and return image sitemap XML.
     * 
     * @return Response XML response
     */
    public function sitemap(): Response
    {
        $cacheEnabled = config('seo-images.cache.enabled', true);
        $cacheKey = config('seo-images.cache.prefix', 'seo_images_') . 'sitemap';
        $ttl = config('seo-images.cache.ttl', 3600);

        $xml = $cacheEnabled
            ? Cache::remember($cacheKey, $ttl, function () {
                return $this->generateSitemapXml();
            })
            : $this->generateSitemapXml();

        return response($xml, 200)
            ->header('Content-Type', 'application/xml; charset=utf-8');
    }

    /**
     * Generate image sitemap XML content.
     * 
     * @return string XML content
     */
    protected function generateSitemapXml(): string
    {
        try {
            // Get all active images (not soft deleted)
            $images = SeoImage::orderBy('created_at', 'desc')->get();

            // Start XML
            $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' . "\n";
            $xml .= ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">' . "\n";

    // Base URL for images (use APP_URL or generate from request)
    $baseUrl = rtrim(config('app.url'), '/');

    // Get page URL pattern from config (optional)
    $pageUrlPattern = config('seo-images.sitemap.page_url_pattern', null);

    foreach ($images as $image) {
    $xml .= ' <url>' . "\n";

        // Page URL (where image is used)
        // If page_url_pattern is set, use it, otherwise use image URL as page URL
        if ($pageUrlPattern) {
        // Replace placeholders: {folder_path}, {basename}, {id}
        $pageUrl = str_replace(
        ['{folder_path}', '{basename}', '{id}'],
        [$image->folder_path, $image->basename, $image->id],
        $pageUrlPattern
        );
        $xml .= ' <loc>' . e($baseUrl . '/' . ltrim($pageUrl, '/')) . '</loc>' . "\n";
        } else {
        // Use image URL as page URL (fallback)
        $imageUrl = $image->getUrl('jpg');
        $xml .= ' <loc>' . e($imageUrl) . '</loc>' . "\n";
        }

        // Image information
        $xml .= ' <image:image>' . "\n";

            // Image location (use best available format: AVIF > WebP > JPG)
            $imageUrl = null;
            if ($image->exists('avif', null)) {
            $imageUrl = $image->getUrl('avif');
            } elseif ($image->exists('webp', null)) {
            $imageUrl = $image->getUrl('webp');
            } else {
            $imageUrl = $image->getUrl('jpg');
            }
            $xml .= ' <image:loc>' . e($imageUrl) . '</image:loc>' . "\n";

            // Image title (use title or alt or basename)
            $title = $image->title ?: $image->alt ?: $image->basename;
            if ($title) {
            $xml .= ' <image:title>' . e($title) . '</image:title>' . "\n";
            }

            // Image caption (use alt text)
            if ($image->alt) {
            $xml .= ' <image:caption>' . e($image->alt) . '</image:caption>' . "\n";
            }

            // Image license (optional, can be added to config later)
            $license = config('seo-images.sitemap.license', null);
            if ($license) {
            $xml .= ' <image:license>' . e($license) . '</image:license>' . "\n";
            }

            $xml .= ' </image:image>' . "\n";
        $xml .= ' </url>' . "\n";
    }

    $xml .= '</urlset>';

return $xml;
} catch (Exception $e) {
// Return empty sitemap on error (don't break site)
Log::error('SEO Images Sitemap generation failed: ' . $e->getMessage());
return '
<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>
';
}
}
}