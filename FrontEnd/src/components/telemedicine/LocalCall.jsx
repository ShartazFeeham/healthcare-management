import { useEffect, useRef, useState } from "react";

// Peer-to-peer video call that needs no cloud service: two browser tabs / windows on the same
// machine find each other through a BroadcastChannel and exchange media over WebRTC host candidates.
const LocalCall = ({ roomId }) => {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("Starting camera...");
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [ended, setEnded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (ended) return undefined;
    const me = Math.random().toString(36).slice(2);
    const channel = new BroadcastChannel("hc-call-" + roomId);
    let pc = null;
    let peerId = null;
    let offered = false;
    let pending = [];
    let disposed = false;

    const send = (msg) => channel.postMessage({ ...msg, from: me });

    const setup = (stream) => {
      pc = new RTCPeerConnection({ iceServers: [] });
      if (stream) stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      pc.ontrack = (e) => {
        const el = remoteRef.current;
        if (el) {
          el.srcObject = e.streams[0];
          // Browsers may block unmuted autoplay before a user gesture: retry muted rather than show nothing.
          el.play().catch(() => { el.muted = true; el.play().catch(() => {}); });
        }
        setConnected(true);
        setStatus("Connected");
      };
      // RTCIceCandidate objects cannot be structured-cloned through a BroadcastChannel: send plain JSON.
      pc.onicecandidate = (e) => e.candidate && send({ type: "ice", candidate: e.candidate.toJSON() });
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") setStatus("Connection failed. Both participants must open the call link on the same network.");
      };
      window.__hcCall = pc; // handy when diagnosing network problems from the browser console
    };

    const flush = async () => {
      for (const c of pending) await pc.addIceCandidate(c).catch(() => {});
      pending = [];
    };

    const maybeOffer = async () => {
      if (!pc || offered || !peerId || me > peerId) return;
      offered = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      send({ type: "offer", sdp: { type: offer.type, sdp: offer.sdp } });
    };

    channel.onmessage = async ({ data }) => {
      if (!pc || data.from === me) return;
      if (data.type === "hello" || data.type === "hello-ack") {
        peerId = data.from;
        if (data.type === "hello") send({ type: "hello-ack" });
        setStatus("Participant found, connecting...");
        maybeOffer();
      } else if (data.type === "offer") {
        await pc.setRemoteDescription(data.sdp);
        await flush();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ type: "answer", sdp: { type: answer.type, sdp: answer.sdp } });
      } else if (data.type === "answer") {
        await pc.setRemoteDescription(data.sdp);
        await flush();
      } else if (data.type === "ice") {
        if (pc.remoteDescription) await pc.addIceCandidate(data.candidate).catch(() => {});
        else pending.push(data.candidate);
      } else if (data.type === "bye") {
        setConnected(false);
        setStatus("The other participant left the call.");
        if (remoteRef.current) remoteRef.current.srcObject = null;
        offered = false;
        peerId = null;
      }
    };

    (async () => {
      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (e) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (e2) {
          setStatus("Camera unavailable, joining without video.");
        }
      }
      if (disposed) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      if (localRef.current && stream) localRef.current.srcObject = stream;
      setup(stream);
      setStatus("Waiting for the other participant...");
      send({ type: "hello" });
    })();

    return () => {
      disposed = true;
      try { send({ type: "bye" }); } catch (e) { /* channel already closed */ }
      channel.close();
      if (pc) pc.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [roomId, ended]);

  useEffect(() => {
    if (!connected) return undefined;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  const toggle = (kind) => {
    const stream = streamRef.current;
    if (!stream) return;
    const tracks = kind === "audio" ? stream.getAudioTracks() : stream.getVideoTracks();
    const next = tracks.some((t) => t.enabled);
    tracks.forEach((t) => (t.enabled = !next));
    kind === "audio" ? setMuted(next) : setCameraOff(next);
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const link = `${window.location.origin}/tele/call/${roomId}`;

  if (ended)
    return (
      <div className="card shadow m-4 p-5 text-center">
        <h2>Call ended</h2>
        <p className="text-muted">Appointment {roomId} · duration {mmss}</p>
        <button className="btn btn-primary" onClick={() => { setSeconds(0); setEnded(false); }}>Rejoin</button>
      </div>
    );

  const tile = { position: "relative", background: "#0f1b2d", borderRadius: 16, overflow: "hidden", minHeight: 240, flex: "1 1 280px" };
  const video = { width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 };
  const label = { position: "absolute", left: 14, bottom: 12, color: "#fff", background: "rgba(0,0,0,.45)", padding: "2px 10px", borderRadius: 10, fontSize: 13 };
  const btn = (active) => ({ width: 52, height: 52, borderRadius: "50%", border: 0, margin: "0 8px", color: "#fff", fontSize: 18, background: active ? "#e2563b" : "rgba(255,255,255,.18)" });

  return (
    <div style={{ width: "100%", background: "#16253d", borderRadius: 20, padding: 20, boxShadow: "0 20px 50px rgba(0,0,0,.25)" }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3" style={{ color: "#fff", gap: 8 }}>
        <div>
          <i className="fa-solid fa-video mr-2" />
          <strong>Telemedicine consultation</strong>
          <span className="ml-2" style={{ opacity: 0.7 }}>{roomId}</span>
        </div>
        <div>
          <span className="badge badge-pill" style={{ background: connected ? "#2dce89" : "#fb6340", whiteSpace: "normal", textAlign: "left" }}>{status}</span>
          {connected && <span className="ml-3">{mmss}</span>}
        </div>
      </div>
      <div className="d-flex flex-wrap" style={{ gap: 12 }}>
        <div style={tile}>
          <video ref={remoteRef} autoPlay playsInline style={video} />
          {!connected && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9db4d8" }}>
              <i className="fa-regular fa-user" style={{ fontSize: 64 }} />
              <div className="mt-3">{status}</div>
            </div>
          )}
          <span style={label}>Remote participant</span>
        </div>
        <div style={tile}>
          <video ref={localRef} autoPlay playsInline muted style={{ ...video, transform: "scaleX(-1)" }} />
          <span style={label}>You {muted ? "(muted)" : ""}</span>
        </div>
      </div>
      <div className="text-center mt-4">
        <button style={btn(muted)} title="Microphone" onClick={() => toggle("audio")}><i className={muted ? "fa-solid fa-microphone-slash" : "fa-solid fa-microphone"} /></button>
        <button style={btn(cameraOff)} title="Camera" onClick={() => toggle("video")}><i className={cameraOff ? "fa-solid fa-video-slash" : "fa-solid fa-video"} /></button>
        <button style={{ ...btn(false), background: "#3d6fe0" }} title="Copy invitation link" onClick={() => { navigator.clipboard && navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
          <i className={copied ? "fa-solid fa-check" : "fa-solid fa-link"} />
        </button>
        <button style={{ ...btn(true), width: 64 }} title="End call" onClick={() => setEnded(true)}><i className="fa-solid fa-phone-slash" /></button>
      </div>
    </div>
  );
};

export default LocalCall;
