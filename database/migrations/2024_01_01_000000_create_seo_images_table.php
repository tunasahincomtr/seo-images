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
            $table->string('folder_path')->unique();
            $table->string('basename');
            $table->string('disk')->default('public');
            $table->string('original_extension')->nullable();
            $table->string('original_mime')->nullable();
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->string('alt')->nullable();
            $table->string('title')->nullable();
            $table->integer('file_size_jpg')->nullable();
            $table->integer('file_size_webp')->nullable();
            $table->integer('file_size_avif')->nullable();
            $table->timestamps();
            $table->softDeletes();
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

