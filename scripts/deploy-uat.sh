#!/bin/bash

# UAT Deployment Script
# This script deploys the application to the UAT environment

set -e

echo "🚀 Starting UAT deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Wrangler is available
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler is not installed. Please install Wrangler to deploy to Cloudflare."
    print_error "Install with: npm install -g wrangler"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    print_error "CLOUDFLARE_API_TOKEN is not set. Please set your Cloudflare API token."
    exit 1
fi

# Set environment variables
export NODE_ENV=uat
export APP_VERSION=${APP_VERSION:-$(git describe --tags --always --dirty)}

print_status "Deploying version: $APP_VERSION to UAT environment"

# Build the application
print_status "Building application for UAT deployment..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed. dist/ directory not found."
    exit 1
fi

# Deploy to UAT environment
print_status "Deploying to UAT environment..."
wrangler deploy --config wrangler.uat.toml

# Verify deployment
print_status "Verifying UAT deployment..."

# Wait a moment for deployment to propagate
sleep 10

# Check if the deployment was successful
if wrangler tail --config wrangler.uat.toml --once | grep -q "Deployed"; then
    print_success "UAT deployment verified successfully!"
else
    print_warning "UAT deployment verification inconclusive. Please check manually."
fi

print_success "UAT deployment completed successfully!"
echo ""
echo "☁️  UAT Environment:"
echo "   - Worker: ccsb-v3-uat"
echo "   - R2 Bucket: ccsb-screens-uat"
echo "   - D1 Database: ccsb-db-uat"
echo "   - KV Namespace: uat-logs"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: wrangler tail --config wrangler.uat.toml"
echo "   - Check status: wrangler status --config wrangler.uat.toml"
echo "   - Open dashboard: wrangler dashboard --config wrangler.uat.toml"
echo ""
echo "🔍 Testing:"
echo "   - Test the UAT worker manually through the Cloudflare dashboard"
echo "   - Verify R2 bucket access and D1 database connectivity"
echo "   - Check that logs are being written to the UAT KV namespace"


