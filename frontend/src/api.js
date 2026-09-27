const rawApiUrl = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/+$/, "");

export default API_URL;