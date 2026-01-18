import { useEffect, useRef, useState } from 'react';
import solace from 'solace';
import './App.css';

// --- CONFIG ---
const BROKER_URL = "ws://localhost:8008"; 
const VPN_NAME = "default";
const USERNAME = "admin";
const PASSWORD = "admin";

// Topics for Solace Agent Mesh (SAM)
const ORCHESTRATOR_REQ_TOPIC = "sam/request/v1/synapse/OrchestratorAgent";
const ORCHESTRATOR_RES_TOPIC = "sam/response/v1/synapse/OrchestratorAgent/>";

const STUB_VIDEOS = [
  { id: 1, title: "Scenario A: Gaming Minecraft", url: "/videos/video1.mp4" },
  { id: 2, title: "Scenario B: Old School Singing Rock Music", url: "/videos/video2.mp4" },
  { id: 3, title: "Scenario C: Cars and Racing in the rainy city", url: "/videos/video3.mp4" },
  { id: 4, title: "Scenario D: Traditional East Asian Dancing", url: "/videos/video4.mp4" },
  { id: 5, title: "Scenario E: Cartoons and Animation with Ducks and Grandmas", url: "/videos/video5.mp4" },
  { id: 6, title: "Scenario F: Old School Jazz Band Performance", url: "/videos/video6.mp4" },
  { id: 7, title: "Scenario G: Robots and Wires Overload", url: "/videos/video7.mp4" },
  { id: 8, title: "Scenario H: Sourdough Tasty Fresh Bread Baking", url: "/videos/video8.mp4" },
  { id: 9, title: "Scenario I: Fast-Paced Hockey Game Highlights", url: "/videos/video9.mp4" }
];

function App() {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);

  const [logs, setLogs] = useState<string[]>([]);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  // 1. Solace Session & SAM Subscriptions
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

      // Subscribe to SAM Responses
      try {
        const topic = solace.SolclientFactory.createTopicDestination(ORCHESTRATOR_RES_TOPIC);
        session.subscribe(topic, true, "sam_res_sub", 10000);
        addLog("📡 Subscribed to SAM Responses");
      } catch (e) {
        addLog(`❌ Sub Error: ${e}`);
      }
    });

    // Handle Incoming SAM Messages (Results from C++ Specialist)
    session.on(solace.SessionEventCode.MESSAGE, (message: any) => {
      try {
        const payload = JSON.parse(message.getBinaryAttachment());
        // Extracting data from the specialist's response payload
        if (payload.data && payload.data.bpm) {
          setCurrentBpm(payload.data.bpm);
          addLog(`💓 Vitals Detected: ${payload.data.bpm} BPM`);
        }
      } catch (e) {
        console.error("Payload Parse Error", e);
      }
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

  // 3. SAM Publishing Loop (The Stimulus Pipe)
  useEffect(() => {
    if (!isConnected || !sessionRef.current) return;
    
    const interval = setInterval(() => {
      if (isSaving) return;

      if (webcamRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Capture frame for analysis
          ctx.drawImage(webcamRef.current, 0, 0, 320, 240);
          
          // Convert to Base64 (JPEG format for efficient mesh transport)
          const base64Frame = canvasRef.current.toDataURL('image/jpeg', 0.6).split(',')[1];

          try {
            // Construct the SAM Stimulus Object
            const stimulus = {
              text: "Analyze the vitals from this image frame.",
              data: { 
                image_base64: base64Frame,
                user_id: "jim_user_001",
                timestamp: Date.now()
              }
            };

            const msg = solace.SolclientFactory.createMessage();
            const dest = solace.SolclientFactory.createTopicDestination(ORCHESTRATOR_REQ_TOPIC);
            
            msg.setDestination(dest);
            msg.setBinaryAttachment(JSON.stringify(stimulus)); 
            msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
            
            sessionRef.current.send(msg);
          } catch (e) { 
            console.error("SAM Publish Error:", e); 
          }
        }
      }
    }, 1000); // 1 FPS processing is ideal for stable vital sign extraction

    return () => clearInterval(interval);
  }, [isConnected, isSaving]);

  // --- Handlers ---
  const handleNextVideo = () => {
    setIsSaving(true);
    if (mainVideoRef.current) mainVideoRef.current.pause();
    addLog(`💾 Saving session for: ${STUB_VIDEOS[currentVideoIdx].title}`);

    setTimeout(() => {
      const nextIdx = (currentVideoIdx + 1) % STUB_VIDEOS.length;
      setCurrentVideoIdx(nextIdx);
      setIsSaving(false);
      setCurrentBpm(null); // Reset BPM for new scenario
      addLog(`▶️ Starting: ${STUB_VIDEOS[nextIdx].title}`);
    }, 1500);
  };

  useEffect(() => {
    if (mainVideoRef.current) {
      mainVideoRef.current.load();
      mainVideoRef.current.play().catch(e => console.error("Playback error", e));
    }
  }, [currentVideoIdx]);

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="brand">PRESAGE // SENSOR</div>
        
        <div className="webcam-container">
          <video ref={webcamRef} className="webcam-video" playsInline muted />
          <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />
          
          {/* Vitals Overlay */}
          <div className="vitals-monitor">
            <div className={`heart-icon ${currentBpm ? 'pulse' : ''}`}>💓</div>
            <div className="bpm-value">{currentBpm ? currentBpm : '--'}</div>
            <div className="bpm-label">BPM</div>
          </div>

          <div className="status-indicator">
             {isSaving ? 'PAUSED' : '● LIVE SENSING'}
          </div>
        </div>

        <div className="logs-container">
          <div className="logs-header">SYSTEM LOGS</div>
          {logs.map((log, i) => (
            <div key={i} className="log-entry">{log}</div>
          ))}
        </div>
      </div>

      {/* MAIN STAGE */}
      <div className="main-stage">
        {isSaving && (
          <div className="saving-overlay">
            <div className="spinner"></div>
            <div>STABILIZING SENSORS...</div>
          </div>
        )}

        <div className="video-player-frame">
          <video 
            ref={mainVideoRef}
            className="main-video"
            src={STUB_VIDEOS[currentVideoIdx].url}
            loop
          />
        </div>

        <div className="video-controls">
          <div className="video-info">
            <h2>{STUB_VIDEOS[currentVideoIdx].title}</h2>
            <p>ID: #{STUB_VIDEOS[currentVideoIdx].id} // MESH_ACTIVE: {isConnected ? 'YES' : 'NO'}</p>
          </div>
          <button className="btn-next" onClick={handleNextVideo} disabled={isSaving}>
            Next Scenario &gt;&gt;
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;