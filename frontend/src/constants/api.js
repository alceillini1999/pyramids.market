const raw = import.meta.env?.VITE_API_URL ?? "https://pyramids-market.onrender.com/api";

export const API_URL = (raw || "").replace(/\/$/, "");