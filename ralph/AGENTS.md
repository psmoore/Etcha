# Ralph Agent Instructions

## Overview

Ralph is an autonomous AI agent loop that runs Amp repeatedly until all PRD items are complete. Each iteration is a fresh Amp instance with clean context.

## Commands

### macOS/Linux (Amp)
```bash
# Run the flowchart dev server
cd flowchart && npm run dev

# Build the flowchart
cd flowchart && npm run build

# Run Ralph (from your project that has prd.json)
./ralph.sh [max_iterations]
```

### Windows (Claude Code)
```powershell
# Run the flowchart dev server
cd flowchart; npm run dev

# Build the flowchart
cd flowchart; npm run build

# Run Ralph (from your project that has prd.json)
.\ralph.ps1 [max_iterations]
```

## Key Files

- `ralph.ps1` - The powershell loop that spawns fresh Claude Code instances
- `prompt.md` - Instructions given to each Claude Code instance
- `prd.json.example` - Example PRD format
- `flowchart/` - Interactive React Flow diagram explaining how Ralph works

## Flowchart

The `flowchart/` directory contains an interactive visualization built with React Flow. It's designed for presentations - click through to reveal each step with animations.

To run locally:
```bash
cd flowchart
npm install
npm run dev
```

## Patterns

- Each iteration spawns a fresh Claude Code instance with clean context
- Memory persists via git history, `progress.txt`, and `prd.json`
- Stories should be small enough to complete in one context window
- Always update AGENTS.md with discovered patterns for future iterations
- Use Claude for Chrome to test browser UI