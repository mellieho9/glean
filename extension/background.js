// Listen for auth tokens passed from the web app via messages
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
    return true; // async response
  }
});

// Also listen for internal messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_AUTH") {
    chrome.storage.local.get(["accessToken", "refreshToken"], (data) => {
      sendResponse(data);
    });
    return true; // async response
  }
});
