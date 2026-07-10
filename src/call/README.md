## Call Connection Flow

### Phase 1: Joining the Room and Establishing Presence

This initial phase validates the user, places them into the digital meeting space (room), and prepares their local system for real-time communication.

**Step 1: Joining the Socket Room & Authentication (`joinRoom`)**
*   **What happens:** The client initiates a connection attempt by sending an event to join a specific room ID. Before allowing entry, the system validates the user's authentication token (e.g., provided in the socket handshake).
*   **Purpose:** Ensures that only authorized users can access the call and places their connection into the correct logical group (`socket.join(roomId)`), allowing all future messages to be broadcast specifically to members of that room.

**Step 2: Room and Peer Initialization (Setup)**
*   **What happens:** The system ensures a persistent record of the meeting space exists within the service layer, and crucially, registers a dedicated representation of the connecting user's endpoint within that room (`PeerService`).
*   **Purpose:** This step confirms the structural state of the call (room existence) and establishes a unique connection identifier for the new participant.

**Step 3: Initial Readiness Check (Gathering Metadata)**
*   **What happens:** The system compiles and sends back critical initial metadata to the joining client. This includes supported Real-Time Communication Protocol (RTP) capabilities—a list of formats (audio codecs, video codecs) that the user's device can handle. It also checks if any other participants have already started streaming media.
*   **Purpose:** This ensures both parties agree on a common set of standards and informs the client about any existing content they might need to start displaying immediately.

### Phase 2: Establishing Media Pipes (Transport Layer)

Once authenticated, the application must establish the actual data pipelines—the means by which media data will flow between peers.

**Step 4: Creating the WebRTC Transport (`createTransport`)**
*   **What happens:** The client requests the creation of a secure transport object specific to the room and their peer identity. This service generates necessary internal IDs, configuration, and scaffolding for the connection.
*   **Purpose:** This step doesn't connect yet; it merely sets up the *potential* pipe (the metadata, key material, and parameters) that will carry media data later.

**Step 5: Connecting the Transport (`connectTransport`)**
*   **What happens:** Using the ID and configuration received in Step 4, the client executes a connection attempt. This involves exchanging security credentials (DTLS parameters) necessary to establish a secure peer-to-peer link over the Internet (often relying on ICE/STUN/TURN services).
*   **Purpose:** This is the crucial step that brings the two endpoints online and verifies that data can actually flow securely between them, creating the active media channel.

### Phase 3: Media Interaction (Sending and Receiving Streams)

With a stable transport pipe established, participants begin sharing audio and video content through dedicated streams.

**Step 6: Producing/Publishing Media (Outgoing Stream)**
*   **What happens:** When a user wants to speak or show their camera, they send an event with the media type (audio/video), stream details, and capabilities. The system then creates a `Producer` object associated with that specific transport pipe.
*   **Purpose:** This mechanism tells the room: "I am starting a stream." Crucially, it simultaneously broadcasts a notification to *every other peer* in the room so they know what new content source is available and can prepare their display elements for it.

**Step 7: Consuming/Subscribing to Media (Incoming Stream)**
*   **What happens:** A client wishing to view another person's stream sends a request specifying which `Producer` they want to listen to, along with their local capabilities. The system then creates a `Consumer` object for that specific stream.
*   **Purpose:** This initializes the logic on the receiving end, allowing the client to correctly handle, decode, and display the incoming media data from the specified producer.

*(Note: When communication needs refreshing or resuming after an interruption, separate events like `resumeConsumer` are used to re-establish these stream links.)*