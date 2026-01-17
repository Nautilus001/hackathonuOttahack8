import { useEffect, useRef, useState } from 'react';
import solace from 'solace';

// CONFIGURATION
const BROKER_URL = "ws://localhost:8008"; 
const VPN_NAME = "default";
const USERNAME = "admin"; //was 'default'
const PASSWORD = "admin"; //see above

function App() {
  // TypeScript Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null); // keeping 'any' for the solace session
  
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Log Helper
  const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

  // 1. Initialize Solace Connection
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
      addLog("✅ Connected to Solace Agent Mesh!");
      setIsConnected(true);
    });

    session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (e: any) => {
      addLog(`❌ Connection Failed: ${e.message}`);
      console.error(e);
    });

    try {
        session.connect();
        sessionRef.current = session;
    } catch (error) {
        addLog(`❌ Init Error: ${error}`);
    }

    return () => {
      if (sessionRef.current) sessionRef.current.disconnect();
    };
  }, []);

  // 2. Capture & Publish Loop
  useEffect(() => {
    if (!isConnected || !sessionRef.current) return;

    const interval = setInterval(() => {
        // Ensure video is ready and playing
        if (videoRef.current && videoRef.current.readyState === 4 && canvasRef.current) { 
            const context = canvasRef.current.getContext('2d');
            if (context) {
                // Draw frame
                context.drawImage(videoRef.current, 0, 0, 320, 240);
                
                canvasRef.current.toBlob((blob) => {
                    if(!blob) return;
                    
                    try {
                        const message = solace.SolclientFactory.createMessage();
                        const destination = solace.SolclientFactory.createTopicDestination("video/stream/user_jim");
                        
                        message.setDestination(destination);
                        message.setBinaryAttachment(blob);
                        message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT); 
                        
                        sessionRef.current.send(message);
                    } catch (error) {
                        console.error("Send failed", error);
                    }
                }, 'image/jpeg', 0.5); 
            }
        }
    }, 200); // 5 FPS

    return () => clearInterval(interval);
  }, [isConnected]);

  // 3. Setup Webcam (Imperative Play Fix)
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { 
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Explicitly trigger play to satisfy React/Browser policy
            videoRef.current.play().catch(e => console.error("Autoplay prevented:", e));
        }
        addLog("📷 Webcam initialized");
      })
      .catch(err => addLog(`❌ Webcam Error: ${err.message}`));
  }, []);

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px', backgroundColor: '#111', color: '#0f0', minHeight: '100vh' }}>
      <h1>👁️ Presage Sensor Agent (TS)</h1>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ border: '2px solid #333' }}>
            <video 
                ref={videoRef} 
                playsInline 
                muted 
                width="320" 
                height="240" 
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} width="320" height="240" />
        </div>

        <div style={{ width: '300px' }}>
            <h4>System Logs:</h4>
            {logs.map((log, i) => (
                <div key={i} style={{ opacity: Math.max(0, 1 - i * 0.15) }}>
                    {log}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default App;