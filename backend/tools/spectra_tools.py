import os
import base64
from pathlib import Path
import smart_spectra_py
from typing import Optional
from google.adk.tools import ToolContext
from dotenv import load_dotenv

env_path = "C:/Users/justi/Desktop/Synapse/.env"

load_dotenv(dotenv_path=env_path)
engine_key = os.getenv("SPECTRA_ENGINE_KEY")

if engine_key:
    print(f"✅ Successfully loaded Spectra Key from {env_path}")
else:
    print(f"❌ Failed to find .env at {env_path.resolve()}")
# Initialize the engine once for performance
processor = smart_spectra_py.Processor(engine_key)

async def analyze_vitals(
        raw_signal_b64: str,
        tool_context: Optional[ToolContext] = None,
    ):
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