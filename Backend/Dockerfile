# syntax=docker/dockerfile:1
# DocLens backend — multi-stage build, runs as a non-root user.

# ---------- Stage 1: build wheels ----------
FROM python:3.12-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build
COPY requirements.txt .
# Build wheels for all pinned deps so the final image needs no build toolchain.
RUN pip wheel --wheel-dir /wheels -r requirements.txt

# ---------- Stage 2: runtime ----------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create an unprivileged user to run the app.
RUN groupadd --system app && useradd --system --gid app --home /app app

WORKDIR /app

# Install dependencies from the prebuilt wheels only (no network, no compilers).
COPY requirements.txt .
COPY --from=builder /wheels /wheels
RUN pip install --no-index --find-links /wheels -r requirements.txt \
    && rm -rf /wheels

# Cache-busting ARG — must be set at build time (e.g. --build-arg CACHEBUST=$(date +%s))
# This forces the COPY layer to always rebuild so Python code changes are always picked up.
ARG CACHEBUST=1
# Copy the application code. It lives under the Backend/ package, so we place it
# at /app/Backend to preserve the `Backend.<module>` import paths.
COPY . /app/Backend

# Drop privileges.
USER app

EXPOSE 8000

# Render (and most platforms) inject $PORT; default to 8000 locally.
ENV PORT=8000

# Liveness probe hits the app's own /api/health endpoint. Uses stdlib urllib so
# the slim image needs no extra tooling (curl/wget are absent).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD ["python", "-c", "import os,urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8000')+'/api/health', timeout=4).status==200 else 1)"]

CMD ["sh", "-c", "uvicorn Backend.main:app --host 0.0.0.0 --port ${PORT}"]
