const STORAGE_KEY = "playbackRate";
const DEFAULT_RATE = 1.0;

let currentRate = DEFAULT_RATE;

function enforceRate(video) {
    if (video.playbackRate !== currentRate) {
        video.playbackRate = currentRate;
    }
}

function bindVideo(video) {
    if (video.dataset.vgfBound) return;
    video.dataset.vgfBound = "1";

    video.addEventListener("play", () => enforceRate(video));
    video.addEventListener("loadedmetadata", () => enforceRate(video));
    video.addEventListener("ratechange", () => enforceRate(video));
}

function applyToVideos(rate) {
    document.querySelectorAll("video").forEach((video) => {
        bindVideo(video);
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
        } else {
            applyToVideos(currentRate);
        }
    });
}

loadStoredRate();

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes[STORAGE_KEY]) return;
    setRate(changes[STORAGE_KEY].newValue);
});

function handleAddedNode(node) {
    if (node.nodeName === "VIDEO") {
        bindVideo(node);
        node.playbackRate = currentRate;
    } else if (node.querySelectorAll) {
        node.querySelectorAll("video").forEach((video) => {
            bindVideo(video);
            video.playbackRate = currentRate;
        });
    }
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                handleAddedNode(node);
            }
        }
    }
});

observer.observe(document.documentElement, { childList: true, subtree: true });
