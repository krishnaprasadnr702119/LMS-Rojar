#!/bin/bash

# LMS Development Startup Script

echo "🚀 Starting LMS in Development Mode..."
echo "=================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down

# Start services
echo "🏗️  Building and starting services..."
docker-compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo "✅ Services started successfully!"
    echo ""
    echo "📱 Access URLs:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:5000"
    echo "   Database:  localhost:5432"
    echo ""
    echo "📋 Useful commands:"
    echo "   View logs:     docker-compose -f docker-compose.dev.yml logs -f"
    echo "   Stop services: docker-compose -f docker-compose.dev.yml down"
    echo "   Restart:       ./start_dev_docker.sh"
else
    echo "❌ Failed to start services. Check logs:"
    docker-compose -f docker-compose.dev.yml logs
fi
