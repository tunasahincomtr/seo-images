<?php

namespace TunaSahin\SeoImages\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use TunaSahin\SeoImages\Models\SeoImage;

class SyncAvailableFormatsCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'seo-images:sync-formats';

    /**
     * The console command description.
     */
    protected $description = 'Mevcut görsellerin available_formats alanını disk tarayarak günceller';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $sizes = config('seo-images.sizes', [480, 768, 1200, 1920]);
        $formats = ['jpg', 'webp', 'avif'];
        
        $images = SeoImage::whereNull('available_formats')
            ->orWhere('available_formats', '[]')
            ->orWhere('available_formats', '')
            ->get();
        
        if ($images->isEmpty()) {
            $this->info('Güncellenecek görsel bulunamadı. Tüm görseller zaten senkronize.');
            return Command::SUCCESS;
        }
        
        $this->info("Toplam {$images->count()} görsel güncellenecek...");
        $bar = $this->output->createProgressBar($images->count());
        $bar->start();
        
        $updated = 0;
        $errors = 0;
        
        foreach ($images as $image) {
            try {
                $disk = Storage::disk($image->disk);
                $availableFormats = [];
                
                foreach ($formats as $format) {
                    $availableFormats[$format] = [];
                    
                    // Check original
                    $originalPath = "{$image->folder_path}/{$image->basename}.{$format}";
                    if ($disk->exists($originalPath)) {
                        $availableFormats[$format][] = null;
                    }
                    
                    // Check sizes
                    foreach ($sizes as $size) {
                        $sizePath = "{$image->folder_path}/{$image->basename}-{$size}.{$format}";
                        if ($disk->exists($sizePath)) {
                            $availableFormats[$format][] = $size;
                        }
                    }
                }
                
                $image->update(['available_formats' => $availableFormats]);
                $updated++;
            } catch (\Exception $e) {
                $errors++;
                $this->newLine();
                $this->error("Hata (ID: {$image->id}): " . $e->getMessage());
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info("✓ {$updated} görsel başarıyla güncellendi.");
        if ($errors > 0) {
            $this->warn("✗ {$errors} görsel güncellenemedi.");
        }
        
        return Command::SUCCESS;
    }
}