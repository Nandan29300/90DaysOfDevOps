# ── Stage: Build / Runtime ──────────────────────────────────────────────────
# Use a slim Python base to keep the image small
FROM python:3.12-slim

# Set working directory inside the container
WORKDIR /app

# Copy dependency list first (layer-cache optimisation:
# dependencies are only re-installed when requirements.txt changes)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source code
COPY . .

# Expose the port Flask listens on
EXPOSE 5000

# Default command to start the app
CMD ["python", "app.py"]
