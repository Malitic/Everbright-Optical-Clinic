<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $staff;
    protected $customer;
    protected $optometrist;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test users with different roles
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->staff = User::factory()->create(['role' => 'staff']);
        $this->customer = User::factory()->create(['role' => 'customer']);
        $this->optometrist = User::factory()->create(['role' => 'optometrist']);
    }

    /** @test */
    public function test_basic_api_connectivity()
    {
        $response = $this->get('/api/products');

        $response->assertStatus(200);
    }

    /** @test */
    public function test_admin_can_create_product()
    {
        Storage::fake('public');

        $productData = [
            'name' => 'Test Glasses',
            'description' => 'Test description',
            'price' => 99.99,
            'category' => 'glasses',
            'product_type' => 'prescription_glasses',
            'stock_quantity' => 10,
            'sku' => 'TEST-001'
        ];

        $response = $this->actingAs($this->admin, 'api')
            ->postJson('/api/products', $productData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'description',
                    'price',
                    'category',
                    'product_type',
                    'stock_quantity',
                    'sku'
                ]
            ]);

        $this->assertDatabaseHas('products', $productData);
    }

    /** @test */
    public function test_admin_can_create_product_with_image()
    {
        Storage::fake('public');

        $image = UploadedFile::fake()->image('test-image.jpg');

        $productData = [
            'name' => 'Test Glasses with Image',
            'description' => 'Test description',
            'price' => 149.99,
            'category' => 'glasses',
            'product_type' => 'prescription_glasses',
            'stock_quantity' => 5,
            'sku' => 'TEST-002',
            'image' => $image
        ];

        $response = $this->actingAs($this->admin, 'api')
            ->postJson('/api/products', $productData);

        $response->assertStatus(201);

        $product = Product::where('sku', 'TEST-002')->first();
        $this->assertNotNull($product->image_path);
        Storage::disk('public')->assertExists($product->image_path);
    }

    /** @test */
    public function test_staff_can_create_inventory_product()
    {
        $productData = [
            'name' => 'Test Inventory Item',
            'description' => 'Test inventory description',
            'price' => 29.99,
            'category' => 'inventory',
            'product_type' => 'stock_items',
            'stock_quantity' => 100,
            'sku' => 'INV-001'
        ];

        $response = $this->actingAs($this->staff, 'api')
            ->postJson('/api/products', $productData);

        $response->assertStatus(201);
        $this->assertDatabaseHas('products', $productData);
    }

    /** @test */
    public function test_customer_cannot_create_product()
    {
        $productData = [
            'name' => 'Unauthorized Product',
            'description' => 'Should not be created',
            'price' => 49.99,
            'category' => 'glasses',
            'product_type' => 'sunglasses',
            'stock_quantity' => 1,
            'sku' => 'UNAUTH-001'
        ];

        $response = $this->actingAs($this->customer, 'api')
            ->postJson('/api/products', $productData);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('products', ['sku' => 'UNAUTH-001']);
    }

    /** @test */
    public function test_admin_can_update_product()
    {
        $product = Product::factory()->create([
            'name' => 'Original Name',
            'price' => 100.00
        ]);

        $updateData = [
            'name' => 'Updated Name',
            'price' => 150.00
        ];

        $response = $this->actingAs($this->admin, 'api')
            ->putJson("/api/products/{$product->id}", $updateData);

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'name' => 'Updated Name',
                    'price' => 150.00
                ]
            ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Name',
            'price' => 150.00
        ]);
    }

    /** @test */
    public function test_admin_can_delete_product()
    {
        $product = Product::factory()->create();

        $response = $this->actingAs($this->admin, 'api')
            ->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    /** @test */
    public function test_customer_cannot_delete_product()
    {
        $product = Product::factory()->create();

        $response = $this->actingAs($this->customer, 'api')
            ->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('products', ['id' => $product->id]);
    }

    /** @test */
    public function test_get_all_products()
    {
        Product::factory()->count(5)->create();

        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'description',
                        'price',
                        'category',
                        'product_type',
                        'stock_quantity',
                        'sku'
                    ]
                ]
            ])
            ->assertJsonCount(5, 'data');
    }

    /** @test */
    public function test_get_single_product()
    {
        $product = Product::factory()->create();

        $response = $this->actingAs($this->admin, 'api')
            ->getJson("/api/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $product->id,
                    'name' => $product->name
                ]
            ]);
    }

    /** @test */
    public function test_role_based_product_visibility()
    {
        // Create products for different roles
        $customerProduct = Product::factory()->create([
            'product_type' => 'glasses'
        ]);

        $optometristProduct = Product::factory()->create([
            'product_type' => 'professional_equipment'
        ]);

        $staffProduct = Product::factory()->create([
            'product_type' => 'stock_items'
        ]);

        // Customer should see customer products
        $response = $this->actingAs($this->customer, 'api')
            ->getJson('/api/products');

        $response->assertStatus(200);
        $productIds = collect($response->json('data'))->pluck('id')->toArray();
        $this->assertContains($customerProduct->id, $productIds);
        $this->assertNotContains($optometristProduct->id, $productIds);
        $this->assertNotContains($staffProduct->id, $productIds);
    }

    /** @test */
    public function test_product_validation_errors()
    {
        $invalidData = [
            'name' => '', // Required field empty
            'price' => 'not-a-number', // Invalid price
            'stock_quantity' => -1 // Invalid quantity
        ];

        $response = $this->actingAs($this->admin, 'api')
            ->postJson('/api/products', $invalidData);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'errors' => [
                    'name',
                    'price',
                    'stock_quantity'
                ]
            ]);
    }

    /** @test */
    public function test_image_upload_validation()
    {
        Storage::fake('public');

        // Test invalid file type
        $invalidImage = UploadedFile::fake()->create('test.txt', 100);

        $productData = [
            'name' => 'Test Product',
            'description' => 'Test description',
            'price' => 99.99,
            'category' => 'glasses',
            'product_type' => 'prescription_glasses',
            'stock_quantity' => 10,
            'sku' => 'TEST-003',
            'image' => $invalidImage
        ];

        $response = $this->actingAs($this->admin, 'api')
            ->postJson('/api/products', $productData);

        $response->assertStatus(422)
            ->assertJsonStructure(['errors' => ['image']]);
    }

    /** @test */
    public function test_search_products()
    {
        Product::factory()->create(['name' => 'Blue Glasses']);
        Product::factory()->create(['name' => 'Red Sunglasses']);
        Product::factory()->create(['name' => 'Green Contacts']);

        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/products?search=glasses');

        $response->assertStatus(200);
        $this->assertEquals(2, count($response->json('data')));
    }

    /** @test */
    public function test_filter_products_by_category()
    {
        Product::factory()->create(['category' => 'glasses']);
        Product::factory()->create(['category' => 'contacts']);
        Product::factory()->create(['category' => 'accessories']);

        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/products?category=glasses');

        $response->assertStatus(200);
        $this->assertEquals(1, count($response->json('data')));
        $this->assertEquals('glasses', $response->json('data.0.category'));
    }

    /** @test */
    public function test_pagination()
    {
        Product::factory()->count(25)->create();

        $response = $this->actingAs($this->admin, 'api')
            ->getJson('/api/products?page=2&per_page=10');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'meta' => [
                    'current_page',
                    'per_page',
                    'total',
                    'last_page'
                ]
            ]);

        $this->assertEquals(2, $response->json('meta.current_page'));
        $this->assertEquals(10, $response->json('meta.per_page'));
    }
}
