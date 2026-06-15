#!/bin/bash
# Docker utility scripts
# Build and run application with Docker

set -e

echo "🐳 Building Docker image..."
docker-compose build

echo "🚀 Starting services with Docker Compose..."
docker-compose up -d

echo ""
echo "✓ Services are running!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔌 Backend API: http://localhost:8000/api"
echo "💾 Database: localhost:5432"
echo ""
echo "View logs with: docker-compose logs -f"
echo "Stop services with: docker-compose down"
