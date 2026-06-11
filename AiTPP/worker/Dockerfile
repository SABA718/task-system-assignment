FROM python:3.11-slim
WORKDIR /app
COPY worker.py .
# Install dependencies directly to save time
RUN pip install --no-cache-dir redis pymongo
# Create a non-root user
RUN useradd -m app
USER app
# Use -u to force unbuffered output so logs appear immediately
CMD ["python", "-u", "worker.py"]