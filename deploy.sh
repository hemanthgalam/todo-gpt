#!/bin/bash

# Todo-GPT Docker Deployment Script

# Function to display help
show_help() {
  echo "Todo-GPT Docker Deployment Script"
  echo ""
  echo "Usage: ./deploy.sh [OPTION]"
  echo ""
  echo "Options:"
  echo "  build       Build the Docker image"
  echo "  start       Start the Docker container"
  echo "  stop        Stop the Docker container"
  echo "  restart     Restart the Docker container"
  echo "  logs        Show container logs"
  echo "  status      Check container status"
  echo "  test        Run tests"
  echo "  help        Show this help message"
  echo ""
}

# Function to build Docker image
build_image() {
  echo "Building Todo-GPT Docker image..."
  docker build -t todo-gpt .
  echo "Build complete!"
}

# Function to start container
start_container() {
  echo "Starting Todo-GPT container..."
  
  # Check if .env file exists
  if [ ! -f .env ]; then
    echo "Warning: .env file not found. Creating from .env.docker template..."
    cp .env.docker .env
    echo "Please edit .env file with your actual credentials before using the application."
  fi
  
  # Create data directories if they don't exist
  mkdir -p data
  mkdir -p backups
  
  # Start container with docker-compose
  docker-compose up -d
  
  echo "Container started! Access the web interface at http://localhost:3000"
}

# Function to stop container
stop_container() {
  echo "Stopping Todo-GPT container..."
  docker-compose down
  echo "Container stopped!"
}

# Function to restart container
restart_container() {
  echo "Restarting Todo-GPT container..."
  docker-compose restart
  echo "Container restarted!"
}

# Function to show logs
show_logs() {
  echo "Showing Todo-GPT container logs (press Ctrl+C to exit)..."
  docker-compose logs -f
}

# Function to check status
check_status() {
  echo "Todo-GPT container status:"
  docker-compose ps
}

# Function to run tests
run_tests() {
  echo "Running Todo-GPT tests..."
  npm test
}

# Main script logic
case "$1" in
  build)
    build_image
    ;;
  start)
    start_container
    ;;
  stop)
    stop_container
    ;;
  restart)
    restart_container
    ;;
  logs)
    show_logs
    ;;
  status)
    check_status
    ;;
  test)
    run_tests
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    echo "Unknown option: $1"
    show_help
    exit 1
    ;;
esac

exit 0