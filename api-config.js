/* ==========================================================================
   API CONFIG (api-config.js)
   One place to point the whole frontend at your Django backend.
   Change API_BASE_URL if your PythonAnywhere username or domain changes.
   ========================================================================== */

const API_BASE_URL = "https://ngorgechmuy15.pythonanywhere.com/api";

// Small fetch helper: throws a readable Error on non-2xx responses instead
// of silently returning whatever error body the server sent back.
async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // some responses (e.g. 204 No Content) have no body
  }

  if (!response.ok) {
    const message =
      (data && (data.detail || Object.values(data)[0])) ||
      `Request failed (${response.status})`;
    throw new Error(Array.isArray(message) ? message[0] : message);
  }

  return data;
}
