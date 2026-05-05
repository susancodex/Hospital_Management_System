# Multi-stage build for production-ready Hospital Management System

# Stage 1: Backend builder
FROM python:3.12-slim as backend-builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Stage 2: Frontend builder
FROM node:20-alpine as frontend-builder

WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
COPY frontend/tsconfig*.json* ./
COPY frontend/tailwind.config.js ./
COPY frontend/postcss.config.mjs ./
COPY frontend/vite.config.js ./
COPY frontend/src ./src
COPY frontend/index.html ./

# Install dependencies and build
RUN npm ci && \
    npm run build

# Stage 3: Production runtime
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 appuser

# Copy Python dependencies from builder
COPY --from=backend-builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy backend application
COPY --chown=appuser:appuser backend/ ./backend/

# Copy frontend static files to backend's static directory
COPY --from=frontend-builder --chown=appuser:appuser /app/frontend/dist ./backend/hospital_system/static/

# Create necessary directories
RUN mkdir -p ./backend/media && \
    chown -R appuser:appuser ./backend/

# Switch to non-root user
USER appuser

WORKDIR /app/backend

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health/', timeout=5)" || exit 1

# Run gunicorn
CMD ["gunicorn", "hospital_system.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--timeout", "120", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
