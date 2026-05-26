// Centralized client-side configuration.
// Vite only exposes env vars prefixed with VITE_.

export const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
