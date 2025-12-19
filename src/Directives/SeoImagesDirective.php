<?php

namespace TunaSahin\SeoImages\Directives;

use TunaSahin\SeoImages\Models\SeoImage;
use Illuminate\Support\Facades\Storage;

class SeoImagesDirective
{
    /**
     * Render @seoinput directive.
     */
    public function renderSeoInput($inputName, $mode = 'single'): string
    {
        $inputName = is_string($inputName) ? trim($inputName, '\'"') : (string) $inputName;
        $mode = is_string($mode) ? strtolower(trim($mode, '\'"')) : 'single';
        $isMultiple = $mode === 'multiple';
        
        $inputId = 'seo-input-' . str_replace(['[', ']'], ['-', ''], $inputName);
        $previewId = 'seo-preview-' . str_replace(['[', ']'], ['-', ''], $inputName);
        
        $html = '<div class="seo-input-wrapper" data-input-name="' . e($inputName) . '" data-mode="' . e($mode) . '">';
        
        // Hidden input
        if ($isMultiple) {
            $html .= '<input type="hidden" name="' . e($inputName) . '" id="' . $inputId . '" value="[]">';
        } else {
            $html .= '<input type="hidden" name="' . e($inputName) . '" id="' . $inputId . '" value="">';
        }
        
        // Preview area
        $html .= '<div class="seo-input-preview" id="' . $previewId . '">';
        if ($isMultiple) {
            $html .= '<div class="seo-gallery-preview"></div>';
        } else {
            $html .= '<div class="seo-single-preview">';
            $html .= '<span class="seo-no-image">Resim seçilmedi</span>';
            $html .= '</div>';
        }
        $html .= '</div>';
        
        // Open button
        $html .= '<button type="button" class="btn btn-primary seo-input-open-btn" ';
        $html .= 'data-seoinput-open ';
        $html .= 'data-input-name="' . e($inputName) . '" ';
        $html .= 'data-mode="' . e($mode) . '">';
        $html .= $isMultiple ? 'Galeri Seç' : 'Resim Seç';
        $html .= '</button>';
        
        $html .= '</div>';
        
        return $html;
    }

    /**
     * Render @seoimages directive.
     */
    public function renderSeoImages($folderPath, $options = []): string
    {
        // Normalize parameters
        $folderPath = is_string($folderPath) ? trim($folderPath, '\'"') : (string) $folderPath;
        if (!is_array($options)) {
            $options = [];
        }
        
        // Find image in database
        $seoImage = SeoImage::where('folder_path', $folderPath)->first();
        
        if (!$seoImage) {
            // Fallback: return empty or placeholder
            if (config('seo-images.fallback_on_missing', false)) {
                return '<img src="' . e($options['fallback'] ?? '') . '" alt="' . e($options['alt'] ?? '') . '">';
            }
            return '';
        }
        
        // Get options
        $alt = $options['alt'] ?? $seoImage->alt ?? '';
        $title = $options['title'] ?? $seoImage->title ?? '';
        $class = $options['class'] ?? '';
        $loading = $options['loading'] ?? 'lazy';
        $width = $options['width'] ?? $seoImage->width;
        $height = $options['height'] ?? $seoImage->height;
        
        // SEO Performance Attributes
        $decoding = $options['decoding'] ?? 'async'; // Default: async for better performance
        $fetchpriority = $options['fetchpriority'] ?? null; // Optional: high/low/auto
        $sizes = $options['sizes'] ?? null; // Optional: responsive sizes attribute
        
        // Validate decoding attribute
        $validDecoding = ['async', 'sync', 'auto'];
        if (!in_array(strtolower($decoding), $validDecoding)) {
            $decoding = 'async'; // Fallback to safe default
        }
        
        // Validate fetchpriority attribute
        if ($fetchpriority !== null) {
            $validFetchpriority = ['high', 'low', 'auto'];
            if (!in_array(strtolower($fetchpriority), $validFetchpriority)) {
                $fetchpriority = null; // Invalid value, ignore it
            } else {
                $fetchpriority = strtolower($fetchpriority);
            }
        }
        
        $disk = Storage::disk($seoImage->disk);
        $imageSizes = config('seo-images.sizes', [480, 768, 1200, 1920]);
        
        // Generate smart default sizes attribute if not provided and srcset is used
        if ($sizes === null && !empty($imageSizes)) {
            $sizes = $this->generateSmartSizes($imageSizes, $width);
        }
        
        // Build picture element
        $html = '<picture>';
        
        // AVIF sources
        $avifSrcset = [];
        foreach ($imageSizes as $size) {
            if ($seoImage->exists('avif', $size)) {
                $url = $seoImage->getUrl('avif', $size);
                $avifSrcset[] = $url . ' ' . $size . 'w';
            }
        }
        // Add original with real width
        if ($seoImage->exists('avif', null)) {
            $url = $seoImage->getUrl('avif');
            $avifSrcset[] = $url . ' ' . $seoImage->width . 'w';
        }
        
        if (!empty($avifSrcset)) {
            $html .= '<source srcset="' . implode(', ', $avifSrcset) . '" type="image/avif">';
        }
        
        // WebP sources
        $webpSrcset = [];
        foreach ($imageSizes as $size) {
            if ($seoImage->exists('webp', $size)) {
                $url = $seoImage->getUrl('webp', $size);
                $webpSrcset[] = $url . ' ' . $size . 'w';
            }
        }
        // Add original with real width
        if ($seoImage->exists('webp', null)) {
            $url = $seoImage->getUrl('webp');
            $webpSrcset[] = $url . ' ' . $seoImage->width . 'w';
        }
        
        if (!empty($webpSrcset)) {
            $html .= '<source srcset="' . implode(', ', $webpSrcset) . '" type="image/webp">';
        }
        
        // Fallback img
        $imgSrc = $seoImage->getUrl('jpg');
        $html .= '<img src="' . e($imgSrc) . '"';
        if ($alt) {
            $html .= ' alt="' . e($alt) . '"';
        }
        if ($title) {
            $html .= ' title="' . e($title) . '"';
        }
        if ($width) {
            $html .= ' width="' . e($width) . '"';
        }
        if ($height) {
            $html .= ' height="' . e($height) . '"';
        }
        if ($class) {
            $html .= ' class="' . e($class) . '"';
        }
        if ($loading) {
            $html .= ' loading="' . e($loading) . '"';
        }
        // SEO Performance: decoding attribute (always add for better performance)
        $html .= ' decoding="' . e($decoding) . '"';
        
        // SEO Performance: fetchpriority attribute (only if specified)
        if ($fetchpriority !== null) {
            $html .= ' fetchpriority="' . e($fetchpriority) . '"';
        }
        
        // SEO Performance: sizes attribute (for responsive images with srcset)
        if ($sizes !== null && (!empty($avifSrcset) || !empty($webpSrcset))) {
            $html .= ' sizes="' . e($sizes) . '"';
        }
        
        $html .= '>';
        
        $html .= '</picture>';
        
        return $html;
    }

    /**
     * Generate smart default sizes attribute for responsive images.
     * 
     * Generates a responsive sizes attribute based on common breakpoints.
     * Example output: "(max-width: 480px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px"
     * 
     * @param array $imageSizes Available image sizes
     * @param int|null $originalWidth Original image width
     * @return string Smart sizes attribute value
     */
    protected function generateSmartSizes(array $imageSizes, ?int $originalWidth = null): string
    {
        // Sort sizes ascending
        $sortedSizes = array_unique($imageSizes);
        sort($sortedSizes);
        
        if (empty($sortedSizes)) {
            // Fallback: use original width or default
            return ($originalWidth ?? 1920) . 'px';
        }
        
        // Common responsive breakpoints
        // Format: (max-width: breakpoint) viewport-width-or-fixed-size
        $sizesParts = [];
        
        // Mobile first approach
        // Small screens (up to 480px): full width
        if (isset($sortedSizes[0]) && $sortedSizes[0] <= 480) {
            $sizesParts[] = '(max-width: 480px) 100vw';
        }
        
        // Tablet (up to 768px): full width or first available size
        if (isset($sortedSizes[0]) && $sortedSizes[0] <= 768) {
            $sizesParts[] = '(max-width: 768px) 100vw';
        }
        
        // Desktop (up to 1200px): 50vw or appropriate size
        if (isset($sortedSizes[1]) && $sortedSizes[1] <= 1200) {
            $sizesParts[] = '(max-width: 1200px) 50vw';
        }
        
        // Large desktop: use largest available size or original width
        $finalSize = $originalWidth ?? end($sortedSizes);
        $sizesParts[] = $finalSize . 'px';
        
        return implode(', ', $sizesParts);
    }

    /**
     * Render scripts and styles.
     */
    public function renderScripts(): string
    {
        $primaryColor = config('seo-images.primary_color', '#0d6efd');
        
        // Dynamic CSS variables
        $html = '<style>';
        $html .= ':root { --seo-images-primary: ' . e($primaryColor) . '; }';
        $html .= '</style>';
        
        $html .= '<link rel="stylesheet" href="' . asset('vendor/seo-images/seo-images.css') . '">';
        $html .= '<script src="' . asset('vendor/seo-images/seo-images.js') . '"></script>';
        return $html;
    }
}