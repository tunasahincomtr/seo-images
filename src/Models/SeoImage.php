<?php

namespace Tunasahin\SeoImages\Models;

use Illuminate\Database\Eloquent\Model;

class SeoImage extends Model
{
    protected $fillable = [
        'path',
        'folder_path',
        'original_name',
        'alt_text',
        'title',
        'width',
        'height',
        'file_size',
        'mime_type',
    ];

    protected $casts = [
        'width' => 'integer',
        'height' => 'integer',
        'file_size' => 'integer',
    ];

    /**
     * Resmin tam URL'ini döndür
     */
    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->folder_path);
    }

    /**
     * WebP formatındaki dosya yolunu döndür
     */
    public function getWebpPathAttribute(): string
    {
        return $this->folder_path . '/' . basename($this->folder_path) . '.webp';
    }

    /**
     * AVIF formatındaki dosya yolunu döndür
     */
    public function getAvifPathAttribute(): string
    {
        return $this->folder_path . '/' . basename($this->folder_path) . '.avif';
    }

    /**
     * JPG formatındaki dosya yolunu döndür
     */
    public function getJpgPathAttribute(): string
    {
        return $this->folder_path . '/' . basename($this->folder_path) . '.jpg';
    }
}
