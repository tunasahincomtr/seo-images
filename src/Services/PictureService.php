<?php

namespace Tunasahin\SeoImages\Services;

use Tunasahin\SeoImages\Models\SeoImage;
use Illuminate\Support\Facades\Storage;

class PictureService
{
    /**
     * SEO uyumlu picture etiketi oluştur
     * 
     * @param string $folderPath Resim klasör yolu
     * @param string|null $alt Alt etiketi (opsiyonel)
     * @param string|null $class CSS class (opsiyonel)
     * @param string $fetchPriority 'high' veya 'low' (varsayılan: 'low')
     * @return string
     */
    public function render(
        string $folderPath, 
        ?string $alt = null, 
        ?string $class = null,
        string $fetchPriority = 'low'
    ): string {
        $seoImage = SeoImage::where('folder_path', $folderPath)->first();

        if (!$seoImage) {
            return '';
        }

        $alt = $alt ?? $seoImage->alt_text ?? '';
        $classAttr = $class ? ' class="' . htmlspecialchars($class) . '"' : '';
        $fetchPriority = in_array($fetchPriority, ['high', 'low', 'auto']) ? $fetchPriority : 'low';
        
        $baseUrl = asset('storage/' . $seoImage->folder_path);
        $fileName = basename($seoImage->folder_path);
        $width = $seoImage->width ?? 0;
        $height = $seoImage->height ?? 0;

        // Sizes attribute - otomatik hesapla
        $sizes = $width > 0 ? $this->calculateSizes($width) : null;

        // Srcset genişlikleri - otomatik hesapla
        $srcsetWidths = $width > 0 ? $this->calculateSrcsetWidths($width) : [];
        
        // Srcset dosyalarının var olup olmadığını kontrol et
        // Eğer srcset dosyaları yoksa (eski resimler için), srcset kullanma
        $hasSrcsetFiles = false;
        if ($srcsetWidths && count($srcsetWidths) > 0) {
            $storagePath = 'public/' . $seoImage->folder_path;
            // En az bir srcset dosyasının var olup olmadığını kontrol et
            foreach ($srcsetWidths as $w) {
                if ($w < $width) {
                    $testFile = $storagePath . '/' . $fileName . '-' . $w . '.jpg';
                    if (Storage::exists($testFile)) {
                        $hasSrcsetFiles = true;
                        break;
                    }
                }
            }
        }

        $html = '<picture' . $classAttr . '>';
        
        // AVIF source (en modern format) - srcset ile
        if ($hasSrcsetFiles && $srcsetWidths && count($srcsetWidths) > 0) {
            $avifSrcset = $this->buildSrcset($baseUrl, $fileName, 'avif', $srcsetWidths, $width);
            $html .= '<source srcset="' . $avifSrcset . '" type="image/avif"';
            if ($sizes) {
                $html .= ' sizes="' . htmlspecialchars($sizes) . '"';
            }
            if ($width > 0) {
                $html .= ' width="' . $width . '" height="' . $height . '"';
            }
            $html .= '>';
        } else {
            // Basit srcset yoksa direkt URL
            $html .= '<source srcset="' . $baseUrl . '/' . $fileName . '.avif" type="image/avif"';
            if ($width > 0) {
                $html .= ' width="' . $width . '" height="' . $height . '"';
            }
            $html .= '>';
        }
        
        // WebP source - srcset ile
        if ($hasSrcsetFiles && $srcsetWidths && count($srcsetWidths) > 0) {
            $webpSrcset = $this->buildSrcset($baseUrl, $fileName, 'webp', $srcsetWidths, $width);
            $html .= '<source srcset="' . $webpSrcset . '" type="image/webp"';
            if ($sizes) {
                $html .= ' sizes="' . htmlspecialchars($sizes) . '"';
            }
            if ($width > 0) {
                $html .= ' width="' . $width . '" height="' . $height . '"';
            }
            $html .= '>';
        } else {
            // Basit srcset yoksa direkt URL
            $html .= '<source srcset="' . $baseUrl . '/' . $fileName . '.webp" type="image/webp"';
            if ($width > 0) {
                $html .= ' width="' . $width . '" height="' . $height . '"';
            }
            $html .= '>';
        }
        
        // JPG fallback - srcset ile
        $html .= '<img src="' . $baseUrl . '/' . $fileName . '.jpg" alt="' . htmlspecialchars($alt) . '"';
        
        if ($hasSrcsetFiles && $srcsetWidths && count($srcsetWidths) > 0) {
            $jpgSrcset = $this->buildSrcset($baseUrl, $fileName, 'jpg', $srcsetWidths, $width);
            $html .= ' srcset="' . $jpgSrcset . '"';
            if ($sizes) {
                $html .= ' sizes="' . htmlspecialchars($sizes) . '"';
            }
        }
        
        if ($width > 0) {
            $html .= ' width="' . $width . '"';
        }
        if ($height > 0) {
            $html .= ' height="' . $height . '"';
        }
        
        $html .= ' loading="lazy"';
        $html .= ' decoding="async"';
        $html .= ' fetchpriority="' . $fetchPriority . '"';
        
        if ($class) {
            $html .= ' class="' . htmlspecialchars($class) . '"';
        }
        
        $html .= '>';
        $html .= '</picture>';

        return $html;
    }

    /**
     * Srcset oluştur
     */
    protected function buildSrcset(string $baseUrl, string $fileName, string $extension, array $widths, int $originalWidth): string
    {
        $srcset = [];
        foreach ($widths as $w) {
            // Orijinal genişlik için suffix ekleme, küçük boyutlar için ekle
            if ($w == $originalWidth) {
                $srcset[] = $baseUrl . '/' . $fileName . '.' . $extension . ' ' . $w . 'w';
            } else {
                $srcset[] = $baseUrl . '/' . $fileName . '-' . $w . '.' . $extension . ' ' . $w . 'w';
            }
        }
        return implode(', ', $srcset);
    }

    /**
     * Sizes attribute hesapla
     */
    protected function calculateSizes(int $width): string
    {
        // Responsive breakpoint'lere göre sizes hesapla
        if ($width <= 480) {
            return '100vw';
        } elseif ($width <= 768) {
            return '(max-width: 768px) 100vw, ' . $width . 'px';
        } elseif ($width <= 1200) {
            return '(max-width: 768px) 100vw, (max-width: 1200px) 768px, ' . $width . 'px';
        } else {
            return '(max-width: 768px) 100vw, (max-width: 1200px) 768px, 1200px';
        }
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
        
        // Küçük genişlikler için ek breakpoint'ler
        if ($width > 1200) {
            $widths[] = 1920; // Full HD
        }
        
        return array_unique($widths);
    }
}
