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
            
        case 'register':
            // Handle user registration
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['name'], $input['email'], $input['password'], $input['password_confirmation'], $input['role'])) {
                http_response_code(400);
                echo json_encode(['message' => 'Name, email, password, password_confirmation, and role are required']);
                exit();
            }
            
            $name = trim($input['name']);
            $email = trim(strtolower($input['email']));
            $password = $input['password'];
            $passwordConfirmation = $input['password_confirmation'];
            $role = $input['role'];
            $branchId = $input['branch_id'] ?? null;
            
            // Validate password confirmation
            if ($password !== $passwordConfirmation) {
                http_response_code(400);
                echo json_encode(['message' => 'Password confirmation does not match']);
                exit();
            }
            
            // Validate password length
            if (strlen($password) < 8) {
                http_response_code(400);
                echo json_encode(['message' => 'Password must be at least 8 characters long']);
                exit();
            }
            
            // Check if user already exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['message' => 'User with this email already exists']);
                exit();
            }
            
            // Hash password
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            
            // Insert new user
            $stmt = $pdo->prepare("
                INSERT INTO users (name, email, password, role, branch_id, email_verified_at, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())
            ");
            
            try {
                $stmt->execute([$name, $email, $hashedPassword, $role, $branchId]);
                $userId = $pdo->lastInsertId();
                
                // Get branch info if branch_id is provided
                $branch = null;
                if ($branchId) {
                    $stmt = $pdo->prepare("SELECT * FROM branches WHERE id = ?");
                    $stmt->execute([$branchId]);
                    $branch = $stmt->fetch();
                }
                
                // For customer role, immediately log them in and return token
                if ($role === 'customer') {
                    $response = [
                        'message' => 'Registration successful',
                        'token' => 'mysql_token_' . time(),
                        'token_expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours')),
                        'token_expires_in_minutes' => 1440,
                        'user' => [
                            'id' => $userId,
                            'name' => $name,
                            'email' => $email,
                            'role' => $role,
                            'phone' => null,
                            'address' => null,
                            'branch' => $branch ? [
                                'id' => $branch['id'],
                                'name' => $branch['name'],
                                'address' => $branch['address']
                            ] : null,
                            'email_verified_at' => date('Y-m-d H:i:s'),
                            'created_at' => date('Y-m-d H:i:s'),
                            'updated_at' => date('Y-m-d H:i:s')
                        ]
                    ];
                } else {
                    // For other roles, don't return token (admin approval needed)
                    $response = [
                        'message' => 'Registration submitted successfully. Your account is pending admin approval.',
                        'user' => [
                            'id' => $userId,
                            'name' => $name,
                            'email' => $email,
                            'role' => $role,
                            'phone' => null,
                            'address' => null,
                            'branch' => $branch ? [
                                'id' => $branch['id'],
                                'name' => $branch['name'],
                                'address' => $branch['address']
                            ] : null,
                            'email_verified_at' => null,
                            'created_at' => date('Y-m-d H:i:s'),
                            'updated_at' => date('Y-m-d H:i:s')
                        ]
                    ];
                }
                
                http_response_code(201);
                echo json_encode($response);
                exit();
                
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['message' => 'Registration failed. Please try again.']);
                exit();
            }
            break;
            
        case 'appointments':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Check if requesting specific sub-route
                $pathParts = explode('/', trim($fullPath, '/'));
                
                if (count($pathParts) > 1 && $pathParts[1] === 'availability') {
                    // Handle availability check
                    $date = $_GET['date'] ?? date('Y-m-d');
                    $optometristId = $_GET['optometrist_id'] ?? null;
                    $branchId = $_GET['branch_id'] ?? null;
                    
                    // Get available time slots for the date
                    $availableSlots = [];
                    $timeSlots = [
                        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
                        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
                    ];
                    
                    // Get existing appointments for the date
                    $sql = "SELECT appointment_time FROM appointments WHERE appointment_date = ?";
                    $params = [$date];
                    
                    if ($optometristId) {
                        $sql .= " AND optometrist_id = ?";
                        $params[] = $optometristId;
                    }
                    
                    if ($branchId) {
                        $sql .= " AND branch_id = ?";
                        $params[] = $branchId;
                    }
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    $bookedTimes = array_column($stmt->fetchAll(), 'appointment_time');
                    
                    // Filter available slots
                    foreach ($timeSlots as $slot) {
                        if (!in_array($slot, $bookedTimes)) {
                            $availableSlots[] = [
                                'value' => $slot,
                                'display' => date('g:i A', strtotime($slot))
                            ];
                        }
                    }
                    
                    $response = [
                        'date' => $date,
                        'available_slots' => $availableSlots,
                        'total_available' => count($availableSlots)
                    ];
                    
                } else {
                    // Get appointments
                    $userId = null;
                    $role = null;
                    
                    // Get user info from token (simplified - in real app, validate token properly)
                    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
                    if (empty($authHeader) && function_exists('getallheaders')) {
                        $headers = getallheaders();
                        $authHeader = $headers['Authorization'] ?? '';
                    }
                    
                    if (preg_match('/Bearer mysql_token_(\d+)/', $authHeader, $matches)) {
                        // For now, we'll use a simple approach - get user from session or default
                        // In a real app, you'd validate the token and get user info
                        $userId = 1001; // Default to genesis user for now
                        $role = 'customer';
                    }
                    
                    // Get appointments for the user
                    if ($userId) {
                        $stmt = $pdo->prepare("
                            SELECT a.*, u.name as patient_name, u.email as patient_email,
                                   o.name as optometrist_name, b.name as branch_name
                            FROM appointments a
                            LEFT JOIN users u ON a.patient_id = u.id
                            LEFT JOIN users o ON a.optometrist_id = o.id
                            LEFT JOIN branches b ON a.branch_id = b.id
                            WHERE a.patient_id = ? OR a.optometrist_id = ?
                            ORDER BY a.appointment_date DESC, a.appointment_time DESC
                        ");
                        $stmt->execute([$userId, $userId]);
                        $appointments = $stmt->fetchAll();
                    } else {
                        // If no auth, return empty array
                        $appointments = [];
                    }
                    
                    $response = [
                        'data' => $appointments
                    ];
                }
                
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Create new appointment
                $input = json_decode(file_get_contents('php://input'), true);
                
                $requiredFields = ['patient_id', 'optometrist_id', 'appointment_date', 'appointment_time', 'branch_id'];
                foreach ($requiredFields as $field) {
                    if (!isset($input[$field])) {
                        http_response_code(400);
                        echo json_encode(['message' => "Field '$field' is required"]);
                        exit();
                    }
                }
                
                $patientId = $input['patient_id'];
                $optometristId = $input['optometrist_id'];
                $appointmentDate = $input['appointment_date'];
                $appointmentTime = $input['appointment_time'];
                $branchId = $input['branch_id'];
                $notes = $input['notes'] ?? '';
                $status = $input['status'] ?? 'scheduled';
                
                $stmt = $pdo->prepare("
                    INSERT INTO appointments (patient_id, optometrist_id, appointment_date, appointment_time, branch_id, notes, status, created_at, updated_at) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                
                try {
                    $stmt->execute([$patientId, $optometristId, $appointmentDate, $appointmentTime, $branchId, $notes, $status]);
                    $appointmentId = $pdo->lastInsertId();
                    
                    // Get the created appointment with related data
                    $stmt = $pdo->prepare("
                        SELECT a.*, u.name as patient_name, u.email as patient_email,
                               o.name as optometrist_name, b.name as branch_name
                        FROM appointments a
                        LEFT JOIN users u ON a.patient_id = u.id
                        LEFT JOIN users o ON a.optometrist_id = o.id
                        LEFT JOIN branches b ON a.branch_id = b.id
                        WHERE a.id = ?
                    ");
                    $stmt->execute([$appointmentId]);
                    $appointment = $stmt->fetch();
                    
                    $response = [
                        'data' => $appointment,
                        'message' => 'Appointment created successfully'
                    ];
                    
                    http_response_code(201);
                    
                } catch (PDOException $e) {
                    http_response_code(500);
                    echo json_encode(['message' => 'Failed to create appointment']);
                    exit();
                }
                
            } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                // Update appointment
                $pathParts = explode('/', trim($fullPath, '/'));
                if (count($pathParts) > 1 && is_numeric($pathParts[1])) {
                    $appointmentId = $pathParts[1];
                    $input = json_decode(file_get_contents('php://input'), true);
                    
                    $updateFields = [];
                    $updateValues = [];
                    
                    $allowedFields = ['appointment_date', 'appointment_time', 'notes', 'status'];
                    foreach ($allowedFields as $field) {
                        if (isset($input[$field])) {
                            $updateFields[] = "$field = ?";
                            $updateValues[] = $input[$field];
                        }
                    }
                    
                    if (empty($updateFields)) {
                        http_response_code(400);
                        echo json_encode(['message' => 'No valid fields to update']);
                        exit();
                    }
                    
                    $updateValues[] = $appointmentId;
                    $sql = "UPDATE appointments SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
                    
                    try {
                        $stmt = $pdo->prepare($sql);
                        $stmt->execute($updateValues);
                        
                        // Get updated appointment
                        $stmt = $pdo->prepare("
                            SELECT a.*, u.name as patient_name, u.email as patient_email,
                                   o.name as optometrist_name, b.name as branch_name
                            FROM appointments a
                            LEFT JOIN users u ON a.patient_id = u.id
                            LEFT JOIN users o ON a.optometrist_id = o.id
                            LEFT JOIN branches b ON a.branch_id = b.id
                            WHERE a.id = ?
                        ");
                        $stmt->execute([$appointmentId]);
                        $appointment = $stmt->fetch();
                        
                        if ($appointment) {
                            $response = [
                                'data' => $appointment,
                                'message' => 'Appointment updated successfully'
                            ];
                        } else {
                            http_response_code(404);
                            echo json_encode(['message' => 'Appointment not found']);
                            exit();
                        }
                        
                    } catch (PDOException $e) {
                        http_response_code(500);
                        echo json_encode(['message' => 'Failed to update appointment']);
                        exit();
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['message' => 'Invalid appointment ID']);
                    exit();
                }
                
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                // Delete appointment
                $pathParts = explode('/', trim($fullPath, '/'));
                if (count($pathParts) > 1 && is_numeric($pathParts[1])) {
                    $appointmentId = $pathParts[1];
                    
                    try {
                        $stmt = $pdo->prepare("DELETE FROM appointments WHERE id = ?");
                        $stmt->execute([$appointmentId]);
                        
                        if ($stmt->rowCount() > 0) {
                            $response = ['message' => 'Appointment deleted successfully'];
                        } else {
                            http_response_code(404);
                            echo json_encode(['message' => 'Appointment not found']);
                            exit();
                        }
                        
                    } catch (PDOException $e) {
                        http_response_code(500);
                        echo json_encode(['message' => 'Failed to delete appointment']);
                        exit();
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['message' => 'Invalid appointment ID']);
                    exit();
                }
            }
            break;
            
        case 'prescriptions':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Get prescriptions
                $userId = null;
                $role = null;
                
                // Get user info from token (simplified - in real app, validate token properly)
                $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
                if (empty($authHeader) && function_exists('getallheaders')) {
                    $headers = getallheaders();
                    $authHeader = $headers['Authorization'] ?? '';
                }
                
                if (preg_match('/Bearer mysql_token_(\d+)/', $authHeader, $matches)) {
                    // For now, we'll use a simple approach - get user from session or default
                    // In a real app, you'd validate the token and get user info
                    $userId = 1001; // Default to genesis user for now
                    $role = 'customer';
                }
                
                // Check if requesting specific prescription by ID or patient prescriptions
                $pathParts = explode('/', trim($fullPath, '/'));
                if (count($pathParts) > 1) {
                    if ($pathParts[1] === 'patient' && isset($pathParts[2]) && is_numeric($pathParts[2])) {
                        // Get prescriptions for specific patient
                        $requestedPatientId = $pathParts[2];
                        
                        // Check if user has permission to view this patient's prescriptions
                        if ($userId && ($userId == $requestedPatientId || $role === 'optometrist' || $role === 'admin')) {
                            $stmt = $pdo->prepare("
                                SELECT p.*, 
                                       u.name as patient_name, u.email as patient_email,
                                       o.name as optometrist_name, o.email as optometrist_email,
                                       b.name as branch_name, b.code as branch_code,
                                       a.appointment_date, a.appointment_time
                                FROM prescriptions p
                                LEFT JOIN users u ON p.patient_id = u.id
                                LEFT JOIN users o ON p.optometrist_id = o.id
                                LEFT JOIN branches b ON p.branch_id = b.id
                                LEFT JOIN appointments a ON p.appointment_id = a.id
                                WHERE p.patient_id = ?
                                ORDER BY p.issue_date DESC, p.created_at DESC
                            ");
                            $stmt->execute([$requestedPatientId]);
                            $prescriptions = $stmt->fetchAll();
                            
                            // Parse JSON fields for each prescription
                            foreach ($prescriptions as &$prescription) {
                                $prescription['prescription_data'] = json_decode($prescription['prescription_data'], true);
                                $prescription['right_eye'] = json_decode($prescription['right_eye'], true);
                                $prescription['left_eye'] = json_decode($prescription['left_eye'], true);
                            }
                            
                            $response = [
                                'data' => $prescriptions
                            ];
                        } else {
                            http_response_code(403);
                            echo json_encode(['message' => 'Access denied']);
                            exit();
                        }
                    } elseif (is_numeric($pathParts[1])) {
                    // Get specific prescription by ID
                    $prescriptionId = $pathParts[1];
                    $stmt = $pdo->prepare("
                        SELECT p.*, 
                               u.name as patient_name, u.email as patient_email,
                               o.name as optometrist_name, o.email as optometrist_email,
                               b.name as branch_name, b.code as branch_code,
                               a.appointment_date, a.appointment_time
                        FROM prescriptions p
                        LEFT JOIN users u ON p.patient_id = u.id
                        LEFT JOIN users o ON p.optometrist_id = o.id
                        LEFT JOIN branches b ON p.branch_id = b.id
                        LEFT JOIN appointments a ON p.appointment_id = a.id
                        WHERE p.id = ? AND (p.patient_id = ? OR p.optometrist_id = ?)
                    ");
                    $stmt->execute([$prescriptionId, $userId, $userId]);
                    $prescription = $stmt->fetch();
                    
                    if ($prescription) {
                        // Parse prescription_data JSON
                        $prescription['prescription_data'] = json_decode($prescription['prescription_data'], true);
                        $prescription['right_eye'] = json_decode($prescription['right_eye'], true);
                        $prescription['left_eye'] = json_decode($prescription['left_eye'], true);
                        
                        $response = [
                            'data' => $prescription
                        ];
                    } else {
                        http_response_code(404);
                        echo json_encode(['message' => 'Prescription not found']);
                        exit();
                    }
                    } else {
                        http_response_code(400);
                        echo json_encode(['message' => 'Invalid prescription request']);
                        exit();
                    }
                } else {
                    // Get all prescriptions for the user
                    if ($userId) {
                        $stmt = $pdo->prepare("
                        SELECT p.*, 
                               u.name as patient_name, u.email as patient_email,
                               o.name as optometrist_name, o.email as optometrist_email,
                               b.name as branch_name, b.code as branch_code,
                               a.appointment_date, a.appointment_time
                        FROM prescriptions p
                        LEFT JOIN users u ON p.patient_id = u.id
                        LEFT JOIN users o ON p.optometrist_id = o.id
                        LEFT JOIN branches b ON p.branch_id = b.id
                        LEFT JOIN appointments a ON p.appointment_id = a.id
                        WHERE p.patient_id = ? OR p.optometrist_id = ?
                        ORDER BY p.issue_date DESC, p.created_at DESC
                        ");
                        $stmt->execute([$userId, $userId]);
                        $prescriptions = $stmt->fetchAll();
                        
                        // Parse JSON fields for each prescription
                        foreach ($prescriptions as &$prescription) {
                            $prescription['prescription_data'] = json_decode($prescription['prescription_data'], true);
                            $prescription['right_eye'] = json_decode($prescription['right_eye'], true);
                            $prescription['left_eye'] = json_decode($prescription['left_eye'], true);
                        }
                    } else {
                        // If no auth, return empty array
                        $prescriptions = [];
                    }
                    
                    $response = [
                        'data' => $prescriptions
                    ];
                }
                
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Create new prescription
                $input = json_decode(file_get_contents('php://input'), true);
                
                $requiredFields = ['patient_id', 'optometrist_id', 'type', 'prescription_data', 'issue_date', 'expiry_date'];
                foreach ($requiredFields as $field) {
                    if (!isset($input[$field])) {
                        http_response_code(400);
                        echo json_encode(['message' => "Field '$field' is required"]);
                        exit();
                    }
                }
                
                $patientId = $input['patient_id'];
                $optometristId = $input['optometrist_id'];
                $appointmentId = $input['appointment_id'] ?? null;
                $branchId = $input['branch_id'] ?? null;
                $type = $input['type'];
                $prescriptionData = json_encode($input['prescription_data']);
                $rightEye = json_encode($input['right_eye'] ?? []);
                $leftEye = json_encode($input['left_eye'] ?? []);
                $visionAcuity = $input['vision_acuity'] ?? '';
                $additionalNotes = $input['additional_notes'] ?? '';
                $recommendations = $input['recommendations'] ?? '';
                $lensType = $input['lens_type'] ?? '';
                $coating = $input['coating'] ?? '';
                $followUpDate = $input['follow_up_date'] ?? null;
                $followUpNotes = $input['follow_up_notes'] ?? '';
                $issueDate = $input['issue_date'];
                $expiryDate = $input['expiry_date'];
                $notes = $input['notes'] ?? '';
                $status = $input['status'] ?? 'active';
                
                // Generate prescription number
                $prescriptionNumber = 'RX' . date('Ymd') . sprintf('%04d', rand(1, 9999));
                
                $stmt = $pdo->prepare("
                    INSERT INTO prescriptions (
                        patient_id, optometrist_id, appointment_id, branch_id, type, prescription_data,
                        prescription_number, right_eye, left_eye, vision_acuity, additional_notes,
                        recommendations, lens_type, coating, follow_up_date, follow_up_notes,
                        issue_date, expiry_date, notes, status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                ");
                
                try {
                    $stmt->execute([
                        $patientId, $optometristId, $appointmentId, $branchId, $type, $prescriptionData,
                        $prescriptionNumber, $rightEye, $leftEye, $visionAcuity, $additionalNotes,
                        $recommendations, $lensType, $coating, $followUpDate, $followUpNotes,
                        $issueDate, $expiryDate, $notes, $status
                    ]);
                    $prescriptionId = $pdo->lastInsertId();
                    
                    // Get the created prescription with related data
                    $stmt = $pdo->prepare("
                        SELECT p.*, 
                               u.name as patient_name, u.email as patient_email,
                               o.name as optometrist_name, o.email as optometrist_email,
                               b.name as branch_name, b.code as branch_code,
                               a.appointment_date, a.appointment_time
                        FROM prescriptions p
                        LEFT JOIN users u ON p.patient_id = u.id
                        LEFT JOIN users o ON p.optometrist_id = o.id
                        LEFT JOIN branches b ON p.branch_id = b.id
                        LEFT JOIN appointments a ON p.appointment_id = a.id
                        WHERE p.id = ?
                    ");
                    $stmt->execute([$prescriptionId]);
                    $prescription = $stmt->fetch();
                    
                    // Parse JSON fields
                    $prescription['prescription_data'] = json_decode($prescription['prescription_data'], true);
                    $prescription['right_eye'] = json_decode($prescription['right_eye'], true);
                    $prescription['left_eye'] = json_decode($prescription['left_eye'], true);
                    
                    $response = [
                        'data' => $prescription,
                        'message' => 'Prescription created successfully'
                    ];
                    
                    http_response_code(201);
                    
                } catch (PDOException $e) {
                    http_response_code(500);
                    echo json_encode(['message' => 'Failed to create prescription']);
                    exit();
                }
                
            } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                // Update prescription
                $pathParts = explode('/', trim($fullPath, '/'));
                if (count($pathParts) > 1 && is_numeric($pathParts[1])) {
                    $prescriptionId = $pathParts[1];
                    $input = json_decode(file_get_contents('php://input'), true);
                    
                    $updateFields = [];
                    $updateValues = [];
                    
                    $allowedFields = ['type', 'prescription_data', 'right_eye', 'left_eye', 'vision_acuity', 
                                    'additional_notes', 'recommendations', 'lens_type', 'coating', 
                                    'follow_up_date', 'follow_up_notes', 'issue_date', 'expiry_date', 'notes', 'status'];
                    
                    foreach ($allowedFields as $field) {
                        if (isset($input[$field])) {
                            if (in_array($field, ['prescription_data', 'right_eye', 'left_eye'])) {
                                $updateFields[] = "$field = ?";
                                $updateValues[] = json_encode($input[$field]);
                            } else {
                                $updateFields[] = "$field = ?";
                                $updateValues[] = $input[$field];
                            }
                        }
                    }
                    
                    if (empty($updateFields)) {
                        http_response_code(400);
                        echo json_encode(['message' => 'No valid fields to update']);
                        exit();
                    }
                    
                    $updateValues[] = $prescriptionId;
                    $sql = "UPDATE prescriptions SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
                    
                    try {
                        $stmt = $pdo->prepare($sql);
                        $stmt->execute($updateValues);
                        
                        // Get updated prescription
                        $stmt = $pdo->prepare("
                            SELECT p.*, 
                                   u.name as patient_name, u.email as patient_email,
                                   o.name as optometrist_name, o.email as optometrist_email,
                                   b.name as branch_name, b.code as branch_code,
                                   a.appointment_date, a.appointment_time
                            FROM prescriptions p
                            LEFT JOIN users u ON p.patient_id = u.id
                            LEFT JOIN users o ON p.optometrist_id = o.id
                            LEFT JOIN branches b ON p.branch_id = b.id
                            LEFT JOIN appointments a ON p.appointment_id = a.id
                            WHERE p.id = ?
                        ");
                        $stmt->execute([$prescriptionId]);
                        $prescription = $stmt->fetch();
                        
                        if ($prescription) {
                            // Parse JSON fields
                            $prescription['prescription_data'] = json_decode($prescription['prescription_data'], true);
                            $prescription['right_eye'] = json_decode($prescription['right_eye'], true);
                            $prescription['left_eye'] = json_decode($prescription['left_eye'], true);
                            
                            $response = [
                                'data' => $prescription,
                                'message' => 'Prescription updated successfully'
                            ];
                        } else {
                            http_response_code(404);
                            echo json_encode(['message' => 'Prescription not found']);
                            exit();
                        }
                        
                    } catch (PDOException $e) {
                        http_response_code(500);
                        echo json_encode(['message' => 'Failed to update prescription']);
                        exit();
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['message' => 'Invalid prescription ID']);
                    exit();
                }
                
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                // Delete prescription
                $pathParts = explode('/', trim($fullPath, '/'));
                if (count($pathParts) > 1 && is_numeric($pathParts[1])) {
                    $prescriptionId = $pathParts[1];
                    
                    try {
                        $stmt = $pdo->prepare("DELETE FROM prescriptions WHERE id = ?");
                        $stmt->execute([$prescriptionId]);
                        
                        if ($stmt->rowCount() > 0) {
                            $response = ['message' => 'Prescription deleted successfully'];
                        } else {
                            http_response_code(404);
                            echo json_encode(['message' => 'Prescription not found']);
                            exit();
                        }
                        
                    } catch (PDOException $e) {
                        http_response_code(500);
                        echo json_encode(['message' => 'Failed to delete prescription']);
                        exit();
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['message' => 'Invalid prescription ID']);
                    exit();
                }
            }
            break;
            
        case 'product-categories':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Get product categories
                $stmt = $pdo->query("
                    SELECT pc.*, 
                           COUNT(p.id) as product_count
                    FROM product_categories pc
                    LEFT JOIN products p ON pc.name = p.category
                    GROUP BY pc.id
                    ORDER BY pc.name ASC
                ");
                $categories = $stmt->fetchAll();
                
                $response = [
                    'data' => $categories
                ];
                
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                // Create new product category
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!isset($input['name'])) {
                    http_response_code(400);
                    echo json_encode(['message' => 'Name is required']);
                    exit();
                }
                
                $name = trim($input['name']);
                $description = $input['description'] ?? '';
                
                $stmt = $pdo->prepare("
                    INSERT INTO product_categories (name, description, created_at, updated_at) 
                    VALUES (?, ?, NOW(), NOW())
                ");
                
                try {
                    $stmt->execute([$name, $description]);
                    $categoryId = $pdo->lastInsertId();
                    
                    // Get the created category
                    $stmt = $pdo->prepare("SELECT * FROM product_categories WHERE id = ?");
                    $stmt->execute([$categoryId]);
                    $category = $stmt->fetch();
                    
                    $response = [
                        'data' => $category,
                        'message' => 'Product category created successfully'
                    ];
                    
                    http_response_code(201);
                    
                } catch (PDOException $e) {
                    http_response_code(500);
                    echo json_encode(['message' => 'Failed to create product category']);
                    exit();
                }
                
            } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                // Update product category
                $pathParts = explode('/', trim($fullPath, '/'));
                if (count($pathParts) > 1 && is_numeric($pathParts[1])) {
                    $categoryId = $pathParts[1];
                    $input = json_decode(file_get_contents('php://input'), true);
                    
                    $updateFields = [];
                    $updateValues = [];
                    
                    $allowedFields = ['name', 'description'];
                    foreach ($allowedFields as $field) {
                        if (isset($input[$field])) {
                            $updateFields[] = "$field = ?";
                            $updateValues[] = $input[$field];
                        }
                    }
                    
                    if (empty($updateFields)) {
                        http_response_code(400);
                        echo json_encode(['message' => 'No valid fields to update']);
                        exit();
                    }
                    
                    $updateValues[] = $categoryId;
                    $sql = "UPDATE product_categories SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
                    
                    try {
                        $stmt = $pdo->prepare($sql);
                        $stmt->execute($updateValues);
                        
                        // Get updated category
                        $stmt = $pdo->prepare("SELECT * FROM product_categories WHERE id = ?");
                        $stmt->execute([$categoryId]);
                        $category = $stmt->fetch();
                        
                        if ($category) {
                            $response = [
                                'data' => $category,
                                'message' => 'Product category updated successfully'
                            ];
                        } else {
                            http_response_code(404);
                            echo json_encode(['message' => 'Product category not found']);
                            exit();
                        }
                        
                    } catch (PDOException $e) {
                        http_response_code(500);
                        echo json_encode(['message' => 'Failed to update product category']);
                        exit();
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['message' => 'Invalid category ID']);
                    exit();
                }
                
            } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                // Delete product category
                $pathParts = explode('/', trim($fullPath, '/'));
                if (count($pathParts) > 1 && is_numeric($pathParts[1])) {
                    $categoryId = $pathParts[1];
                    
                    try {
                        $stmt = $pdo->prepare("DELETE FROM product_categories WHERE id = ?");
                        $stmt->execute([$categoryId]);
                        
                        if ($stmt->rowCount() > 0) {
                            $response = ['message' => 'Product category deleted successfully'];
                        } else {
                            http_response_code(404);
                            echo json_encode(['message' => 'Product category not found']);
                            exit();
                        }
                        
                    } catch (PDOException $e) {
                        http_response_code(500);
                        echo json_encode(['message' => 'Failed to delete product category']);
                        exit();
                    }
                } else {
                    http_response_code(400);
                    echo json_encode(['message' => 'Invalid category ID']);
                    exit();
                }
            }
            break;
            
        case 'schedules':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Get doctor schedules
                $stmt = $pdo->query("
                    SELECT 
                        u.id as doctor_id,
                        u.name as doctor_name,
                        u.email as doctor_email,
                        u.role,
                        b.id as branch_id,
                        b.name as branch_name,
                        b.code as branch_code,
                        b.address as branch_address,
                        b.phone as branch_phone,
                        b.email as branch_email,
                        b.is_active as branch_active
                    FROM users u
                    LEFT JOIN branches b ON u.branch_id = b.id
                    WHERE u.role IN ('optometrist', 'doctor') AND u.branch_id IS NOT NULL
                    ORDER BY u.name, b.name
                ");
                $schedules = $stmt->fetchAll();
                
                // Group by doctor
                $groupedSchedules = [];
                foreach ($schedules as $schedule) {
                    $doctorId = $schedule['doctor_id'];
                    if (!isset($groupedSchedules[$doctorId])) {
                        $groupedSchedules[$doctorId] = [
                            'doctor' => [
                                'id' => $schedule['doctor_id'],
                                'name' => $schedule['doctor_name'],
                                'email' => $schedule['doctor_email'],
                                'role' => $schedule['role']
                            ],
                            'branches' => []
                        ];
                    }
                    
                    if ($schedule['branch_id']) {
                        $groupedSchedules[$doctorId]['branches'][] = [
                            'id' => $schedule['branch_id'],
                            'name' => $schedule['branch_name'],
                            'code' => $schedule['branch_code'],
                            'address' => $schedule['branch_address'],
                            'phone' => $schedule['branch_phone'],
                            'email' => $schedule['branch_email'],
                            'is_active' => (bool)$schedule['branch_active']
                        ];
                    }
                }
                
                $response = [
                    'data' => array_values($groupedSchedules)
                ];
            }
            break;

        case 'admin':
            // Handle admin endpoints
            $pathParts = explode('/', trim($fullPath, '/'));
            if (count($pathParts) > 1 && $pathParts[1] === 'users') {
                if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                    // Get all users (admin only)
                    $stmt = $pdo->query("
                        SELECT u.*, b.name as branch_name, b.address as branch_address
                        FROM users u
                        LEFT JOIN branches b ON u.branch_id = b.id
                        ORDER BY u.created_at DESC
                    ");
                    $users = $stmt->fetchAll();
                    
                    $response = [
                        'data' => $users
                    ];
                    
                } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                    // Create new user
                    $input = json_decode(file_get_contents('php://input'), true);
                    
                    if (!isset($input['name'], $input['email'], $input['password'], $input['role'])) {
                        http_response_code(400);
                        echo json_encode(['message' => 'Name, email, password, and role are required']);
                        exit();
                    }
                    
                    $name = trim($input['name']);
                    $email = trim(strtolower($input['email']));
                    $password = $input['password'];
                    $role = $input['role'];
                    $branchId = $input['branch_id'] ?? null;
                    $isApproved = $input['is_approved'] ?? true;
                    
                    // Validate password length
                    if (strlen($password) < 8) {
                        http_response_code(400);
                        echo json_encode(['message' => 'Password must be at least 8 characters long']);
                        exit();
                    }
                    
                    // Check if user already exists
                    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
                    $stmt->execute([$email]);
                    if ($stmt->fetch()) {
                        http_response_code(400);
                        echo json_encode(['message' => 'User with this email already exists']);
                        exit();
                    }
                    
                    // Hash password
                    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
                    
                    // Insert new user
                    $stmt = $pdo->prepare("
                        INSERT INTO users (name, email, password, role, branch_id, is_approved, email_verified_at, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
                    ");
                    
                    try {
                        $stmt->execute([$name, $email, $hashedPassword, $role, $branchId, $isApproved]);
                        $userId = $pdo->lastInsertId();
                        
                        // Get the created user with branch info
                        $stmt = $pdo->prepare("
                            SELECT u.*, b.name as branch_name, b.address as branch_address
                            FROM users u
                            LEFT JOIN branches b ON u.branch_id = b.id
                            WHERE u.id = ?
                        ");
                        $stmt->execute([$userId]);
                        $user = $stmt->fetch();
                        
                        $response = [
                            'data' => $user,
                            'message' => 'User created successfully'
                        ];
                        
                        http_response_code(201);
                        
                    } catch (PDOException $e) {
                        http_response_code(500);
                        echo json_encode(['message' => 'Failed to create user']);
                        exit();
                    }
                    
                } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
                    // Update user
                    if (count($pathParts) > 2 && is_numeric($pathParts[2])) {
                        $userId = $pathParts[2];
                        $input = json_decode(file_get_contents('php://input'), true);
                        
                        $updateFields = [];
                        $updateValues = [];
                        
                        $allowedFields = ['name', 'email', 'role', 'branch_id', 'is_approved'];
                        foreach ($allowedFields as $field) {
                            if (isset($input[$field])) {
                                $updateFields[] = "$field = ?";
                                $updateValues[] = $input[$field];
                            }
                        }
                        
                        // Handle password update separately
                        if (isset($input['password']) && !empty($input['password'])) {
                            if (strlen($input['password']) < 8) {
                                http_response_code(400);
                                echo json_encode(['message' => 'Password must be at least 8 characters long']);
                                exit();
                            }
                            $updateFields[] = "password = ?";
                            $updateValues[] = password_hash($input['password'], PASSWORD_DEFAULT);
                        }
                        
                        if (empty($updateFields)) {
                            http_response_code(400);
                            echo json_encode(['message' => 'No valid fields to update']);
                            exit();
                        }
                        
                        $updateValues[] = $userId;
                        $sql = "UPDATE users SET " . implode(', ', $updateFields) . ", updated_at = NOW() WHERE id = ?";
                        
                        try {
                            $stmt = $pdo->prepare($sql);
                            $stmt->execute($updateValues);
                            
                            // Get updated user
                            $stmt = $pdo->prepare("
                                SELECT u.*, b.name as branch_name, b.address as branch_address
                                FROM users u
                                LEFT JOIN branches b ON u.branch_id = b.id
                                WHERE u.id = ?
                            ");
                            $stmt->execute([$userId]);
                            $user = $stmt->fetch();
                            
                            if ($user) {
                                $response = [
                                    'data' => $user,
                                    'message' => 'User updated successfully'
                                ];
                            } else {
                                http_response_code(404);
                                echo json_encode(['message' => 'User not found']);
                                exit();
                            }
                            
                        } catch (PDOException $e) {
                            http_response_code(500);
                            echo json_encode(['message' => 'Failed to update user']);
                            exit();
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['message' => 'Invalid user ID']);
                        exit();
                    }
                    
                } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
                    // Delete user
                    if (count($pathParts) > 2 && is_numeric($pathParts[2])) {
                        $userId = $pathParts[2];
                        
                        try {
                            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
                            $stmt->execute([$userId]);
                            
                            if ($stmt->rowCount() > 0) {
                                $response = ['message' => 'User deleted successfully'];
                            } else {
                                http_response_code(404);
                                echo json_encode(['message' => 'User not found']);
                                exit();
                            }
                            
                        } catch (PDOException $e) {
                            http_response_code(500);
                            echo json_encode(['message' => 'Failed to delete user']);
                            exit();
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['message' => 'Invalid user ID']);
                        exit();
                    }
                    
                } elseif ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
                    // Handle approve user
                    if (count($pathParts) > 3 && $pathParts[3] === 'approve') {
                        $userId = $pathParts[2];
                        
                        try {
                            $stmt = $pdo->prepare("UPDATE users SET is_approved = 1, updated_at = NOW() WHERE id = ?");
                            $stmt->execute([$userId]);
                            
                            if ($stmt->rowCount() > 0) {
                                // Get updated user
                                $stmt = $pdo->prepare("
                                    SELECT u.*, b.name as branch_name, b.address as branch_address
                                    FROM users u
                                    LEFT JOIN branches b ON u.branch_id = b.id
                                    WHERE u.id = ?
                                ");
                                $stmt->execute([$userId]);
                                $user = $stmt->fetch();
                                
                                $response = [
                                    'data' => $user,
                                    'message' => 'User approved successfully'
                                ];
                            } else {
                                http_response_code(404);
                                echo json_encode(['message' => 'User not found']);
                                exit();
                            }
                            
                        } catch (PDOException $e) {
                            http_response_code(500);
                            echo json_encode(['message' => 'Failed to approve user']);
                            exit();
                        }
                    } else {
                        http_response_code(400);
                        echo json_encode(['message' => 'Invalid approve request']);
                        exit();
                    }
                }
            }
            break;

        case 'analytics':
            // Handle analytics endpoints
            $pathParts = explode('/', trim($fullPath, '/'));
            if (count($pathParts) > 1 && $pathParts[1] === 'product-availability') {
                if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                    $productId = $_GET['product_id'] ?? null;
                    $branchId = $_GET['branch_id'] ?? null;
                    
                    $sql = "
                        SELECT 
                            p.id as product_id,
                            p.name as product_name,
                            b.id as branch_id,
                            b.name as branch_name,
                            b.code as branch_code,
                            COALESCE(bs.stock_quantity, 0) as stock_quantity,
                            COALESCE(bs.reserved_quantity, 0) as reserved_quantity,
                            GREATEST(COALESCE(bs.stock_quantity, 0) - COALESCE(bs.reserved_quantity, 0), 0) as available_quantity,
                            CASE 
                                WHEN COALESCE(bs.stock_quantity, 0) - COALESCE(bs.reserved_quantity, 0) > 0 THEN 1 
                                ELSE 0 
                            END as is_available
                        FROM products p
                        CROSS JOIN branches b
                        LEFT JOIN branch_stock bs ON p.id = bs.product_id AND b.id = bs.branch_id
                        WHERE p.is_active = 1 AND b.is_active = 1
                    ";
                    
                    $params = [];
                    if ($productId) {
                        $sql .= " AND p.id = ?";
                        $params[] = $productId;
                    }
                    if ($branchId) {
                        $sql .= " AND b.id = ?";
                        $params[] = $branchId;
                    }
                    
                    $sql .= " ORDER BY p.name, b.name";
                    
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                    $availability = $stmt->fetchAll();
                    
                    $response = [
                        'availability' => $availability,
                        'summary' => [
                            'total_products' => count(array_unique(array_column($availability, 'product_id'))),
                            'total_branches' => count(array_unique(array_column($availability, 'branch_id'))),
                            'total_available' => count(array_filter($availability, fn($item) => $item['is_available']))
                        ]
                    ];
                }
            }
            break;
            
        case 'branches':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                // Check if requesting specific sub-route
                $pathParts = explode('/', trim($fullPath, '/'));
                
                if (count($pathParts) > 1) {
                    if ($pathParts[1] === 'active') {
                        // Get active branches
                        $stmt = $pdo->query("
                            SELECT b.*, 
                                   COUNT(DISTINCT bs.product_id) as product_count,
                                   COUNT(DISTINCT u.id) as staff_count
                            FROM branches b
                            LEFT JOIN branch_stock bs ON b.id = bs.branch_id
                            LEFT JOIN users u ON b.id = u.branch_id AND u.role IN ('staff', 'optometrist')
                            WHERE b.is_active = 1
                            GROUP BY b.id
                            ORDER BY b.name ASC
                        ");
                        $branches = $stmt->fetchAll();
                        
                        $response = [
                            'data' => $branches
                        ];
                        
                    } elseif (is_numeric($pathParts[1])) {
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
                        http_response_code(400);
                        echo json_encode(['message' => 'Invalid branch request']);
                        exit();
                    }
                } else {
                    // Get all branches
                    $stmt = $pdo->query("
                        SELECT b.*, 
                               COUNT(DISTINCT bs.product_id) as product_count,
                               COUNT(DISTINCT u.id) as staff_count
                        FROM branches b
                        LEFT JOIN branch_stock bs ON b.id = bs.branch_id
                        LEFT JOIN users u ON b.id = u.branch_id AND u.role IN ('staff', 'optometrist')
                        GROUP BY b.id
                        ORDER BY b.name ASC
                    ");
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
                
                // Parse JSON fields for each product
                foreach ($products as &$product) {
                    if ($product['image_paths']) {
                        $product['image_paths'] = json_decode($product['image_paths'], true) ?: [];
                    } else {
                        $product['image_paths'] = [];
                    }
                    
                    // Get branch availability for this product
                    $branchAvailabilitySql = "
                        SELECT 
                            b.id as branch_id,
                            b.name as branch_name,
                            b.code as branch_code,
                            COALESCE(bs.stock_quantity, 0) as stock_quantity,
                            COALESCE(bs.reserved_quantity, 0) as reserved_quantity,
                            GREATEST(COALESCE(bs.stock_quantity, 0) - COALESCE(bs.reserved_quantity, 0), 0) as available_quantity,
                            CASE 
                                WHEN COALESCE(bs.stock_quantity, 0) - COALESCE(bs.reserved_quantity, 0) > 0 THEN 1 
                                ELSE 0 
                            END as is_available
                        FROM branches b
                        LEFT JOIN branch_stock bs ON b.id = bs.branch_id AND bs.product_id = ?
                        WHERE b.is_active = 1
                        ORDER BY b.name
                    ";
                    
                    $branchStmt = $pdo->prepare($branchAvailabilitySql);
                    $branchStmt->execute([$product['id']]);
                    $branchAvailability = $branchStmt->fetchAll();
                    
                    // Format branch availability data
                    $product['branch_availability'] = array_map(function($ba) {
                        return [
                            'branch' => [
                                'id' => $ba['branch_id'],
                                'name' => $ba['branch_name'],
                                'code' => $ba['branch_code']
                            ],
                            'stock_quantity' => (int)$ba['stock_quantity'],
                            'reserved_quantity' => (int)$ba['reserved_quantity'],
                            'available_quantity' => (int)$ba['available_quantity'],
                            'is_available' => (bool)$ba['is_available']
                        ];
                    }, $branchAvailability);
                    
                    // Calculate totals for admin interface
                    $product['total_stock'] = array_sum(array_column($branchAvailability, 'stock_quantity'));
                    $product['total_reserved'] = array_sum(array_column($branchAvailability, 'reserved_quantity'));
                    $product['total_available'] = array_sum(array_column($branchAvailability, 'available_quantity'));
                }
                
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
