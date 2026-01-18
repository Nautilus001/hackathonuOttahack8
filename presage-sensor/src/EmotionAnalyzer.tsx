import React, { useRef, useEffect, useState } from 'react';

// ⚠️ HACKATHON WARNING: This exposes your API key to anyone inspecting the network tab.
// For production, you should proxy this through your Python backend.
const LUXAND_TOKEN = "589fcae269b3457fb72d35f3766fbe89"; 

const EmotionAnalyzer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasAnalyzed = useRef(false); // The lock to ensure 1 call per session
  const [emotions, setEmotions] = useState(null);

  // 1. Start the Camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };
    startCamera();
  }, []);

  // 2. The Logic: Wait 3 seconds, then Capture & Send
  const handleVideoPlay = () => {
    if (hasAnalyzed.current) return; // Stop if we already did it

    console.log("⏳ Video started. Waiting 3 seconds to analyze emotions...");
    
    setTimeout(() => {
      if (videoRef.current && !hasAnalyzed.current) {
        captureAndAnalyze(videoRef.current);
        hasAnalyzed.current = true; // Lock it immediately
      }
    }, 3000); // 3000ms = 3 seconds delay
  };

  // 3. Capture Frame and Call API
  const captureAndAnalyze = (videoElement: HTMLVideoElement) => {
    // Create a temporary canvas to grab the frame
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (ctx) {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to Blob (like a file)
      canvas.toBlob((blob) => {
        if (blob) {
          sendToLuxand(blob);
        }
      }, "image/jpeg");
    }
  };

  // 4. The API Call (Translated from your Python code)
  const sendToLuxand = async (imageBlob: Blob) => {
    console.log("📸 Sending frame to Luxand...");
    
    const formData = new FormData();
    formData.append("photo", imageBlob); // 'photo' is the key Luxand expects

    try {
      const response = await fetch("https://api.luxand.cloud/photo/emotions", {
        method: "POST",
        headers: {
          "token": "589fcae269b3457fb72d35f3766fbe89", // Custom header expected by Luxand
          // Note: Do NOT set 'Content-Type'. The browser sets it automatically for FormData.
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Emotion Results:", data);
        setEmotions(data);
      } else {
        console.error("❌ Luxand Error:", await response.text());
      }
    } catch (error) {
      console.error("❌ Network Error:", error);
    }
  };

  return (
    <div className="relative">
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        onPlay={handleVideoPlay} // This triggers the timer
        className="w-full rounded-lg"
      />
      {emotions && (
        <div className="absolute top-2 left-2 bg-black/70 text-white p-2 rounded">
          <pre className="text-xs">{JSON.stringify(emotions, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default EmotionAnalyzer;