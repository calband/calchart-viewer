cmake_minimum_required(VERSION 3.11)
project(calchart-viewer NONE)

# This CMakeLists.txt allows calchart-viewer to be built as part of a CMake project
# while maintaining its Node.js/npm/grunt workflow.

find_program(NODE_EXECUTABLE NAMES node nodejs)
find_program(NPM_EXECUTABLE NAMES npm)

if(NOT NODE_EXECUTABLE OR NOT NPM_EXECUTABLE)
    message(WARNING "Node.js or npm not found. CalChart Viewer will not be built.")
    message(WARNING "  Install Node.js from https://nodejs.org/ to enable the viewer.")
    return()
endif()

message(STATUS "CalChart Viewer: Found Node.js: ${NODE_EXECUTABLE}")
message(STATUS "CalChart Viewer: Found npm: ${NPM_EXECUTABLE}")

set(VIEWER_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR})
set(VIEWER_BUILD_DIR ${CMAKE_CURRENT_SOURCE_DIR}/build)
set(VIEWER_NODE_MODULES ${CMAKE_CURRENT_SOURCE_DIR}/node_modules)
set(VIEWER_PACKAGE_JSON ${CMAKE_CURRENT_SOURCE_DIR}/package.json)

# Output files we're building
set(VIEWER_JS ${VIEWER_BUILD_DIR}/js/application.js)
set(VIEWER_CSS ${VIEWER_BUILD_DIR}/css/app.css)

# Step 1: Install npm dependencies
add_custom_command(
    OUTPUT ${VIEWER_NODE_MODULES}/.npm-install-stamp
    COMMAND ${NPM_EXECUTABLE} install
    COMMAND ${CMAKE_COMMAND} -E make_directory ${VIEWER_NODE_MODULES}
    COMMAND ${CMAKE_COMMAND} -E touch ${VIEWER_NODE_MODULES}/.npm-install-stamp
    WORKING_DIRECTORY ${VIEWER_SOURCE_DIR}
    DEPENDS ${VIEWER_PACKAGE_JSON}
    COMMENT "CalChart Viewer: Installing npm dependencies..."
    VERBATIM
)

add_custom_target(calchart_viewer_npm_install
    DEPENDS ${VIEWER_NODE_MODULES}/.npm-install-stamp
)

# Step 2: Build viewer assets (JS and CSS)
# Use npm run build which internally calls grunt - this works cross-platform
# Add --verbose to get detailed error messages on failure
# Ensure build directories exist first
add_custom_command(
    OUTPUT ${VIEWER_JS} ${VIEWER_CSS}
    COMMAND ${CMAKE_COMMAND} -E make_directory ${VIEWER_BUILD_DIR}/js
    COMMAND ${CMAKE_COMMAND} -E make_directory ${VIEWER_BUILD_DIR}/css
    COMMAND ${NPM_EXECUTABLE} run build -- --verbose
    WORKING_DIRECTORY ${VIEWER_SOURCE_DIR}
    DEPENDS calchart_viewer_npm_install ${VIEWER_NODE_MODULES}/.npm-install-stamp
    COMMENT "CalChart Viewer: Building assets (JavaScript and CSS)..."
    VERBATIM
)

# Main target that external projects can depend on
add_custom_target(calchart_viewer_assets ALL
    DEPENDS ${VIEWER_JS} ${VIEWER_CSS}
)

# Export variables for parent project
set(CALCHART_VIEWER_SOURCE_DIR ${VIEWER_SOURCE_DIR} PARENT_SCOPE)
set(CALCHART_VIEWER_BUILD_DIR ${VIEWER_BUILD_DIR} PARENT_SCOPE)
set(CALCHART_VIEWER_BUILT TRUE PARENT_SCOPE)

message(STATUS "CalChart Viewer: Configured to build at ${VIEWER_BUILD_DIR}")
