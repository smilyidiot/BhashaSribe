import { useCallback, useRef, useState } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/transcribe";

// Rolling chunk length sent to the backend. Shorter = more "live" feeling,
// longer = better transcription accuracy per chunk. 3s is a reasonable middle
// ground for a CPU-only faster-whisper model.
const CHUNK_MS = 3000;

export function useRecorder({ onFinalized } = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [language, setLanguage] = useState(null);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);

  const cleanupMedia = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send("stop");
    }
    cleanupMedia();
    setIsRecording(false);
  }, [cleanupMedia]);

  const startRecording = useCallback(async () => {
    setError(null);
    setLiveText("");
    setLanguage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser doesn't support microphone recording.");
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access was denied or is unavailable.");
      return;
    }
    streamRef.current = stream;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "partial") {
        setLiveText(data.accumulated_text);
        setLanguage(data.language);
      } else if (data.type === "final") {
        setLiveText(data.accumulated_text);
        onFinalized?.(data.transcription_id);
      }
    };

    ws.onerror = () => {
      setError("Connection to the transcription service failed.");
      cleanupMedia();
      setIsRecording(false);
    };

    ws.onopen = () => {
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
        }
      };

      recorder.start(CHUNK_MS);
      setIsRecording(true);
    };
  }, [cleanupMedia, onFinalized]);

  return { isRecording, liveText, language, error, startRecording, stopRecording };
}
