import { useEffect, useRef, useState } from 'react';
import solace from 'solace';
import './App.css'; // Ensure you import the CSS

// CONFIGURATION
const BROKER_URL = "ws://localhost:8008"; 
const VPN_NAME = "default";
const USERNAME = "admin";
const PASSWORD = "admin";

function App() {
  // TypeScript Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isStreamActive, setStreamActive] = useState<boolean>(false);

  // Log Helper
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 8));
  };

  // 1. Initialize Solace Connection
  useEffect(() => {
    addLog("System initializing...");
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
      addLog("Network link established.");
      setIsConnected(true);
    });

    session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (e: any) => {
      addLog(`Connection Error: ${e.message}`);
      console.error(e);
      setIsConnected(false);
    });

    session.on(solace.SessionEventCode.DISCONNECTED, () => {
      addLog("Network link terminated.");
      setIsConnected(false);
    });

    try {
        addLog(`Dialing ${BROKER_URL}...`);
        session.connect();
        sessionRef.current = session;
    } catch (error) {
        addLog(`Init Failed: ${error}`);
    }

    return () => {
      if (sessionRef.current) sessionRef.current.disconnect();
    };
  }, []);

  // 2. Capture & Publish Loop
  useEffect(() => {
    if (!isConnected || !sessionRef.current) return;

    const interval = setInterval(() => {
        if (videoRef.current && videoRef.current.readyState === 4 && canvasRef.current) { 
            const context = canvasRef.current.getContext('2d');
            if (context) {
                // Draw frame
                context.drawImage(videoRef.current, 0, 0, 320, 240);
                
                // Convert to Binary and Send
                canvasRef.current.toBlob(async (blob) => {
                    if(!blob) return;
                    
                    try {
                        // Convert Blob to ArrayBuffer for safe transport
                        const buffer = await blob.arrayBuffer();
                        
                        const message = solace.SolclientFactory.createMessage();
                        const destination = solace.SolclientFactory.createTopicDestination("video/stream/user_jim");
                        
                        message.setDestination(destination);
                        message.setBinaryAttachment(buffer);
                        message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT); 
                        
                        sessionRef.current.send(message);
                        setStreamActive(true);
                    } catch (error) {
                        console.error("TX Fail", error);
                        setStreamActive(false);
                    }
                }, 'image/jpeg', 0.5); 
            }
        }
    }, 200); // 5 FPS

    return () => clearInterval(interval);
  }, [isConnected]);

  // 3. Setup Webcam
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { 
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Autoplay blocked:", e));
        }
        addLog("Optical sensor active.");
      })
      .catch(err => addLog(`Sensor Error: ${err.message}`));
  }, []);

  return (
    <div className="dashboard-container">
      <div className="main-card">
        
        {/* Header Section */}
        <header className="header">
          <div className="title">
            <h1>Presage Sensor</h1>
            <div className="subtitle">UNIT ID: JIM-01 // AGENT MESH</div>
          </div>
          <div className={`status-pill ${isConnected ? 'status-connected' : 'status-error'}`}>
            <div className="status-dot"></div>
            <span>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </header>

        {/* Video Column */}
        <div className="viewport-column">
          <div className="viewport-container">
            <video 
                ref={videoRef} 
                playsInline 
                muted 
                width="320" 
                height="240" 
            />
            {/* HUD Overlay for visual effect */}
            <div className="hud-overlay"></div>
            {isStreamActive && (
              <div className="rec-indicator">
                <div className="rec-dot"></div> REC
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} width="320" height="240" />
          </div>
        </div>

        {/* Logs Column */}
        <div className="terminal-column">
          <div className="terminal-container">
            <div className="terminal-header">SYSTEM EVENTS</div>
            {logs.length === 0 && <div className="log-entry" style={{opacity:0.5}}>Waiting for events...</div>}
            {logs.map((log, i) => (
                <div key={i} className="log-entry" style={{ opacity: Math.max(0.4, 1 - i * 0.1) }}>
                    {log}
                </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
