import { useEffect, useRef, useState } from 'react';
import solace from 'solace';
import './App.css';

// --- CONFIG ---
const BROKER_URL = "ws://localhost:8008"; 
const VPN_NAME = "default";
const USERNAME = "admin";
const PASSWORD = "admin";
const USER_DISPLAY_NAME = "KARL"; 
const USER_AVATAR = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop"; 
const ORCHESTRATOR_RES_TOPIC = "sam/response";
const FACEPP_URL = "https://api-us.faceplusplus.com/facepp/v3/detect";

// ⚠️ HACKATHON WARNING: Exposing API keys in frontend code is risky for production.
// Ensure you rotate this key after the event.
const API_KEY = "XquYAfouNoR_6aGeJ-pEcSk2JX-poFSD"; 
const API_SECRET="1__vAMTR29tx54M8aOPPoXzB3e2hY018";

// 1. UPDATED VIDEO LIST
const STUB_VIDEOS = [
  { id: 1, title: "Scenario A: Gaming Minecraft", url: "/videos/video1.mp4" },
  { id: 2, title: "Scenario B: Old School Singing Rock Music", url: "/videos/video2.mp4" },
  { id: 3, title: "Scenario C: Cars and Racing in the rainy city", url: "/videos/video3.mp4" },
  { id: 4, title: "Scenario D: Traditional East Asian Dancing", url: "/videos/video4.mp4" },
  { id: 5, title: "Scenario E: Cartoons and Animation with Ducks and Grandmas", url: "/videos/video5.mp4" },
  { id: 6, title: "Scenario F: Old School Jazz Band Performance", url: "/videos/video6.mp4" },
  { id: 7, title: "Scenario G: Robots and Wires Overload", url: "/videos/video7.mp4" },
  { id: 8, title: "Scenario H: Sourdough Tasty Fresh Bread Baking", url: "/videos/video8.mp4" },
  { id: 9, title: "Scenario I: Fast-Paced Action Filled Hockey Game Highlights", url: "/videos/video9.mp4" }
];

// 2. MOCK PRODUCT DATA
const MOCK_PRODUCTS = [
  { 
    id: 1, 
    name: "Noise Cancelling Headphones", 
    price: "$54.99", 
    category: "Focus", 
    image: "/products/headphones.jpg",
    link: "https://www.amazon.ca/soundcore-Cancelling-Headphones-Bluetooth-Transparency/dp/B0F4884LN3" 
  },
  { 
    id: 2, 
    name: "Smart LED Therapy Lamp", 
    price: "$52.99", 
    category: "Wellness", 
    image: "/products/lamp.jpg",
    link: "https://www.amazon.ca/Verilux-HappyLight%C2%AE-Adjustable-Brightness-Countdown/dp/B08BCLLYN5"

  },
  { 
    id: 3, 
    name: "Ergonomic Mesh Chair", 
    price: "$289.99", 
    category: "Comfort", 
    image: "/products/chair.jpg",
    link: "https://www.amazon.ca/ELABEST-Office-Ergonomic-Computer-Sturdy/dp/B0BKT1NR68"
  },
  { 
    id: 4, 
    name: "Organic Calming Chamomile Tea", 
    price: "$6.99", 
    category: "Wellness",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500",
    link: "https://davidstea.com/products/organic-calming-chamomile-tea"
  },
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
  const [showProfile, setShowProfile] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>
  ("Analyzing...");
  const [emotionStrength, setEmotionStrength] = useState(1);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  // --- LUXAND API INTEGRATION ---
  
  // 1. Capture Frame and Trigger API
  const captureAndAnalyzeEmotion = () => {
    if (webcamRef.current) {
      const videoElement = webcamRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d");
      
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            sendToFacePlusPlus(blob);
          }
        }, "image/jpeg", 0.8);
      }
    }
  };

  // 2. Send to API
  const sendToFacePlusPlus = async (imageBlob: Blob) => {
    addLog("📸 Sending frame to Face++...");

    const formData = new FormData();
    formData.append("api_key","XquYAfouNoR_6aGeJ-pEcSk2JX-poFSD");
    formData.append("api_secret", "1__vAMTR29tx54M8aOPPoXzB3e2hY018");
    formData.append("image_file", imageBlob);
    // We must explicitly ask for 'emotion' return attributes
    formData.append("return_attributes", "emotion"); 

    try {
      const response = await fetch("https://api-us.faceplusplus.com/facepp/v3/detect", {
        method: "POST",
        body: formData, 
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.faces && data.faces.length > 0) {
          // Face++ returns an object with percentages for all emotions
          const emotionsObj = data.faces[0].attributes.emotion;
          
          // Find the emotion with the highest value
          const dominant = Object.keys(emotionsObj).reduce((a, b) => 
            emotionsObj[a] > emotionsObj[b] ? a : b
          );

          setCurrentEmotion(dominant.toUpperCase());
          addLog(`Emotion Detected: ${dominant.toUpperCase()} (${emotionsObj[dominant]}%)`);
          setEmotionStrength( emotionsObj[dominant] / 10);        
        } else {
          addLog("⚠️ No face detected.");
          setCurrentEmotion("NO FACE");
        }
      } else {
        console.error("Face++ Error:", await response.text());
      }
    } catch (error) {
      console.error("Network Error:", error);
    }
  };

  // 3. Trigger Logic: Watch for Scenario Change
  useEffect(() => {
    // Reset emotion display when video changes
    setCurrentEmotion("Analyzing...");
    
    // Wait 3 seconds after new video starts, then capture
    const timerId = setTimeout(() => {
      console.log("⏰ 3 seconds passed, triggering emotion check...");
      captureAndAnalyzeEmotion();
    }, 3000);

    // Cleanup: If user skips video before 3s, cancel the timer
    return () => clearTimeout(timerId);
  }, [currentVideoIdx]); // Re-run whenever currentVideoIdx changes


  // --- SOLACE INIT ---
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

      try {
        const topic = solace.SolclientFactory.createTopicDestination(ORCHESTRATOR_RES_TOPIC);
        session.subscribe(topic, true, "sam_res_sub", 10000);
        addLog("📡 Subscribed to SAM Responses");
      } catch (e) {
        addLog(`❌ Sub Error: ${e}`);
      }
    });

    session.on(solace.SessionEventCode.MESSAGE, (message: any) => {
      try {
        const payload = JSON.parse(message.getBinaryAttachment());
        if (payload.data && payload.data.bpm) {
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

  // --- WEBCAM INIT ---
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

  // --- STREAMING LOOP (VITALS) ---
  useEffect(() => {
    if (!isConnected || !sessionRef.current) return;
    
    const interval = setInterval(() => {
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
              const dest = solace.SolclientFactory.createTopicDestination(`video/stream/${USER_DISPLAY_NAME.toLowerCase()}`);
              msg.setDestination(dest);
              msg.setBinaryAttachment(buffer);
              msg.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
              sessionRef.current.send(msg);
            } catch (e) { console.error(e); }
          }, 'image/jpeg', 0.5);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isConnected, isSaving]);

  // --- HANDLERS ---
  const handleNextVideo = () => {
    setIsSaving(true);
    if (mainVideoRef.current) mainVideoRef.current.pause();
    addLog(`💾 Saving session for: ${STUB_VIDEOS[currentVideoIdx].title}`);

    setTimeout(() => {
      const nextIdx = (currentVideoIdx + 1) % STUB_VIDEOS.length;
      setCurrentVideoIdx(nextIdx);
      setIsSaving(false);
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
        <div className="brand">SYNAPSE</div>
        
        <div className="webcam-container">
          <video ref={webcamRef} className="webcam-video" playsInline muted />
          <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }} />

          <div className="vitals-monitor">
            <div style={{fontSize: '3.5rem', marginBottom: '10px'}}>
              {/* Emoji Logic remains here */}
              {currentEmotion === "HAPPINESS" ? "😄" : 
              currentEmotion === "SADNESS" ? "😢" : 
              currentEmotion === "ANGER" ? "😠" : 
              currentEmotion === "SURPRISE" ? "😲" : "😐"}
            </div>
            
            <div className="emotion" style={{fontSize: '1.4rem'}}>
              {currentEmotion}
            </div>
            <div className="sentiment">SENTIMENT ANALYTICS</div>
            <div style={{fontSize: '0.7rem', color: 'var(--primary)', marginTop: '5px'}}>
              SENSING VIA FACE++
            </div>
          </div>
        </div>

        <div className="logs-container">
          <div className="logs-header">SYSTEM LOGS</div>
          {logs.map((log, i) => (
            <div key={i} className="log-entry">{log}</div>
          ))}
        </div>

        <button className="btn-profile" onClick={() => setShowProfile(true)}>
            <span>👤 User Profile</span>
        </button>
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
            controls={false}
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
          <button 
            onClick={captureAndAnalyzeEmotion}
            style={{ background: 'var(--primary)', color: 'white', padding: '10px', marginTop: '10px' }}
          >
            Force Emotion Check
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                
                <div className="modal-header">
                    <div className="modal-header-content">
                        <img src={USER_AVATAR} alt="Karl Profile" className="profile-avatar" />
                        <h2>Subject Analysis: {USER_DISPLAY_NAME}</h2>
                    </div>
                    <button className="btn-close" onClick={() => setShowProfile(false)}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="analysis-summary">
                      <div className="stat-card">
                          <div className="stat-label">Emotion Strength</div>
                          <div className="stat-value">{emotionStrength}</div>
                      </div>
                      <div className="stat-card" style={{border: '1px solid #00ff00'}}>
                          <div className="stat-label">Market Value (USD)</div>
                          <div className="stat-value" style={{color: '#00ff00'}}>
                              {/* Logic: Higher value for non-neutral emotions */}
                              {0.89*emotionStrength}
                          </div>
                          <div style={{fontSize: '0.6rem'}}>Current Bidding Active</div>
                      </div>
                      <div className="stat-card">
                          <div className="stat-label">Data Tier</div>
                          <div className="stat-value">PREMIUM</div>
                      </div>
                  </div>

                    <h3 style={{color: 'var(--primary)', borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                        RECOMMENDED PRODUCTS (SAM GENERATED/YELLOWCAKE SCRAPED)
                    </h3>
                    
                    <div className="products-grid">
                        {MOCK_PRODUCTS.map(product => (
                            <div key={product.id} className="product-card">
                                <a href={product.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', cursor: 'pointer' }}>
                                    <img src={product.image} alt={product.name} className="product-image" />
                                </a>

                                <div className="product-info">
                                    <div className="product-title">{product.name}</div>
                                    <div className="product-price">{product.price}</div>
                                    <div style={{fontSize: '0.7rem', color: '#666', marginTop: '5px'}}>
                                        Match: {product.category}
                                    </div>
                                    <a href={product.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                        <button className="btn-buy">VIEW PRODUCT</button>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      )}

    </div>
  );
}

export default App;