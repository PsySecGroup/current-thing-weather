#!/bin/bash

# Specify the path to your .env file
ENV_FILE=".env"

# Check if the .env file exists
if [[ -f "$ENV_FILE" ]]; then
  # Extract the value of GDELT_PATH
  GDELT_PATH=$(grep -E '^GDELT_PATH=' "$ENV_FILE" | cut -d '=' -f2-)
  GDELT_SQLITE_PATH==$(grep -E '^GDELT_SQLITE_PATH=' "$ENV_FILE" | cut -d '=' -f2-)

  # Check if GDELT_PATH was found and is not empty
  if [[ -n "$GDELT_PATH" ]]; then
    echo "GDELT_PATH: $GDELT_PATH"
  else
    echo "GDELT_PATH variable not found in the .env file or is empty."
  fi
else
  echo ".env file not found."
fi

echo "Updating..."

mkdir -p GDELT_SQLITE_PATH

cd GDELT_PATH

curl -s http://data.gdeltproject.org/events/index.html | grep -oP 'HREF="\K[^"]*\.zip' | while read -r link; do
  filename=$(basename "$link")
  
  if [ ! -f "$filename" ]; then
    echo "Downloading $filename..."
    curl -o "data/$link" -s "http://data.gdeltproject.org/events/$link"
  fi
done

npm start
