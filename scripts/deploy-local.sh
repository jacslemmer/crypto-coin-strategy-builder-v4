#!/bin/bash

# Local Development Deployment Script
# This script builds and starts the application locally using Docker Compose

set -e

echo "🚀 Starting local development deployment..."

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

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p tmp/logs tmp/data tmp/r2 ssl

# Generate self-signed SSL certificate for local development
if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
    print_status "Generating self-signed SSL certificate for local development..."
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    print_success "SSL certificate generated successfully"
fi

# Build and start services
print_status "Building and starting services with Docker Compose..."

# Stop any existing containers
docker-compose down

# Build images
print_status "Building Docker images..."
docker-compose build

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check backend health
if curl -f http://localhost:4000/health > /dev/null 2>&1; then
    print_success "Backend is healthy and running on http://localhost:4000"
else
    print_warning "Backend health check failed. Service may still be starting..."
fi

# Check nginx health
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_success "Nginx is healthy and running on http://localhost"
else
    print_warning "Nginx health check failed. Service may still be starting..."
fi

# Check Redis
if docker-compose exec redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is running and accessible"
else
    print_warning "Redis health check failed. Service may still be starting..."
fi

# Show running containers
print_status "Running containers:"
docker-compose ps

# Show logs
print_status "Recent logs:"
docker-compose logs --tail=20

print_success "Local development deployment completed successfully!"
echo ""
echo "🌐 Services available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:4000"
echo "   - Nginx Proxy: http://localhost (HTTP) / https://localhost (HTTPS)"
echo "   - Redis: localhost:6379"
echo ""
echo "📋 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - Rebuild and restart: docker-compose up --build -d"
echo ""
echo "🔍 Health checks:"
echo "   - Backend: http://localhost:4000/health"
echo "   - Nginx: http://localhost/health"


