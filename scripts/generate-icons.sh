#!/bin/bash

# Icon Generation Script using ImageMagick
# Alternative to Sharp-based generation
# 
# Installation:
#   macOS: brew install imagemagick
#   Ubuntu/Debian: sudo apt-get install imagemagick
#   Windows: https://imagemagick.org/script/download.php#windows
#
# Usage: bash scripts/generate-icons.sh

set -e

SOURCE_ICON="./public/icon.png"
PUBLIC_DIR="./public"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎨 Starting icon generation with ImageMagick...${NC}"
echo "📦 Source: $SOURCE_ICON"
echo "📁 Output: $PUBLIC_DIR"
echo ""

# Check if source exists
if [ ! -f "$SOURCE_ICON" ]; then
    echo -e "${RED}❌ Error: Source icon not found at $SOURCE_ICON${NC}"
    echo "   Please ensure icon.png exists in /public directory"
    exit 1
fi

SUCCESS_COUNT=0
ERROR_COUNT=0

# Function to generate icon
generate_icon() {
    local size=$1
    local name=$2
    
    if convert "$SOURCE_ICON" -resize "${size}x${size}" -background none -gravity center -extent "${size}x${size}" "$PUBLIC_DIR/$name"; then
        echo -e "${GREEN}✅ Generated: $name (${size}x${size})${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}❌ Failed: $name${NC}"
        ((ERROR_COUNT++))
    fi
}

# Favicon sizes
generate_icon 32 "favicon-32x32.png"
generate_icon 96 "favicon-96x96.png"

# Android Chrome icons
generate_icon 36 "android-icon-36x36.png"
generate_icon 48 "android-icon-48x48.png"
generate_icon 72 "android-icon-72x72.png"
generate_icon 96 "android-icon-96x96.png"
generate_icon 144 "android-icon-144x144.png"
generate_icon 192 "android-icon-192x192.png"

# Apple Touch Icons
generate_icon 57 "apple-icon-57x57.png"
generate_icon 60 "apple-icon-60x60.png"
generate_icon 72 "apple-icon-72x72.png"
generate_icon 76 "apple-icon-76x76.png"
generate_icon 114 "apple-icon-114x114.png"
generate_icon 120 "apple-icon-120x120.png"
generate_icon 144 "apple-icon-144x144.png"
generate_icon 152 "apple-icon-152x152.png"
generate_icon 180 "apple-icon-180x180.png"
generate_icon 192 "apple-icon-192x192.png"

# Generic apple icon
generate_icon 180 "apple-icon.png"

# Windows Tiles
generate_icon 70 "ms-icon-70x70.png"
generate_icon 150 "ms-icon-150x150.png"
generate_icon 310 "ms-icon-310x310.png"

echo ""
echo -e "${BLUE}📊 Generation complete!${NC}"
echo -e "   ${GREEN}✅ Success: $SUCCESS_COUNT${NC}"
echo -e "   ${RED}❌ Errors: $ERROR_COUNT${NC}"
echo -e "\n${GREEN}🚀 All icons are ready at /public/${NC}\n"

if [ $ERROR_COUNT -gt 0 ]; then
    exit 1
fi
