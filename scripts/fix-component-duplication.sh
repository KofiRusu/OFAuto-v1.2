#!/bin/bash

echo "🔍 Checking for redundant components between components/ and src/components/"

# Create a temporary file to store matching files
TEMP_FILE=$(mktemp)

# Find files that exist in both directories
find components -type f -name "*.tsx" -o -name "*.jsx" | while read -r file; do
  BASENAME=$(basename "$file")
  SRC_FILE=$(find src/components -type f -name "$BASENAME")
  
  if [ -n "$SRC_FILE" ]; then
    echo "$file <=> $SRC_FILE" >> "$TEMP_FILE"
  fi
done

# Check if we found any duplicates
DUPLICATE_COUNT=$(wc -l < "$TEMP_FILE")

if [ "$DUPLICATE_COUNT" -eq 0 ]; then
  echo "✅ No redundant components found!"
  rm "$TEMP_FILE"
  exit 0
fi

echo "⚠️ Found $DUPLICATE_COUNT potentially redundant component(s):"
cat "$TEMP_FILE"
echo

# Ask user what to do
echo "Would you like to:"
echo "1) Merge the redundant components (keep src/components/ versions)"
echo "2) View differences between the files"
echo "3) Exit without changes"
read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    echo "Merging redundant components..."
    while read -r line; do
      ROOT_FILE=$(echo "$line" | awk '{print $1}')
      SRC_FILE=$(echo "$line" | awk '{print $3}')
      
      # First, verify if the components are actually different
      if ! diff -q "$ROOT_FILE" "$SRC_FILE" > /dev/null; then
        echo "Components differ: $ROOT_FILE ≠ $SRC_FILE"
        echo "Creating backup of the root component..."
        cp "$ROOT_FILE" "${ROOT_FILE}.bak"
      fi
      
      echo "Removing $ROOT_FILE (src/components version will be used)"
      rm "$ROOT_FILE"
    done < "$TEMP_FILE"
    
    echo "✅ Redundant components removed! Backups of different files were created with .bak extension."
    ;;
    
  2)
    echo "Showing differences between redundant components..."
    while read -r line; do
      ROOT_FILE=$(echo "$line" | awk '{print $1}')
      SRC_FILE=$(echo "$line" | awk '{print $3}')
      
      echo "========== Differences between $ROOT_FILE and $SRC_FILE =========="
      diff -u "$ROOT_FILE" "$SRC_FILE" | grep -v -e '^+++' -e '^---' -e '^@@'
      echo ""
    done < "$TEMP_FILE"
    ;;
    
  3)
    echo "Exiting without changes."
    ;;
    
  *)
    echo "Invalid choice. Exiting without changes."
    ;;
esac

# Clean up
rm "$TEMP_FILE" 