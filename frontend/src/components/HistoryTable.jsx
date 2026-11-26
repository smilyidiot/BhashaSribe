import { useCallback, useEffect, useState } from "react";
import { deleteTranscription, listTranscriptions, updateTranscription } from "../api/client";

function HistoryTable({ refreshKey }) {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draftText, setDraftText] = useState("");
  const [loadError, setLoadError] = useState(null);

  const loadHistory = useCallback(() => {
    listTranscriptions()
      .then(setRows)
      .catch(() => setLoadError("Couldn't load transcription history."));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, refreshKey]);

  const startEdit = (row) => {
    setEditingId(row.id);
    setDraftText(row.text);
  };

  const saveEdit = async (id) => {
    const updated = await updateTranscription(id, draftText);
    setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
    setEditingId(null);
  };

  const removeRow = async (id) => {
    if (!window.confirm("Delete this transcription?")) return;
    await deleteTranscription(id);
    setRows((prev) => prev.filter((row) => row.id !== id));
  };

  if (loadError) {
    return <p className="error-text">{loadError}</p>;
  }

  if (rows.length === 0) {
    return <p className="placeholder">No transcriptions yet. Record something!</p>;
  }

  return (
    <ul className="history-list">
      {rows.map((row) => (
        <li key={row.id} className="history-row">
          {editingId === row.id ? (
            <>
              <textarea
                className="history-edit-area"
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
              />
              <div className="history-actions">
                <button type="button" onClick={() => saveEdit(row.id)}>
                  Save
                </button>
                <button type="button" onClick={() => setEditingId(null)}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="history-text">{row.text || "(empty)"}</p>
              <div className="history-meta">
                {row.language && <span className="language-badge">{row.language}</span>}
                <span>{new Date(row.created_at).toLocaleString()}</span>
              </div>
              <div className="history-actions">
                <button type="button" onClick={() => startEdit(row)}>
                  Edit
                </button>
                <button type="button" onClick={() => removeRow(row.id)}>
                  Delete
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

export default HistoryTable;
