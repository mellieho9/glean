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

syncTokens();

window.addEventListener("storage", syncTokens);

let attempts = 0;
const interval = setInterval(() => {
  syncTokens();
  attempts++;
  if (attempts >= 10) clearInterval(interval);
}, 2000);
