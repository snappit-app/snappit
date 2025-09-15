#!/usr/bin/env bash
set -euo pipefail

LIBDIR="src-tauri/resources/lib-mac"
mkdir -p "$LIBDIR"

copy_if_missing () {
  local src="$1"
  local dst="$LIBDIR/$(basename "$src")"
  if [[ ! -f "$dst" ]]; then
    cp "$src" "$dst"
    echo "Copied: $src -> $dst"
  fi
}

copy_if_missing /opt/homebrew/opt/tesseract/lib/libtesseract.5.dylib
copy_if_missing /opt/homebrew/opt/leptonica/lib/libleptonica.6.dylib
copy_if_missing /opt/homebrew/opt/libarchive/lib/libarchive.13.dylib

copy_if_missing /opt/homebrew/opt/xz/lib/liblzma.5.dylib
copy_if_missing /opt/homebrew/opt/zstd/lib/libzstd.1.dylib
copy_if_missing /opt/homebrew/opt/lz4/lib/liblz4.1.dylib
copy_if_missing /opt/homebrew/opt/libb2/lib/libb2.1.dylib

copy_if_missing /opt/homebrew/opt/libpng/lib/libpng16.16.dylib
copy_if_missing /opt/homebrew/opt/jpeg-turbo/lib/libjpeg.8.dylib
copy_if_missing /opt/homebrew/opt/giflib/lib/libgif.dylib
copy_if_missing /opt/homebrew/opt/libtiff/lib/libtiff.6.dylib
copy_if_missing /opt/homebrew/opt/webp/lib/libwebp.7.dylib
copy_if_missing /opt/homebrew/opt/webp/lib/libwebpmux.3.dylib
copy_if_missing /opt/homebrew/opt/openjpeg/lib/libopenjp2.7.dylib

pushd "$LIBDIR" >/dev/null

for f in *.dylib; do
  install_name_tool -id "@rpath/$f" "$f" || true
done

install_name_tool -change "/opt/homebrew/opt/leptonica/lib/libleptonica.6.dylib" "@rpath/libleptonica.6.dylib" libtesseract.5.dylib || true
install_name_tool -change "/opt/homebrew/opt/libarchive/lib/libarchive.13.dylib" "@rpath/libarchive.13.dylib" libtesseract.5.dylib || true

install_name_tool -change "/opt/homebrew/opt/xz/lib/liblzma.5.dylib"   "@rpath/liblzma.5.dylib"   libarchive.13.dylib || true
install_name_tool -change "/opt/homebrew/opt/zstd/lib/libzstd.1.dylib" "@rpath/libzstd.1.dylib"   libarchive.13.dylib || true
install_name_tool -change "/opt/homebrew/opt/lz4/lib/liblz4.1.dylib"   "@rpath/liblz4.1.dylib"    libarchive.13.dylib || true
install_name_tool -change "/opt/homebrew/opt/libb2/lib/libb2.1.dylib"  "@rpath/libb2.1.dylib"     libarchive.13.dylib || true

install_name_tool -change "/opt/homebrew/opt/libpng/lib/libpng16.16.dylib"   "@rpath/libpng16.16.dylib"   libleptonica.6.dylib || true
install_name_tool -change "/opt/homebrew/opt/jpeg-turbo/lib/libjpeg.8.dylib" "@rpath/libjpeg.8.dylib"     libleptonica.6.dylib || true
install_name_tool -change "/opt/homebrew/opt/giflib/lib/libgif.dylib"        "@rpath/libgif.dylib"        libleptonica.6.dylib || true
install_name_tool -change "/opt/homebrew/opt/libtiff/lib/libtiff.6.dylib"    "@rpath/libtiff.6.dylib"     libleptonica.6.dylib || true
install_name_tool -change "/opt/homebrew/opt/webp/lib/libwebp.7.dylib"       "@rpath/libwebp.7.dylib"     libleptonica.6.dylib || true
install_name_tool -change "/opt/homebrew/opt/webp/lib/libwebpmux.3.dylib"    "@rpath/libwebpmux.3.dylib"  libleptonica.6.dylib || true
install_name_tool -change "/opt/homebrew/opt/openjpeg/lib/libopenjp2.7.dylib" "@rpath/libopenjp2.7.dylib" libleptonica.6.dylib || true

ln -sf libtesseract.5.dylib  libtesseract.dylib
ln -sf libleptonica.6.dylib  libleptonica.dylib
ln -sf libarchive.13.dylib   libarchive.dylib

popd >/dev/null

echo "✓ Done. Now re-run build. Check RPATHs in your build.rs and tauri.conf.json."