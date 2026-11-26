import { useCallback, useState } from "react";
import LiveTranscript from "./components/LiveTranscript";
import HistoryTable from "./components/HistoryTable";
import "./App.css";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleFinalized = useCallback(() => setRefreshKey((key) => key + 1), []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>BhashaScribe</h1>
        <p className="subtitle">Real-time multilingual speech-to-text</p>
      </header>

      <main className="page-body">
        <section className="panel">
          <h2>Live transcript</h2>
          <LiveTranscript onFinalized={handleFinalized} />
        </section>

        <section className="panel">
          <h2>History</h2>
          <HistoryTable refreshKey={refreshKey} />
        </section>
      </main>
    </div>
  );
}

export default App;
