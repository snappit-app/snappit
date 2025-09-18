use std::{env, path::PathBuf};

fn main() {
    #[cfg(target_os = "macos")]
    {
        let manifest_dir =
            PathBuf::from(env::var("CARGO_MANIFEST_DIR").expect("Missing manifest dir"));
        let lib_dir = manifest_dir.join("resources").join("lib-mac");

        println!("cargo:rerun-if-changed={}", lib_dir.display());
        println!("cargo:rustc-link-search=native={}", lib_dir.display());

        #[cfg(debug_assertions)]
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/resources/lib-mac");

        #[cfg(not(debug_assertions))]
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../Resources/resources/lib-mac");
    }

    tauri_build::build()
}
