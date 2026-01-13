fn main() {
    // Set rpath for macOS to find bundled dylibs at runtime
    #[cfg(target_os = "macos")]
    {
        #[cfg(debug_assertions)]
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/resources/lib-mac");

        #[cfg(not(debug_assertions))]
        println!("cargo:rustc-link-arg=-Wl,-rpath,@executable_path/../Resources/resources/lib-mac");
    }

    tauri_build::build()
}
