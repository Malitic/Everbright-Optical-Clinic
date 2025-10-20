#!/bin/bash
# Railway Deployment Test Script
# This script tests the deployment configuration before going live

set -e

echo "🧪 Railway Deployment Test Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_status "Testing: $test_name"
    
    if eval "$test_command"; then
        print_success "$test_name"
        ((TESTS_PASSED++))
    else
        print_error "$test_name"
        ((TESTS_FAILED++))
    fi
    echo ""
}

echo "Starting deployment configuration tests..."
echo ""

# Test 1: Check if we're in the right directory
run_test "Project Structure" "[ -f 'package.json' ] && [ -d 'backend' ] && [ -d 'frontend--' ]"

# Test 2: Check backend configuration files
run_test "Backend Railway Config" "[ -f 'backend/railway.json' ]"
run_test "Backend Composer Config" "[ -f 'backend/composer.json' ]"
run_test "Backend Procfile" "[ -f 'backend/Procfile' ]"

# Test 3: Check frontend configuration files
run_test "Frontend Railway Config" "[ -f 'railway.json' ]"
run_test "Frontend Package Config" "[ -f 'frontend--/package.json' ]"

# Test 4: Check if backend dependencies can be installed
print_status "Testing backend dependencies..."
if cd backend && composer install --no-dev --dry-run > /dev/null 2>&1; then
    print_success "Backend dependencies can be installed"
    ((TESTS_PASSED++))
else
    print_error "Backend dependencies installation failed"
    ((TESTS_FAILED++))
fi
cd ..
echo ""

# Test 5: Check if frontend dependencies can be installed
print_status "Testing frontend dependencies..."
if cd frontend-- && npm install --dry-run > /dev/null 2>&1; then
    print_success "Frontend dependencies can be installed"
    ((TESTS_PASSED++))
else
    print_error "Frontend dependencies installation failed"
    ((TESTS_FAILED++))
fi
cd ..
echo ""

# Test 6: Check if frontend can build
print_status "Testing frontend build..."
if cd frontend-- && npm run build > /dev/null 2>&1; then
    print_success "Frontend can build successfully"
    ((TESTS_PASSED++))
else
    print_error "Frontend build failed"
    ((TESTS_FAILED++))
fi
cd ..
echo ""

# Test 7: Check Laravel configuration
print_status "Testing Laravel configuration..."
if cd backend && php artisan config:cache > /dev/null 2>&1; then
    print_success "Laravel configuration is valid"
    ((TESTS_PASSED++))
else
    print_error "Laravel configuration has issues"
    ((TESTS_FAILED++))
fi
cd ..
echo ""

# Test 8: Check if required PHP version is available
print_status "Testing PHP version..."
PHP_VERSION=$(php -r "echo PHP_VERSION;" 2>/dev/null || echo "not_found")
if [[ "$PHP_VERSION" == "not_found" ]]; then
    print_error "PHP is not installed or not in PATH"
    ((TESTS_FAILED++))
elif php -r "exit(version_compare(PHP_VERSION, '8.2.0', '>=') ? 0 : 1);" 2>/dev/null; then
    print_success "PHP version $PHP_VERSION is compatible (>= 8.2.0)"
    ((TESTS_PASSED++))
else
    print_error "PHP version $PHP_VERSION is not compatible (requires >= 8.2.0)"
    ((TESTS_FAILED++))
fi
echo ""

# Test 9: Check if Node.js version is available
print_status "Testing Node.js version..."
NODE_VERSION=$(node --version 2>/dev/null || echo "not_found")
if [[ "$NODE_VERSION" == "not_found" ]]; then
    print_error "Node.js is not installed or not in PATH"
    ((TESTS_FAILED++))
else
    print_success "Node.js version $NODE_VERSION is available"
    ((TESTS_PASSED++))
fi
echo ""

# Test 10: Check environment file templates
run_test "Backend Environment Template" "[ -f 'backend/.env.example' ] || [ -f 'backend/.env' ]"
run_test "Frontend Environment Template" "[ -f 'frontend--/env.production' ]"

# Test 11: Validate JSON configuration files
print_status "Testing JSON configuration files..."
if python3 -m json.tool backend/railway.json > /dev/null 2>&1; then
    print_success "Backend railway.json is valid JSON"
    ((TESTS_PASSED++))
else
    print_error "Backend railway.json has invalid JSON"
    ((TESTS_FAILED++))
fi

if python3 -m json.tool railway.json > /dev/null 2>&1; then
    print_success "Frontend railway.json is valid JSON"
    ((TESTS_PASSED++))
else
    print_error "Frontend railway.json has invalid JSON"
    ((TESTS_FAILED++))
fi
echo ""

# Test 12: Check if serve package is available for frontend
print_status "Testing frontend serve package..."
if cd frontend-- && npm list serve > /dev/null 2>&1; then
    print_success "Serve package is available for frontend"
    ((TESTS_PASSED++))
else
    print_warning "Serve package not found - will be installed during deployment"
    ((TESTS_PASSED++))
fi
cd ..
echo ""

# Summary
echo "=========================================="
echo "Test Summary:"
echo "✅ Tests Passed: $TESTS_PASSED"
echo "❌ Tests Failed: $TESTS_FAILED"
echo "=========================================="

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "All tests passed! Your application is ready for Railway deployment."
    echo ""
    echo "Next steps:"
    echo "1. Run: ./deploy-to-railway.sh"
    echo "2. Follow the Railway deployment guide"
    echo "3. Use the deployment checklist"
    exit 0
else
    print_error "$TESTS_FAILED tests failed. Please fix the issues before deploying."
    echo ""
    echo "Common fixes:"
    echo "- Install missing dependencies (PHP, Node.js, Composer, npm)"
    echo "- Fix JSON syntax errors in configuration files"
    echo "- Ensure all required files are present"
    echo "- Check file permissions"
    exit 1
fi
