# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Snappit is a macOS desktop application for screen capture and utility tasks, built with Tauri v2 (Rust backend) and SolidJS (TypeScript frontend). Features include OCR, QR code scanning, color picking, and screen magnification.

## Development Setup

Before running the project locally, install required system dependencies:

```bash
brew install leptonica tesseract libarchive
```

Then run `pnpm resolve-dylib` to copy and patch libraries for bundling.

## Commands

| Command              | Description                                               |
| -------------------- | --------------------------------------------------------- |
| `pnpm start`         | Primary dev command - runs `tauri dev` with hot-reloading |
| `pnpm build-tauri`   | Build production Tauri application                        |
| `pnpm lint`          | Run ESLint                                                |
| `pnpm format`        | Run ESLint with auto-fix                                  |
| `pnpm resolve-dylib` | Resolve dynamic library paths for macOS                   |

For Rust backend:

- `cargo check` in `src-tauri/` to type-check Rust code
- `cargo build` in `src-tauri/` to build backend only

## Architecture

### Multi-Page Application Structure

The frontend uses Vite MPA with three entry points:

- `apps/snap_overlay/` - Main transparent overlay for screen capture and tools
- `apps/settings/` - Settings window
- `apps/notifications/` - Custom notification UI

### Shared Code (`shared/`)

- `ui/` - Reusable SolidJS UI components (Button, Select, Switch, etc.)
- `tauri/` - TypeScript wrappers for Tauri IPC commands (`*_api.ts` files)
- `libs/` - Utility functions and shared logic
- `store/` - SolidJS stores for state management

### Rust Backend (`src-tauri/src/`)

- `lib.rs` - Main entry point, exposes all Tauri commands
- `snappit_*.rs` - Feature modules (overlay, ocr, shortcuts, license, etc.)
- `snappit_ocr/` and `snappit_qr/` - OCR and QR code processing

### Path Aliases (vite.config.ts)

- `@` → project root
- `@shared` → `./shared`
- `@overlay` → `./apps/overlay`
- `@settings` → `./apps/settings`
- `@notifications` → `./apps/notifications`

## Key Technical Details

- **macOS-only**: Uses `macOSPrivateApi: true` and `tauri-nspanel` for NSPanel window management
- **Image Protocol**: Custom `img://` protocol for serving captured images
- **OCR**: Tesseract via `leptess` crate with language management
- **QR Scanning**: Uses `rqrr` crate
- **Global Shortcuts**: Via `tauri-plugin-global-shortcut`

## Code Style

- Tailwind CSS for styling
- ESLint with Prettier (100 char width, double quotes, 2-space indent)
- Import sorting via `eslint-plugin-simple-import-sort`
- Unused vars allowed if prefixed with `_`
- **Solid Primitives**: Always prefer `@solid-primitives/*` packages over custom implementations. Only write custom primitives if no suitable solid-primitives package exists.
- For platform specific styles use tailwind prefixes. macos:{tailwind-code}, win:{tailwind-code}
