<?php

namespace TunaSahin\SeoImages\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class SeoImage extends Model
{
    use SoftDeletes;

    protected $table = 'seo_images';

    protected $fillable = [
        'folder_path',
        'basename',
        'disk',
        'original_extension',
        'original_mime',
        'width',
        'height',
        'alt',
        'title',
        'file_size_jpg',
        'file_size_webp',
        'file_size_avif',
        'available_formats',
    ];

    protected $casts = [
        'width' => 'integer',
        'height' => 'integer',
        'file_size_jpg' => 'integer',
        'file_size_webp' => 'integer',
        'file_size_avif' => 'integer',
        'available_formats' => 'array',
    ];

    /**
     * Get preview URL for the image.
     */
    public function getPreviewUrlAttribute(): string
    {
        $disk = Storage::disk($this->disk);
        $path = $this->folder_path . '/' . $this->basename . '-480.webp';
        
        if ($disk->exists($path)) {
            return $this->getFullUrl($path);
        }

        // Fallback to jpg
        $path = $this->folder_path . '/' . $this->basename . '-480.jpg';
        if ($disk->exists($path)) {
            return $this->getFullUrl($path);
        }

        // Fallback to original
        $path = $this->folder_path . '/' . $this->basename . '.jpg';
        return $this->getFullUrl($path);
    }

    /**
     * Get URL for a specific format and size.
     */
    public function getUrl(string $format = 'jpg', ?int $width = null): string
    {
        $disk = Storage::disk($this->disk);
        $filename = $this->basename;
        
        if ($width) {
            $filename .= '-' . $width;
        }
        
        $filename .= '.' . $format;
        $path = $this->folder_path . '/' . $filename;
        
        return $this->getFullUrl($path);
    }

    /**
     * Get full URL using APP_URL from config.
     */
    protected function getFullUrl(string $path): string
    {
        $disk = Storage::disk($this->disk);
        $relativeUrl = $disk->url($path);
        
        // If URL already contains http/https, return as is
        if (preg_match('/^https?:\/\//', $relativeUrl)) {
            return $relativeUrl;
        }
        
        // Use Laravel's url() helper which automatically uses APP_URL
        // url() helper handles both absolute and relative URLs
        return url($relativeUrl);
    }

    /**
     * Check if a specific format and size exists.
     * Uses database (available_formats) for performance, falls back to disk check.
     */
    public function exists(string $format = 'jpg', ?int $width = null): bool
    {
        // If available_formats is set, use it (fast - no disk I/O)
        if (!empty($this->available_formats)) {
            $formats = $this->available_formats;
            
            if (!isset($formats[$format])) {
                return false;
            }
            
            return in_array($width, $formats[$format], true);
        }
        
        // Fallback: check disk (for backward compatibility with old records)
        $disk = Storage::disk($this->disk);
        $filename = $this->basename;
        
        if ($width) {
            $filename .= '-' . $width;
        }
        
        $filename .= '.' . $format;
        $path = $this->folder_path . '/' . $filename;
        
        return $disk->exists($path);
    }
}