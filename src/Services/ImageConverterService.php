<?php

namespace TunaSahin\SeoImages\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManagerStatic as Image;
use TunaSahin\SeoImages\Models\SeoImage;
use Exception;

class ImageConverterService
{
    protected string $disk;
    protected array $sizes;
    protected int $qualityJpg;
    protected int $qualityWebp;
    protected int $qualityAvif;

    public function __construct()
    {
        $this->disk = config('seo-images.disk', 'public');
        $this->sizes = config('seo-images.sizes', [480, 768, 1200, 1920]);
        $this->qualityJpg = config('seo-images.quality_jpg', 80);
        $this->qualityWebp = config('seo-images.quality_webp', 80);
        $this->qualityAvif = config('seo-images.quality_avif', 60);
    }

    /**
     * Convert and save uploaded image.
     */
    public function convert(UploadedFile $file): SeoImage
    {
        // Check file size before processing
        $maxSize = config('seo-images.max_upload_size', 5120) * 1024; // Convert KB to bytes
        if ($file->getSize() > $maxSize) {
            throw new Exception("Dosya boyutu çok büyük. Maksimum: " . config('seo-images.max_upload_size', 5120) . " KB");
        }

        // Check available memory
        $memoryLimit = $this->getMemoryLimit();
        $currentMemory = memory_get_usage(true);
        $availableMemory = $memoryLimit - $currentMemory;
        
        // Estimate required memory (roughly 4x file size for processing)
        $estimatedMemory = $file->getSize() * 4;
        if ($estimatedMemory > $availableMemory) {
            throw new Exception("Yetersiz bellek. Dosya çok büyük veya sunucu bellek limiti yetersiz.");
        }

        try {
            // Get date parts
            $now = now();
            $year = $now->format('Y');
            $month = $now->format('m');
            $day = $now->format('d');

            // Generate unique slug
            $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $slug = Str::slug($originalName);
            $slug = $this->generateUniqueSlug($year, $month, $day, $slug);

            // Create folder path
            $folderPath = "{$year}/{$month}/{$day}/{$slug}";

            // Get original file info
            $originalExtension = strtolower($file->getClientOriginalExtension());
            $originalMime = $file->getMimeType();

            // Create directory
            Storage::disk($this->disk)->makeDirectory($folderPath);

            // Load original image (memory efficient)
            $image = Image::make($file->getRealPath());
            $originalWidth = $image->width();
            $originalHeight = $image->height();

            // Generate all formats and sizes
            $fileSizeJpg = null;
            $fileSizeWebp = null;
            $fileSizeAvif = null;

            // Original sizes (no width suffix) - process and free memory immediately
            $this->saveImage($image, $folderPath, $slug, 'jpg', null, $this->qualityJpg);
            $this->saveImage($image, $folderPath, $slug, 'webp', null, $this->qualityWebp);
            $this->saveImage($image, $folderPath, $slug, 'avif', null, $this->qualityAvif);

            // Get original file sizes
            $fileSizeJpg = Storage::disk($this->disk)->size("{$folderPath}/{$slug}.jpg");
            $fileSizeWebp = Storage::disk($this->disk)->size("{$folderPath}/{$slug}.webp");
            $fileSizeAvif = Storage::disk($this->disk)->size("{$folderPath}/{$slug}.avif");

            // Resized versions - process each size separately to save memory
            foreach ($this->sizes as $width) {
                if ($width >= $originalWidth) {
                    continue; // Skip if requested width is larger than original
                }

                // Clone and resize (to avoid modifying original)
                $resized = clone $image;
                $resized->resize($width, null, function ($constraint) {
                    $constraint->aspectRatio();
                    $constraint->upsize();
                });
                
                // Save in all formats
                $this->saveImage($resized, $folderPath, $slug, 'jpg', $width, $this->qualityJpg);
                $this->saveImage($resized, $folderPath, $slug, 'webp', $width, $this->qualityWebp);
                $this->saveImage($resized, $folderPath, $slug, 'avif', $width, $this->qualityAvif);
                
                // Free memory for resized image immediately
                unset($resized);
            }

            // Free original image memory
            unset($image);

            // Create database record
            $seoImage = SeoImage::create([
                'folder_path' => $folderPath,
                'basename' => $slug,
                'disk' => $this->disk,
                'original_extension' => $originalExtension,
                'original_mime' => $originalMime,
                'width' => $originalWidth,
                'height' => $originalHeight,
                'alt' => '',
                'title' => '',
                'file_size_jpg' => $fileSizeJpg,
                'file_size_webp' => $fileSizeWebp,
                'file_size_avif' => $fileSizeAvif,
            ]);

            return $seoImage;
        } catch (Exception $e) {
            throw new Exception("Görsel dönüştürme hatası: " . $e->getMessage());
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
            case 'm':
                $value *= 1024;
            case 'k':
                $value *= 1024;
        }
        
        return $value;
    }

    /**
     * Save image in specific format and size.
     */
    protected function saveImage($image, string $folderPath, string $slug, string $format, ?int $width, int $quality): void
    {
        $filename = $slug;
        if ($width) {
            $filename .= '-' . $width;
        }
        $filename .= '.' . $format;

        $path = "{$folderPath}/{$filename}";

        try {
            // Encode and save image
            $encoded = null;
            switch ($format) {
                case 'jpg':
                case 'jpeg':
                    $encoded = (string) $image->encode('jpg', $quality);
                    break;
                case 'webp':
                    $encoded = (string) $image->encode('webp', $quality);
                    break;
                case 'avif':
                    // AVIF might not be supported in v2.7, fallback to webp
                    try {
                        $encoded = (string) $image->encode('webp', $quality);
                    } catch (Exception $e) {
                        // If AVIF is not supported, skip it
                        return;
                    }
                    break;
                default:
                    $encoded = (string) $image->encode('jpg', $quality);
            }

            // Save to storage
            if ($encoded) {
                Storage::disk($this->disk)->put($path, $encoded);
                // Free encoded data memory immediately
                unset($encoded);
            }
        } catch (Exception $e) {
            // Log error but don't stop processing
            \Log::warning("Failed to save image {$path}: " . $e->getMessage());
        }
    }

    /**
     * Generate unique slug.
     */
    protected function generateUniqueSlug(string $year, string $month, string $day, string $slug): string
    {
        $baseSlug = $slug;
        $counter = 0;
        $folderPath = "{$year}/{$month}/{$day}/{$slug}";

        while (SeoImage::where('folder_path', $folderPath)->exists()) {
            $counter++;
            $slug = $baseSlug . ($counter > 1 ? '-' . $counter : '');
            $folderPath = "{$year}/{$month}/{$day}/{$slug}";
        }

        return $slug;
    }

    /**
     * Delete all files for a SeoImage.
     */
    public function deleteFiles(SeoImage $seoImage): void
    {
        $disk = Storage::disk($seoImage->disk);
        $folderPath = $seoImage->folder_path;

        // Delete all files in the folder
        if ($disk->exists($folderPath)) {
            $files = $disk->allFiles($folderPath);
            foreach ($files as $file) {
                $disk->delete($file);
            }
            
            // Delete folder
            $disk->deleteDirectory($folderPath);
        }
    }
}

