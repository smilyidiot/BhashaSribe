import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const apiClient = axios.create({ baseURL });

export function listTranscriptions() {
  return apiClient.get("/api/transcriptions").then((res) => res.data);
}

export function updateTranscription(id, text) {
  return apiClient.put(`/api/transcriptions/${id}`, { text }).then((res) => res.data);
}

export function deleteTranscription(id) {
  return apiClient.delete(`/api/transcriptions/${id}`);
}
