# Flip Clock

English | [中文](README.md)

A classic flip clock desktop app built with Tauri v2 + HTML/CSS/JS.

## Features

- **Current Time**: 12/24-hour format toggle, seconds display on/off
- **Timer**: Set a target time, triggers black-gray flash alert when reached
- **Countdown**: Hours/minutes/seconds countdown with flash alert
- **Pomodoro**: Work/break cycle with completed session counter
- **Background Opacity**: Adjustable from 10%–100%, persisted in localStorage
- **Borderless Window**: Drag from top bar, sidebar on right edge to switch modes
- **Fullscreen Toggle**: F11 or window button

## Project Structure

```
FlipClock/
├── frontend/                    # Frontend source
│   ├── index.html               # Page structure
│   ├── styles.css               # Styles (flip animation + opacity variable)
│   ├── renderer.js             # Logic (4 modes + Tauri invoke calls)
│   └── fonts/
│       └── LXGWWenKai-Regular.woff2  # Subset font (64KB)
├── src-tauri/                   # Tauri backend source
│   ├── Cargo.toml               # Rust dependencies
│   ├── Cargo.lock               # Rust dependency lock
│   ├── build.rs                 # Tauri build script
│   ├── tauri.conf.json          # Tauri config (window/CSP/bundle)
│   ├── src/
│   │   ├── main.rs              # Entry point
│   │   └── lib.rs               # Window commands (minimize/close/fullscreen)
│   └── icons/                   # App icons
├── FlipClock.exe                # Final single-file executable (~3MB)
├── README.md                    # Chinese documentation
└── README_EN.md                 # This file (English)
```

## Build Instructions

### 1. Install Prerequisites

Required once (no need to repeat afterwards):

```powershell
# 1) Rust toolchain
winget install Rustlang.Rustup

# 2) MSVC C++ Build Tools + Windows SDK
winget install Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.VCTools --add Microsoft.VisualStudio.Component.Windows11SDK.22621 --includeRecommendations --passive --wait --norestart"

# 3) Tauri CLI
npm install -g @tauri-apps/cli@^2
```

### 2. Build

Run from the project root:

```powershell
cd FlipClock
npx tauri build
```

Build outputs:
- **Single-file exe**: `src-tauri\target\release\flip-clock.exe` (~3 MB, copy to any PC and run directly)
- **Installer**: `src-tauri\target\release\bundle\nsis\FlipClock_1.0.0_x64-setup.exe`

### 3. Direct Usage

Copy `FlipClock.exe` to any Windows 10/11 machine and double-click to run. No installation needed.
Only system requirement: Windows 10/11 with built-in WebView2 Runtime.

## Technical Notes

- **Frontend**: Vanilla HTML/CSS/JS, no framework dependencies
- **Font**: LXGW WenKai Regular, subset to 64 KB (digits + ASCII + UI Chinese)
- **Window Control**: Frontend calls Rust commands via `window.__TAURI__.core.invoke()`
- **Drag**: Title bar uses `data-tauri-drag-region` attribute
- **Opacity**: CSS variable `--bg-alpha` controls body background alpha, persisted in localStorage
