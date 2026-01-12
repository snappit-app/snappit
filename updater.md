# Tauri Updater - Пошаговая инструкция

## Часть 1: Код внутри приложения

### 1.1 Установка зависимостей

**Rust (в папке `src-tauri/`):**

```bash
cargo add tauri-plugin-updater --target 'cfg(target_os = "macos")'
cargo add tauri-plugin-process
```

**JavaScript:**

```bash
pnpm add @tauri-apps/plugin-updater @tauri-apps/plugin-process
```

### 1.2 Генерация ключей подписи

```bash
pnpm tauri signer generate -w ~/.tauri/snappit.key
```

Это создаст два файла:

- `~/.tauri/snappit.key` - приватный ключ (НИКОГДА не публиковать!)
- `~/.tauri/snappit.key.pub` - публичный ключ

> **ВАЖНО:** Сохрани приватный ключ в надёжном месте. Если потеряешь - не сможешь выпускать обновления для существующих пользователей.

### 1.3 Настройка tauri.conf.json

Добавить в `src-tauri/tauri.conf.json`:

```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/user/snappit/releases/latest/download/latest.json"
      ],
      "pubkey": "содержимое файла snappit.key.pub"
    }
  }
}
```

### 1.4 Инициализация плагинов в Rust

В `src-tauri/src/lib.rs` добавить регистрацию плагинов:

```rust
// В функции run() или main()
tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    // ... остальные плагины
```

### 1.5 Раздел About в настройках (SolidJS)

Создать компонент `apps/settings/components/AboutSection.tsx`:

```tsx
import { createSignal, Show } from "solid-js";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"
  | "up-to-date";

export function AboutSection() {
  const [version, setVersion] = createSignal<string>("");
  const [status, setStatus] = createSignal<UpdateStatus>("idle");
  const [error, setError] = createSignal<string>("");
  const [updateInfo, setUpdateInfo] = createSignal<Update | null>(null);
  const [downloadProgress, setDownloadProgress] = createSignal(0);

  // Получить текущую версию при монтировании
  getVersion().then(setVersion);

  async function checkForUpdates() {
    setStatus("checking");
    setError("");

    try {
      const update = await check();

      if (!update) {
        setStatus("up-to-date");
        return;
      }

      setUpdateInfo(update);
      setStatus("available");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка проверки обновлений");
      setStatus("error");
    }
  }

  async function downloadUpdate() {
    const update = updateInfo();
    if (!update) return;

    setStatus("downloading");
    setDownloadProgress(0);

    try {
      let totalSize = 0;
      let downloadedSize = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            totalSize = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloadedSize += event.data.chunkLength;
            if (totalSize > 0) {
              setDownloadProgress(
                Math.round((downloadedSize / totalSize) * 100),
              );
            }
            break;
          case "Finished":
            setDownloadProgress(100);
            break;
        }
      });

      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки обновления");
      setStatus("error");
    }
  }

  async function restartApp() {
    await relaunch();
  }

  return (
    <div class="space-y-4">
      <h2 class="text-lg font-semibold">About</h2>

      {/* Информация о версии */}
      <div class="space-y-2">
        <div class="flex justify-between">
          <span class="text-gray-500">Version</span>
          <span>{version()}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-500">Release Date</span>
          <span>January 2025</span> {/* TODO: получать из build info */}
        </div>
      </div>

      {/* Статус и действия */}
      <div class="space-y-3">
        {/* Idle - показать кнопку проверки */}
        <Show when={status() === "idle"}>
          <button
            onClick={checkForUpdates}
            class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Check for Updates
          </button>
        </Show>

        {/* Checking - показать спиннер */}
        <Show when={status() === "checking"}>
          <div class="flex items-center justify-center gap-2 py-2">
            <div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Checking for updates...</span>
          </div>
        </Show>

        {/* Up to date */}
        <Show when={status() === "up-to-date"}>
          <div class="text-center py-2">
            <p class="text-green-600">You're using the latest version</p>
            <button
              onClick={() => setStatus("idle")}
              class="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Check again
            </button>
          </div>
        </Show>

        {/* Update available */}
        <Show when={status() === "available"}>
          <div class="space-y-3 p-3 bg-blue-50 rounded-lg">
            <div>
              <p class="font-medium">
                Update available: v{updateInfo()?.version}
              </p>
              <Show when={updateInfo()?.body}>
                <p class="text-sm text-gray-600 mt-1">{updateInfo()?.body}</p>
              </Show>
            </div>
            <button
              onClick={downloadUpdate}
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Download Update
            </button>
          </div>
        </Show>

        {/* Downloading */}
        <Show when={status() === "downloading"}>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>Downloading...</span>
              <span>{downloadProgress()}%</span>
            </div>
            <div class="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                class="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${downloadProgress()}%` }}
              />
            </div>
          </div>
        </Show>

        {/* Ready to restart */}
        <Show when={status() === "ready"}>
          <div class="space-y-3 p-3 bg-green-50 rounded-lg">
            <p class="text-green-700">Update downloaded successfully!</p>
            <button
              onClick={restartApp}
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Restart to Update
            </button>
          </div>
        </Show>

        {/* Error */}
        <Show when={status() === "error"}>
          <div class="space-y-2 p-3 bg-red-50 rounded-lg">
            <p class="text-red-600">{error()}</p>
            <button
              onClick={checkForUpdates}
              class="text-sm text-red-600 hover:text-red-800"
            >
              Try again
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}
```

### 1.6 Переменные окружения для сборки

При сборке нужны переменные:

```bash
export TAURI_SIGNING_PRIVATE_KEY="содержимое ~/.tauri/snappit.key или путь к файлу"
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="пароль от ключа"
```

---

## Часть 2: Инфраструктура (GitHub Releases + Actions)

### 2.1 Настройка GitHub Secrets

В репозитории: Settings → Secrets and variables → Actions → New repository secret

Добавить секреты:

- `TAURI_SIGNING_PRIVATE_KEY` - содержимое файла `~/.tauri/snappit.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` - пароль от ключа

### 2.2 GitHub Actions Workflow

Создать файл `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

jobs:
  release:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          # macOS Apple Silicon
          - platform: macos-latest
            args: --target aarch64-apple-darwin
          # macOS Intel
          - platform: macos-latest
            args: --target x86_64-apple-darwin

    runs-on: ${{ matrix.platform }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: aarch64-apple-darwin,x86_64-apple-darwin

      - name: Install dependencies
        run: pnpm install

      - name: Build and release
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: v__VERSION__
          releaseName: "Snappit v__VERSION__"
          releaseBody: |
            See the assets below to download this version.

            **Installation:**
            - Download the `.dmg` file for your architecture
            - Open and drag Snappit to Applications

            **What's new:**
            - See commit history for changes
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

### 2.3 Что создаёт tauri-action

При сборке автоматически создаётся:

```
# Для каждой архитектуры:
snappit_x.x.x_aarch64.dmg           # DMG для установки (Apple Silicon)
snappit_x.x.x_aarch64.app.tar.gz    # Архив для обновлений
snappit_x.x.x_aarch64.app.tar.gz.sig # Подпись

snappit_x.x.x_x64.dmg               # DMG для установки (Intel)
snappit_x.x.x_x64.app.tar.gz        # Архив для обновлений
snappit_x.x.x_x64.app.tar.gz.sig    # Подпись

# Файл метаданных для updater:
latest.json
```

### 2.4 Структура latest.json

`tauri-action` автоматически генерирует `latest.json`:

```json
{
  "version": "1.0.1",
  "notes": "Release notes from GitHub release body",
  "pub_date": "2025-01-11T12:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "url": "https://github.com/user/snappit/releases/download/v1.0.1/snappit_1.0.1_aarch64.app.tar.gz",
      "signature": "автоматически заполняется из .sig файла"
    },
    "darwin-x86_64": {
      "url": "https://github.com/user/snappit/releases/download/v1.0.1/snappit_1.0.1_x64.app.tar.gz",
      "signature": "автоматически заполняется из .sig файла"
    }
  }
}
```

### 2.5 Процесс релиза

1. **Обновить версию:**

   ```bash
   # В src-tauri/tauri.conf.json
   "version": "1.0.1"

   # В package.json
   "version": "1.0.1"
   ```

2. **Создать git tag и запушить:**

   ```bash
   git add .
   git commit -m "Release v1.0.1"
   git tag v1.0.1
   git push origin master --tags
   ```

3. **GitHub Actions автоматически:**
   - Соберёт приложение для обеих архитектур
   - Подпишет артефакты
   - Создаст draft release с артефактами
   - Сгенерирует `latest.json`

4. **Опубликовать release:**
   - Перейти в GitHub → Releases
   - Отредактировать описание если нужно
   - Нажать "Publish release"

### 2.6 Endpoint в tauri.conf.json

```json
"plugins": {
  "updater": {
    "endpoints": [
      "https://github.com/YOUR_USERNAME/snappit/releases/latest/download/latest.json"
    ],
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk..."
  }
}
```

### 2.7 Важные моменты

- **Подпись обязательна** - Tauri не позволяет отключить проверку подписи
- **HTTPS** - GitHub Releases уже по HTTPS
- **Версии** - используй semver (1.0.0, 1.0.1, etc.)
- **Draft releases** - релиз создаётся как draft, нужно вручную опубликовать
- **Apple Silicon + Intel** - workflow собирает для обеих архитектур

---

## Полезные ссылки

- [Официальная документация Tauri Updater](https://v2.tauri.app/plugin/updater/)
- [tauri-apps/tauri-action](https://github.com/tauri-apps/tauri-action)
- [tauri-plugin-updater](https://crates.io/crates/tauri-plugin-updater)
