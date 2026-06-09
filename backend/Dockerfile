# Use a slim Python image for a smaller footprint while maintaining compatibility
# with ML libraries like scipy and scikit-learn.
FROM python:3.12-slim

# Set environment variables to optimize Python for Docker
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install system dependencies required for WeasyPrint, Psycopg2, and ML tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    python3-dev \
    python3-pip \
    python3-cffi \
    python3-brotli \
    libpango-1.0-0 \
    libharfbuzz0b \
    libpangoft2-1.0-0 \
    libcairo2 \
    libffi-dev \
    libjpeg-dev \
    libopenjp2-7-dev \
    libgdk-pixbuf2.0-0 \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .

# Upgrade pip and install requirements
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# WeasyPrint isn't in requirements.txt directly based on analysis, but required
RUN pip install --no-cache-dir weasyprint==62.3

# Copy the backend source code
COPY . .

# Create the uploads directory and ensure correct permissions
RUN mkdir -p /app/uploads && \
    useradd -m myuser && \
    chown -R myuser:myuser /app

# Run the container as the non-root user for security
USER myuser

# Expose the application port
EXPOSE 8000

# Start the FastAPI application with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
