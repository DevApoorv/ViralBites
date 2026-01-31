#!/bin/bash

# ViralBites Configuration Checker

echo "🔍 ViralBites Configuration Checker"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: $NODE_VERSION"
    
    # Check if version is >= 18
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo -e "${YELLOW}⚠${NC}  Warning: Node.js 18+ recommended (you have v$MAJOR_VERSION)"
    fi
else
    echo -e "${RED}✗${NC} Node.js not found. Please install from https://nodejs.org/"
fi
echo ""

# Check npm
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found"
fi
echo ""

# Check Firebase CLI
echo "🔥 Checking Firebase CLI..."
if command -v firebase &> /dev/null; then
    FIREBASE_VERSION=$(firebase --version)
    echo -e "${GREEN}✓${NC} Firebase CLI installed: $FIREBASE_VERSION"
else
    echo -e "${YELLOW}✗${NC} Firebase CLI not found"
    echo "   Install with: npm install -g firebase-tools"
fi
echo ""

# Check .env file
echo "🔐 Checking environment configuration..."
if [ -f .env ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check for required variables
    if grep -q "VITE_API_KEY=" .env && ! grep -q "VITE_API_KEY=your_" .env; then
        echo -e "${GREEN}✓${NC} VITE_API_KEY is set"
    else
        echo -e "${RED}✗${NC} VITE_API_KEY not configured in .env"
    fi
    
    if grep -q "VITE_BACKEND_URL=" .env; then
        BACKEND_URL=$(grep "VITE_BACKEND_URL=" .env | cut -d'=' -f2)
        echo -e "${GREEN}✓${NC} VITE_BACKEND_URL: $BACKEND_URL"
    else
        echo -e "${YELLOW}⚠${NC}  VITE_BACKEND_URL not set"
    fi
    
    # Check OAuth credentials
    if grep -q "INSTAGRAM_CLIENT_ID=" .env && ! grep -q "INSTAGRAM_CLIENT_ID=your_" .env; then
        echo -e "${GREEN}✓${NC} Instagram OAuth configured"
    else
        echo -e "${YELLOW}⚠${NC}  Instagram OAuth not configured (optional)"
    fi
    
    if grep -q "GOOGLE_CLIENT_ID=" .env && ! grep -q "GOOGLE_CLIENT_ID=your_" .env; then
        echo -e "${GREEN}✓${NC} Google OAuth configured"
    else
        echo -e "${YELLOW}⚠${NC}  Google OAuth not configured (optional)"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
    echo "   Create one from: cp .env.example .env"
fi
echo ""

# Check node_modules
echo "📁 Checking dependencies..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Frontend dependencies installed"
else
    echo -e "${YELLOW}✗${NC} Frontend dependencies not installed"
    echo "   Run: npm install"
fi

if [ -d "functions/node_modules" ]; then
    echo -e "${GREEN}✓${NC} Backend dependencies installed"
else
    echo -e "${YELLOW}✗${NC} Backend dependencies not installed"
    echo "   Run: cd functions && npm install"
fi
echo ""

# Check for Firebase project
echo "🔥 Checking Firebase project..."
if [ -f ".firebaserc" ]; then
    PROJECT=$(grep '"default"' .firebaserc | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC} Firebase project configured: $PROJECT"
else
    echo -e "${YELLOW}✗${NC} Firebase project not initialized"
    echo "   Run: firebase init"
fi
echo ""

# Check build
echo "🏗️  Checking build..."
if [ -d "dist" ]; then
    echo -e "${GREEN}✓${NC} Build directory exists"
else
    echo -e "${YELLOW}⚠${NC}  No build found"
    echo "   Run: npm run build"
fi
echo ""

# Summary
echo "===================================="
echo "📊 Configuration Summary"
echo "===================================="
echo ""

# Count checks
CHECKS=0
PASSED=0

# Basic requirements
if command -v node &> /dev/null; then ((CHECKS++)); ((PASSED++)); fi
if command -v npm &> /dev/null; then ((CHECKS++)); ((PASSED++)); fi
if [ -f .env ]; then ((CHECKS++)); ((PASSED++)); fi
if [ -d "node_modules" ]; then ((CHECKS++)); ((PASSED++)); fi

echo "Core Requirements: $PASSED/$CHECKS"

# Optional
OPT_CHECKS=0
OPT_PASSED=0
if command -v firebase &> /dev/null; then ((OPT_CHECKS++)); ((OPT_PASSED++)); fi
if [ -f ".firebaserc" ]; then ((OPT_CHECKS++)); ((OPT_PASSED++)); fi
if [ -d "functions/node_modules" ]; then ((OPT_CHECKS++)); ((OPT_PASSED++)); fi

echo "Optional Features: $OPT_PASSED/$OPT_CHECKS"
echo ""

if [ $PASSED -eq $CHECKS ]; then
    echo -e "${GREEN}✓ Your setup looks good! Ready to run.${NC}"
    echo ""
    echo "Start development:"
    echo "  Terminal 1: cd server && npm start"
    echo "  Terminal 2: npm run dev"
else
    echo -e "${YELLOW}⚠ Some configuration needed. Check items marked with ✗ above.${NC}"
fi
echo ""
