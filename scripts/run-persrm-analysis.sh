#!/bin/bash

# PersRM - Personalized UI/UX Reasoning + Optimization
# This script automates the PersRM analysis and optimization process for OFAuto

# Set paths
PERSRM_PATH="/Users/kofirusu/PersLM"
OFAUTO_PATH="/Users/kofirusu/OFAuto"
OUTPUT_DIR="$OFAUTO_PATH/persrm-output"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Log file
LOG_FILE="$OUTPUT_DIR/session.log"

# Function to log messages
log() {
  echo "$(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log "Starting PersRM analysis for OFAuto"
log "Mode: Real (using full analyzer + optimizer pipeline)"

# Phase 1: Analysis
log "=== 🧠 Phase 1: Analysis ==="
log "Running analysis on target areas:"
log "- /src/app/api/ — campaign, post, DM, connection endpoints"
log "- /src/components/ — dashboard, modals, forms, outreach UIs"
log "- /src/pages/dashboard/ — scheduling, analytics, planner"

# Run analysis for each target area
cd "$PERSRM_PATH" && npm run ux:analyze -- "$OFAUTO_PATH/src/app/api" -o "$OUTPUT_DIR" -v
log "Analysis complete for /src/app/api/"

cd "$PERSRM_PATH" && npm run ux:analyze -- "$OFAUTO_PATH/src/components" -o "$OUTPUT_DIR" -v
log "Analysis complete for /src/components/"

cd "$PERSRM_PATH" && npm run ux:analyze -- "$OFAUTO_PATH/src/pages/dashboard" -o "$OUTPUT_DIR" -v
log "Analysis complete for /src/pages/dashboard/"

# Phase 2: Optimization
log "=== ⚙️ Phase 2: Optimization ==="
log "Auto-generating improvement suggestions for:"
log "- Campaign creation flow"
log "- Auto-DM setup UX"
log "- Visual clutter in Connected Accounts"

cd "$PERSRM_PATH" && npm run ux:optimize -- "$OFAUTO_PATH/src/components" -o "$OUTPUT_DIR" -v
log "Optimization complete"

# Phase 3: Analytics + Reporting
log "=== 📈 Phase 3: Analytics + Reporting ==="
log "Generating benchmark report"

cd "$PERSRM_PATH" && npm run ux:report -- -f html -o "$OUTPUT_DIR/report.html"
log "Report generated at $OUTPUT_DIR/report.html"

# Phase 5: Watch + Sync
log "=== 🔁 Phase 5: Watch + Sync ==="
log "Starting component watcher (runs in background)"

# Start the watcher in the background
cd "$PERSRM_PATH" && PERSRM_MODE=real npm run ux:watch -- "$OFAUTO_PATH/src/components" --output "$OUTPUT_DIR" &
WATCHER_PID=$!
log "Component watcher started with PID: $WATCHER_PID"
log "To stop the watcher, run: kill $WATCHER_PID"

log "PersRM analysis complete. All outputs are in $OUTPUT_DIR"
log "You can now view the report at $OUTPUT_DIR/report.html" 