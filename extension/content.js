// Content script that runs on the Glean web app pages.
// Reads auth tokens from localStorage and syncs them to the extension.

function syncTokens() {
  const accessToken = localStorage.getItem("glean_access_token");
  const refreshToken = localStorage.getItem("glean_refresh_token");

  if (accessToken) {
    chrome.runtime.sendMessage({
      type: "SYNC_AUTH",
      accessToken,
      refreshToken,
    });
  }
}

// Sync on page load
syncTokens();

// Re-sync whenever localStorage changes (e.g. after login)
window.addEventListener("storage", syncTokens);

// Also poll briefly after load in case login happens via SPA navigation
let attempts = 0;
const interval = setInterval(() => {
  syncTokens();
  attempts++;
  if (attempts >= 10) clearInterval(interval);
}, 2000);
