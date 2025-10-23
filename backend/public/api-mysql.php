<?php
// Complete API server using MySQL only - bypasses Laravel completely
header('Content-Type: application/json');

// Handle CORS preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    // Define allowed origins
    $allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:8082',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'http://127.0.0.1:5176',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:8081',
        'http://127.0.0.1:8082',
        'http://192.168.56.1:3000',
        'http://192.168.56.1:5173',
        'http://192.168.56.1:5174',
        'http://192.168.56.1:5175',
        'http://192.168.56.1:5176',
        'http://192.168.56.1:8080',
        'http://192.168.56.1:8081',
        'http://192.168.56.1:8082',
        'http://192.168.100.6:3000',
        'http://192.168.100.6:5173',
        'http://192.168.100.6:5174',
        'http://192.168.100.6:5175',
        'http://192.168.100.6:5176',
        'http://192.168.100.6:8080',
        'http://192.168.100.6:8081',
        'http://192.168.100.6:8082',
        'http://10.173.7.92:3000',
        'http://10.173.7.92:5173',
        'http://10.173.7.92:5174',
        'http://10.173.7.92:5175',
        'http://10.173.7.92:5176',
        'http://10.173.7.92:8080',
        'http://10.173.7.92:8081',
        'http://10.173.7.92:8082',
    ];
    
    // Check if origin is allowed
    if (in_array($origin, $allowedOrigins) || 
        preg_match('/^http:\/\/localhost(?:\:[0-9]+)?$/', $origin) ||
        preg_match('/^http:\/\/127\.0\.0\.1(?:\:[0-9]+)?$/', $origin) ||
        preg_match('/^http:\/\/192\.168\.[0-9]+\.[0-9]+(?:\:[0-9]+)?$/', $origin) ||
        preg_match('/^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+(?:\:[0-9]+)?$/', $origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: http://192.168.100.6:5173'); // Default fallback
    }
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
    http_response_code(200);
    exit();
}

// Set CORS headers for actual requests
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Define allowed origins (same as above)
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://127.0.0.1:5176',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082',
    'http://192.168.56.1:3000',
    'http://192.168.56.1:5173',
    'http://192.168.56.1:5174',
    'http://192.168.56.1:5175',
    'http://192.168.56.1:5176',
    'http://192.168.56.1:8080',
    'http://192.168.56.1:8081',
    'http://192.168.56.1:8082',
    'http://192.168.100.6:3000',
    'http://192.168.100.6:5173',
    'http://192.168.100.6:5174',
    'http://192.168.100.6:5175',
    'http://192.168.100.6:5176',
    'http://192.168.100.6:8080',
    'http://192.168.100.6:8081',
    'http://192.168.100.6:8082',
    'http://10.173.7.92:3000',
    'http://10.173.7.92:5173',
    'http://10.173.7.92:5174',
    'http://10.173.7.92:5175',
    'http://10.173.7.92:5176',
    'http://10.173.7.92:8080',
    'http://10.173.7.92:8081',
    'http://10.173.7.92:8082',
];

// Check if origin is allowed
if (in_array($origin, $allowedOrigins) || 
    preg_match('/^http:\/\/localhost(?:\:[0-9]+)?$/', $origin) ||
    preg_match('/^http:\/\/127\.0\.0\.1(?:\:[0-9]+)?$/', $origin) ||
    preg_match('/^http:\/\/192\.168\.[0-9]+\.[0-9]+(?:\:[0-9]+)?$/', $origin) ||
    preg_match('/^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+(?:\:[0-9]+)?$/', $origin)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: http://192.168.100.6:5173'); // Default fallback
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Allow-Credentials: true');

try {
    // Connect to MySQL database
    $host = '127.0.0.1';
    $dbname = 'everbright_optical';
    $username = 'root';
    $password_db = '';
    
    $pdo = new PDO(
        "mysql:host={$host};dbname={$dbname};charset=utf8mb4",
        $username,
        $password_db,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    // Get the endpoint from the URL
    $path = $_SERVER['REQUEST_URI'];
    $path = str_replace('/api-mysql.php', '', $path);
    $path = ltrim($path, '/');
    
    // Handle query parameters
    if (strpos($path, '?') !== false) {
        $path = substr($path, 0, strpos($path, '?'));
    }
    
    // Extract the main endpoint (first part of the path)
    $pathParts = explode('/', $path);
    $endpoint = $pathParts[0];
    
    // Store the full path for sub-endpoint handling
    $fullPath = $path;
    
    // If no path specified, default to health check
    if (empty($path)) {
        $path = 'health';
    }
    
    // Route to appropriate handler
    switch ($endpoint) {
        case 'login':
            // Handle login
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['email'], $input['password'], $input['role'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Email, password, and role are required']);
                exit();
            }
            
            $email = $input['email'];
            $password = $input['password'];
            $role = $input['role'];
            
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND role = ?");
            $stmt->execute([$email, $role]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password'])) {
                $branch = null;
                if (isset($user['branch_id']) && $user['branch_id']) {
                    $stmt = $pdo->prepare("SELECT * FROM branches WHERE id = ?");
                    $stmt->execute([$user['branch_id']]);
                    $branch = $stmt->fetch();
                }
                
                $response = [
                    'message' => 'Login successful',
                    'token' => 'mysql_token_' . time(),
                    'token_expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours')),
                    'token_expires_in_minutes' => 1440,
                    'user' => [
                        'id' => $user['id'],
                        'name' => $user['name'],
                        'email' => $user['email'],
                        'role' => $user['role'],
                        'phone' => $user['phone'] ?? null,
                        'address' => $user['address'] ?? null,
                        'branch' => $branch ? [
                            'id' => $branch['id'],
                            'name' => $branch['name'],
                            'address' => $branch['address']
                        ] : null
                    ]
                ];
                
                http_response_code(200);
                echo json_encode($response);
                exit();
            } else {
                http_response_code(401);
                echo json_encode(['message' => 'Invalid credentials']);
                exit();
            }
            break;
            
        case 'branches':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Check if requesting specific branch by ID
                $pathParts = explode('/', trim($fullPath, '/'));
                if (count($pathParts) > 1 && is_numeric($pathParts[1])) {
                    // Get specific branch by ID
                    $branchId = $pathParts[1];
                    $stmt = $pdo->prepare("SELECT * FROM branches WHERE id = ?");
                    $stmt->execute([$branchId]);
                    $branch = $stmt->fetch();
                    
                    if ($branch) {
                        $response = [
                            'data' => $branch
                        ];
                    } else {
                        http_response_code(404);
                        echo json_encode(['message' => 'Branch not found']);
                        exit();
                    }
                } else {
                    // Get all branches
                    $stmt = $pdo->query("SELECT * FROM branches ORDER BY name");
                    $branches = $stmt->fetchAll();
                    
                    $response = [
                        'data' => $branches
                    ];
                }
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Create new branch
                $input = json_decode(file_get_contents('php://input'), true);
                $name = $input['name'] ?? '';
                $code = $input['code'] ?? '';
                $address = $input['address'] ?? '';
                $phone = $input['phone'] ?? '';
                $email = $input['email'] ?? '';
                $is_active = $input['is_active'] ?? true;
                
                if (empty($name) || empty($code) || empty($address)) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Name, code, and address are required']);
                    exit();
                }
                
                $stmt = $pdo->prepare("
                    INSERT INTO branches (name, code, address, phone, email, is_active, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                $stmt->execute([$name, $code, $address, $phone, $email, $is_active ? 1 : 0]);
                
                $branchId = $pdo->lastInsertId();
                
                $response = [
                    'data' => ['id' => $branchId],
                    'message' => 'Branch created successfully'
                ];
            } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                // Update branch
                $pathParts = explode('/', trim($fullPath, '/'));
                if (count($pathParts) > 1 && is_numeric($pathParts[1])) {
                    $branchId = $pathParts[1];
                    $input = json_decode(file_get_contents('php://input'), true);
                    $name = $input['name'] ?? '';
                    $code = $input['code'] ?? '';
                    $address = $input['address'] ?? '';
                    $phone = $input['phone'] ?? '';
                    $email = $input['email'] ?? '';
                    $is_active = $input['is_active'] ?? true;
                    
                    if (empty($name) || empty($code) || empty($address)) {
                        http_response_code(400);
                        echo json_encode(['message' => 'Name, code, and address are required']);
                        exit();
                    }
                    
                    $stmt = $pdo->prepare("
                        UPDATE branches 
                        SET name = ?, code = ?, address = ?, phone = ?, email = ?, is_active = ?, updated_at = NOW()
                        WHERE id = ?
                    ");
                    $stmt->execute([$name, $code, $address, $phone, $email, $is_active ? 1 : 0, $branchId]);
                    
                    $response = [
                        'message' => 'Branch updated successfully'
                    ];
                } else {
                    http_response_code(400);
                    echo json_encode(['message' => 'Branch ID is required']);
                    exit();
                }
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                // Delete branch
                $pathParts = explode('/', trim($fullPath, '/'));
                if (count($pathParts) > 1 && is_numeric($pathParts[1])) {
                    $branchId = $pathParts[1];
                    
                    // Check if branch has any associated data (products, users, etc.)
                    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM users WHERE branch_id = ?");
                    $stmt->execute([$branchId]);
                    $userCount = $stmt->fetch()['count'];
                    
                    if ($userCount > 0) {
                        http_response_code(400);
                        echo json_encode(['message' => 'Cannot delete branch with associated users']);
                        exit();
                    }
                    
                    $stmt = $pdo->prepare("DELETE FROM branches WHERE id = ?");
                    $stmt->execute([$branchId]);
                    
                    $response = [
                        'message' => 'Branch deleted successfully'
                    ];
                } else {
                    http_response_code(400);
                    echo json_encode(['message' => 'Branch ID is required']);
                    exit();
                }
            } else {
                $response = [
                    'data' => [],
                    'message' => 'Method not allowed'
                ];
            }
            break;
            
        case 'admin/users':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $stmt = $pdo->query("SELECT id, name, email, role, is_approved, created_at FROM users ORDER BY created_at DESC");
                $users = $stmt->fetchAll();
                $response = [
                    'data' => $users,
                    'message' => 'Users retrieved successfully'
                ];
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);
                
                $stmt = $pdo->prepare("INSERT INTO users (name, email, password, role, is_approved) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$input['name'], $input['email'], $hashedPassword, $input['role'], $input['is_approved'] ?? 0]);
                
                $response = [
                    'data' => ['id' => $pdo->lastInsertId()],
                    'message' => 'User created successfully'
                ];
            } else {
                $response = [
                    'data' => [],
                    'message' => 'Method not allowed'
                ];
            }
            break;
            
        case 'product-categories':
            $stmt = $pdo->query("SELECT * FROM product_categories ORDER BY name");
            $categories = $stmt->fetchAll();
            $response = [
                'data' => $categories,
                'message' => 'Product categories retrieved successfully'
            ];
            break;
            
        case 'products':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $search = $_GET['search'] ?? '';
                $category = $_GET['category'] ?? '';
                
                $sql = "SELECT p.*, COALESCE(SUM(bs.stock_quantity), 0) as total_stock FROM products p 
                        LEFT JOIN branch_stock bs ON p.id = bs.product_id 
                        WHERE p.is_active = 1";
                $params = [];
                
                if (!empty($search)) {
                    $sql .= " AND (p.name LIKE ? OR p.description LIKE ?)";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }
                
                if (!empty($category)) {
                    $sql .= " AND p.category = ?";
                    $params[] = $category;
                }
                
                $sql .= " GROUP BY p.id ORDER BY p.created_at DESC";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $products = $stmt->fetchAll();
                
                $response = [
                    'data' => $products,
                    'message' => 'Products retrieved successfully'
                ];
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Handle product creation
                $name = $_POST['name'] ?? '';
                $description = $_POST['description'] ?? '';
                $price = $_POST['price'] ?? '0';
                $stock_quantity = $_POST['stock_quantity'] ?? '0';
                $category = $_POST['category'] ?? '';
                $brand = $_POST['brand'] ?? '';
                $model = $_POST['model'] ?? '';
                $is_active = $_POST['is_active'] ?? '1';
                
                // Basic validation
                if (empty($name)) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Product name is required']);
                    exit();
                }
                
                if (!is_numeric($price) || $price < 0) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Valid price is required']);
                    exit();
                }
                
                if (!is_numeric($stock_quantity) || $stock_quantity < 0) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Valid stock quantity is required']);
                    exit();
                }
                
                // Handle image uploads
                $imagePaths = [];
                
                // Check for files uploaded with the pattern images[0], images[1], etc.
                foreach ($_FILES as $key => $file) {
                    if (strpos($key, 'images[') === 0 && $file['error'] === UPLOAD_ERR_OK) {
                        // Create upload directory if it doesn't exist
                        $uploadDir = __DIR__ . '/../storage/app/public/products/';
                        if (!is_dir($uploadDir)) {
                            mkdir($uploadDir, 0755, true);
                        }
                        
                        $fileName = time() . '_' . basename($file['name']);
                        $targetPath = $uploadDir . $fileName;
                        
                        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                            $imagePaths[] = 'products/' . $fileName;
                        }
                    }
                }
                
                // Also check for traditional images array format
                if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
                    $uploadDir = __DIR__ . '/../storage/app/public/products/';
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0755, true);
                    }
                    
                    for ($i = 0; $i < count($_FILES['images']['name']); $i++) {
                        if ($_FILES['images']['error'][$i] === UPLOAD_ERR_OK) {
                            $fileName = time() . '_' . $i . '_' . basename($_FILES['images']['name'][$i]);
                            $targetPath = $uploadDir . $fileName;
                            
                            if (move_uploaded_file($_FILES['images']['tmp_name'][$i], $targetPath)) {
                                $imagePaths[] = 'products/' . $fileName;
                            }
                        }
                    }
                }
                
                // Convert image paths array to JSON string for storage
                $imagePathsJson = !empty($imagePaths) ? json_encode($imagePaths) : null;
                
                // Insert product
                $stmt = $pdo->prepare("
                    INSERT INTO products (name, description, price, stock_quantity, category, brand, model, image_paths, is_active, created_by, updated_by, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())
                ");
                
                $stmt->execute([
                    $name,
                    $description,
                    $price,
                    $stock_quantity,
                    $category,
                    $brand,
                    $model,
                    $imagePathsJson,
                    $is_active
                ]);
                
                $productId = $pdo->lastInsertId();
                
                // Handle branch stock assignment if branch_stocks is provided
                $branchStocksJson = $_POST['branch_stocks'] ?? '';
                if (!empty($branchStocksJson)) {
                    $branchStocks = json_decode($branchStocksJson, true);
                    
                    if (is_array($branchStocks) && !empty($branchStocks)) {
                        // Check if branch_stock table exists, if not create it
                        $pdo->exec("
                            CREATE TABLE IF NOT EXISTS `branch_stock` (
                                `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                                `product_id` bigint(20) UNSIGNED NOT NULL,
                                `branch_id` bigint(20) UNSIGNED NOT NULL,
                                `stock_quantity` int(11) NOT NULL DEFAULT 0,
                                `reserved_quantity` int(11) NOT NULL DEFAULT 0,
                                `created_at` timestamp NULL DEFAULT NULL,
                                `updated_at` timestamp NULL DEFAULT NULL,
                                PRIMARY KEY (`id`),
                                UNIQUE KEY `branch_stock_product_branch_unique` (`product_id`, `branch_id`),
                                KEY `branch_stock_product_id_foreign` (`product_id`),
                                KEY `branch_stock_branch_id_foreign` (`branch_id`)
                            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                        ");
                        
                        // Insert stock for each branch with individual quantities
                        $stmt = $pdo->prepare("
                            INSERT INTO branch_stock (product_id, branch_id, stock_quantity, created_at, updated_at) 
                            VALUES (?, ?, ?, NOW(), NOW())
                            ON DUPLICATE KEY UPDATE 
                            stock_quantity = VALUES(stock_quantity), 
                            updated_at = NOW()
                        ");
                        
                        foreach ($branchStocks as $branchStock) {
                            if (isset($branchStock['branch_id']) && isset($branchStock['stock_quantity']) && $branchStock['stock_quantity'] > 0) {
                                $stmt->execute([$productId, $branchStock['branch_id'], $branchStock['stock_quantity']]);
                            }
                        }
                    }
                }
                
                $response = [
                    'data' => ['id' => $productId],
                    'message' => 'Product created successfully'
                ];
            } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                // Handle product update
                $productId = $_GET['id'] ?? '';
                $name = $_POST['name'] ?? '';
                $description = $_POST['description'] ?? '';
                $price = $_POST['price'] ?? '0';
                $stock_quantity = $_POST['stock_quantity'] ?? '0';
                $category = $_POST['category'] ?? '';
                $brand = $_POST['brand'] ?? '';
                $model = $_POST['model'] ?? '';
                $is_active = $_POST['is_active'] ?? '1';
                
                if (empty($productId)) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Product ID is required']);
                    exit();
                }
                
                // Update product
                $stmt = $pdo->prepare("
                    UPDATE products 
                    SET name = ?, description = ?, price = ?, stock_quantity = ?, category = ?, brand = ?, model = ?, is_active = ?, updated_at = NOW() 
                    WHERE id = ?
                ");
                
                $stmt->execute([
                    $name,
                    $description,
                    $price,
                    $stock_quantity,
                    $category,
                    $brand,
                    $model,
                    $is_active,
                    $productId
                ]);
                
                $response = [
                    'data' => ['id' => $productId],
                    'message' => 'Product updated successfully'
                ];
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                // Handle product deletion (permanent delete)
                $productId = $_GET['id'] ?? '';
                
                if (empty($productId)) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Product ID is required']);
                    exit();
                }
                
                // Permanent delete - remove from database completely
                $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
                $stmt->execute([$productId]);
                
                $response = [
                    'data' => ['id' => $productId],
                    'message' => 'Product deleted permanently'
                ];
            } else {
                $response = [
                    'data' => [],
                    'message' => 'Method not allowed'
                ];
            }
            break;
            
        case 'notifications':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $perPage = (int)($_GET['per_page'] ?? 20);
                $status = $_GET['status'] ?? '';
                
                $sql = "SELECT id, user_id, role, title, message, status, type, read_at, created_at, updated_at FROM notifications WHERE 1=1";
                $params = [];
                
                if (!empty($status)) {
                    $sql .= " AND status = ?";
                    $params[] = $status;
                }
                
                $sql .= " ORDER BY created_at DESC LIMIT $perPage";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $notifications = $stmt->fetchAll();
                
                // Get unread count
                $stmt = $pdo->query("SELECT COUNT(*) as unread_count FROM notifications WHERE status = 'unread'");
                $unreadCount = $stmt->fetch()['unread_count'];
                
                $response = [
                    'notifications' => $notifications,
                    'pagination' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => $perPage,
                        'total' => count($notifications)
                    ],
                    'unread_count' => (int)$unreadCount
                ];
            } else {
                $response = [
                    'notifications' => [],
                    'pagination' => [
                        'current_page' => 1,
                        'last_page' => 1,
                        'per_page' => 20,
                        'total' => 0
                    ],
                    'unread_count' => 0
                ];
            }
            break;
            
        case 'notifications/unread-count':
            $stmt = $pdo->query("SELECT COUNT(*) as unread_count FROM notifications WHERE status = 'unread'");
            $unreadCount = $stmt->fetch()['unread_count'];
            
            $response = [
                'unread_count' => (int)$unreadCount
            ];
            break;
            
        case 'branch-stock':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Get all branch stock records
                $stmt = $pdo->query("
                    SELECT bs.*, b.name as branch_name, p.name as product_name
                    FROM branch_stock bs
                    LEFT JOIN branches b ON bs.branch_id = b.id
                    LEFT JOIN products p ON bs.product_id = p.id
                    ORDER BY bs.product_id, bs.branch_id
                ");
                $stockRecords = $stmt->fetchAll();
                
                $response = [
                    'stock' => $stockRecords
                ];
            } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                // Update branch stock
                $input = json_decode(file_get_contents('php://input'), true);
                $productId = $input['product_id'] ?? '';
                $branchId = $input['branch_id'] ?? '';
                $stockQuantity = $input['stock_quantity'] ?? 0;
                
                if (empty($productId) || empty($branchId)) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Product ID and Branch ID are required']);
                    exit();
                }
                
                // Update or insert branch stock
                $stmt = $pdo->prepare("
                    INSERT INTO branch_stock (product_id, branch_id, stock_quantity, created_at, updated_at) 
                    VALUES (?, ?, ?, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE 
                    stock_quantity = VALUES(stock_quantity), 
                    updated_at = NOW()
                ");
                $stmt->execute([$productId, $branchId, $stockQuantity]);
                
                $response = [
                    'message' => 'Branch stock updated successfully'
                ];
            } else {
                $response = [
                    'message' => 'Method not allowed'
                ];
            }
            break;
            
        case 'health':
            $response = [
                'status' => 'healthy',
                'service' => 'Everbright Optical System',
                'mode' => 'mysql-only',
                'timestamp' => date('c')
            ];
            break;
            
        case 'storage':
            // Handle image serving
            $path = $_SERVER['REQUEST_URI'];
            $path = str_replace('/api-mysql.php/storage/', '', $path);
            $path = str_replace('/storage/', '', $path);
            
            // Security: prevent directory traversal
            $path = str_replace('../', '', $path);
            $path = str_replace('..\\', '', $path);
            
            $fullPath = __DIR__ . '/../storage/app/public/' . $path;
            
            if (file_exists($fullPath) && is_file($fullPath)) {
                $mimeType = mime_content_type($fullPath);
                if (strpos($mimeType, 'image/') === 0) {
                    header('Content-Type: ' . $mimeType);
                    header('Content-Length: ' . filesize($fullPath));
                    header('Cache-Control: public, max-age=31536000'); // Cache for 1 year
                    readfile($fullPath);
                    exit();
                }
            }
            
            http_response_code(404);
            echo json_encode(['message' => 'Image not found']);
            exit();
            
        default:
            $response = [
                'data' => [],
                'message' => 'Endpoint not found: ' . $path
            ];
            break;
    }
    
    http_response_code(200);
    echo json_encode($response);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database error: ' . $e->getMessage()]);
}
?>
