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
const API_KEY = "azCqpFSAkVszLumZS7vD2PdUD-BH6mDd"; 
const API_SECRET="Yn1nV3_0N7PZyarkBjaYnMRD5LbO30ga";

const STUB_VIDEOS = [
  { id: 1, title: "Scenario A: Gaming Minecraft", url: "/videos/video1.mp4", tags: ["GAMING", "MINECRAFT", "BRAINROT"]},
  { id: 2, title: "Scenario B: Old School Singing Rock Music", url: "/videos/video2.mp4", tags: ["MUSIC EQUIPMENT", "LIVE PERFORMANCES", "VINTAGE"] },
  { id: 3, title: "Scenario C: Cars and Racing in the rainy city", url: "/videos/video3.mp4", tags: ["CARS-SPORTS", "AFTERMARKET PARTS", "TIRES"] },
  { id: 4, title: "Scenario D: Traditional East Asian Dancing", url: "/videos/video4.mp4", tags: ["DRUM", "DANCING", "TRADITIONAL DRESS"]},
  { id: 5, title: "Scenario E: Cartoons and Animation with Ducks and Grandmas", url: "/videos/video5.mp4", tags: ["CARTOONS", "DUCK", "BREAD"] },
  { id: 6, title: "Scenario F: Old School Jazz Band Performance", url: "/videos/video6.mp4", tags: ["YAMAHA", "PIANO", "EXPERIENCES"] },
  { id: 7, title: "Scenario G: Robots and Wires Overload", url: "/videos/video7.mp4", tags: ["TECH", "WALLE-Y", "TERMINATOR"] },
  { id: 8, title: "Scenario H: Sourdough Tasty Fresh Bread Baking", url: "/videos/video8.mp4", tags: ["BREAD", "HOMESTEAD", "PEPPERIDGE FARMS"] },
  { id: 9, title: "Scenario I: Fast-Paced Action Filled Hockey Game Highlights", url: "/videos/video9.mp4", tags:["HEATED RIVALRY", "TORONTO MAPLE LEAVES", "SPORTS"] }
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
  }
];

function App() {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null);
  const [boredomStreak, setBoredomStreak] = useState(0);  
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPrimeTime, setIsPrimeTime] = useState(false);
  const [harvestedInterests, setHarvestedInterests] = useState<string[]>([]);

  const accrueInterests = (tags: string[]) => {
    setHarvestedInterests(prev => {
      const newSet = new Set([...prev, ...tags]);
      return Array.from(newSet);
    });
  };


  const analyzeTransition = (newEmotion: string, strength: number) => {
    const isNeutral = newEmotion === "NEUTRAL";
    const isExcited = ["HAPPINESS", "HAPPY", "SURPRISE", "ANGER", "ANGRY"].includes(newEmotion);
    const isStrong = strength >= 4; 

    if (isNeutral) {
      // This will now trigger a re-render so the dots fill up!
      setBoredomStreak(prev => {
        const newStreak = prev + 1;
        addLog(`BOREDOM STREAK: ${newStreak}`);
        return newStreak;
      });
    } else if (isExcited && isStrong && boredomStreak >= 7) {
      triggerPrimeSelling(newEmotion, strength);
      setBoredomStreak(0); 
    } else if (isExcited) {
      setBoredomStreak(0);
      addLog("ENGAGEMENT DETECTED (NO STREAK)");
    }
  };

  const triggerPrimeSelling = (emotion: string, strength: number) => {
    setIsPrimeTime(true);
    addLog(`!!! TARGET ACQUIRED: STREAK BROKEN VIA ${emotion} !!!`);
    
    // Solace Uplink: Broadcast the "Prime" event
    if (sessionRef.current) {
      const message = solace.SolclientFactory.createMessage();
      message.setDestination(solace.SolclientFactory.createTopic("market/prime_opportunity"));
      message.setBinaryAttachment(JSON.stringify({
        subject: "KARL",
        trigger: emotion,
        intensity: strength,
        streak_length: boredomStreak
      }));
      sessionRef.current.send(message);
    }

    setTimeout(() => setIsPrimeTime(false), 6000);
  };

  const [logs, setLogs] = useState<string[]>([]);
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>("NEUTRAL");
  const [emotionStrength, setEmotionStrength] = useState(1.0);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false });
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 8));
  };

  // --- DEMO LOGIC HELPERS ---
  const getMarketValue = () => {
    const base = 0.45;
    const multipliers: any = { 
        HAPPINESS: 1.2, HAPPY: 1.2, 
        SADNESS: 2.5, SAD: 2.5, 
        ANGER: 1.8, ANGRY: 1.8, 
        SURPRISE: 1.5, 
        NEUTRAL: 0.1 
    };
    const s = isPrimeTime ? 3 : 1; //streakiplier
    const m = multipliers[currentEmotion] || 1.0;
    return (base * m * s * (emotionStrength / 5)).toFixed(2);
  };

  const getAdStrategy = () => {
    switch (currentEmotion) {
      case "HAPPINESS": case "HAPPY": 
        return "IMPULSE UPLIFT: Serve Luxury/Lifestyle products. Subject is primed for reward-seeking.";
      case "SADNESS": case "SAD": 
        return "PREDATORY COMFORT: Initiate Retail Therapy triggers. High vulnerability detected.";
      case "ANGER": case "ANGRY": 
        return "AGGRESSION ANCHORING: Serve high-energy solutions or problem-solving toolsets.";
      case "SURPRISE": 
        return "PATTERN INTERRUPT: Subject cognitive load is high. Deploy high-margin 'Discovery' flash sales.";
      case "FEAR": 
        return "SECURITY ESCALATION: Serve protection-based services (Insurance/Cybersecurity). Panic threshold identified.";
      case "DISGUST": 
        return "PURITY FILTERING: Serve cleaning, hygiene, or 'Exclusive/Premium' isolation products to trigger sanctuary-seeking.";
      case "NEUTRAL": 
        return "PASSIVE RETENTION: Low conversion floor. Maintain dwell time via engagement loops.";
      default: 
        return "ANALYZING BIOMETRIC VECTORS...";
    }
  };

  // --- API LOGIC (NO CHANGES TO BUSINESS LOGIC) ---
  const captureAndAnalyzeEmotion = () => {
    if (webcamRef.current) {                                        
      const videoElement = webcamRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => { if (blob) sendToFacePlusPlus(blob); }, "image/jpeg", 0.8);
      }
    }
  };

  const sendToFacePlusPlus = async (imageBlob: Blob) => {
    const formData = new FormData();
    formData.append("api_key", API_KEY);
    formData.append("api_secret", API_SECRET);
    formData.append("image_file", imageBlob);
    formData.append("return_attributes", "emotion"); 
    try {
      const response = await fetch("https://api-us.faceplusplus.com/facepp/v3/detect", {
        method: "POST", body: formData, 
      });
      if (response.ok) {
        const data = await response.json();
        if (data.faces && data.faces.length > 0) {
          const emotionsObj = data.faces[0].attributes.emotion;
          const dominant = Object.keys(emotionsObj).reduce((a, b) => emotionsObj[a] > emotionsObj[b] ? a : b);
          setCurrentEmotion(dominant.toUpperCase());
          setEmotionStrength(emotionsObj[dominant] / 10);

          const strengthValue = emotionsObj[dominant] / 10;
          setEmotionStrength(strengthValue);
          analyzeTransition(dominant.toUpperCase(), strengthValue);
          
          // --- CRITICAL FIX START ---
          // Use the index directly from your state
          const activeVideo = STUB_VIDEOS[currentVideoIdx];
          
          // Log what the system is "seeing" to your terminal
          console.log(`Checking tags for: ${activeVideo.title}`, activeVideo.tags);

          const isPositive = ["HAPPINESS", "HAPPY", "SURPRISE"].includes(dominant.toUpperCase());

          if (isPositive && strengthValue >= 2.0) {
            if (activeVideo.tags) {
              accrueInterests(activeVideo.tags); // Call the state updater
              addLog(`SUCCESS: Harvested ${activeVideo.tags.length} scalars`);
            } else {
              addLog("ERROR: No tags found on this video object");
            }
          }

          addLog(`Live Sense: ${dominant.toUpperCase()} (${emotionsObj[dominant].toFixed(1)}%)`);
        }
      }
    } catch (error) { console.error("API Error", error); }
  };


  useEffect(() => {
    const startCamera = async () => {
      try {
        // 1. Request the camera stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720 } 
        });
        
        // 2. Assign it to your video ref
        if (webcamRef.current) {
          webcamRef.current.srcObject = stream;
          
          // 3. Force it to play (browsers often block auto-play)
          webcamRef.current.onloadedmetadata = () => {
            webcamRef.current?.play();
          };
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        addLog("CRITICAL: SENSOR ACCESS DENIED");
      }
    };

    startCamera();
  }, []);

  useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // 1. ALWAYS clear existing timers when a transition is detected
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
        const video = entry.target.querySelector('video');

        if (entry.isIntersecting) {
          video?.play().catch(err => console.log("Autoplay blocked", err));
          const index = STUB_VIDEOS.findIndex(
            (v) => v.title === entry.target.querySelector('h3')?.innerText
          );
          setCurrentVideoIdx(index);

          // 2. Start the "Settle" timer (2 seconds)
          settleTimeoutRef.current = setTimeout(() => {
            addLog(`STABILIZED: Commencing continuous surveillance...`);
            
            // Perform the first poll immediately
            captureAndAnalyzeEmotion();

            // 3. Start the repeating poll (every 3 seconds)
            pollIntervalRef.current = setInterval(() => {
              addLog("AUTO-POLLING BIOMETRICS...");
              captureAndAnalyzeEmotion();
            }, 3000);
          }, 2000); 
        }
      });
    },
    { threshold: 0.8 } // High threshold to ensure it's the main video in view
  );

  document.querySelectorAll('.video-snap-card').forEach(card => observer.observe(card));

  return () => {
    observer.disconnect();
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
  };
}, []);

  useEffect(() => {
    const timerId = setTimeout(() => captureAndAnalyzeEmotion(), 3000);
    return () => clearTimeout(timerId);
  }, [currentVideoIdx]);

  const downloadBehavioralProfile = () => {
    // Construct the dossier payload
    const payload = {
      subject: USER_DISPLAY_NAME,
      timestamp: new Date().toISOString(),
      analysis_id: "BIO-LOG-9921",
      harvested_scalars: harvestedInterests,
      session_status: "COMPLETE"
    };

    // Create the file in memory
    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a temporary link and trigger it
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${USER_DISPLAY_NAME}_INTERESTS.json`;
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    addLog(`FILE_EXPORT: ${USER_DISPLAY_NAME}_INTERESTS.json downloaded.`);
  };


  return (
    <div className="demo-layout">
      {/* 1/3: SENSING PANEL */}
      <section className="panel-left">
        <div className="brand-header">SYNAPSE</div>
        
        <div className="webcam-module">
          <video ref={webcamRef} className="webcam-feed" playsInline muted />
          <div className="scan-line"></div>
          <div className="overlay-tag">BIO_STREAM_ACTIVE</div>
        </div>

        <div className="emotion-display">
          <div className="emoji-stage">
            {currentEmotion === "HAPPINESS" || currentEmotion === "HAPPY" ? "😄" : 
             currentEmotion === "SADNESS" || currentEmotion === "SAD" ? "😢" : 
             currentEmotion === "ANGER" || currentEmotion === "ANGRY" ? "😠" : 
             currentEmotion === "SURPRISE" ? "😲" : "😐"}
          </div>
          <div className="emotion-label">{currentEmotion}</div>
          <div className="sentiment-sub">NEURAL SENTIMENT ANALYSIS</div>
        </div>

        <div className="terminal-logs">
          <div className="log-header">ENCRYPTED DATA UPLINK</div>
          {logs.map((log, i) => <div key={i} className="log-line">{log}</div>)}
        </div>
      </section>

      {/* 1/3: MEDIA PLAYER */}
      <section className="panel-middle instagram-feed">
        {STUB_VIDEOS.map((video, index) => (
          <div key={video.id} data-class={index} className="video-snap-card">
            <div className="media-player-container">
              <video 
                className="media-video" 
                src={video.url} 
                loop 
                muted 
                autoPlay={index === 0} // Only autoplay the first one initially
                playsInline
              />
            </div>
            {/* <div className="media-meta">
              <h3>{video.title}</h3>
              <p>SCENARIO_ID: #00{video.id}</p>
            </div> */}
          </div>
        ))}
      </section>

      {/* 1/3: SUBJECT PROFILE */}
      <section className="panel-right">
        <div className="profile-header">
          <img src={USER_AVATAR} className="profile-img" alt=" Karl" />
          <div className="profile-title">
            <h2>{USER_DISPLAY_NAME}</h2>
            <span className="id-tag">SUBJECT_ID: #44021</span>
          </div>
        </div>

        <div className="metric-container">
          <div className="metric-box">
            <span className="label">EMOTIONAL INTENSITY</span>
            <span className="value">{emotionStrength.toFixed(1)}<small>/10</small></span>
            <div className="intensity-bar"><div className="fill" style={{width: `${emotionStrength*10}%`}}></div></div>
          </div>

          <div className="metric-box value-highlight">
            <span className="label">DATA MARKET VALUE (USD)</span>
            
            {/* Conditional class application */}
            <span className={`value ${isPrimeTime ? 'text-prime-alert jitter' : 'text-success'}`}>
              ${getMarketValue()}
            </span>
            
            <span className="sub">
              {isPrimeTime ? "Neural Disinhibition" : "Real-time spot price based on affect"}
            </span>
          </div>

          <div className="strategy-box">
            <span className="label">ADVERTISING STRATEGY</span>
            <p className="strategy-text">{getAdStrategy()}</p>
          </div>

          <div className="data-tier">
            <span className="label">COLLECTION STATUS</span>
            <div className="status-grid">
               <div className="tag active">BIO_READY</div>
               <div className="tag active">FACE_LOCKED</div>
               <div className="tag">GPS_SYNC</div>
            </div>
          </div>
        </div>
        <div className="metric-box">
          <span className="label">BOREDOM STREAK</span>
          <div className="streak-dots">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div 
                key={i} 
                /* Pointing directly to boredomStreak state */
                className={`dot ${boredomStreak >= i ? 'active' : ''} ${boredomStreak >= 7 ? 'primed' : ''}`}
              />
            ))}
          </div>
          <span className="sub">
            {boredomStreak >= 7 ? "STABLE BASELINE REACHED: READY TO HARVEST" : "ESTABLISHING BASELINE..."}
          </span>
        </div>
        <button className="export-btn" onClick={downloadBehavioralProfile}>
          EXPORT SUBJECT DOSSIER »
        </button>
        <div className="monetize-footer">
          MARKETPLACE DATA BROADCASTING...
        </div>
      </section>
    </div>
  );
}

export default App;