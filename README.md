# Snappit

A macOS desktop application for screen capture and utility tasks. Capture screenshots, extract text with OCR, scan QR codes, pick colors, and magnify your screen.

## Features

- Screenshot capture with overlay selection
- OCR text extraction (Tesseract-based)
- QR code scanning
- Color picker
- Screen magnification

## Installation

Requirements:

- macOS
- Node.js
- pnpm
- Rust

System dependencies:

```bash
brew install leptonica tesseract libarchive
```

Install project dependencies:

```bash
pnpm install
pnpm resolve-dylib
```

## Development

```bash
pnpm start
```

## Build

```bash
pnpm build-tauri
```
