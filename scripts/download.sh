#!/bin/bash
echo "Updating..."

curl -s http://data.gdeltproject.org/events/index.html | grep -oP 'HREF="\K[^"]*\.zip' | while read -r link; do
    filename=$(basename "$link")
    
    if [ ! -f "$filename" ]; then
        echo "Downloading $filename..."
        curl -Os "http://data.gdeltproject.org/events/$link"
    fi
done