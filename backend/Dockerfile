FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock ./

# Install dependencies into the system Python (no venv needed in container)
RUN uv sync --frozen --no-dev --no-install-project

COPY . .

CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]
