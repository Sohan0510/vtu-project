FROM python:3.11-slim-bookworm

WORKDIR /app

# Install system dependencies & updated CA certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    tesseract-ocr \
    libgl1 \
    libglib2.0-0 \
    wkhtmltopdf \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create necessary directories
RUN mkdir -p static temp exports

ENV TESSERACT_PATH="/usr/bin/tesseract"

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
