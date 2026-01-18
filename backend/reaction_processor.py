import os
import time
import sys
# Load environment variables from the root .env file
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

from solace.messaging.messaging_service import MessagingService
from solace.messaging.resources.topic_subscription import TopicSubscription
from solace.messaging.receiver.message_receiver import MessageHandler, InboundMessage

# Load config from .env or defaults for local Docker
SOLACE_HOST = os.getenv('SOLACE_BROKER_URL', 'localhost:55555')
SOLACE_VPN = os.getenv('SOLACE_VPN_NAME', 'default')
SOLACE_USER = os.getenv('SOLACE_USERNAME', 'default')
SOLACE_PASS = os.getenv('SOLACE_PASSWORD', 'default')

class FrameHandler(MessageHandler):
    def on_message(self, message: InboundMessage):
        topic = message.get_destination_name()
        payload = message.get_payload_as_bytes()
        
        # This is where PresageSDK will live later
        print(f"⚡ [SAM] Received frame on {topic} | Payload Size: {len(payload)} bytes")

def main():
    print(f"Attempting connection to Solace at {SOLACE_HOST}...")
    
    # Build the connection
    broker_props = {
        "solace.messaging.transport.host": SOLACE_HOST,
        "solace.messaging.service.vpn-name": SOLACE_VPN,
        "solace.messaging.authentication.scheme.basic.username": SOLACE_USER,
        "solace.messaging.authentication.scheme.basic.password": SOLACE_PASS,
    }

    messaging_service = MessagingService.builder().from_properties(broker_props).build()
    
    try:
        messaging_service.connect()
        print("✅ Backend Connected to Mesh!")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        sys.exit(1)

    # Subscribe to dynamic topic: video/stream/{any_user_id}
    receiver = messaging_service.create_direct_message_receiver_builder().build(FrameHandler())
    receiver.start()
    receiver.add_subscription(TopicSubscription.of("video/stream/>"))
    
    print("👀 Listening for video streams...")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Disconnecting...")
        receiver.terminate()
        messaging_service.disconnect()

if __name__ == "__main__":
    main()