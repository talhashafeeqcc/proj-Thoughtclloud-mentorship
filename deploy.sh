#!/bin/bash

# Build the React frontend
echo "Building frontend..."
npm run build

# Build the server
echo "Building server..."
npm run build:server

# Create a production .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating production .env file..."
    cp .env.example .env
    echo "Please update the .env file with your production values before starting the server"
fi

# Start the server
echo "Starting server..."
npm run start 