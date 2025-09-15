// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // let lib_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap())
    //     .join("resources")
    //     .join("lib-mac");

    // if lib_dir.exists() {
    //     println!("cargo:rustc-link-search=native={}", lib_dir.display());
    //     println!("cargo:rustc-link-lib=dylib=tesseract");
    //     println!("cargo:rustc-link-lib=dylib=leptonica");

    //     println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../Resources");
    //     println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../Resources/lib/mac");
    // }

    text_snap_lib::run()
}
