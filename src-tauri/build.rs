fn main() {
    // macOS dev mode 의 raw Mach-O 는 .app bundle 의 Info.plist 를 못 쓰므로
    // __TEXT,__info_plist section 으로 같은 plist 를 binary 에 직접 박는다.
    // (tauri build 시점의 bundle Info.plist 는 tauri-build 가 별도로 처리)
    #[cfg(target_os = "macos")]
    {
        let plist = std::path::Path::new(&std::env::var("CARGO_MANIFEST_DIR").unwrap())
            .join("Info.plist");
        println!("cargo:rerun-if-changed={}", plist.display());
        println!(
            "cargo:rustc-link-arg=-Wl,-sectcreate,__TEXT,__info_plist,{}",
            plist.display()
        );
    }

    tauri_build::build()
}
