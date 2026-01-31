# CalChart Viewer - CMake Integration

This directory contains a `CMakeLists.txt` that allows calchart-viewer to be built as part of a CMake-based project while maintaining its Node.js/npm/grunt workflow.

## Usage in a CMake Project

### As a Subdirectory (Git Submodule)

```cmake
add_subdirectory(viewer)
# The viewer assets will be built automatically
# Variables available: CALCHART_VIEWER_SOURCE_DIR, CALCHART_VIEWER_BUILD_DIR
```

### With FetchContent

```cmake
include(FetchContent)
FetchContent_Declare(
  calchart-viewer
  GIT_REPOSITORY https://github.com/calband/calchart-viewer
  GIT_TAG main
)
FetchContent_MakeAvailable(calchart-viewer)
```

## Requirements

- Node.js and npm must be installed
- CMake will automatically:
  - Run `npm install` to fetch dependencies
  - Run `npm run build` to build the viewer assets
  - Create build outputs in `build/js/` and `build/css/`

## Build Outputs

- `build/js/application.js` - Main application JavaScript
- `build/css/app.css` - Main application CSS
- `build/css/graph.css` - Graph rendering CSS
- Additional CSS and JS files

## Development

For active development with live rebuilding:

```bash
cd viewer
npm install
npm run watch  # or: grunt watch
```

This CMake integration doesn't interfere with the normal npm/grunt workflow.
