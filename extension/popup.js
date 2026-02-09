const API_BASE = "http://localhost:8000";

// ── DOM refs ──
const stateDefault = document.getElementById("state-default");
const stateProcessing = document.getElementById("state-processing");
const stateSuccess = document.getElementById("state-success");
const stateError = document.getElementById("state-error");

const schemaSelect = document.getElementById("schema-select");
const btnGlean = document.getElementById("btn-glean");
const btnRetry = document.getElementById("btn-retry");
const btnSettings = document.getElementById("btn-settings");
const statusDot = document.getElementById("status-dot");
const statusText = document.getElementById("status-text");
const successDetail = document.getElementById("success-detail");
const errorDetail = document.getElementById("error-detail");

let currentTabUrl = null;
let isYouTube = false;

// ── State management ──
function showState(stateEl) {
  [stateDefault, stateProcessing, stateSuccess, stateError].forEach((el) =>
    el.classList.add("hidden")
  );
  stateEl.classList.remove("hidden");
}

// ── Detect current tab ──
async function detectCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return;

  currentTabUrl = tab.url;
  isYouTube =
    currentTabUrl.includes("youtube.com/watch") ||
    currentTabUrl.includes("youtu.be/");

  if (isYouTube) {
    statusDot.className = "dot dot-green";
    statusText.textContent = "YouTube video detected";
    updateGleanButton();
  } else {
    statusDot.className = "dot dot-gray";
    statusText.textContent = "Not a YouTube video";
    btnGlean.disabled = true;
  }
}

// ── Load configured schemas from storage ──
async function loadSchemas() {
  const { schemas } = await chrome.storage.local.get("schemas");

  // Use stored schemas or fall back to defaults for demo
  const schemaList = schemas || [
    { source_id: "recipes", name: "Recipes", integration: "notion" },
    { source_id: "commentary", name: "Interesting Commentary", integration: "notion" },
    { source_id: "places", name: "Places", integration: "notion" },
  ];

  schemaSelect.innerHTML = "";

  if (schemaList.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.disabled = true;
    opt.selected = true;
    opt.textContent = "No schemas configured";
    schemaSelect.appendChild(opt);
    return;
  }

  schemaList.forEach((schema, i) => {
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
}

function updateGleanButton() {
  btnGlean.disabled = !isYouTube || !schemaSelect.value;
}

// ── Process video ──
async function processVideo() {
  const selected = JSON.parse(schemaSelect.value);
  const selectedName =
    schemaSelect.options[schemaSelect.selectedIndex].textContent;

  showState(stateProcessing);

  try {
    const { accessToken } = await chrome.storage.local.get("accessToken");

    const res = await fetch(
      `${API_BASE}/agent/${selected.integration}/process`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken || "",
        },
        body: JSON.stringify({
          youtube_url: currentTabUrl,
          source_id: selected.source_id,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Request failed (${res.status})`);
    }

    const data = await res.json();

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

// ── Event listeners ──
schemaSelect.addEventListener("change", updateGleanButton);
btnGlean.addEventListener("click", processVideo);
btnRetry.addEventListener("click", () => showState(stateDefault));
btnSettings.addEventListener("click", () => {
  chrome.tabs.create({ url: `${API_BASE.replace("localhost:8000", "localhost:5173")}` });
});

// ── Init ──
detectCurrentTab();
loadSchemas();
