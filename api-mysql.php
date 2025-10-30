<?php
// Lightweight PHP API shim compatible with your React frontend's base URL
// Intended as a temporary bridge until the full Laravel backend is running.

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// --- Configuration ---
$dbHost = getenv('DB_HOST') ?: '127.0.0.1';
$dbName = getenv('DB_DATABASE') ?: 'everbright_optical';
$dbUser = getenv('DB_USERNAME') ?: 'root';
$dbPass = getenv('DB_PASSWORD') ?: '';

$tokenStoreFile = __DIR__ . DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'api_tokens.json';
if (!file_exists(dirname($tokenStoreFile))) {
    @mkdir(dirname($tokenStoreFile), 0777, true);
}

function readJsonBody(): array {
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function getBearerToken(): ?string {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (stripos($auth, 'Bearer ') === 0) {
        return substr($auth, 7);
    }
    return null;
}

function tokenStoreLoad(string $file): array {
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function tokenStoreSave(string $file, array $data): void {
    file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
}

function jsonResponse($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

try {
    $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Throwable $e) {
    jsonResponse(['error' => 'Database connection failed', 'details' => $e->getMessage()], 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
// Normalize to subpath after /api-mysql.php
$script = basename(__FILE__);
$idx = strpos($path, '/' . $script);
$subPath = $idx !== false ? substr($path, $idx + strlen('/' . $script)) : $path;
$subPath = '/' . ltrim($subPath, '/');

// Routes
if ($method === 'POST' && $subPath === '/login') {
    $body = readJsonBody();
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';
    $role = $body['role'] ?? null; // optional

    if ($email === '' || $password === '') {
        jsonResponse(['message' => 'Email and password are required'], 422);
    }

    $stmt = $pdo->prepare('SELECT id, name, email, password, role, email_verified_at, created_at, updated_at FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch();
    if (!$user) {
        jsonResponse(['message' => 'Invalid credentials'], 401);
    }

    // Verify bcrypt hash (Laravel uses $2y$)
    if (!password_verify($password, $user['password'])) {
        jsonResponse(['message' => 'Invalid credentials'], 401);
    }

    if ($role && strcasecmp((string)$user['role'], (string)$role) !== 0) {
        jsonResponse(['message' => 'Role mismatch'], 403);
    }

    // Generate opaque token and store
    $token = bin2hex(random_bytes(32));
    $tokens = tokenStoreLoad($tokenStoreFile);
    $tokens[$token] = [
        'user_id' => (int)$user['id'],
        'issued_at' => time(),
        'expires_at' => time() + 60 * 60 * 24 * 7, // 7 days
    ];
    tokenStoreSave($tokenStoreFile, $tokens);

    unset($user['password']);
    jsonResponse(['user' => $user, 'token' => $token]);
}

if ($method === 'POST' && $subPath === '/logout') {
    $token = getBearerToken();
    if ($token) {
        $tokens = tokenStoreLoad($tokenStoreFile);
        if (isset($tokens[$token])) {
            unset($tokens[$token]);
            tokenStoreSave($tokenStoreFile, $tokens);
        }
    }
    jsonResponse(['success' => true]);
}

if ($method === 'GET' && $subPath === '/profile') {
    $token = getBearerToken();
    if (!$token) jsonResponse(['message' => 'Unauthorized'], 401);
    $tokens = tokenStoreLoad($tokenStoreFile);
    $entry = $tokens[$token] ?? null;
    if (!$entry || ($entry['expires_at'] ?? 0) < time()) {
        jsonResponse(['message' => 'Unauthorized'], 401);
    }
    $stmt = $pdo->prepare('SELECT id, name, email, role, email_verified_at, created_at, updated_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $entry['user_id']]);
    $user = $stmt->fetch();
    if (!$user) jsonResponse(['message' => 'Unauthorized'], 401);
    jsonResponse($user);
}

if ($method === 'GET' && $subPath === '/branches') {
    $stmt = $pdo->query('SELECT id, name, code, address, phone, email, is_active, created_at, updated_at FROM branches ORDER BY name');
    $rows = $stmt->fetchAll();
    jsonResponse(['data' => $rows]);
}

if ($method === 'GET' && $subPath === '/branches/active') {
    $stmt = $pdo->query('SELECT id, name, code, address, phone, email, is_active, created_at, updated_at FROM branches WHERE is_active = 1 ORDER BY name');
    $rows = $stmt->fetchAll();
    jsonResponse(['data' => $rows]);
}

// -------- Products --------
if ($method === 'GET' && $subPath === '/product-categories') {
    try {
        $stmt = $pdo->query('SELECT id, name FROM product_categories ORDER BY name');
        $rows = $stmt->fetchAll();
        jsonResponse(['data' => $rows]);
    } catch (Throwable $e) {
        jsonResponse(['data' => []]);
    }
}

if ($method === 'GET' && $subPath === '/products') {
    $id = $_GET['id'] ?? null;
    $search = trim($_GET['search'] ?? '');
    $category = $_GET['category'] ?? null;
    $active = $_GET['active'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare('SELECT * FROM products WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        jsonResponse($row ?: []);
    }

    $sql = 'SELECT * FROM products WHERE 1=1';
    $params = [];
    if ($search !== '') {
        $sql .= ' AND (name LIKE :q OR description LIKE :q OR brand LIKE :q OR model LIKE :q OR sku LIKE :q)';
        $params[':q'] = '%' . $search . '%';
    }
    if ($category !== null && $category !== '') {
        $sql .= ' AND category_id = :category';
        $params[':category'] = $category;
    }
    if ($active !== null && $active !== '') {
        $sql .= ' AND is_active = :active';
        $params[':active'] = (int)!!$active;
    }
    $sql .= ' ORDER BY created_at DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    jsonResponse(['data' => $rows]);
}

if ($method === 'POST' && $subPath === '/products') {
    // Accept multipart/form-data
    $fields = [
        'name' => $_POST['name'] ?? null,
        'description' => $_POST['description'] ?? null,
        'price' => $_POST['price'] ?? null,
        'stock_quantity' => $_POST['stock_quantity'] ?? null,
        'category_id' => $_POST['category_id'] ?? null,
        'brand' => $_POST['brand'] ?? null,
        'model' => $_POST['model'] ?? null,
        'sku' => $_POST['sku'] ?? null,
        'branch_id' => $_POST['branch_id'] ?? null,
        'is_active' => isset($_POST['is_active']) ? (int)!!$_POST['is_active'] : 1,
    ];

    // Optional single primary image handling
    $imagePath = null;
    if (!empty($_FILES)) {
        $uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
        if (!file_exists($uploadDir)) @mkdir($uploadDir, 0777, true);
        foreach ($_FILES as $file) {
            if (is_array($file) && ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_OK) {
                $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                $fname = uniqid('', true) . ($ext ? ('.' . $ext) : '');
                $dest = $uploadDir . DIRECTORY_SEPARATOR . $fname;
                if (@move_uploaded_file($file['tmp_name'], $dest)) {
                    $imagePath = 'uploads/' . $fname;
                    break;
                }
            }
        }
    }

    $columns = ['name','description','price','stock_quantity','category_id','brand','model','sku','branch_id','is_active'];
    $placeholders = array_map(fn($c) => ':' . $c, $columns);
    $sql = 'INSERT INTO products (' . implode(',', $columns) . ( $imagePath ? ', image' : '' ) . ') VALUES (' . implode(',', $placeholders) . ( $imagePath ? ', :image' : '' ) . ')';
    $stmt = $pdo->prepare($sql);
    $params = [];
    foreach ($columns as $c) { $params[':' . $c] = $fields[$c]; }
    if ($imagePath) { $params[':image'] = $imagePath; }
    $stmt->execute($params);
    $id = (int)$pdo->lastInsertId();
    $row = $pdo->query('SELECT * FROM products WHERE id = ' . (int)$id)->fetch();
    jsonResponse($row, 201);
}

if ($method === 'PUT' && $subPath === '/products') {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $qs);
    $id = $qs['id'] ?? null;
    if (!$id) jsonResponse(['message' => 'Missing id'], 422);
    $input = readJsonBody();

    $allowed = ['name','description','price','stock_quantity','category_id','brand','model','sku','branch_id','is_active'];
    $sets = [];
    $params = [':id' => $id];
    foreach ($allowed as $col) {
        if (array_key_exists($col, $input)) {
            $sets[] = "$col = :$col";
            $params[":$col"] = $input[$col];
        }
    }
    if (!$sets) jsonResponse(['message' => 'No fields to update'], 422);
    $sql = 'UPDATE products SET ' . implode(', ', $sets) . ' WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $pdo->query('SELECT * FROM products WHERE id = ' . (int)$id)->fetch();
    jsonResponse($row);
}

if ($method === 'DELETE' && $subPath === '/products') {
    parse_str($_SERVER['QUERY_STRING'] ?? '', $qs);
    $id = $qs['id'] ?? null;
    if (!$id) jsonResponse(['message' => 'Missing id'], 422);
    try {
        // Try soft delete
        $pdo->prepare('UPDATE products SET is_active = 0 WHERE id = :id')->execute([':id' => $id]);
    } catch (Throwable $e) {
        // Fall back to hard delete
        $pdo->prepare('DELETE FROM products WHERE id = :id')->execute([':id' => $id]);
    }
    jsonResponse(['success' => true]);
}

// -------- Analytics (fallback minimal) --------
if ($method === 'GET' && $subPath === '/admin/analytics') {
    jsonResponse([
        'period' => ['days' => (int)($_GET['period'] ?? 30), 'start_date' => '', 'end_date' => ''],
        'branch_performance' => [],
        'optometrist_workload' => [],
        'staff_activity' => [],
        'system_wide_stats' => [
            'appointments' => 0,
            'reservations' => 0,
            'revenue' => 0,
            'products' => 0,
            'branches' => 0,
            'users' => 0,
        ],
        'common_diagnoses' => [
            'by_type' => new stdClass(),
            'by_lens_type' => new stdClass(),
            'by_coating' => new stdClass(),
        ],
    ]);
}

if ($method === 'GET' && $subPath === '/analytics/realtime') {
    jsonResponse([
        'total_appointments_today' => 0,
        'total_revenue_today' => 0,
        'active_users' => 0,
        'low_stock_alerts' => 0,
        'upcoming_appointments' => 0,
        'system_health' => [
            'database_status' => 'ok',
            'api_response_time' => 50,
            'last_backup' => date('Y-m-d H:i:s'),
        ],
    ]);
}

if ($method === 'GET' && $subPath === '/analytics/trends') {
    jsonResponse([
        'revenue_trend' => [],
        'appointment_trend' => [],
        'inventory_trend' => [],
        'appointment_types' => [],
    ]);
}

// -------- Appointments availability (minimal) --------
if ($method === 'GET' && $subPath === '/appointments/availability') {
    $date = $_GET['date'] ?? date('Y-m-d');
    jsonResponse([
        'date' => $date,
        'branch' => 'UNITOP',
        'optometrist' => 'Dr. Samuel',
        'available_times' => ['09:00', '10:00', '14:00', '15:00'],
    ]);
}

if ($method === 'GET' && $subPath === '/appointments/weekly-schedule') {
    jsonResponse([
        'schedule' => [
            ['day' => 'Monday', 'times' => ['09:00', '10:00', '14:00']],
            ['day' => 'Tuesday', 'times' => ['09:00', '11:00', '15:00']],
        ],
    ]);
}

// Not found
jsonResponse(['message' => 'Not Found', 'path' => $subPath], 404);
?>


