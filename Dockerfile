# ── Bookmark — Django Backend ─────────────────────────────────────────────────
# Base image: slim Python 3.12 on Debian (pip, venv, apt — all guaranteed)
FROM python:3.12-slim

# Prevents Python from writing .pyc files and buffers stdout/stderr
# so logs appear immediately in docker compose logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system packages needed to compile psycopg2 (PostgreSQL adapter)
# and other Python packages that have C extensions
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside the container
# All subsequent commands run from here
WORKDIR /app

# Copy requirements first — Docker caches this layer
# If requirements.txt hasn't changed, Docker skips pip install on rebuild
# This makes rebuilds much faster during development
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the project into the container
COPY . .

# Create directories the app writes to at runtime
RUN mkdir -p logs tmp/captures

# Expose the Django port so docker compose can map it to the host
EXPOSE 8080

# Entrypoint script — runs migrations then starts the server
# Using a script instead of direct command so we can add steps later
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]