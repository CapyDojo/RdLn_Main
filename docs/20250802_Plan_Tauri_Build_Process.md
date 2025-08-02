# 20250802_Plan_Tauri_Build_Process

This document outlines the steps for a clean and reliable Tauri build process for the RdLn application.

## 1. Aggressive Cleanup

To ensure a clean build environment, remove all potentially problematic directories and files:

```bash
rd /s /q src-tauri\target
rd /s /q node_modules
rd /s /q dist
del package-lock.json
```

## 2. Dependency Modernization

Update Tauri dependencies to the latest stable versions.

### `package.json`

Ensure `@tauri-apps/cli` and `@tauri-apps/api` are updated to their latest versions. (As of 2025-08-02, these were already up-to-date).

### `src-tauri/Cargo.toml`

Update `tauri` and `tauri-build` versions to the latest from crates.io.

```toml
# Before
[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.0", features = [] }

# After (as of 2025-08-02)
tauri-build = { version = "2.3.1", features = [] }

[dependencies]
tauri = { version = "2.7.0", features = [] }
```

## 3. Configuration Streamlining

Adjust `tauri.conf.json` to specify the desired bundle target. For Windows, `msi` is recommended.

```json
// Before
"bundle": {
  "active": true,
  "targets": "all",
  // ...
}

// After
"bundle": {
  "active": true,
  "targets": ["msi"],
  // ...
}
```

## 4. The Build

### Install npm dependencies

```bash
npm install
```

### Build the Tauri application

```bash
npm run tauri build
```

The generated MSI installer will be located in `src-tauri\target\release\bundle\msi\`.
