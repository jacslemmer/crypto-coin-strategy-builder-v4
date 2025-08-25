#!/bin/bash

# Production Deployment Script
# This script builds and deploys the application to production

set -e

echo "🚀 Starting production deployment..."

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

# Check if required environment variables are set
if [ -z "$SENTRY_DSN" ]; then
    print_warning "SENTRY_DSN is not set. Sentry error reporting will be disabled."
fi

if [ -z "$REDIS_PASSWORD" ]; then
    print_warning "REDIS_PASSWORD is not set. Redis will run without authentication."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Check if Wrangler is available for Cloudflare deployment
if ! command -v wrangler &> /dev/null; then
    print_warning "Wrangler is not installed. Cloudflare deployment will be skipped."
    CLOUDFLARE_DEPLOY=false
else
    CLOUDFLARE_DEPLOY=true
    print_status "Wrangler found. Cloudflare deployment will be included."
fi

# Set environment variables
export NODE_ENV=production
export APP_VERSION=${APP_VERSION:-$(git describe --tags --always --dirty)}

print_status "Deploying version: $APP_VERSION"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p tmp/logs tmp/data tmp/r2 ssl

# Check if SSL certificates exist
if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
    print_error "SSL certificates not found in ssl/ directory."
    print_error "Please provide valid SSL certificates for production deployment."
    exit 1
fi

# Build and start services
print_status "Building and starting production services with Docker Compose..."

# Stop any existing containers
docker-compose -f docker-compose.prod.yml down

# Build production images
print_status "Building production Docker images..."
docker-compose -f docker-compose.prod.yml build

# Start production services
print_status "Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 15

# Check service health
print_status "Checking service health..."

# Check backend health
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    print_success "Backend is healthy and running on http://localhost:4000"
else
    print_error "Backend health check failed. Deployment may have failed."
    docker-compose -f docker-compose.prod.yml logs backend
    exit 1
fi

# Check nginx health
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx is healthy and running on http://localhost"
else
    print_error "Nginx health check failed. Deployment may have failed."
    docker-compose -f docker-compose.prod.yml logs nginx
    exit 1
fi

# Check Redis
if docker-compose -f docker-compose.prod.yml exec redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is running and accessible"
else
    print_warning "Redis health check failed. Service may still be starting..."
fi

# Deploy to Cloudflare if Wrangler is available
if [ "$CLOUDFLARE_DEPLOY" = true ]; then
    print_status "Deploying to Cloudflare..."
    
    # Build the application for Cloudflare
    print_status "Building application for Cloudflare..."
    npm run build
    
    # Deploy to UAT environment
    print_status "Deploying to UAT environment..."
    wrangler deploy --config wrangler.uat.toml
    
    # Deploy to production environment
    print_status "Deploying to production environment..."
    wrangler deploy --config wrangler.prod.toml
    
    print_success "Cloudflare deployment completed successfully!"
else
    print_warning "Skipping Cloudflare deployment (Wrangler not available)"
fi

# Show running containers
print_status "Running production containers:"
docker-compose -f docker-compose.prod.yml ps

# Show logs
print_status "Recent production logs:"
docker-compose -f docker-compose.prod.yml logs --tail=20

print_success "Production deployment completed successfully!"
echo ""
echo "🌐 Production services available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:4000"
echo "   - Nginx Proxy: http://localhost (HTTP) / https://localhost (HTTPS)"
echo "   - Redis: localhost:6379"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   - Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "   - Rebuild and restart: docker-compose -f docker-compose.prod.yml up --build -d"
echo ""
echo "🔍 Health checks:"
echo "   - Backend: http://localhost:4000/health"
echo "   - Nginx: http://localhost/health"
echo ""
echo "☁️  Cloudflare:"
echo "   - UAT: https://uat.ccsb.example.com"
echo "   - Production: https://ccsb.example.com"


