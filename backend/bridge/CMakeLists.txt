cmake_minimum_required(VERSION 3.12)
project(smart_spectra_bridge)

# 1. Standard pybind11 setup
set(pybind11_DIR "C:/Users/justi/Desktop/Synapse/mesh_env/Lib/site-packages/pybind11/share/cmake/pybind11")
find_package(pybind11 REQUIRED)

# 2. Paths to the SDK you just cloned
set(SDK_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/external/SmartSpectra/cpp")

# 3. BUILD THE BRIDGE WITHOUT THE FAILING SDK FILES
# We only compile YOUR bridge.cpp. We will link the SDK as a library later.
pybind11_add_module(smart_spectra_py bridge.cpp)

# 4. Include headers so your code knows what functions exist
target_include_directories(smart_spectra_py PRIVATE "${SDK_ROOT}")

# 5. Tell the compiler to ignore the missing MediaPipe for now
add_definitions(-D_SKIP_MEDIAPIPE)