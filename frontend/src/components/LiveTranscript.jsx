import { useRecorder } from "../hooks/useRecorder";

function LiveTranscript({ onFinalized }) {
  const { isRecording, liveText, language, error, startRecording, stopRecording } = useRecorder({
    onFinalized,
  });

  return (
    <div className="live-transcript">
      <button
        type="button"
        className={isRecording ? "record-button recording" : "record-button"}
        onClick={isRecording ? stopRecording : startRecording}
      >
        {isRecording ? "Stop recording" : "Start recording"}
      </button>

      {language && <span className="language-badge">{language}</span>}

      {error && <p className="error-text">{error}</p>}

      <p className="live-text">
        {liveText || (isRecording ? "Listening..." : "Press start and speak.")}
      </p>
    </div>
  );
}

export default LiveTranscript;
