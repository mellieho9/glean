const WEB_APP = "http://localhost:5173";

// ── DOM refs ──
const stateSignin = document.getElementById("state-signin");
const stateLoading = document.getElementById("state-loading");
const stateDefault = document.getElementById("state-default");
const stateProcessing = document.getElementById("state-processing");
const stateSuccess = document.getElementById("state-success");
const stateError = document.getElementById("state-error");

const schemaSelect = document.getElementById("schema-select");
const btnGlean = document.getElementById("btn-glean");
const btnRetry = document.getElementById("btn-retry");
const btnDone = document.getElementById("btn-done");
const btnSettings = document.getElementById("btn-settings");
const btnSignin = document.getElementById("btn-signin");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const processingSub = document.getElementById("processing-sub");
const successDetail = document.getElementById("success-detail");
const errorDetail = document.getElementById("error-detail");

let currentTabUrl = null;
let isYouTube = false;
let accessToken = null;

// ── State management ──

const ALL_STATES = [stateSignin, stateLoading, stateDefault, stateProcessing, stateSuccess, stateError];

function showState(stateEl) {
  ALL_STATES.forEach((el) => el.classList.add("hidden"));
  stateEl.classList.remove("hidden");
}

// ── API helpers ──

function apiFetch(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: "API_FETCH",
        path,
        options: {
          ...rest,
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: accessToken } : {}),
            ...extraHeaders,
          },
        },
      },
      (response) => {
        if (!response || response.error) {
          if (response?.status === 401) {
            chrome.storage.local.remove(["accessToken", "refreshToken"]);
            accessToken = null;
            showState(stateSignin);
          }
          reject(new Error(response?.error || "Request failed"));
          return;
        }
        resolve(response.data);
      }
    );
  });
}

// ── Tab detection ──

async function detectCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  currentTabUrl = tab.url;
  isYouTube =
    currentTabUrl.includes("youtube.com/watch") ||
    currentTabUrl.includes("youtube.com/shorts") ||
    currentTabUrl.includes("youtu.be/");

  if (isYouTube) {
    statusDot.className = "dot dot-green";
    statusText.textContent = "YouTube video detected";
  } else {
    statusDot.className = "dot dot-gray";
    statusText.textContent = "Not a YouTube video";
  }
  updateGleanButton();
}

// ── Schema loading ──

async function loadSchemas() {
  schemaSelect.innerHTML = "";

  try {
    const schemas = await apiFetch("/agent/schemas");

    if (!schemas || schemas.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.disabled = true;
      opt.selected = true;
      opt.textContent = "No schemas configured";
      schemaSelect.appendChild(opt);
      updateGleanButton();
      return;
    }

    schemas.forEach((schema, i) => {
      const opt = document.createElement("option");
      opt.value = JSON.stringify({
        source_id: schema.source_id,
        integration: schema.integration,
      });
      opt.textContent = schema.name;
      if (i === 0) opt.selected = true;
      schemaSelect.appendChild(opt);
    });

    updateGleanButton();
  } catch (err) {
    // If auth error, showState already handled above
    if (!accessToken) return;

    const opt = document.createElement("option");
    opt.value = "";
    opt.disabled = true;
    opt.selected = true;
    opt.textContent = "Failed to load schemas";
    schemaSelect.appendChild(opt);
    updateGleanButton();
  }
}

function updateGleanButton() {
  btnGlean.disabled = !isYouTube || !schemaSelect.value;
}

// ── Video processing ──

async function processVideo() {
  if (!schemaSelect.value) {
    errorDetail.textContent = "Please select a schema";
    showState(stateError);
    return;
  }

  const selected = JSON.parse(schemaSelect.value);
  const selectedName =
    schemaSelect.options[schemaSelect.selectedIndex].textContent;

  showState(stateProcessing);
  processingSub.textContent = `Extracting to ${selectedName}…`;

  try {
    const data = await apiFetch(`/agent/${selected.integration}/process`, {
      method: "POST",
      body: JSON.stringify({
        youtube_url: currentTabUrl,
        source_id: selected.source_id,
      }),
    });

    if (data.success) {
      successDetail.textContent = `Data saved to ${selectedName}`;
      showState(stateSuccess);
    } else {
      throw new Error(data.error || "Extraction failed");
    }
  } catch (err) {
    errorDetail.textContent = err.message || "Please try again";
    showState(stateError);
  }
}

// ── Initialization ──

async function init() {
  showState(stateLoading);

  // Get stored auth token
  const stored = await chrome.storage.local.get(["accessToken"]);
  accessToken = stored.accessToken || null;

  if (!accessToken) {
    showState(stateSignin);
    return;
  }

  // Validate token by fetching schemas
  try {
    await detectCurrentTab();
    await loadSchemas();
    showState(stateDefault);
  } catch (err) {
    // If token is invalid, sign-in state is already shown by apiFetch
    if (!accessToken) return;
    errorDetail.textContent = err.message || "Failed to initialize";
    showState(stateError);
  }
}

// ── Event listeners ──

btnSignin.addEventListener("click", () => {
  chrome.tabs.create({ url: WEB_APP });
});

btnSettings.addEventListener("click", () => {
  chrome.tabs.create({ url: WEB_APP });
});

btnGlean.addEventListener("click", processVideo);

btnRetry.addEventListener("click", () => {
  showState(stateDefault);
  detectCurrentTab();
});

btnDone.addEventListener("click", () => {
  showState(stateDefault);
  detectCurrentTab();
});

schemaSelect.addEventListener("change", updateGleanButton);

// Start
init();
