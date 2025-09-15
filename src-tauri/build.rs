fn main() {
    #[cfg(all(target_os = "macos", debug_assertions))]
    println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../../resources/lib-mac");

    #[cfg(all(target_os = "macos", not(debug_assertions)))]
    println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../Resources/lib-mac");

    tauri_build::build()
}
