import smart_spectra_py
import base64

# Initialize the engine once for performance
processor = smart_spectra_py.Processor("YOUR_KEY_HERE")

def analyze_vitals(raw_signal_b64: str):
    """
    SAM Tool: Decodes data and runs the C++ local inference engine.
    """
    try:
        # Decode the data coming from the React Frontend
        raw_data = base64.b64decode(raw_signal_b64)
        
        # Call your successfully bridged C++ method
        result = processor.process_frame(raw_data)
        
        return {
            "bpm": result,
            "status": "locally_processed",
            "agent": "Vitals Specialist"
        }
    except Exception as e:
        return {"error": str(e)}