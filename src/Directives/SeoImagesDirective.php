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
        
        $disk = Storage::disk($seoImage->disk);
        $sizes = config('seo-images.sizes', [480, 768, 1200, 1920]);
        
        // Build picture element
        $html = '<picture>';
        
        // AVIF sources
        $avifSrcset = [];
        foreach ($sizes as $size) {
            if ($seoImage->exists('avif', $size)) {
                $url = $seoImage->getUrl('avif', $size);
                $avifSrcset[] = $url . ' ' . $size . 'w';
            }
        }
        // Add original
        if ($seoImage->exists('avif')) {
            $url = $seoImage->getUrl('avif');
            $avifSrcset[] = $url . ' 1920w';
        }
        
        if (!empty($avifSrcset)) {
            $html .= '<source srcset="' . implode(', ', $avifSrcset) . '" type="image/avif">';
        }
        
        // WebP sources
        $webpSrcset = [];
        foreach ($sizes as $size) {
            if ($seoImage->exists('webp', $size)) {
                $url = $seoImage->getUrl('webp', $size);
                $webpSrcset[] = $url . ' ' . $size . 'w';
            }
        }
        // Add original
        if ($seoImage->exists('webp')) {
            $url = $seoImage->getUrl('webp');
            $webpSrcset[] = $url . ' 1920w';
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
        $html .= '>';
        
        $html .= '</picture>';
        
        return $html;
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