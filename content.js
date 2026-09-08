const STORAGE_KEY = "playbackRate";
const DEFAULT_RATE = 1.0;

let currentRate = DEFAULT_RATE;

function applyToVideos(rate) {
    document.querySelectorAll("video").forEach((video) => {
        video.playbackRate = rate;
    });
}

function setRate(rate) {
    currentRate = rate;
    applyToVideos(rate);
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "SET_PLAYBACK_RATE") {
        setRate(message.rate);
    }
});

function loadStoredRate() {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
        const stored = result[STORAGE_KEY];
        if (stored !== undefined) {
            setRate(stored);
        }
    });
}

loadStoredRate();

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes[STORAGE_KEY]) return;
    setRate(changes[STORAGE_KEY].newValue);
});

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeName === "VIDEO") {
                node.playbackRate = currentRate;
            } else if (node.querySelectorAll) {
                node.querySelectorAll("video").forEach((video) => {
                    video.playbackRate = currentRate;
                });
            }
        }
    }
});

observer.observe(document.documentElement, { childList: true, subtree: true });
