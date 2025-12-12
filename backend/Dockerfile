# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV APP_ENV=production

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Expose port
EXPOSE 8000

# Run gunicorn
# Note: We are in /app, and the package is 'backend', so we need to make sure 'backend' is importable.
# If we copy backend/ to /app/backend, then `backend.main:app` works.
# But existing structure is `root/backend`, `root/requirements.txt`.
# If I put Dockerfile in `backend/Dockerfile`, I assume context is `backend/` or `root/`.
# Best practice: context is root.
# But easier if Dockerfile is in `backend/` and context is `backend/`.
# If context is `backend/`, then `COPY . .` puts `main.py` in `/app/main.py`?
# No, `backend/` dir structure: `main.py` is at top level of `backend/`.
# So `main` module.
# Check imports in `main.py`: `from . import models`. This implies package.
# So `backend` folder must be preserved?
# If I copy `.` to `/app` (where `.` is `backend/` content), then `main.py` is at `/app/main.py`.
# `uvicorn main:app` would work.
# But `main.py` does `from . import models`. Relative import in non-package?
# Relative imports in top-level script only work if `-m` is used.
# So we should treat `/app` as the package folder? No.
# If `backend` is a package, we should preserve the `backend` directory.

# Let's check `backend/main.py` imports.
# `from . import models`

# If I run `uvicorn main:app`, `main` is top-level. `from .` fails?
# Yes.
# So `backend` must be a subdirectory in the container too.
# So Dockerfile should be:
# WORKDIR /app
# COPY . /app/backend
# ENV PYTHONPATH=/app

# However, the `requirements.txt` is inside `backend/`.
# I'll restart the thought.

# Assumed build context: `backend/` directory (if built via docker-compose context: ./backend).
# So `COPY . .` copies content of `backend/` to `/app`.
# So `/app/main.py` exists.
# `cmd ["uvicorn", "main:app"]` -> `main` is top level.
# `from . import models` in `main.py`.
# This fails.

# Solution:
# 1. Change imports in `main.py` to absolute `import models` (but then local dev breaks if we run as module?)
# 2. Run as module `python -m main`?
# 3. Use `uvicorn backend.main:app`? For this `backend` must be in pythonpath.
# If I copy content of `backend/` to `/app/backend/`.
# WORKDIR /app
# COPY requirements.txt . (Assuming requirements.txt is in backend/)
# COPY . backend/
# ENV PYTHONPATH=/app
# CMD gunicorn backend.main:app ...

CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "backend.main:app", "--bind", "0.0.0.0:8000"]
