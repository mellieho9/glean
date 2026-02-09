const API_BASE = "http://localhost:8000";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_AUTH") {
    chrome.storage.local.set({
      accessToken: message.accessToken,
      refreshToken: message.refreshToken,
    });
    sendResponse({ success: true });
  }

  if (message.type === "GET_AUTH") {
    chrome.storage.local.get(["accessToken", "refreshToken"], (data) => {
      sendResponse(data);
    });
    return true;
  }

  if (message.type === "SIGN_OUT") {
    chrome.storage.local.remove(["accessToken", "refreshToken"], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === "API_FETCH") {
    const { path, options } = message;
    fetch(`${API_BASE}${path}`, options)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          sendResponse({ error: err.detail || `Request failed (${res.status})`, status: res.status });
          return;
        }
        const data = await res.json();
        sendResponse({ data });
      })
      .catch((err) => {
        sendResponse({ error: err.message });
      });
    return true;
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.type === "SET_AUTH") {
    chrome.storage.local.set({
      accessToken: message.accessToken,
      refreshToken: message.refreshToken,
    });
    sendResponse({ success: true });
  }

  if (message.type === "SET_SCHEMAS") {
    chrome.storage.local.set({ schemas: message.schemas }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
    return true;
  }
});
