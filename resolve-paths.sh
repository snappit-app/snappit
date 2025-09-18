#!/bin/sh
# resolve-paths.sh (POSIX /bin/sh)
# Recursively fix macOS .dylib dependencies:
# - Copies external (Homebrew/absolute) deps into DEST_DIR
# - Rewrites references to @rpath/<basename>
# - Iterates until fixed-point, without infinite loops
# - Stops if nothing else can be fixed (pending unresolved deps)
#
# Exit codes:
#   0 = success (no external deps remain)
#   2 = stopped with unresolved deps (nothing else can be done)
#   3 = hit MAX_PASSES
#
# Options:
#   --dry-run         : print actions only
#   --max-passes N    : safety cap (default 10)

set -eu

DRY_RUN=0
VERBOSE=1
MAX_PASSES=10

# -------- parse args --------
while [ $# -gt 0 ]; do
  case "${1-}" in
    --dry-run) DRY_RUN=1; shift ;;
    --max-passes)
      shift
      [ $# -gt 0 ] || { echo "Missing value for --max-passes" >&2; exit 1; }
      MAX_PASSES="$1"; shift ;;
    --) shift; break ;;
    --*) echo "Unknown option: $1" >&2; exit 1 ;;
    *) break ;;
  esac
done

SCAN_DIR="${1:-.}"
DEST_DIR="${2:-./lib-mac}"

log() {
  if [ "$VERBOSE" -eq 1 ]; then
    printf '%s\n' "$*"
  fi
}

do_cp() {
  if [ "$DRY_RUN" -eq 1 ]; then
    log "DRY-RUN: cp -f \"$1\" \"$2\""
  else
    cp -f "$1" "$2"
  fi
}

do_mkdir_p() {
  if [ "$DRY_RUN" -eq 1 ]; then
    log "DRY-RUN: mkdir -p \"$1\""
  else
    mkdir -p "$1"
  fi
}

do_chmod_u_w() {
  if [ "$DRY_RUN" -eq 1 ]; then
    log "DRY-RUN: chmod u+w \"$1\""
  else
    chmod u+w "$1" || true
  fi
}

do_install_id() {
  if [ "$DRY_RUN" -eq 1 ]; then
    log "DRY-RUN: install_name_tool -id \"$1\" \"$2\""
  else
    install_name_tool -id "$1" "$2"
  fi
}

do_change_dep() {
  if [ "$DRY_RUN" -eq 1 ]; then
    log "DRY-RUN: install_name_tool -change \"$1\" \"$2\" \"$3\""
  else
    install_name_tool -change "$1" "$2" "$3"
  fi
}

# -------- env prep --------
[ "$DRY_RUN" -eq 1 ] && log "DRY-RUN mode is ON"
[ -d "$DEST_DIR" ] || do_mkdir_p "$DEST_DIR"

BREW_PREFIX=""
if command -v brew >/dev/null 2>&1; then
  BREW_PREFIX="$(brew --prefix 2>/dev/null || true)"
fi
# space-separated list of prefixes to search
CANDIDATE_PREFIXES="$BREW_PREFIX /opt/homebrew /usr/local"

UNRESOLVED_LIST="$(mktemp)"
: > "$UNRESOLVED_LIST"

CODESIGN_LIST="$(mktemp)"
: > "$CODESIGN_LIST"

if [ "$DRY_RUN" -eq 0 ] && ! command -v codesign >/dev/null 2>&1; then
  echo "codesign command not found" >&2
  exit 1
fi

# -------- helpers --------
find_brew_lib() {
  # $1 = basename (e.g., libtesseract.5.dylib)
  name="$1"
  for p in $CANDIDATE_PREFIXES; do
    [ -n "$p" ] && [ -d "$p" ] || continue
    for sub in "$p/Cellar" "$p/lib" "$p/opt"; do
      [ -d "$sub" ] || continue
      found=$(find "$sub" -maxdepth 6 -name "$name" -print -quit 2>/dev/null || true)
      if [ -n "$found" ]; then
        printf '%s\n' "$found"
        return 0
      fi
    done
  done
  # fallback (slower)
  for base in /opt/homebrew /usr/local; do
    [ -d "$base" ] || continue
    found=$(find "$base" -name "$name" -print -quit 2>/dev/null || true)
    if [ -n "$found" ]; then
      printf '%s\n' "$found"
      return 0
    fi
  done
  return 1
}

list_deps() {
  # print first field of lines 2..end from otool -L
  otool -L "$1" 2>/dev/null | sed -n '2,$p' | awk '{print $1}'
}

copy_and_fix_id() {
  # $1 = src abs path
  src="$1"
  base="$(basename "$src")"
  dst="$DEST_DIR/$base"
  if [ -f "$dst" ]; then
    log "Already present: $base"
  else
    log "Copy: $src -> $dst"
    do_cp "$src" "$dst"
    do_chmod_u_w "$dst"
    idpath="@rpath/$base"
    log "Set install_name (id): $idpath"
    do_install_id "$idpath" "$dst"
  fi
  mark_for_codesign "$dst"
}

change_dep_to_rpath() {
  # $1 = target file, $2 = old path
  target="$1"
  old="$2"
  base="$(basename "$old")"
  new="@rpath/$base"
  # If it's already @rpath/<same>, skip
  case "$old" in
    "@rpath/$base") return 0 ;;
  esac
  log "Rewrite in '$target': $old -> $new"
  do_change_dep "$old" "$new" "$target"
  mark_for_codesign "$target"
}

record_unresolved() {
  # $1 = target file, $2 = dep path, $3 = reason
  printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$UNRESOLVED_LIST"
}

mark_for_codesign() {
  # $1 = path to sign later
  [ -n "${1-}" ] || return 0
  printf '%s\n' "$1" >> "$CODESIGN_LIST"
}

finalize_codesign() {
  [ -n "${CODESIGN_LIST-}" ] || return 0

  if [ -d "$DEST_DIR" ]; then
    # Include every dylib in DEST_DIR to ensure signatures are fresh
    find "$DEST_DIR" -type f -name '*.dylib' -print >> "$CODESIGN_LIST" 2>/dev/null || true
  fi

  if [ ! -s "$CODESIGN_LIST" ]; then
    rm -f "$CODESIGN_LIST"
    return 0
  fi

  UNIQUE_LIST="$(mktemp)"
  sort -u "$CODESIGN_LIST" > "$UNIQUE_LIST"

  if [ "$DRY_RUN" -eq 1 ]; then
    log "DRY-RUN: codesign --force --sign - would run for:"
    while IFS= read -r path; do
      [ -n "$path" ] || continue
      log "  $path"
    done < "$UNIQUE_LIST"
  else
    while IFS= read -r path; do
      [ -n "$path" ] || continue
      [ -e "$path" ] || continue
      log "codesign: $path"
      codesign --force --sign - "$path"
    done < "$UNIQUE_LIST"
  fi

  rm -f "$UNIQUE_LIST" "$CODESIGN_LIST"
}

trap finalize_codesign EXIT

# -------- main fixed-point loop --------
PASS=0
while : ; do
  PASS=$((PASS + 1))
  log "=== Pass #$PASS ==="
  CHANGED=0
  PENDING=0
  : > "$UNRESOLVED_LIST"

  TMP_LIST="$(mktemp)"
  ( find "$SCAN_DIR" "$DEST_DIR" -type f -name '*.dylib' 2>/dev/null || true ) > "$TMP_LIST"

  while IFS= read -r dylib; do
    [ -n "$dylib" ] || continue
    [ -f "$dylib" ] || continue

    log "Processing: $dylib"

    DEPS_TMP="$(mktemp)"
    ( list_deps "$dylib" || true ) > "$DEPS_TMP"

    while IFS= read -r dep; do
      [ -n "${dep:-}" ] || continue

      case "$dep" in
        /usr/lib/*|/System/*)
          # system lib, ignore
          continue
          ;;
      esac

      # Homebrew absolute paths
      case "$dep" in
        /opt/homebrew/*|/usr/local/Cellar/*|/usr/local/lib/*|/usr/local/opt/*)
          if [ -f "$dep" ]; then
            copy_and_fix_id "$dep"
            change_dep_to_rpath "$dylib" "$dep"
            CHANGED=1
          else
            bn="$(basename "$dep")"
            if found="$(find_brew_lib "$bn" 2>/dev/null)"; then
              copy_and_fix_id "$found"
              change_dep_to_rpath "$dylib" "$dep"
              CHANGED=1
            else
              log "Unresolved (Homebrew not found): $dep"
              record_unresolved "$dylib" "$dep" "homebrew-not-found"
              PENDING=1
            fi
          fi
          continue
          ;;
      esac

      # Other absolute non-system paths
      case "$dep" in
        /*)
          if [ -f "$dep" ]; then
            copy_and_fix_id "$dep"
            change_dep_to_rpath "$dylib" "$dep"
            CHANGED=1
          else
            log "Unresolved (absolute missing): $dep"
            record_unresolved "$dylib" "$dep" "absolute-missing"
            PENDING=1
          fi
          continue
          ;;
      esac

      # @rpath
      case "$dep" in
        @rpath/*)
          bn="$(basename "$dep")"
          if [ -f "$DEST_DIR/$bn" ]; then
            # ok
            :
          else
            if found="$(find_brew_lib "$bn" 2>/dev/null)"; then
              copy_and_fix_id "$found"
              CHANGED=1
            else
              log "Unresolved (@rpath not found locally or in brew): $dep"
              record_unresolved "$dylib" "$dep" "rpath-missing"
              PENDING=1
            fi
          fi
          continue
          ;;
      esac

      # @loader_path / @executable_path — try to normalize to @rpath
      case "$dep" in
        @loader_path/*|@executable_path/*)
          bn="$(basename "$dep")"
          if [ -f "$DEST_DIR/$bn" ]; then
            # normalize to @rpath only once; if already @rpath/<bn>, change_dep_to_rpath is a no-op
            change_dep_to_rpath "$dylib" "$dep"
            CHANGED=1
          else
            if found="$(find_brew_lib "$bn" 2>/dev/null)"; then
              copy_and_fix_id "$found"
              change_dep_to_rpath "$dylib" "$dep"
              CHANGED=1
            else
              log "Unresolved (loader/exe path missing): $dep"
              record_unresolved "$dylib" "$dep" "loader-exe-missing"
              PENDING=1
            fi
          fi
          continue
          ;;
      esac

      # Unknown pattern — treat as pending but do not loop forever
      log "Unresolved (unhandled pattern): $dep"
      record_unresolved "$dylib" "$dep" "unhandled-pattern"
      PENDING=1
    done < "$DEPS_TMP"

    rm -f "$DEPS_TMP"
  done < "$TMP_LIST"

  rm -f "$TMP_LIST"

  if [ "$DRY_RUN" -eq 1 ]; then
    log "DRY-RUN: single pass finished."
    if [ -s "$UNRESOLVED_LIST" ]; then
      log "Unresolved dependencies detected (dry-run):"
      awk -F '\t' '{printf "  target=%s | dep=%s | reason=%s\n",$1,$2,$3}' "$UNRESOLVED_LIST"
    fi
    rm -f "$UNRESOLVED_LIST"
    exit 0
  fi

  # Termination logic
  if [ "$CHANGED" -eq 0 ] && [ "$PENDING" -eq 0 ]; then
    log "Done: no external dependencies remain."
    rm -f "$UNRESOLVED_LIST"
    exit 0
  fi

  if [ "$CHANGED" -eq 0 ] && [ "$PENDING" -eq 1 ]; then
    log "Stopped: unresolved dependencies remain, and no further changes are possible."
    awk -F '\t' '{printf "  target=%s | dep=%s | reason=%s\n",$1,$2,$3}' "$UNRESOLVED_LIST"
    rm -f "$UNRESOLVED_LIST"
    exit 2
  fi

  if [ "$PASS" -ge "$MAX_PASSES" ]; then
    log "Stopped: reached MAX_PASSES=$MAX_PASSES."
    if [ -s "$UNRESOLVED_LIST" ]; then
      log "Unresolved dependencies summary:"
      awk -F '\t' '{printf "  target=%s | dep=%s | reason=%s\n",$1,$2,$3}' "$UNRESOLVED_LIST"
    fi
    rm -f "$UNRESOLVED_LIST"
    exit 3
  fi

  log "Changes were made — rescanning..."
done
