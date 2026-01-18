import { useEffect, useRef, useState } from 'react';
import solace from 'solace';
import './App.css';

// --- CONFIG ---
const BROKER_URL = "ws://localhost:8008"; 
const VPN_NAME = "default";
const USERNAME = "admin";
const PASSWORD = "admin";
const USER_DISPLAY_NAME = "KARL"; // Updated Name
const USER_AVATAR = "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop"; // Karl's Photo

// 1. UPDATED VIDEO LIST
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
  },
  { 
    id: 4, 
    title: "Scenario D: Traditional East Asian Dancing", 
    url: "/videos/video4.mp4" 
  },
  { 
    id: 5, 
    title: "Scenario E: Cartoons and Animation with Ducks and Grandmas", 
    url: "/videos/video5.mp4" 
  },
  { 
    id: 6, 
    title: "Scenario F: Old School Jazz Band Performance", 
    url: "/videos/video6.mp4" 
  },
  { 
    id: 7, 
    title: "Scenario G: Robots and Wires Overload", 
    url: "/videos/video7.mp4" 
  },
  { 
    id: 8, 
    title: "Scenario H: Sourdough Tasty Fresh Bread Baking", 
    url: "/videos/video8.mp4" 
  },
  { 
    id: 9, 
    title: "Scenario I: Fast-Paced Action Filled Hockey Game Highlights", 
    url: "/videos/video9.mp4" 
  }
];

// 2. MOCK PRODUCT DATA
const MOCK_PRODUCTS = [
  { 
    id: 1, 
    name: "Noise Cancelling Headphones", 
    price: "$54.99", 
    category: "Focus", 
    image: "/products/headphones.jpg",
    link: "https://www.amazon.ca/soundcore-Cancelling-Headphones-Bluetooth-Transparency/dp/B0F4884LN3?source=ps-sl-shoppingads-lpcontext&ref_=fplfs&psc=1&smid=AREE309N4XPXI" 
  },
  { 
    id: 2, 
    name: "Smart LED Therapy Lamp", 
    price: "$52.99", 
    category: "Wellness", 
    image: "/products/lamp.jpg",
    link: "https://www.https://www.amazon.ca/Verilux-HappyLight%C2%AE-Adjustable-Brightness-Countdown/dp/B08BCLLYN5/ref=sr_1_6?dib=eyJ2IjoiMSJ9.UMaQSuP6_-Vzsp4psKOOFyf-bx-GKGOjr9baYhgQ3YnQKw1GyzHJK0zUAk0g9LEWUKjUA9YleKpKLxUaOpi2XiYF7UpQnYB2riQcW8ET00Nk69liyncnkxx_5FBftp6PdpMHzRSZYgXf_iUFWVq9snQtwlvGVemj8vyFaial0sVhz7p6PzN6jaPDsBsMUhFvwm7dTUgU7f-ju33eor7mZU4yy7tyVA0JPLohOONasLQ8lAOEgtkoO7KPfndwtfqgL0vXkiwkdpSI6Myufl-bMS7qRgTBnu7YW1K_53Fw0K8.Ra5WELs6JD1QdJZ9WuhHGkL5z-rVciBO_Wr-y96fink&dib_tag=se&keywords=light+therapy+lamps&qid=1768700439&sr=8-6"
  },
  { 
    id: 3, 
    name: "Ergonomic Mesh Chair", 
    price: "$289.99", 
    category: "Comfort", 
    image: "/products/chair.jpg",
    link: "https://www.https://www.amazon.ca/ELABEST-Office-Ergonomic-Computer-Sturdy/dp/B0BKT1NR68/ref=sr_1_7?dib=eyJ2IjoiMSJ9.VEGaTHyVkxMtFRqKY451Ztn_2s4t0yB2Qrqjc50E6epmv-gB2yQ_ShkWZrrUPP_anYVndPdD6yzpAXsmfx_ucT5eimq0l9LQC0-_sOP5m-f8T4Gpoiq5NA9BXoUQ26egsqIpXDedHfze9ORTEozLNvIwvHNOasXI-xie0fot1YWhMKbg1BHENbENzdoXxGDhVBHWFPVdhYFoGvzEOf0BSA94b0INnVpbPiPGcwgF1r3W6JamGc4ygN9CkuUB3FsuOG6K_SgNs2zTIDGskzvl9Klt3aOgXpdTam_NdGHWRq0.cuyi9FfcZFH8mowR2PJEvxtoRZX7CSvk4tMAsRWB2b4&dib_tag=se&keywords=mesh%2Boffice%2Bchair&qid=1768700492&sr=8-7&th=1"
  },
  { 
    id: 4, 
    name: "Organic Calming Chamomile Tea", 
    price: "$6.99", 
    category: "/products/tea.jpeg",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500",
    link: "https://www.https://davidstea.com/products/organic-calming-chamomile-tea?srsltid=AfmBOopekJFUpJM6WLccXJlMFYaH7JDsOl1ObpXySnsrToQOH6vfbzyC&variant=46532241555696"
  },
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
  const [showProfile, setShowProfile] = useState(false);

  // Helper to add logs
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 10));
  };

  // 1. Solace Init
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

  // 3. Publishing Loop
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

  // --- Handlers ---
  const handleNextVideo = () => {
    setIsSaving(true);
    if (mainVideoRef.current) mainVideoRef.current.pause();
    addLog(`💾 Saving session data for: ${STUB_VIDEOS[currentVideoIdx].title}`);

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
      mainVideoRef.current.play().catch(e => console.error("Auto-play prevented", e));
    }
  }, [currentVideoIdx]);

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

        {/* PROFILE BUTTON */}
        <button className="btn-profile" onClick={() => setShowProfile(true)}>
            <span>👤 User Profile</span>
        </button>
      </div>

      {/* MAIN STAGE: Video Feed */}
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
            controls={false}
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

      {/* MODAL: USER PROFILE & SUGGESTIONS */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                
                <div className="modal-header">
                    <div className="modal-header-content">
                        {/* PROFILE PICTURE */}
                        <img src={USER_AVATAR} alt="Karl Profile" className="profile-avatar" />
                        <h2>Subject Analysis: {USER_DISPLAY_NAME}</h2>
                    </div>
                    <button className="btn-close" onClick={() => setShowProfile(false)}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="analysis-summary">
                        <div className="stat-card">
                            <div className="stat-label">Avg Attention</div>
                            <div className="stat-value">84%</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Stress Level</div>
                            <div className="stat-value" style={{color: 'var(--danger)'}}>HIGH</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Dominant Emotion</div>
                            <div className="stat-value">ANXIETY</div>
                        </div>
                    </div>

                    <h3 style={{color: 'var(--primary)', borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                        RECOMMENDED PRODUCTS (SAM GENERATED/YELLOWCAKE SCRAPED)
                    </h3>
                    
                    <div className="products-grid">
                        {MOCK_PRODUCTS.map(product => (
                            <div key={product.id} className="product-card">
                                <a 
                                  href={product.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  style={{ display: 'block', cursor: 'pointer' }}
                                >
                                    <img src={product.image} alt={product.name} className="product-image" />
                                </a>

                                <div className="product-info">
                                    <div className="product-title">{product.name}</div>
                                    <div className="product-price">{product.price}</div>
                                    <div style={{fontSize: '0.7rem', color: '#666', marginTop: '5px'}}>
                                        Match: {product.category}
                                    </div>
                                    <a 
                                      href={product.link} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      style={{ textDecoration: 'none' }}
                                    >
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