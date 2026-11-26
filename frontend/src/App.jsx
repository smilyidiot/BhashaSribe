import LiveTranscript from "./components/LiveTranscript";
import "./App.css";

function App() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>BhashaScribe</h1>
        <p className="subtitle">Real-time multilingual speech-to-text</p>
      </header>

      <main className="page-body">
        <section className="panel">
          <h2>Live transcript</h2>
          <LiveTranscript />
        </section>

        <section className="panel">
          <h2>History</h2>
          <p className="placeholder">Transcription history table coming in the next stage.</p>
        </section>
      </main>
    </div>
  );
}

export default App;
