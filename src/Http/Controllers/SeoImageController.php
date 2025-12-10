<?php

namespace Tunasahin\SeoImages\Http\Controllers;

use Tunasahin\SeoImages\Models\SeoImage;
use Tunasahin\SeoImages\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller as BaseController;

class SeoImageController extends BaseController
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Tüm resimleri listele (sayfalama ve arama desteği ile)
     */
    public function index(Request $request): JsonResponse
    {
        $query = SeoImage::query();
        
        // Arama
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('alt_text', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('folder_path', 'like', "%{$search}%");
            });
        }
        
        // Toplam sayı (arama sonrası)
        $total = $query->count();
        
        // Sayfalama
        $perPage = $request->get('per_page', 12);
        $page = $request->get('page', 1);
        $skip = ($page - 1) * $perPage;
        
        $images = $query->orderBy('created_at', 'desc')
                       ->skip($skip)
                       ->take($perPage)
                       ->get();
        
        return response()->json([
            'success' => true,
            'data' => $images->map(function ($image) {
                $fileName = basename($image->folder_path);
                return [
                    'id' => $image->id,
                    'folder_path' => $image->folder_path,
                    'alt_text' => $image->alt_text,
                    'title' => $image->title,
                    'width' => $image->width,
                    'height' => $image->height,
                    'url' => asset('storage/' . $image->folder_path . '/' . $fileName . '.jpg'),
                    'webp_url' => asset('storage/' . $image->folder_path . '/' . $fileName . '.webp'),
                    'avif_url' => asset('storage/' . $image->folder_path . '/' . $fileName . '.avif'),
                    'created_at' => $image->created_at->format('Y-m-d H:i:s'),
                ];
            }),
            'pagination' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => $page,
                'has_more' => ($skip + $images->count()) < $total,
            ]
        ]);
    }

    /**
     * Yeni resim yükle
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:10240', // Max 10MB
            'alt_text' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
        ]);

        try {
            $seoImage = $this->imageService->uploadImage(
                $request->file('image'),
                $request->input('alt_text'),
                $request->input('title')
            );

            return response()->json([
                'success' => true,
                'message' => 'Resim başarıyla yüklendi',
                'data' => [
                    'id' => $seoImage->id,
                    'folder_path' => $seoImage->folder_path,
                    'alt_text' => $seoImage->alt_text,
                    'title' => $seoImage->title,
                    'width' => $seoImage->width,
                    'height' => $seoImage->height,
                    'url' => asset('storage/' . $seoImage->folder_path . '/' . basename($seoImage->folder_path) . '.jpg'),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Resim yüklenirken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resmi güncelle
     */
    public function update(Request $request, SeoImage $seoImage): JsonResponse
    {
        $request->validate([
            'alt_text' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
        ]);

        try {
            $seoImage = $this->imageService->updateImage($seoImage, $request->only(['alt_text', 'title']));

            return response()->json([
                'success' => true,
                'message' => 'Resim başarıyla güncellendi',
                'data' => [
                    'id' => $seoImage->id,
                    'folder_path' => $seoImage->folder_path,
                    'alt_text' => $seoImage->alt_text,
                    'title' => $seoImage->title,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Resim güncellenirken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resmi sil
     */
    public function destroy(SeoImage $seoImage): JsonResponse
    {
        try {
            $this->imageService->deleteImage($seoImage);

            return response()->json([
                'success' => true,
                'message' => 'Resim başarıyla silindi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Resim silinirken hata oluştu: ' . $e->getMessage()
            ], 500);
        }
    }
}
