# Asciinema Editor - Project Plan

## Overview

A web application for editing asciinema recordings (.cast files). The editor enables users to adjust playback speed, add annotations, fix typos, customize fonts, and export to GIF/MP4/asciicast formats.

---

## 1. Asciicast Format

### v2 Format (Primary Target)

Asciicast v2 uses NDJSON (Newline Delimited JSON) format:

```jsonl
{"version": 2, "width": 80, "height": 24, "timestamp": 1504467315, "env": {"SHELL": "/bin/bash", "TERM": "xterm-256color"}}
[0.248848, "o", "\u001b[1;31mHello \u001b[32mWorld!\u001b[0m\r\n"]
[1.001376, "o", "$ "]
[2.500000, "i", "ls\r\n"]
[2.750000, "o", "file1.txt  file2.txt\r\n"]
[5.200000, "m", "end-of-demo"]
```

- **Line 1 (Header)**: JSON object with metadata
  - Required: `version` (2), `width`, `height`
  - Optional: `timestamp`, `duration`, `idle_time_limit`, `command`, `title`, `env`, `theme`
- **Line 2+ (Events)**: JSON arrays `[time, event_type, data]`
  - `"o"` - Terminal output (stdout)
  - `"i"` - Keyboard input (stdin)
  - `"m"` - Marker (breakpoint/navigation label)
  - `"r"` - Terminal resize (e.g., `"100x50"`)
- Time values are **absolute** (seconds from recording start)
- File extension: `.cast`, MIME type: `application/x-asciicast`

### v1 Format (Legacy Support)

- Single JSON object with `stdout` array of `[delay, data]` pairs
- Time values are **relative** (delta from previous frame)
- Output events only (no input/marker/resize)

### v3 Format (Future Consideration)

- Time values changed back to **relative** (intervals)
- New `"x"` (Exit) event type, comment lines (`#`), tags
- Not yet widely adopted; defer support to later phases

---

## 2. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **React 19 + TypeScript** | Largest ecosystem for complex UI; best integration examples with asciinema-player |
| Build Tool | **Vite** | Fast HMR, native WASM support, simple configuration |
| Player | **asciinema-player** | Native .cast support; `seek()`, `play()`, `pause()`, `getCurrentTime()` APIs |
| GIF Generation | **gifenc** | 2x faster than gif.js; lightweight; gif.js is unmaintained |
| MP4 Generation | **ffmpeg.wasm** | Full FFmpeg in browser; ~17k GitHub stars; actively maintained (v12.15, Feb 2026) |
| Frame Capture | **html-to-image** | DOM-to-Canvas conversion; lighter than html2canvas |
| Testing | **Vitest + React Testing Library** | Native Vite integration |
| Linting | **ESLint + Prettier** | Industry standard |

### Key Library Details

- **asciinema-player** (~2.6k stars): JS + Rust (WASM), provides `AsciinemaPlayer.create(src, container, opts)` DOM API
- **ffmpeg.wasm** (~17.2k stars): Requires lazy loading (~25MB bundle), needs COOP/COEP headers for SharedArrayBuffer
- **gifenc** (~326 stars): Small but performant; browser and Node compatible
- **html-to-image** (~5k stars, ~1.6M weekly downloads): Preferred over html2canvas for multi-frame capture performance

---

## 3. Target Users

| Persona | Use Case | Goal |
|---|---|---|
| **Tech Blog Writer** | Fix typos, cut idle time, adjust speed | Clean GIF/MP4 for blog posts |
| **Tutorial Creator** | Add step-by-step annotations, pause at key moments | Educational terminal demos |
| **Presenter** | Fit recording to time slot, highlight key output | Conference/meeting demo videos |
| **OSS Maintainer** | Create README demos, mask secrets | Repository documentation |
| **Internal Knowledge Sharer** | Remove trial-and-error, keep correct steps | Reproducible operation guides |

---

## 4. Feature Set & Priority

### P0 - MVP

#### 4.1 File Loading
- Drag & drop or file picker for `.cast` files
- Asciicast v2 header validation and malformed JSON detection

#### 4.2 Playback Preview
- Play / pause / stop controls
- Seekbar with timeline navigation
- Playback speed preview (0.25x - 4x)
- Frame-by-frame stepping (previous/next event)

#### 4.3 Speed Adjustment
- Global speed multiplier for entire recording
- Automatic idle time compression (e.g., "compress pauses > 2s to 0.5s")

#### 4.4 Annotations
- Text annotations at specified timestamps
- Frame freeze: pause GIF/MP4 at a specified point for N seconds

#### 4.5 Text Editing
- Direct editing of terminal output text (typo fixes)
- Sensitive data masking (replace passwords/tokens with `***`)

#### 4.6 Trimming
- Trim start and end of recording

#### 4.7 Font Customization
- Font family selection (monospace fonts: Fira Code, JetBrains Mono, Source Code Pro, Menlo, etc.)
- Font size adjustment
- Line height and letter spacing
- Ligature toggle

#### 4.8 Export
- Asciicast (.cast) download with edits applied
- GIF export (configurable resolution, frame rate, color depth)
- MP4 export (configurable resolution, bitrate)

#### 4.9 Core UX
- Undo / Redo

### P1 - Major Extensions

#### 4.10 Advanced Speed Control
- Per-segment speed adjustment (select time range, apply different speed)
- Typing speed normalization (uniform interval between keystrokes)

#### 4.11 Advanced Annotations
- Rectangular highlight overlay on specific terminal regions
- Step number markers ("Step 1", "Step 2")

#### 4.12 Advanced Text Editing
- Command input correction (rewrite `"i"` event keystrokes)
- Search & replace with regex support
- Path/username bulk replacement (e.g., `/home/john/` -> `/home/user/`)

#### 4.13 Advanced Editing
- Cut middle sections (remove trial-and-error segments)
- Terminal theme selection (Solarized, Dracula, etc.)
- Before/After diff preview

#### 4.14 UX Improvements
- Keyboard shortcuts (Space for play/pause, Ctrl+Z/Y for undo/redo)
- Auto-save to browser storage

### P2 - Future Extensions

- Merge multiple recordings into one
- Split one recording into multiple files
- Arrow/pointer overlay annotations
- Zoom effect on specific terminal regions
- Watermark overlay on GIF/MP4
- Title card / end card insertion
- Shareable URL generation
- Embed code generation (HTML snippet)
- Direct upload to asciinema.org
- Asciicast v1 auto-conversion to v2
- Asciicast v3 support
- Broken file repair
- Window frame decoration (macOS-style title bar)
- Export presets ("Blog", "Presentation", "High Quality")

---

## 5. Application Architecture

```
src/
  components/
    Player/          # asciinema-player wrapper, playback controls
    Timeline/        # Event timeline visualization, seekbar
    Editor/          # Text editing panel, event list
    Annotation/      # Annotation creation and management
    Export/           # Export settings and progress
    FontSettings/    # Font customization controls
  hooks/
    useAsciicast.ts  # Parse, edit, and serialize asciicast data
    usePlayback.ts   # Playback state management
    useHistory.ts    # Undo/redo history
    useExport.ts     # GIF/MP4/cast export logic
  lib/
    parser.ts        # Asciicast v2 parser
    serializer.ts    # Asciicast v2 serializer
    speed.ts         # Speed adjustment algorithms
    trimmer.ts       # Trim operations
    masker.ts        # Sensitive data masking
  types/
    asciicast.ts     # TypeScript type definitions
  App.tsx
  main.tsx
```

---

## 6. User Flow

```
[Upload .cast file]
       |
       v
[Preview playback] <---> [Edit timeline / events]
       |                         |
       v                         v
[Adjust speed]           [Fix text / Add annotations]
       |                         |
       v                         v
[Customize font & theme]
       |
       v
[Preview final result]
       |
       v
[Export as .cast / GIF / MP4]
```

---

## 7. Implementation Phases

### Phase 1: Foundation
1. Project setup (Vite + React + TypeScript)
2. Asciicast v2 parser and type definitions
3. Basic file upload (drag & drop)
4. asciinema-player integration for playback preview

### Phase 2: Core Editing
5. Global speed adjustment
6. Idle time compression
7. Start/end trimming
8. Undo/redo system

### Phase 3: Text & Annotations
9. Event list view with text editing
10. Sensitive data masking
11. Text annotations
12. Frame freeze markers

### Phase 4: Customization
13. Font family/size/spacing controls
14. Ligature toggle
15. Terminal theme selection (stretch goal for P1)

### Phase 5: Export
16. Asciicast (.cast) export
17. GIF export via gifenc + html-to-image
18. MP4 export via ffmpeg.wasm

### Phase 6: Polish
19. Keyboard shortcuts
20. Auto-save
21. Performance optimization for large recordings
