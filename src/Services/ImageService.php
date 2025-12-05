<?php

namespace Tunasahin\SeoImages\Services;

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Tunasahin\SeoImages\Models\SeoImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ImageService
{
    protected ImageManager $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver());
    }

    /**
     * Resmi yükle ve formatları oluştur
     */
    public function uploadImage(UploadedFile $file, ?string $altText = null, ?string $title = null): SeoImage
    {
        // Tarih bazlı klasör yolu oluştur (2025/12/05)
        $datePath = date('Y/m/d');
        
        // Dosya adını al (uzantısız)
        $fileName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $fileName = Str::slug($fileName);
        
        // Klasör yolu: 2025/12/05/x
        $folderPath = $datePath . '/' . $fileName;
        
        // Storage'da klasör oluştur
        $storagePath = 'public/' . $folderPath;
        Storage::makeDirectory($storagePath);

        // Orijinal resmi yükle ve boyutları al
        $image = $this->imageManager->read($file->getRealPath());
        $width = $image->width();
        $height = $image->height();

        // Srcset için genişlikleri hesapla
        $srcsetWidths = $this->calculateSrcsetWidths($width);

        // 3 formata çevir ve kaydet (orijinal boyut)
        $this->convertToWebp($image, $storagePath, $fileName);
        $this->convertToAvif($image, $storagePath, $fileName);
        $this->convertToJpg($image, $storagePath, $fileName);

        // Srcset için farklı boyutlarda resimler oluştur
        foreach ($srcsetWidths as $targetWidth) {
            // Orijinal genişlik için dosya oluşturma (zaten var)
            // Sadece küçük boyutlar için oluştur
            if ($targetWidth < $width) {
                // Resmi yeniden yükle ve boyutlandır
                $resized = $this->imageManager->read($file->getRealPath());
                $resized->scale(width: $targetWidth);
                
                // Her format için kaydet
                $this->convertToWebp($resized, $storagePath, $fileName, $targetWidth);
                $this->convertToAvif($resized, $storagePath, $fileName, $targetWidth);
                $this->convertToJpg($resized, $storagePath, $fileName, $targetWidth);
            }
            // Orijinal genişlik ($targetWidth == $width) için dosya zaten oluşturuldu
            // Daha büyük genişlikler ($targetWidth > $width) için dosya oluşturma (orijinalden büyük olamaz)
        }

        // Veritabanına kaydet
        $seoImage = SeoImage::create([
            'path' => $file->getClientOriginalName(),
            'folder_path' => $folderPath,
            'original_name' => $file->getClientOriginalName(),
            'alt_text' => $altText ?? $fileName,
            'title' => $title ?? $fileName,
            'width' => $width,
            'height' => $height,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ]);

        return $seoImage;
    }

    /**
     * WebP formatına çevir
     */
    protected function convertToWebp($image, string $storagePath, string $fileName, ?int $width = null): void
    {
        $suffix = $width ? '-' . $width : '';
        $webpPath = storage_path('app/' . $storagePath . '/' . $fileName . $suffix . '.webp');
        $image->toWebp(90)->save($webpPath);
    }

    /**
     * AVIF formatına çevir
     */
    protected function convertToAvif($image, string $storagePath, string $fileName, ?int $width = null): void
    {
        $suffix = $width ? '-' . $width : '';
        $avifPath = storage_path('app/' . $storagePath . '/' . $fileName . $suffix . '.avif');
        try {
            $image->toAvif(90)->save($avifPath);
        } catch (\Exception $e) {
            // AVIF desteği yoksa atla
            Log::warning('AVIF conversion failed: ' . $e->getMessage());
        }
    }

    /**
     * JPG formatına çevir
     */
    protected function convertToJpg($image, string $storagePath, string $fileName, ?int $width = null): void
    {
        $suffix = $width ? '-' . $width : '';
        $jpgPath = storage_path('app/' . $storagePath . '/' . $fileName . $suffix . '.jpg');
        $image->toJpeg(90)->save($jpgPath);
    }

    /**
     * Srcset genişliklerini hesapla
     */
    protected function calculateSrcsetWidths(int $width): array
    {
        $widths = [];
        
        // Standart breakpoint'ler
        $breakpoints = [480, 768, 1200];
        
        foreach ($breakpoints as $bp) {
            if ($bp <= $width) {
                $widths[] = $bp;
            }
        }
        
        // Orijinal genişliği ekle
        if (!in_array($width, $widths)) {
            $widths[] = $width;
        }
        
        // Büyük resimler için ek breakpoint
        if ($width > 1200) {
            $widths[] = 1920; // Full HD
        }
        
        return array_unique($widths);
    }

    /**
     * Resmi güncelle
     */
    public function updateImage(SeoImage $seoImage, array $data): SeoImage
    {
        $seoImage->update($data);
        return $seoImage->fresh();
    }

    /**
     * Resmi sil
     */
    public function deleteImage(SeoImage $seoImage): bool
    {
        // Dosyaları sil
        $folderPath = 'public/' . $seoImage->folder_path;
        if (Storage::exists($folderPath)) {
            Storage::deleteDirectory($folderPath);
        }

        // Veritabanından sil
        return $seoImage->delete();
    }
}
