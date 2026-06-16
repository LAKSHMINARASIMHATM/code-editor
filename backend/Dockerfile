FROM python:3.11-slim

# Install system dependencies if any are required (git is needed by git_service)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set up user with UID 1000 to comply with Hugging Face Space requirements
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:${PATH}"

WORKDIR /app

# Copy requirements and install dependencies
COPY --chown=user:user requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend files
COPY --chown=user:user . .

# Run the FastAPI Socket.IO server on port 7860
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "7860"]
