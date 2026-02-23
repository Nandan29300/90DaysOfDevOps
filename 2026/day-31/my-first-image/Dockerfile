# Start from Ubuntu base image
FROM ubuntu:22.04

# Install curl in the image
RUN apt-get update && apt-get install -y curl \
  && rm -rf /var/lib/apt/lists/*

# Set default command
CMD echo "Hello from my custom image!"