<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('seo_images', function (Blueprint $table) {
            $table->id();
            $table->string('path')->comment('Orijinal dosya yolu');
            $table->string('folder_path')->comment('Klasör yolu (2025/12/05/x gibi)');
            $table->string('original_name')->comment('Orijinal dosya adı');
            $table->string('alt_text')->nullable()->comment('Alt etiketi');
            $table->string('title')->nullable()->comment('Başlık');
            $table->integer('width')->nullable()->comment('Genişlik');
            $table->integer('height')->nullable()->comment('Yükseklik');
            $table->integer('file_size')->nullable()->comment('Dosya boyutu (byte)');
            $table->string('mime_type')->nullable()->comment('MIME tipi');
            $table->timestamps();

            $table->index('folder_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seo_images');
    }
};

