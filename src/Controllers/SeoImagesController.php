<?php

namespace TunaSahin\SeoImages\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
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
}

