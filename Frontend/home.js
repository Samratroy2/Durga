/* =========================================================
   ROY BARI — HOME
   Firebase / Firestore

   Collection: homepageCountdown
   Fields: title, dateTime (Timestamp), audio (Drive URL), fullDay

   Gallery collection: gallery
   ========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { db } from "./firebase.js";

/* =========================================================
   CONFIG
   ========================================================= */

// How long a NON full-day event stays in the "is here" state
// (with audio) after its start time. Full-day events stay
// active for the rest of their IST calendar date.
const ACTIVE_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

const REFRESH_INTERVAL_MS = 15000;

/* =========================================================
   ELEMENTS
   ========================================================= */

const countdown = document.getElementById("countdown");
const countdownLabel = document.getElementById("countdown-label");
const countdownEventTitle = document.getElementById("countdown-event-title");
const heroImage = document.getElementById("hero-durga");
const eyeImage = document.getElementById("eye");

/* =========================================================
   STATE
   ========================================================= */

let countdownInterval = null;
let dayRefreshInterval = null;
let countdownRecords = [];
let activeRecord = null;
let activeState = null; // "upcoming" | "active" | null

let audioSection = null;
let audioTitle = null;
let audioFrame = null;

/* =========================================================
   INITIALIZE
   ========================================================= */

ensureAudioPlayer();
loadHomepageCountdown();
loadDurgaImage();

/* =========================================================
   GOOGLE DRIVE EMBED PLAYER
   ========================================================= */

function ensureAudioPlayer() {
    audioSection = document.getElementById("countdownAudioSection");
    audioTitle = document.getElementById("countdownAudioTitle");
    audioFrame = document.getElementById("countdownAudioFrame");

    if (audioSection && audioTitle && audioFrame) return;
    if (!countdown) return;

    if (!audioSection) {
        audioSection = document.createElement("div");
        audioSection.id = "countdownAudioSection";
        audioSection.className = "countdown-audio";
        audioSection.setAttribute("aria-label", "Countdown event audio");
        audioSection.hidden = true;
        countdown.insertAdjacentElement("afterend", audioSection);
    }

    if (!audioTitle) {
        audioTitle = document.createElement("p");
        audioTitle.id = "countdownAudioTitle";
        audioTitle.className = "countdown-audio-title";
        audioTitle.textContent = "Listen to the current event";
        audioSection.appendChild(audioTitle);
    }

    if (!audioFrame) {
        audioFrame = document.createElement("iframe");
        audioFrame.id = "countdownAudioFrame";
        audioFrame.title = "Roy Bari event audio player";
        audioFrame.width = "100%";
        audioFrame.height = "110";
        audioFrame.loading = "lazy";
        audioFrame.allow = "autoplay";
        audioSection.appendChild(audioFrame);
    }
}

function extractGoogleDriveFileId(url) {
    const value = String(url || "").trim();
    if (!value) return "";

    const fileMatch = value.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
    if (fileMatch?.[1]) return fileMatch[1];

    try {
        const parsedURL = new URL(value);

        if (
            parsedURL.hostname === "drive.google.com" ||
            parsedURL.hostname.endsWith(".drive.google.com")
        ) {
            return parsedURL.searchParams.get("id") || "";
        }
    } catch (error) {
        console.warn("ROY BARI: Invalid Google Drive URL.", error);
    }

    return "";
}

function showAudioPlayer(record) {
    ensureAudioPlayer();

    if (!audioSection || !audioTitle || !audioFrame) {
        console.error("ROY BARI: Audio player elements not found.");
        return;
    }

    const fileId = extractGoogleDriveFileId(record.audio);

    if (!fileId) {
        hideAudioPlayer();
        if (record.audio) {
            console.warn("ROY BARI: Invalid Google Drive audio URL.");
        }
        return;
    }

    audioTitle.textContent = `Listen to ${record.title}`;
    audioSection.hidden = false;

    // Don't reload the player during routine refreshes.
    if (audioFrame.dataset.fileId !== fileId) {
        audioFrame.src =
            `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview`;
        audioFrame.dataset.fileId = fileId;
    }
}

function hideAudioPlayer() {
    ensureAudioPlayer();

    if (audioSection) audioSection.hidden = true;

    if (audioFrame && audioFrame.hasAttribute("src")) {
        audioFrame.removeAttribute("src");
        delete audioFrame.dataset.fileId;
    }
}

/* =========================================================
   LOAD COUNTDOWN RECORDS FROM FIRESTORE
   ========================================================= */

async function loadHomepageCountdown() {
    if (!countdown) {
        console.warn("ROY BARI: #countdown element not found.");
        return;
    }

    try {
        const snapshot = await getDocs(collection(db, "homepageCountdown"));

        countdownRecords = snapshot.docs
            .map(document => {
                const data = document.data();

                return {
                    id: document.id,
                    title: String(data.title || "").trim(),
                    dateTime: getCountdownDate(data.dateTime),
                    audio: String(data.audio || "").trim(),
                    fullDay:
                        data.fullDay === true ||
                        data.fullDay === "true"
                };
            })
            .filter(record => record.title && record.dateTime)
            .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

        if (!countdownRecords.length) {
            showNoCountdown();
            hideAudioPlayer();
            return;
        }

        selectAndRenderCountdown();

        if (dayRefreshInterval) clearInterval(dayRefreshInterval);

        dayRefreshInterval = setInterval(
            selectAndRenderCountdown,
            REFRESH_INTERVAL_MS
        );

    } catch (error) {
        console.error("ROY BARI: HOMEPAGE COUNTDOWN FIREBASE ERROR:", error);
        showCountdownError();
    }
}

/* =========================================================
   SELECT ACTIVE OR NEXT EVENT
   ========================================================= */

function isRecordActive(record, now, todayKey) {
    // Full-day: active for the ENTIRE IST calendar date of the event,
    // whatever time is stored (e.g. 10 Oct 2026 00:00 or 06:00).
    // The audio player is available all day.
    if (record.fullDay) {
        return getISTDateKey(record.dateTime) === todayKey;
    }

    // Timed event: active for a limited window after it starts.
    if (record.dateTime.getTime() > now.getTime()) return false;
    return now.getTime() - record.dateTime.getTime() < ACTIVE_WINDOW_MS;
}

function selectAndRenderCountdown() {
    if (!countdownRecords.length) return;

    const now = new Date();
    const todayKey = getISTDateKey(now);

    // Most recently started event that is still active.
    const active = [...countdownRecords]
        .reverse()
        .find(record => isRecordActive(record, now, todayKey));

    if (active) {
        renderCompletedCountdown(active);
        return;
    }

    const upcoming = countdownRecords.find(
        record => record.dateTime.getTime() > now.getTime()
    );

    if (upcoming) {
        renderUpcomingCountdown(upcoming);
        return;
    }

    // Nothing active or upcoming: show the latest event.
    renderCompletedCountdown(countdownRecords[countdownRecords.length - 1]);
}

/* =========================================================
   UPCOMING EVENT
   ========================================================= */

function renderUpcomingCountdown(record) {
    // Already showing this countdown: don't restart the timer.
    if (
        activeState === "upcoming" &&
        activeRecord?.id === record.id &&
        countdownInterval
    ) {
        return;
    }

    activeRecord = record;
    activeState = "upcoming";

    if (countdownLabel) {
        countdownLabel.textContent = `Counting down to ${record.title}`;
    }

    if (countdownEventTitle) {
        countdownEventTitle.textContent = record.title;
    }

    hideAudioPlayer();
    startCountdown(record.dateTime, record.id);
}

/* =========================================================
   ACTIVE / COMPLETED EVENT
   ========================================================= */

function renderCompletedCountdown(record) {
    // Already showing this state: nothing to redraw.
    if (activeState === "active" && activeRecord?.id === record.id) {
        return;
    }

    activeRecord = record;
    activeState = "active";

    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    if (countdownLabel) {
        countdownLabel.textContent = `${record.title} is here`;
    }

    if (countdownEventTitle) {
        countdownEventTitle.textContent = record.title;
    }

    if (countdown) {
        countdown.innerHTML = `
            <div class="box">
                <span class="n">🪔</span>
                <span class="u">Today</span>
            </div>
        `;
    }

    showAudioPlayer(record);
}

/* =========================================================
   COUNTDOWN TIMER
   ========================================================= */

function startCountdown(targetDate, recordId) {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    function update() {
        if (!activeRecord || activeRecord.id !== recordId) return;

        const difference = targetDate.getTime() - Date.now();

        if (difference <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            activeState = null;

            // Re-select locally; no extra Firestore read needed.
            selectAndRenderCountdown();
            return;
        }

        const second = 1000;
        const minute = second * 60;
        const hour = minute * 60;
        const day = hour * 24;

        const days = Math.floor(difference / day);
        const hours = Math.floor((difference % day) / hour);
        const minutes = Math.floor((difference % hour) / minute);
        const seconds = Math.floor((difference % minute) / second);

        countdown.innerHTML = `
            <div class="box">
                <span class="n">${days}</span>
                <span class="u">Days</span>
            </div>

            <div class="box">
                <span class="n">${String(hours).padStart(2, "0")}</span>
                <span class="u">Hours</span>
            </div>

            <div class="box">
                <span class="n">${String(minutes).padStart(2, "0")}</span>
                <span class="u">Minutes</span>
            </div>

            <div class="box">
                <span class="n">${String(seconds).padStart(2, "0")}</span>
                <span class="u">Seconds</span>
            </div>
        `;
    }

    update();

    // update() may have ended the countdown immediately.
    if (activeState === "upcoming") {
        countdownInterval = setInterval(update, 1000);
    }
}

/* =========================================================
   DATE HELPERS
   ========================================================= */

function getCountdownDate(rawDate) {
    if (!rawDate) return null;

    let date;

    if (typeof rawDate.toDate === "function") {
        date = rawDate.toDate();

    } else if (rawDate instanceof Date) {
        date = rawDate;

    } else if (
        typeof rawDate === "object" &&
        rawDate.seconds !== undefined
    ) {
        date = new Date(
            Number(rawDate.seconds) * 1000 +
            Math.floor(Number(rawDate.nanoseconds || 0) / 1000000)
        );

    } else {
        date = new Date(rawDate);
    }

    return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getISTDateKey(date) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(date);
}

/* =========================================================
   EMPTY / ERROR STATES
   ========================================================= */

function showNoCountdown() {
    activeRecord = null;
    activeState = null;

    if (countdownLabel) countdownLabel.textContent = "Puja Calendar";

    if (countdownEventTitle) {
        countdownEventTitle.textContent = "No upcoming event";
    }

    if (countdown) {
        countdown.innerHTML = `
            <div class="box">
                <span class="n">🪔</span>
                <span class="u">Countdown not set</span>
            </div>
        `;
    }
}

function showCountdownError() {
    activeRecord = null;
    activeState = null;

    if (countdownLabel) countdownLabel.textContent = "Puja Calendar";

    if (countdown) {
        countdown.innerHTML = `
            <div class="box">
                <span class="n">—</span>
                <span class="u">Unable to load countdown</span>
            </div>
        `;
    }
}

/* =========================================================
   LOAD DURGA IMAGE FROM FIRESTORE GALLERY
   ========================================================= */

async function loadDurgaImage() {
    try {
        const snapshot = await getDocs(collection(db, "gallery"));

        let durgaImageURL = "";

        snapshot.forEach(document => {
            const data = document.data();
            const title = String(data.title || "").trim().toLowerCase();

            if (title === "durga" && !durgaImageURL) {
                durgaImageURL = data.link || data.image || data.url || "";
            }
        });

        if (!durgaImageURL) {
            console.warn("ROY BARI: Durga image not found.");
            return;
        }

        const imageURL = convertGoogleDriveImageURL(durgaImageURL);

        if (heroImage) {
            heroImage.src = imageURL;
            heroImage.alt = "Roy Bari Durga idol";
        }

        if (eyeImage) {
            eyeImage.src = imageURL;
            eyeImage.alt = "Roy Bari Durga";
        }

    } catch (error) {
        console.error("ROY BARI: GALLERY FIREBASE ERROR:", error);
    }
}

function convertGoogleDriveImageURL(url) {
    if (!url) return "";

    const value = String(url).trim();

    const fileMatch = value.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);

    if (fileMatch?.[1]) {
        return (
            `https://drive.google.com/thumbnail?id=` +
            `${encodeURIComponent(fileMatch[1])}&sz=w1600`
        );
    }

    try {
        const parsedURL = new URL(value);

        if (
            parsedURL.hostname.includes("drive.google.com") &&
            parsedURL.searchParams.has("id")
        ) {
            const id = parsedURL.searchParams.get("id");

            return (
                `https://drive.google.com/thumbnail?id=` +
                `${encodeURIComponent(id)}&sz=w1600`
            );
        }
    } catch (error) {
        // Not a valid URL; keep the original value.
    }

    return value;
}

/* =========================================================
   BASIC HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =========================================================
   CLEANUP
   ========================================================= */

window.addEventListener("beforeunload", () => {
    if (countdownInterval) clearInterval(countdownInterval);
    if (dayRefreshInterval) clearInterval(dayRefreshInterval);
});