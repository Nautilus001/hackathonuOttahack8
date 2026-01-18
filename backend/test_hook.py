try:
    import smart_spectra_py
    print("✅ Success: Python found the C++ module.")
    
    # Instantiate the class defined in bridge.cpp
    processor = smart_spectra_py.Processor()
    print("✅ Success: C++ Processor class instantiated.")
    
    # Check if the initialization method works
    # Use a dummy key or your actual Presage key
    status = processor.initialize("TEST_KEY")
    print(f"✅ Success: SDK initialized with status: {status}")

except ImportError as e:
    print(f"❌ Error: Could not find smart_spectra_py. Check if the .pyd file is in this folder. {e}")
except Exception as e:
    print(f"❌ Error: The module was found but failed to run: {e}")