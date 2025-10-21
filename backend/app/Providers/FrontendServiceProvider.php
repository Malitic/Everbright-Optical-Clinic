<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\File;

class FrontendServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Check for pre-built frontend on application boot
        $this->checkPreBuiltFrontend();
    }

    /**
     * Check if pre-built frontend exists and log the status
     */
    private function checkPreBuiltFrontend(): void
    {
        $frontendPath = base_path('frontend--/dist');
        
        echo "🚀 Starting Everbright Optical System (Full Stack with Pre-built Frontend)...\n";
        echo "📦 Checking for pre-built frontend...\n";
        echo "📋 Current directory: " . base_path() . "\n";
        echo "📋 Contents:\n";
        
        // List directory contents
        $contents = File::allFiles(base_path());
        foreach ($contents as $file) {
            echo "  " . $file->getFilename() . "\n";
        }
        
        if (File::exists($frontendPath) && File::exists($frontendPath . '/index.html')) {
            echo "✅ Pre-built frontend found!\n";
            echo "📁 Frontend build contents:\n";
            
            $frontendFiles = File::allFiles($frontendPath);
            foreach ($frontendFiles as $file) {
                echo "  " . $file->getFilename() . "\n";
            }
            
            echo "✅ Using pre-built frontend - no build needed\n";
        } else {
            echo "⚠️ Pre-built frontend not found\n";
            echo "📋 Available directories:\n";
            
            $directories = File::directories(base_path());
            foreach ($directories as $dir) {
                echo "  " . basename($dir) . "/\n";
            }
            
            echo "⚠️ Will serve backend API only\n";
        }
    }
}
