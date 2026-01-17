import { useEffect, useRef, useState } from 'react';
import solace from 'solace';
import './App.css';

// --- CONFIG ---
const BROKER_URL = "ws://localhost:8008"; 
const VPN_NAME = "default";
const USERNAME = "admin";
const PASSWORD = "admin";

// Stubbed Video Data
const STUB_VIDEOS = [
  { 
    id: 1, 
    title: "Scenario A: Gaming Minecraft", 
    url: "/videos/video1.mp4"
  },
  { 
    id: 2, 
    title: "Scenario B: Old School Singing Rock Music", 
    url: "/videos/video2.mp4" 
  },
  { 
    id: 3, 
    title: "Scenario C: Cars and Racing in the rainy city", 
    url: "/videos/video3.mp4" 
  }
  { 
    id: 4, 
    title: "Scenario D: Traditional East Asian Dancing", 
    url: "/videos/video4.mp4" 
  }
  { 
    id: 5, 
    title: "Scenario E: Cartoons and Animation with Ducks and Grandmas", 
    url: "/videos/video5.mp4" 
  }
  { 
    id: 6, 
    title: "Scenario F: Old School Jazz Band Performance", 
    url: "/videos/video6.mp4" 
  }
  { 
    id: 7, 
    title: "Scenario G: Robots and Wires Overload", 
    url: "/videos/video7.mp4" 
  }
  { 
    id: 8, 
    title: "Scenario H: Sourdough Tasty Fresh Bread Baking", 
    url: "/videos/video8.mp4" 
  }
  { 
    id: 9, 
    title: "Scenario H: Fast-Paced Action Filled Hockey Game Highlights", 
    url: "/videos/video9.mp4" 
  }
];

function App() {
  // --- Refs ---
  const webcamRef = useRef<HTMLVideoElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);

  // --- State ---
  const [logs, setLogs] = useState<string[]>([]);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Helper to add logs
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  // 1. Solace Init (Same as before)
  useEffect(() => {
    const factoryProps = new solace.SolclientFactoryProperties();
    factoryProps.profile = solace.SolclientFactoryProfiles.version10;
    solace.SolclientFactory.init(factoryProps);

    const session = solace.SolclientFactory.createSession({
      url: BROKER_URL,
      vpnName: VPN_NAME,
      userName: USERNAME,
      password: PASSWORD,
    });

    session.on(solace.SessionEventCode.UP_NOTICE, () => {
      addLog("✅ Solace Connected");
      setIsConnected(true);
    });

    session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (e: any) => {
      addLog(`❌ Connect Failed: ${e.message}`);
    });

    try {
      session.connect();
      sessionRef.current = session;
    } catch (e) {
      addLog(`Init Error: ${e}`);
    }

    return () => { if (sessionRef.current) sessionRef.current.disconnect(); };
  }, []);

  // 2. Webcam Setup
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          webcamRef.current.play().catch(console.error);
        }
        addLog("📷 Webcam Active");
      })
      .catch(err => addLog(`❌ Webcam Fail: ${err.message}`));
  }, []);

  // 3. Publishing Loop (Sends Webcam frames to Solace)
  useEffect(() => {
    if (!isConnected || !sessionRef.current) return;
    
    const interval = setInterval(() => {
      // Only publish if NOT in "Saving" state
      if (isSaving) return;

      if (webcamRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(webcamRef.current, 0, 0, 320, 240);
          canvasRef.current.toBlob(async (blob) => {
            if (!blob) return;
            try {
              const buffer = await blob.arrayBuffer();
              const msg = solace.SolclientFactory.createMessage();
              const dest = solace.SolclientFactory.createTopicDestination("video/stream/user_jim");
              msg.setDestination(dest);
              msg.setBinaryAttachment(buffer);
              msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
              sessionRef.current.send(msg);
            } catch (e) { console.error(e); }
          }, 'image/jpeg', 0.5);
        }
      }
    }, 200); // 5 FPS

    return () => clearInterval(interval);
  }, [isConnected, isSaving]);

  // --- Handlers ---

  const handleNextVideo = () => {
    // 1. Pause everything
    setIsSaving(true);
    if (mainVideoRef.current) mainVideoRef.current.pause();
    addLog(`💾 Saving session data for: ${STUB_VIDEOS[currentVideoIdx].title}`);

    // 2. Simulate Save Delay (1.5s)
    setTimeout(() => {
      // 3. Move to next video
      const nextIdx = (currentVideoIdx + 1) % STUB_VIDEOS.length;
      setCurrentVideoIdx(nextIdx);
      setIsSaving(false);
      addLog(`▶️ Starting: ${STUB_VIDEOS[nextIdx].title}`);
    }, 1500);
  };

  // Auto-play main video when index changes
  useEffect(() => {
    if (mainVideoRef.current) {
      mainVideoRef.current.load();
      mainVideoRef.current.play().catch(e => console.error("Auto-play prevented", e));
    }
  }, [currentVideoIdx]);


  // --- RENDER ---
  return (
    <div className="app-container">
      
      {/* SIDEBAR: Sensor & Logs */}
      <div className="sidebar">
        <div className="brand">PRESAGE // SENSOR</div>
        
        <div className="webcam-container">
          <video ref={webcamRef} className="webcam-video" playsInline muted />
          <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />
          <div style={{ position: 'absolute', top: 5, right: 5, color: isSaving ? 'gray' : 'red', fontSize: '0.8rem' }}>
             {isSaving ? 'PAUSED' : '● LIVE'}
          </div>
        </div>

        <div className="logs-container">
          <div style={{ borderBottom: '1px solid #333', marginBottom: 5 }}>SYSTEM LOGS</div>
          {logs.map((log, i) => (
            <div key={i} className="log-entry">{log}</div>
          ))}
        </div>
      </div>

      {/* MAIN STAGE: Stubbed Video Feed */}
      <div className="main-stage">
        
        {isSaving && (
          <div className="saving-overlay">
            <div className="spinner"></div>
            <div>SAVING SESSION DATA...</div>
            <div style={{fontSize: '0.9rem', color: '#888', marginTop: 10}}>Writing to local storage</div>
          </div>
        )}

        <div className="video-player-frame">
          <video 
            ref={mainVideoRef}
            className="main-video"
            src={STUB_VIDEOS[currentVideoIdx].url}
            controls={false} // Hide default controls to force use of our flow
            loop
          />
        </div>

        <div className="video-controls">
          <div className="video-info">
            <h2>{STUB_VIDEOS[currentVideoIdx].title}</h2>
            <p>ID: #{STUB_VIDEOS[currentVideoIdx].id} // SEQUENCE: 00{currentVideoIdx + 1}</p>
          </div>
          <button className="btn-next" onClick={handleNextVideo} disabled={isSaving}>
            Next Video &gt;&gt;
          </button>
        </div>

      </div>

    </div>
  );
}

export default App;