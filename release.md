# Release Process

## Overview

This project uses GitHub Actions to automate the build and release process. When a version tag is pushed, the workflow builds the application for both macOS architectures (Apple Silicon and Intel) and creates a draft release.

## Steps

### 1. Update Version

Update the version in `package.json`:

```json
{
  "version": "X.Y.Z"
}
```

The version in `src-tauri/tauri.conf.json` automatically reads from `package.json`, so you only need to update it in one place.

### 2. Commit Changes

```bash
git add package.json
git commit -m "Release vX.Y.Z"
```

### 3. Create and Push Tag

```bash
git tag vX.Y.Z
git push origin master --tags
```

### 4. Wait for GitHub Actions

The workflow (`.github/workflows/release.yml`) will:

1. Build the app for macOS Apple Silicon (`aarch64-apple-darwin`)
2. Build the app for macOS Intel (`x86_64-apple-darwin`)
3. Sign all artifacts with the Tauri signing key
4. Create a **draft release** with:
   - `.dmg` installers for both architectures
   - `.app.tar.gz` archives for the updater
   - `.sig` signature files
   - `latest.json` for the updater endpoint

### 5. Publish the Release

1. Go to GitHub repository → **[Releases](https://github.com/snappit-app/snappit/releases)**
2. Find the draft release created by the workflow
3. Edit the release notes if needed
4. Click **"Publish release"**

Once published, the updater endpoint (`/releases/latest/download/latest.json`) will automatically point to the new version, and users will receive update notifications.

## Version Format

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

## Troubleshooting

### Build fails with leptonica/tesseract errors

The workflow installs these dependencies via Homebrew. If versions change, you may need to update the bundled dylibs:

```bash
brew install leptonica tesseract
pnpm resolve-dylib
```

Then commit the updated libraries in `src-tauri/resources/lib-mac/`.

### Draft release not created

Check that:

- The tag follows the `v*` pattern (e.g., `v0.1.2`)
- GitHub Actions secrets are configured:
  - `TAURI_SIGNING_PRIVATE_KEY`
  - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### Updater not finding new version

- Ensure the release is **published** (not draft)
- Verify `latest.json` is accessible at the endpoint URL
- Check that the new version is greater than the installed version
