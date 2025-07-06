#!/bin/bash

# OpenHands Safe Start Script
# This script starts OpenHands with enhanced error handling

echo "Starting OpenHands with enhanced error handling..."

# Set environment variables for safe mode
export OPENHANDS_SAFE_MODE=1
export OPENHANDS_CONTINUE_ON_ERROR=1
export OPENHANDS_MAX_RETRIES=3

# Set working directory
cd "$(dirname "$0")"

echo "Working directory: $(pwd)"
echo "Safe mode: $OPENHANDS_SAFE_MODE"
echo "Continue on error: $OPENHANDS_CONTINUE_ON_ERROR"
echo "Max retries: $OPENHANDS_MAX_RETRIES"

# Check if virtual environment exists and activate it
if [ -d "venv312" ]; then
    echo "Activating virtual environment..."
    source venv312/bin/activate
fi

# Start OpenHands
echo "Starting OpenHands..."
python -m openhands.cli.main "$@"