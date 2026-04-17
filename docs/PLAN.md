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
- Frame-by-frame stepping (previous/next event) (DONE)

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
- Cut middle sections (library, DONE)
- Terminal theme selection (Solarized, Dracula, etc.)
- Before/After diff preview

#### 4.14 UX Improvements
- Keyboard shortcuts (Space for play/pause, Ctrl+Z/Y for undo/redo)
- Auto-save to browser storage

### P2 - Future Extensions

#### 4.15 Advanced Timeline
- Timeline hover preview: show terminal state at the hovered position without seeking
- Static frame preview: view any position's terminal state without playback

#### 4.16 Other
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
- Timeline-based trim: drag handles on the timeline to set trim range visually (replaces sidebar trim controls)

#### DevSecOps Enhancements
- eslint-plugin-security: detect dangerouslySetInnerHTML, eval, etc.
- license-checker: prevent incompatible license (GPL) dependencies

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

---

## 8. MVP Implementation PRs

Each PR targets ~100 lines of diff for reviewability.
Library code uses TDD (tests first). UI code uses top-down approach (skeleton first, then wire up).

### Phase A: Library Foundation (Bottom-Up, TDD) - DONE

### PR 1: Project Setup (DONE)
- Vite + React 19 + TypeScript project initialization
- ESLint configuration
- Minimal App component

### PR 2: Types + Vitest Setup (DONE)
- `src/types/asciicast.ts` - AsciicastHeader, AsciicastEvent, EventType, AsciicastData
- Vitest configuration (`vitest` config in `vite.config.ts`)
- Dev dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`

### PR 3: Parser (TDD) (DONE)
- `src/lib/__tests__/parser.test.ts` - Tests first
- `src/lib/parser.ts` - Asciicast v2 parser implementation
- Valid v2 parsing, header validation, malformed JSON, edge cases

### PR 4: Speed Operations (TDD) (DONE)
- `src/lib/__tests__/speed.test.ts` - Tests first
- `src/lib/speed.ts` - Global speed multiplier, idle time compression

### PR 5: Trimmer (TDD) (DONE)
- `src/lib/__tests__/trimmer.test.ts` - Tests first
- `src/lib/trimmer.ts` - Start/end trim with time offset adjustment

### PR 7: App Shell + Layout Skeleton (DONE)
- `src/App.tsx` - Main layout with all panels as placeholders
- Three-state UI: upload screen -> editing screen -> export screen
- CSS layout: sidebar (controls) + main area (player)
- All panels render placeholder text (e.g., "Player will appear here")

### PR 8: File Upload + Player + E2E (DONE)
- `src/components/FileUpload.tsx` - Drag & drop + file picker
- `src/components/Player.tsx` - asciinema-player React wrapper
- Wire to existing `parseAsciicast()`, transition to editing screen
- Playwright E2E tests for upload flow and screen navigation
- Dev dependency: `asciinema-player`, `@playwright/test`

### PR 9: Asciicast v3 Format Support (DONE)
- v3 header parsing (`term.cols`/`term.rows` -> `width`/`height`)
- Relative timestamp -> absolute conversion
- `#` comment line support, `"x"` exit event type
- v3-specific fields: `tags`, `term.type`, `term.version`

### Phase B: Wire Up Editing Controls - DONE

### PR 10: Serializer (TDD) (DONE)
- `src/lib/__tests__/serializer.test.ts` - Tests first
- `src/lib/serializer.ts` - AsciicastData to NDJSON string
- Round-trip test (parse -> serialize -> parse)
- Support both v2 and v3 output formats

### PR 11: Speed Controls UI (DONE)
- `src/components/SpeedControls.tsx` - Speed slider + idle compression UI
- Wire to existing `applySpeedMultiplier()` and `compressIdleTime()`
- Player updates to reflect speed changes

### PR 12: Trim Controls UI (DONE)
- `src/components/TrimControls.tsx` - Start/end time inputs
- Wire to existing `trimStart()` and `trimEnd()`
- Player updates to reflect trimmed data

### PR 13: Export (.cast Download) (DONE)
- `src/components/ExportPanel.tsx` - Export button + format selection
- Wire serializer to generate .cast file and trigger browser download
- Minimal viable export: .cast only (GIF/MP4 deferred)

### Phase C: Editing Features, Font & Export Foundation

### PR 14: Undo/Redo (DONE)
- `src/hooks/useHistory.ts` - Generic history hook with past/present/future stack
- `src/hooks/__tests__/useHistory.test.ts` - 8 TDD tests
- Undo/Redo buttons in header nav, wired to asciicast data changes

### PR 15: Masker (TDD) (DONE)
- `src/lib/__tests__/masker.test.ts` - 15 TDD tests
- `src/lib/masker.ts` - String/regex masking on output ("o") events

### PR 17: Font Settings with Nerd Font Support (DONE)
- `src/types/fontConfig.ts` - FontConfig interface and defaults
- `src/components/FontSettings.tsx` - Font family (10 options incl. 4 Nerd Fonts), size, line-height, letter-spacing, ligature toggle
- Player integration via `terminalFontFamily`/`terminalFontSize` options and CSS custom properties
- Nerd Fonts: Hack, FiraCode, JetBrainsMono, CascadiaCode

### PR 18: GIF Export Foundation (DONE)
- `src/lib/gif-exporter.ts` - Frame capture (html-to-image) + GIF encoding (gifenc)
- `src/types/gifenc.d.ts` - TypeScript declarations for gifenc
- ExportPanel updated with GIF download button (single-frame MVP)
- Dependencies: `gifenc`, `html-to-image`

### PR 19: MP4 Export Foundation (DONE)
- `src/lib/mp4-exporter.ts` - Lazy ffmpeg.wasm loading + MP4 encoding
- ExportPanel updated with MP4 download button + loading progress
- COOP/COEP headers in Vite dev server config
- Dependencies: `@ffmpeg/ffmpeg`, `@ffmpeg/util`

### Phase D: Polish & Extended Features - DONE

**Library implementation complete** (PR #41):
- `maskText(text, pattern, replacement)` - Replace string or regex pattern in text. Supports both literal strings (uses `replaceAll`) and RegExp (auto-adds global flag).
- `maskEvents(data, pattern, replacement)` - Apply masking to all output (`"o"`) events in an AsciicastData. Input events are left untouched. Returns a new immutable copy.
- Tests cover: literal string replacement, regex replacement, case-insensitive regex, input event preservation, and immutability.

### PR 16: Event List / Text Editing (DONE)
- `src/components/EventList.tsx` - Scrollable event list
- Direct text editing on output events (typo fixes)

### PR 15b: Mask Controls UI (DONE)
- `src/components/MaskControls.tsx` - Mask input UI wired to masker lib

### PR 18b: Multi-Frame GIF Export (DONE)
- Full recording playback with frame capture at configurable FPS
- `src/hooks/useExport.ts` - Export orchestration hook
- Progress indicator during export

### PR 19b: Full MP4 Export (DONE)
- Player element wiring for frame capture
- Full recording playback to MP4
- Progress indicator during export

### PR 20: E2E Tests (DONE)
- `e2e/` - Playwright tests for full user flows
- File upload, editing, export scenarios
- Playwright configuration
- Speed controls, trim controls, and reset button e2e tests

### Phase E: Infrastructure (DONE)

### ESLint Enhancement (DONE)
- Enforce curly braces and indentation rules

### Timeline Controls (DONE)
- Play/pause, seekbar, and time display

### Code Coverage with Codecov (DONE)

### DevSecOps Pipeline (DONE)
- Dependabot, Gitleaks, CodeQL, supply chain hardening

### Phase F: Export Enhancements - DONE

### PR 22: Configurable Export Resolution (DONE)
- Add resolution/width control to GIF and MP4 export UI
- The `width` option already exists in both exporters but is not exposed in the UI
- Slider or preset selector (e.g., 480p, 720p, 1080p)

### Phase G: Format Support

### PR 21: Asciicast v3 Support
- Update parser to handle v3 format (relative timestamps, comment lines with `#`, tags)
- Auto-detect v2 vs v3 from header
- Convert v3 relative times to absolute times internally for unified editing
- Update serializer to export as v3 when source was v3

### Phase H: Advanced Editing

### PR 23: Cut Middle Sections (library, TDD) (DONE)
- `src/lib/__tests__/cutter.test.ts` - Tests first (12 TDD tests)
- `src/lib/cutter.ts` - `cutMiddle(data, startTime, endTime)` removes a middle
  time range and shifts later event timestamps to keep playback continuous
- Immutable: returns a new `AsciicastData`
- Edge cases covered: empty range, full-range cut, empty events, invalid input
- UI wiring deferred to a follow-up PR

### Phase I: UX Enhancements

### PR 24: Frame-by-Frame Stepping (DONE)
- `src/lib/event-navigation.ts` - `findPreviousEvent` / `findNextEvent` lookup helpers (TDD, 12 tests)
- Timeline component: add previous/next event buttons flanking the play button
- Buttons seek to the neighboring event timestamp, pause playback, and disable at list boundaries

