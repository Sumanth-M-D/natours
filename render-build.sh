#!/usr/bin/env bash

# Install system dependencies required by sharp
apt-get update && apt-get install -y \
  build-essential \
  libvips-dev

# Run the build
npm install
