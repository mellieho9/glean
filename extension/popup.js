const WEB_APP = "http://localhost:5173";

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
const progressFill = document.getElementById("progress-fill");
const successDetail = document.getElementById("success-detail");
const errorDetail = document.getElementById("error-detail");
const jobBadge = document.getElementById("job-badge");
const jobCount = document.getElementById("job-count");

let currentTabUrl = null;
let isYouTube = false;
let accessToken = null;
let activeJobs = [];
let pollTimer = null;

const ALL_STATES = [stateSignin, stateLoading, stateDefault, stateProcessing, stateSuccess, stateError];

function showState(stateEl) {
  ALL_STATES.forEach((el) => el.classList.add("hidden"));
  stateEl.classList.remove("hidden");
}

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

async function loadSchemas() {
  schemaSelect.innerHTML = "";

  try {
    const schemas = await apiFetch("/schema/configured");

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

// ── Job tracking ──

function updateJobBadge() {
  if (activeJobs.length > 0) {
    jobBadge.classList.remove("hidden");
    jobCount.textContent = activeJobs.length;
  } else {
    jobBadge.classList.add("hidden");
  }
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(pollJobs, 3000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function pollJobs() {
  if (activeJobs.length === 0) {
    stopPolling();
    return;
  }

  const stillActive = [];
  for (const job of activeJobs) {
    try {
      const data = await apiFetch(`/agent/jobs/${job.id}`);
      if (data.status === "completed") {
        // If we're on the default state, briefly show success
        if (!stateDefault.classList.contains("hidden")) {
          statusDot.className = "dot dot-green";
          statusText.textContent = `Saved to ${job.name}`;
          setTimeout(() => detectCurrentTab(), 3000);
        }
      } else if (data.status === "failed") {
        if (!stateDefault.classList.contains("hidden")) {
          statusDot.className = "dot dot-red";
          statusText.textContent = `Failed: ${data.error || "Unknown error"}`;
          setTimeout(() => detectCurrentTab(), 4000);
        }
      } else {
        stillActive.push(job);
      }
    } catch {
      // Network error — keep polling
      stillActive.push(job);
    }
  }

  activeJobs = stillActive;
  updateJobBadge();
  if (activeJobs.length === 0) stopPolling();
}

// ── Process video ──

async function processVideo() {
  if (!schemaSelect.value) {
    errorDetail.textContent = "Please select a schema";
    showState(stateError);
    return;
  }

  const selected = JSON.parse(schemaSelect.value);
  const selectedName =
    schemaSelect.options[schemaSelect.selectedIndex].textContent;

  // Briefly show submitting state
  btnGlean.disabled = true;
  statusDot.className = "dot dot-yellow pulse";
  statusText.textContent = "Submitting…";

  try {
    const data = await apiFetch(`/agent/${selected.integration}/process`, {
      method: "POST",
      body: JSON.stringify({
        youtube_url: currentTabUrl,
        source_id: selected.source_id,
      }),
    });

    // Track the job
    activeJobs.push({ id: data.job_id, name: selectedName });
    updateJobBadge();
    startPolling();

    // Return to ready state
    statusDot.className = "dot dot-green";
    statusText.textContent = `Processing "${selectedName}"…`;
    btnGlean.disabled = false;
    updateGleanButton();
  } catch (err) {
    errorDetail.textContent = err.message || "Please try again";
    showState(stateError);
  }
}

async function init() {
  showState(stateLoading);

  const stored = await chrome.storage.local.get(["accessToken"]);
  accessToken = stored.accessToken || null;

  if (!accessToken) {
    showState(stateSignin);
    return;
  }

  try {
    await detectCurrentTab();
    await loadSchemas();
    showState(stateDefault);

    // Check for any active jobs from previous sessions
    try {
      const pending = await apiFetch("/agent/jobs?status=processing");
      if (pending && pending.length > 0) {
        activeJobs = pending.map((j) => ({
          id: j.id,
          name: j.source_id,
        }));
        updateJobBadge();
        startPolling();
      }
    } catch {
      // Non-critical, ignore
    }
  } catch (err) {
    if (!accessToken) return;
    errorDetail.textContent = err.message || "Failed to initialize";
    showState(stateError);
  }
}

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

init();
