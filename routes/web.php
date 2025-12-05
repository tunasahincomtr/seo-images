<?php

use Tunasahin\SeoImages\Http\Controllers\SeoImageController;
use Illuminate\Support\Facades\Route;

Route::get('/images', [SeoImageController::class, 'index'])->name('images.index');
Route::post('/images', [SeoImageController::class, 'store'])->name('images.store');
Route::put('/images/{seoImage}', [SeoImageController::class, 'update'])->name('images.update');
Route::delete('/images/{seoImage}', [SeoImageController::class, 'destroy'])->name('images.destroy');
