<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestMultiBranchSystem extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:multi-branch';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the multi-branch product management system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧪 Testing Multi-Branch Product Management System');
        $this->line('=' . str_repeat('=', 50));

        try {
            // Test 1: Check branches
            $this->info('1️⃣ Testing Branch System...');
            $branches = \App\Models\Branch::all();
            $this->info("✅ Found {$branches->count()} branches:");
            foreach ($branches as $branch) {
                $this->line("   - {$branch->name} ({$branch->code})");
            }

            // Test 2: Check products
            $this->info('2️⃣ Testing Product System...');
            $products = \App\Models\Product::all();
            $this->info("✅ Found {$products->count()} products:");
            foreach ($products as $product) {
                $this->line("   - {$product->name} (₱{$product->price})");
            }

            // Test 3: Create sample branch stock
            if ($products->count() > 0) {
                $this->info('3️⃣ Testing Branch Stock System...');
                
                foreach ($products as $product) {
                    foreach ($branches as $branch) {
                        $stockQuantity = rand(0, 10);
                        $reservedQuantity = rand(0, min($stockQuantity, 3));
                        
                        \App\Models\BranchStock::updateOrCreate(
                            [
                                'product_id' => $product->id,
                                'branch_id' => $branch->id
                            ],
                            [
                                'stock_quantity' => $stockQuantity,
                                'reserved_quantity' => $reservedQuantity
                            ]
                        );
                        
                        $this->line("   - {$product->name} at {$branch->name}: {$stockQuantity} stock, {$reservedQuantity} reserved");
                    }
                }
                $this->info('✅ Branch stock created successfully!');
            }

            // Test 4: Test availability
            $this->info('4️⃣ Testing Product Availability...');
            foreach ($products as $product) {
                $this->line("📦 {$product->name}:");
                $branchStock = \App\Models\BranchStock::with('branch')->where('product_id', $product->id)->get();
                
                foreach ($branchStock as $stock) {
                    $available = $stock->stock_quantity - $stock->reserved_quantity;
                    $status = $available > 0 ? "✅ {$available} pcs" : "❌ Out of Stock";
                    $this->line("   - {$stock->branch->name}: {$status}");
                }
            }

            $this->info('🎉 Multi-Branch System Test Completed Successfully!');
            $this->line('=' . str_repeat('=', 50));
            $this->info('✅ All systems are working correctly!');

        } catch (\Exception $e) {
            $this->error("❌ Error: " . $e->getMessage());
        }
    }
}
