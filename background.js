const MIN_RATE = 0.25;
const MAX_RATE = 3.0;
const STEP = 0.25;
const DEFAULT_RATE = 1.0;
const STORAGE_KEY = "playbackRate";

function clampRate(rate) {
    return Math.min(MAX_RATE, Math.max(MIN_RATE, Number(rate)));
}

function getRate() {
    return new Promise((resolve) => {
        chrome.storage.sync.get([STORAGE_KEY], (result) => {
            const stored = result[STORAGE_KEY];
            resolve(stored === undefined ? DEFAULT_RATE : clampRate(stored));
        });
    });
}

function setRate(rate) {
    const clamped = clampRate(rate);
    return new Promise((resolve) => {
        chrome.storage.sync.set({ [STORAGE_KEY]: clamped }, () => resolve(clamped));
    });
}

const INTERNAL_PAGE = /^(chrome|chrome-extension|edge|about|devtools):/;

function isInjectableUrl(url) {
    return Boolean(url && !INTERNAL_PAGE.test(url));
}

function applyRateToTab(tabId, rate) {
    chrome.tabs.sendMessage(tabId, { type: "SET_PLAYBACK_RATE", rate }).catch(() => {});
}

async function applyRateToActiveTab(rate) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.id !== undefined) {
        applyRateToTab(tabs[0].id, rate);
    }
}

async function adjustRate(delta) {
    const current = await getRate();
    const next = await setRate(current + delta);
    await applyRateToActiveTab(next);
    return next;
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (result[STORAGE_KEY] === undefined) {
            chrome.storage.sync.set({ [STORAGE_KEY]: DEFAULT_RATE });
        }
    });
});

chrome.commands.onCommand.addListener(async (command) => {
    if (command === "left") {
        await adjustRate(-STEP);
    } else if (command === "right") {
        await adjustRate(STEP);
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !isInjectableUrl(tab.url)) {
        return;
    }
    const rate = await getRate();
    applyRateToTab(tabId, rate);
});
