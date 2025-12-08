# Snappit - Project Context

## Project Overview

**Snappit** is a desktop application designed for screen capture and utility tasks, built with **Tauri v2**, **SolidJS**, and **Rust**. It focuses on productivity features like OCR (Optical Character Recognition), QR code scanning, color picking, and screen magnification, with a strong integration into the macOS ecosystem.

### Key Technologies

*   **Frontend:** [SolidJS](https://www.solidjs.com/) (Reactive UI), [Tailwind CSS](https://tailwindcss.com/) (Styling), [Vite](https://vitejs.dev/) (Build Tool).
*   **Backend:** [Rust](https://www.rust-lang.org/), [Tauri v2](https://tauri.app/).
*   **Image Processing:** [Tesseract](https://github.com/tesseract-ocr/tesseract) (OCR), [Leptess](https://crates.io/crates/leptess) (Rust wrapper), [Rqrr](https://crates.io/crates/rqrr) (QR scanning).
*   **Platform Specifics:** Utilizes macOS private APIs and `NSPanel` for advanced window management.

## Architecture

The project is structured as a Monorepo-style setup with a Multi-Page Application (MPA) frontend configuration.

### Directory Structure

*   `apps/`: Contains the distinct frontend windows of the application.
    *   `snap_overlay/`: The main overlay for capturing screen regions, displaying tools (ruler, magnifier, etc.).
    *   `settings/`: The settings window for configuration.
    *   `notifications/`: Custom notification UI.
*   `src-tauri/`: The Rust backend logic.
    *   `src/lib.rs`: Main entry point exposing Tauri commands.
    *   `src/snappit_*.rs`: Modules for specific features (OCR, overlay, shortcuts, etc.).
    *   `tauri.conf.json`: Tauri configuration (permissions, windows, bundler settings).
*   `shared/`: Shared TypeScript code (UI components, stores, utilities) used across the different apps.

### Build System

*   **Vite:** configured in `vite.config.ts` to output multiple entry points (`overlay`, `settings`, `notifications`).
*   **Tauri:** Manages the native window wrapper and inter-process communication (IPC).

## Building and Running

### Prerequisites

*   Node.js & pnpm (inferred from `pnpm-lock.yaml`)
*   Rust & Cargo (for Tauri backend)
*   macOS (due to specific platform dependencies like `lib-mac`)

### Commands

| Command | Description |
| :--- | :--- |
| `pnpm start` | **Primary Development Command.** Runs `tauri dev` to start the frontend and backend with hot-reloading. |
| `pnpm dev` | Runs `vite` (frontend only). |
| `pnpm build` | Builds the frontend assets via Vite. |
| `pnpm build-tauri` | Builds the production Tauri application. |
| `pnpm lint` | Runs ESLint. |
| `pnpm format` | Runs ESLint with auto-fix. |
| `pnpm resolve-dylib` | Helper script to resolve dynamic library paths for macOS. |

## Development Conventions

*   **Styling:** Utility-first CSS using Tailwind.
*   **State Management:** SolidJS signals and stores.
*   **IPC:** Frontend invokes Rust commands defined in `src-tauri/src/lib.rs`.
*   **Components:** Reusable UI components are located in `shared/ui/`.
*   **Linting:** ESLint with Prettier integration (`eslint.config.ts`).

## Key Features & Implementations

*   **Overlay Window:** A transparent, full-screen overlay for selecting regions. Implemented using `tauri-nspanel` for macOS specific behaviors.
*   **OCR:** Triggered via `on_capture` command. Uses Tesseract with language management (`download_tess_language`).
*   **QR Scanning:** Triggered via `on_capture` or `scan_region_qr`.
*   **Shortcuts:** Global shortcuts managed via `tauri-plugin-global-shortcut`.
*   **Custom Protocol:** Registers `img://` protocol to serve captured images efficiently.
