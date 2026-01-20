# Winner of uOttaHack 8's Presage Challenge


### Inspiration

We were inspired to reimagine how organizations gather consumer insights and the intersection of biometric analysis and real-time personalization. We asked: What if feedback collection became invisible and integrated into natural digital behavior? Combined with biometric emotion detection, we saw an opportunity to capture authentic sentiment in real-time, transforming passive social media scrolling into active insight generation.
What it does

Synapse is a real-time emotion detection and behavioral analysis platform that seamlessly captures consumer sentiment through behind a social media facade. It:

Captures authentic emotional reactions via facial recognition as users interact with content (videos, products, media) using Presage.
Tracks emotional states (Happiness, Sadness, Anger, Surprise, Fear, Disgust) with precise strength metrics in real-time
Harvests behavioral interests by correlating positive emotional responses with content tags and metadata
Monitors engagement patterns through "boredom streak" detection to identify moments of peak receptiveness
Broadcasts prime selling opportunities via the Solace message broker when emotional vulnerability peaks
Calculates dynamic data market value based on emotional intensity and engagement state
Provides tailored advertising strategies for each emotional state
Suggests a custom list of potential products to purchase based on consumer interests

### How we built it

Frontend: React + TypeScript with Vite for responsive UI development
Real-time Emotion Detection: Presage SDK for continuous facial emotion recognition without user intervention 8 Behavioral Data Harvesting: Automatic tagging and interest accumulation tied to emotional response triggers
Real-time Messaging: Solace PubSub+ broker for broadcasting consumer insights across organizational systems
Backend Processing: Python processor for aggregating emotion data streams and behavioral patterns
Suggested Products: Solace agent uses Yellowcake to scrape online retailers for suggested purchases curated to the user's emotional profile.

### Challenges we ran into

Latency: Managing emotion detection latency while maintaining real-time polling frequency
Webcam Access: Handling browser permissions and ensuring reliable video stream initialization
False Positives: Filtering genuine engagement signals from momentary expressions

### Accomplishments that we're proud of

Eliminated Survey Friction: Created a system where insight collection happens invisibly during content consumption
Real-time Sentiment Pipeline: Integrated Presage SDK with continuous polling to capture authentic emotional responses
Boredom Streak Detection: Engineered a vulnerability-window system that identifies optimal moments for intervention
Dynamic Valuation Model: Built a pricing algorithm that adjusts data market value based on emotional intensity and engagement state
Cross-system Broadcasting: Implemented Solace message broker integration for organizational-scale data distribution
Behavioral Profile Export: Created exportable dossiers of user interests and emotional patterns for business intelligence

### What we learned

Emotion detection APIs are powerful tools for understanding authentic consumer behavior at scale
Interest correlation: Consumer sentiment directly correlates with content topics, enabling precise behavioral profiling

### What's next for Synapse

Multi-user Tracking: Scale biometric analysis across multiple subjects simultaneously across different platforms
Cross-Platform Expansion: Extend beyond web to mobile apps, in-store retail environments, and smart devices
Advertiser Network: Sell real-time emotional insights to brands for precision targeting

