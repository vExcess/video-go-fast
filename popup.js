const MIN_RATE = 0.25;
const MAX_RATE = 3.0;
const STEP = 0.25;
const SLIDER_STEP = 0.05;
const DEFAULT_RATE = 1.0;
const STORAGE_KEY = "playbackRate";

const slider = document.getElementById("slider");
const rateLabel = document.getElementById("rateLabel");
const decreaseBtn = document.getElementById("decrease");
const increaseBtn = document.getElementById("increase");
const resetBtn = document.getElementById("reset");

function clampRate(rate) {
    return Math.min(MAX_RATE, Math.max(MIN_RATE, Number(rate)));
}

function snapRate(rate) {
    return clampRate(Math.round(Number(rate) / SLIDER_STEP) * SLIDER_STEP);
}

function formatRate(rate) {
    return `${Number(rate).toFixed(2)}x`;
}

function updateLabel(rate) {
    rateLabel.textContent = formatRate(rate);
    const percent =
        ((rate - MIN_RATE) / (MAX_RATE - MIN_RATE)) * 100;
    rateLabel.style.left = `calc(${percent}% + (${10 - percent * 0.2}px))`;
}

function syncUI(rate) {
    slider.value = snapRate(rate);
    updateLabel(rate);
}

async function sendToActiveTab(rate) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id !== undefined) {
        chrome.tabs
        .sendMessage(tabs[0].id, { type: "SET_PLAYBACK_RATE", rate })
        .catch(() => {});
    }
}

async function updateRate(rate) {
    const clamped = clampRate(rate);
    await chrome.storage.sync.set({ [STORAGE_KEY]: clamped });
    syncUI(clamped);
    await sendToActiveTab(clamped);
}

slider.addEventListener("input", () => {
    updateLabel(Number(slider.value));
});

slider.addEventListener("change", () => {
    updateRate(snapRate(slider.value));
});

decreaseBtn.addEventListener("click", () => {
    updateRate(Number(slider.value) - STEP);
});

increaseBtn.addEventListener("click", () => {
    updateRate(Number(slider.value) + STEP);
});

resetBtn.addEventListener("click", () => {
    updateRate(DEFAULT_RATE);
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes[STORAGE_KEY]) return;
    syncUI(clampRate(changes[STORAGE_KEY].newValue));
});

document.addEventListener("DOMContentLoaded", async () => {
    const result = await chrome.storage.sync.get([STORAGE_KEY]);
    const rate =
        result[STORAGE_KEY] !== undefined
        ? clampRate(result[STORAGE_KEY])
        : DEFAULT_RATE;
    syncUI(rate);
    await sendToActiveTab(rate);
});
