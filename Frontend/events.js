/* =========================================================
   ROY BARI — EVENTS (PUBLIC PAGE)
   Firestore collection: events

   FIELDS:
   title, about, category[], time ("7:30 PM"), description,
   location, url (Google Drive image)

   DATES:
   dates -> Timestamp[]  (multiple days for one event)
   date  -> Timestamp    (legacy; used only if dates is missing)

   STATUS (calculated from all dates of the event):
   upcoming -> first day + time has not started yet
   ongoing  -> only from the start time until 1 hour after it,
               on each event date
   ended    -> 1 hour after the start time on the LAST date
   (between the dates of a multi-day event: upcoming)
   ========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { db } from "./firebase.js";


/* ======================== STATE ======================== */

let events = [];
let activeFilter = "all";
let countdownInterval = null;
let currentNextEventId = null;
let statusSignature = "";

const DAY_MS = 24 * 60 * 60 * 1000;

// How long an event stays "Ongoing" after its start time
// on each date.
const EVENT_DURATION_MS = 60 * 60 * 1000; // 1 hour


/* ======================== START ======================== */

document.addEventListener("DOMContentLoaded", () => {
    initEventImageModal();
    loadEvents();
    initEventFilters();

    // Re-check statuses every minute (e.g. event ends at midnight).
    setInterval(refreshIfStatusChanged, 60000);
});


/* ======================== LOAD ======================== */

async function loadEvents() {
    const grid = document.getElementById("events-grid");
    if (!grid) return;

    try {
        const snapshot = await getDocs(collection(db, "events"));

        events = [];

        snapshot.forEach(docSnap => {
            const data = docSnap.data();

            let category = [];
            if (Array.isArray(data.category)) {
                category = data.category
                    .map(item => String(item).trim().toLowerCase())
                    .filter(Boolean);
            } else if (data.category) {
                category = [String(data.category).trim().toLowerCase()];
            }

            events.push({
                id: docSnap.id,
                title: data.title || "Untitled Event",
                about: data.about || "",
                category,
                days: normalizeEventDays(data),
                time: data.time || "",
                description: data.description || "",
                location: data.location || "",
                url: data.url || ""
            });
        });

        if (events.length === 0) {
            grid.innerHTML = messageCard(
                "No events found",
                "The Roy Bari Puja calendar is currently empty."
            );
            updateNextEventEmpty();
            renderOngoingNow();
            return;
        }

        // Chronological: first date, then time.
        events.sort((a, b) => {
            const aFirst = a.days.length ? a.days[0].getTime() : Infinity;
            const bFirst = b.days.length ? b.days[0].getTime() : Infinity;
            if (aFirst !== bFirst) return aFirst - bFirst;
            return timeToMinutes(a.time) - timeToMinutes(b.time);
        });

        refreshAll();

    } catch (error) {
        console.error("FIREBASE ERROR:", error);

        grid.innerHTML = `
            <div class="event-card">
                <div class="event-content">
                    <h3>Unable to load events</h3>
                    <p>${escapeHTML(error.message)}</p>
                    <small>Please check your Firebase configuration and Firestore security rules.</small>
                </div>
            </div>
        `;

        updateNextEventError();
    }
}

function messageCard(title, text) {
    return `
        <div class="event-card">
            <div class="event-content">
                <h3>${escapeHTML(title)}</h3>
                <p>${escapeHTML(text)}</p>
            </div>
        </div>
    `;
}

/* Re-render everything from the already loaded data. */
function refreshAll() {
    renderEvents(getFilteredEvents());
    findNextEvent();
    renderOngoingNow();
    statusSignature = computeStatusSignature();
}

function computeStatusSignature() {
    const now = Date.now();
    return events.map(e => {
        const s = getEventStatus(e, now);
        return `${e.id}:${s.key}:${s.dayNumber}`;
    }).join("|");
}

function refreshIfStatusChanged() {
    if (!events.length) return;
    if (computeStatusSignature() !== statusSignature) {
        refreshAll();
    }
}


/* ======================== DATES ======================== */

function convertToDate(value) {
    if (!value) return null;

    if (typeof value.toDate === "function") return value.toDate();

    if (value instanceof Date) return new Date(value.getTime());

    if (typeof value === "object" && typeof value.seconds === "number") {
        return new Date(value.seconds * 1000);
    }

    if (typeof value === "string") {
        const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    if (typeof value === "number") {
        const d = new Date(value);
        if (!Number.isNaN(d.getTime())) return d;
    }

    return null;
}

function startOfDay(date) {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    );
}

/* Returns a sorted, de-duplicated array of local midnight Dates. */
function normalizeEventDays(data) {
    const raw = Array.isArray(data.dates) && data.dates.length
        ? data.dates
        : data.date
            ? [data.date]
            : [];

    const map = new Map();

    raw.forEach(value => {
        const d = convertToDate(value);
        if (!d) return;
        const day = startOfDay(d);
        map.set(day.getTime(), day);
    });

    return [...map.values()].sort((a, b) => a - b);
}

/* Combine a day with the event's time. */
function getOccurrence(day, time) {
    const date = new Date(day.getTime());
    const parts = parseEventTime(time);

    if (parts) {
        date.setHours(parts.hours, parts.minutes, 0, 0);
    }

    return date.getTime();
}

/* =========================================================
   EVENT STATUS
   ========================================================= */

function getEventStatus(event, now = Date.now()) {
    const days = event.days;

    if (!days.length) {
        return {
            key: "unknown",
            label: "Date TBA",
            dayNumber: 0,
            total: 0,
            nextTs: null
        };
    }

    const total = days.length;
    const occurrences = days.map(day => getOccurrence(day, event.time));

    // "Ongoing" is shown only from the start time until
    // EVENT_DURATION_MS after it, on each event date.
    // (If the event has no usable time, the window is the whole day.)
    const hasTime = Boolean(parseEventTime(event.time));

    const windowEnd = (index) => {
        if (hasTime) {
            return occurrences[index] + EVENT_DURATION_MS;
        }

        const d = days[index];
        return new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate() + 1
        ).getTime();
    };

    const nextIndex = occurrences.findIndex(ts => ts > now);
    const nextTs = nextIndex === -1 ? null : occurrences[nextIndex];

    // ONGOING: now is inside the window of one of the dates
    for (let i = 0; i < total; i++) {
        if (now >= occurrences[i] && now < windowEnd(i)) {
            return {
                key: "ongoing",
                label: total > 1
                    ? `Ongoing · Day ${i + 1} of ${total}`
                    : "Ongoing",
                dayNumber: i + 1,
                total,
                nextTs
            };
        }
    }

    // ENDED: the last date's window is over
    if (now >= windowEnd(total - 1)) {
        return {
            key: "ended",
            label: "Ended",
            dayNumber: total,
            total,
            nextTs: null
        };
    }

    // UPCOMING: first date not started yet, or waiting for the
    // next date of a multi-day event
    const todayStart = startOfDay(new Date(now)).getTime();
    const nextIsToday =
        nextTs !== null &&
        startOfDay(new Date(nextTs)).getTime() === todayStart;

    let label = "Upcoming";

    if (nextIsToday) {
        label = "Today";
    } else if (total > 1 && nextIndex > 0) {
        label = `Upcoming · Day ${nextIndex + 1} of ${total}`;
    }

    return {
        key: "upcoming",
        label,
        dayNumber: 0,
        total,
        nextTs
    };
}


/* ======================== TIME ======================== */

function parseEventTime(time) {
    if (!time) return null;

    const value = String(time).trim().toUpperCase();

    const twelve = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
    if (twelve) {
        let hours = Number(twelve[1]);
        const minutes = Number(twelve[2]);
        if (hours < 1 || hours > 12 || minutes > 59) return null;
        if (twelve[3] === "PM" && hours !== 12) hours += 12;
        if (twelve[3] === "AM" && hours === 12) hours = 0;
        return { hours, minutes };
    }

    const twentyFour = value.match(/^(\d{1,2}):(\d{2})$/);
    if (twentyFour) {
        const hours = Number(twentyFour[1]);
        const minutes = Number(twentyFour[2]);
        if (hours > 23 || minutes > 59) return null;
        return { hours, minutes };
    }

    return null;
}

function timeToMinutes(time) {
    const p = parseEventTime(time);
    return p ? p.hours * 60 + p.minutes : 0;
}

function formatEventTime(event) {
    if (!event.time || !String(event.time).trim()) return "";

    const parsed = parseEventTime(event.time);
    if (!parsed) return String(event.time); // e.g. "Evening"

    const period = parsed.hours >= 12 ? "PM" : "AM";
    const hour = parsed.hours % 12 || 12;
    return `${hour}:${String(parsed.minutes).padStart(2, "0")} ${period}`;
}


/* ======================== DATE FORMATTING ======================== */

function fmt(date, options) {
    return date.toLocaleDateString("en-IN", options);
}

function isContiguous(days) {
    for (let i = 1; i < days.length; i++) {
        if (Math.round((days[i] - days[i - 1]) / DAY_MS) !== 1) return false;
    }
    return true;
}

/* "17 October 2026"  |  "11 – 15 October 2026"  |  "30 Sep – 2 October 2026" */
function formatDateRange(days) {
    if (!days.length) return "Not available";

    const first = days[0];
    const last = days[days.length - 1];

    if (days.length === 1) {
        return fmt(first, { day: "numeric", month: "long", year: "numeric" });
    }

    const sameYear = first.getFullYear() === last.getFullYear();
    const sameMonth = sameYear && first.getMonth() === last.getMonth();

    if (sameMonth) {
        return `${first.getDate()} – ${fmt(last, { day: "numeric", month: "long", year: "numeric" })}`;
    }

    if (sameYear) {
        return `${fmt(first, { day: "numeric", month: "long" })} – ${fmt(last, { day: "numeric", month: "long", year: "numeric" })}`;
    }

    return `${fmt(first, { day: "numeric", month: "long", year: "numeric" })} – ${fmt(last, { day: "numeric", month: "long", year: "numeric" })}`;
}

function formatDayLabel(days) {
    if (!days.length) return "Date";

    if (days.length === 1) {
        return fmt(days[0], { weekday: "long" });
    }

    if (isContiguous(days)) {
        return `${fmt(days[0], { weekday: "short" })} – ${fmt(days[days.length - 1], { weekday: "short" })} · ${days.length} days`;
    }

    return `${days.length} days`;
}

/* Only for non-consecutive dates: "11 Oct, 13 Oct, 15 Oct" */
function formatSpecificDates(days) {
    return days
        .map(d => fmt(d, { day: "numeric", month: "short" }))
        .join(", ");
}


/* ======================== RENDER EVENTS ======================== */

function getFilteredEvents() {
    if (activeFilter === "all") return events;

    return events.filter(event =>
        event.category.some(category => {
            if (activeFilter === "visitors") {
                return category === "visitors" || category === "visitor";
            }
            if (activeFilter === "culturals") {
                return category === "culturals" || category === "cultural";
            }
            return category === activeFilter;
        })
    );
}

/* Ended events go to the bottom; everything else keeps date order. */
function sortEventsForDisplay(eventList, now = Date.now()) {
    const active = [];
    const ended = [];

    eventList.forEach(event => {
        if (getEventStatus(event, now).key === "ended") {
            ended.push(event);
        } else {
            active.push(event);
        }
    });

    // eventList is already chronological (first date, then time).
    return [...active, ...ended];
}

function renderEvents(eventList) {
    const grid = document.getElementById("events-grid");
    if (!grid) return;

    grid.innerHTML = "";

    if (eventList.length === 0) {
        grid.innerHTML = messageCard(
            "No events found",
            "There are no events in this category."
        );
        return;
    }

    const now = Date.now();

    // Ongoing + upcoming first (by date), ended events at the bottom.
    const ordered = sortEventsForDisplay(eventList, now);

    let endedHeadingAdded = false;

    ordered.forEach((event, index) => {
        const status = getEventStatus(event, now);

        // Small divider before the first ended event.
        if (status.key === "ended" && !endedHeadingAdded) {
            endedHeadingAdded = true;

            if (index > 0) {
                const divider = document.createElement("div");
                divider.className = "ended-divider";
                divider.textContent = "Ended events";
                grid.appendChild(divider);
            }
        }

        const card = document.createElement("article");
        card.className = `event-card status-${status.key}`;

        if (status.key === "upcoming") card.classList.add("upcoming");
        if (status.key === "ongoing") card.classList.add("ongoing");
        if (status.key === "ended") card.classList.add("ended");

        const hasDates = event.days.length > 0;

        const dateHTML = `
            <div class="event-date">
                <span class="event-day">
                    ${escapeHTML(hasDates ? formatDayLabel(event.days) : "Date")}
                </span>
                <span class="event-full-date">
                    ${escapeHTML(hasDates ? formatDateRange(event.days) : "Not available")}
                </span>
            </div>
        `;

        const statusHTML = `
            <div class="event-status-row">
                <span class="event-status ${status.key}">
                    ${escapeHTML(status.label)}
                </span>
            </div>
        `;

        const time = formatEventTime(event);

        const timeHTML = time
            ? `<div><span>${event.days.length > 1 ? "Time (each day)" : "Time"}</span><strong>${escapeHTML(time)}</strong></div>`
            : "";

        const locationHTML = event.location
            ? `<div><span>Location</span><strong>${escapeHTML(event.location)}</strong></div>`
            : "";

        const datesDetailHTML =
            event.days.length > 1 && !isContiguous(event.days)
                ? `<div style="grid-column:1 / -1;"><span>Dates</span><strong>${escapeHTML(formatSpecificDates(event.days))}</strong></div>`
                : "";

        const detailsHTML =
            timeHTML || locationHTML || datesDetailHTML
                ? `<div class="event-details">${datesDetailHTML}${timeHTML}${locationHTML}</div>`
                : "";

        let aboutHTML = "";

        if (event.about && event.about.trim()) {
            const aboutId = `event-about-${index}-${safeId(event.id)}`;

            aboutHTML = `
                <div class="event-about">
                    <button
                        type="button"
                        class="event-about-toggle"
                        aria-expanded="false"
                        aria-controls="${escapeHTML(aboutId)}"
                    >
                        <span>About this event</span>
                        <span class="about-icon" aria-hidden="true">+</span>
                    </button>

                    <div id="${escapeHTML(aboutId)}" class="event-about-content" hidden>
                        <p>${escapeHTML(event.about)}</p>
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            ${dateHTML}

            <div class="event-content">
                ${statusHTML}

                <h3 style="margin: 13px;">${escapeHTML(event.title)}</h3>

                ${buildCategoryHTML(event.category)}

                ${event.description ? `<p>${escapeHTML(event.description)}</p>` : ""}

                ${detailsHTML}

                ${buildURLHTML(event.url, event.id)}

                ${aboutHTML}
            </div>
        `;

        grid.appendChild(card);
    });

    initAboutButtons();
}


/* ======================== CATEGORY ======================== */

function buildCategoryHTML(categories) {
    if (!Array.isArray(categories) || categories.length === 0) return "";

    const unique = [...new Set(
        categories.map(c => String(c).trim().toLowerCase()).filter(Boolean)
    )];

    if (!unique.length) return "";

    return `
        <div class="event-categories">
            ${unique.map(category => `
                <span class="event-category">
                    ${escapeHTML(formatCategoryName(category))}
                </span>
            `).join("")}
        </div>
    `;
}

function formatCategoryName(category) {
    const names = {
        ritual: "Ritual",
        family: "Family",
        visitors: "Visitors",
        visitor: "Visitors",
        culturals: "Culturals",
        cultural: "Culturals"
    };

    return names[category] ||
        category.charAt(0).toUpperCase() + category.slice(1);
}


/* ======================== URL / IMAGE ======================== */

function buildURLHTML(url, eventId) {
    if (!url || !String(url).trim()) return "";
    if (!isSafeURL(String(url).trim())) return "";

    return `
        <div class="event-link">
            <button
                type="button"
                class="event-url event-view-button"
                data-event-id="${escapeHTML(eventId)}"
            >
                <span>View Event Image</span>
            </button>
        </div>
    `;
}

function isSafeURL(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function convertGoogleDriveURL(url) {
    if (!url) return "";

    const cleanURL = String(url).trim();

    const fileMatch = cleanURL.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
    if (fileMatch) {
        return "https://drive.google.com/thumbnail?id=" +
            encodeURIComponent(fileMatch[1]) + "&sz=w2000";
    }

    try {
        const parsed = new URL(cleanURL);

        if (
            parsed.hostname === "drive.google.com" ||
            parsed.hostname.endsWith(".drive.google.com")
        ) {
            const fileId = parsed.searchParams.get("id");
            if (fileId) {
                return "https://drive.google.com/thumbnail?id=" +
                    encodeURIComponent(fileId) + "&sz=w2000";
            }
        }
    } catch {
        return cleanURL;
    }

    return cleanURL;
}


/* ======================== IMAGE MODAL ======================== */

function initEventImageModal() {
    const modal = document.getElementById("event-image-modal");
    const image = document.getElementById("event-image");
    const loading = document.getElementById("event-image-loading");
    const errorBox = document.getElementById("event-image-error");
    const title = document.getElementById("event-image-title");
    const closeButton = document.getElementById("event-image-close");
    const nextEventButton = document.getElementById("next-event-link");

    if (!modal || !image || !loading || !errorBox || !title || !closeButton) {
        console.error("Event image modal elements not found.");
        return;
    }

    let lastFocusedElement = null;

    function openModal(event) {
        if (!event || !event.url) return;

        lastFocusedElement = document.activeElement;

        title.textContent = event.title || "Event";

        image.removeAttribute("src");
        image.alt = event.title || "Roy Bari event";
        image.hidden = true;
        errorBox.hidden = true;
        loading.hidden = false;

        modal.hidden = false;
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("event-modal-open");

        const imageURL = convertGoogleDriveURL(event.url);

        requestAnimationFrame(() => { image.src = imageURL; });
        requestAnimationFrame(() => { closeButton.focus(); });
    }

    function closeModal() {
        if (document.activeElement && modal.contains(document.activeElement)) {
            document.activeElement.blur();
        }

        modal.setAttribute("aria-hidden", "true");
        modal.hidden = true;
        document.body.classList.remove("event-modal-open");

        image.removeAttribute("src");
        image.hidden = true;
        loading.hidden = true;
        errorBox.hidden = true;

        if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            requestAnimationFrame(() => {
                try {
                    if (document.contains(lastFocusedElement)) {
                        lastFocusedElement.focus();
                    }
                } catch { /* ignore */ }
            });
        }

        lastFocusedElement = null;
    }

    image.addEventListener("load", () => {
        loading.hidden = true;
        errorBox.hidden = true;
        image.hidden = false;
    });

    image.addEventListener("error", () => {
        if (modal.hidden || !image.getAttribute("src")) return;

        console.error("Event image could not be loaded:", image.src);

        loading.hidden = true;
        image.hidden = true;
        errorBox.hidden = false;
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", event => {
        if (event.target.matches("[data-close-event-modal]")) closeModal();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !modal.hidden) closeModal();
    });

    document.addEventListener("click", event => {
        const button = event.target.closest(".event-view-button");
        if (!button) return;

        const selected = events.find(item => item.id === button.dataset.eventId);

        if (!selected) {
            console.error("Event not found:", button.dataset.eventId);
            return;
        }

        openModal(selected);
    });

    if (nextEventButton) {
        nextEventButton.addEventListener("click", () => {
            const selected = events.find(item => item.id === currentNextEventId);

            if (!selected) {
                console.error("Next event not found.");
                return;
            }

            openModal(selected);
        });
    }
}


/* ======================== ABOUT TOGGLES ======================== */

function initAboutButtons() {
    document.querySelectorAll(".event-about-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const content = document.getElementById(
                button.getAttribute("aria-controls")
            );
            if (!content) return;

            const isOpen = button.getAttribute("aria-expanded") === "true";
            const icon = button.querySelector(".about-icon");

            button.setAttribute("aria-expanded", String(!isOpen));
            content.hidden = isOpen;
            if (icon) icon.textContent = isOpen ? "+" : "−";
        });
    });
}


/* =========================================================
   ONGOING NOW  (needs <div id="ongoing-now"> in events.html)
   ========================================================= */

function renderOngoingNow() {
    const box = document.getElementById("ongoing-now");
    if (!box) return;

    const now = Date.now();

    const ongoing = events
        .map(event => ({ event, status: getEventStatus(event, now) }))
        .filter(item => item.status.key === "ongoing");

    if (!ongoing.length) {
        box.hidden = true;
        box.innerHTML = "";
        return;
    }

    box.hidden = false;

    box.innerHTML = `
        <span class="ongoing-now-label">
            <span class="ongoing-dot" aria-hidden="true"></span>
            Happening now
        </span>
        ${ongoing.map(({ event, status }) => `
            <span class="ongoing-now-item">
                <strong>${escapeHTML(event.title)}</strong>
                ${status.total > 1
                    ? `<small>Day ${status.dayNumber} of ${status.total}</small>`
                    : ""}
            </span>
        `).join("")}
    `;
}


/* =========================================================
   NEXT EVENT  (soonest upcoming occurrence of ANY event)
   ========================================================= */

function getNextOccurrence() {
    const now = Date.now();
    let best = null;

    events.forEach(event => {
        const status = getEventStatus(event, now);
        if (status.nextTs === null) return;

        if (!best || status.nextTs < best.ts) {
            const index = event.days.findIndex(
                day => getOccurrence(day, event.time) === status.nextTs
            );

            best = {
                event,
                ts: status.nextTs,
                dayIndex: index,
                total: event.days.length
            };
        }
    });

    return best;
}

function findNextEvent() {
    const nameElement = document.getElementById("next-event-name");
    const descriptionElement = document.getElementById("next-event-description");
    const dateElement = document.getElementById("next-event-date");
    const timeElement = document.getElementById("next-event-time");
    const linkElement = document.getElementById("next-event-link");

    if (!nameElement || !descriptionElement) return;

    const next = getNextOccurrence();

    if (!next) {
        nameElement.textContent = "No upcoming events";
        descriptionElement.textContent = "The Puja calendar will appear here.";
        if (dateElement) dateElement.textContent = "";
        if (timeElement) timeElement.textContent = "";
        if (linkElement) linkElement.hidden = true;

        stopCountdown();
        setCountdown(0, 0, 0, 0);
        currentNextEventId = null;
        return;
    }

    const { event, ts, dayIndex, total } = next;

    currentNextEventId = event.id;

    nameElement.textContent = event.title;
    descriptionElement.textContent = event.description || event.about || "";

    if (dateElement) {
        dateElement.textContent = fmt(new Date(ts), {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    }

    if (timeElement) {
        const parts = [];
        const time = formatEventTime(event);

        if (time) parts.push(time);
        if (total > 1 && dayIndex >= 0) {
            parts.push(`Day ${dayIndex + 1} of ${total}`);
        }

        timeElement.textContent = parts.length ? ` · ${parts.join(" · ")}` : "";
    }

    if (linkElement) {
        linkElement.hidden = !(event.url && isSafeURL(event.url));
    }

    startCountdown(ts);
}

function updateNextEventEmpty() {
    const set = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    set("next-event-name", "No events found");
    set("next-event-description", "The Puja calendar is currently empty.");
    set("next-event-date", "");
    set("next-event-time", "");

    const link = document.getElementById("next-event-link");
    if (link) link.hidden = true;

    stopCountdown();
    setCountdown(0, 0, 0, 0);
}

function updateNextEventError() {
    const set = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    set("next-event-name", "Unable to load events");
    set("next-event-description", "Please try again later.");

    const link = document.getElementById("next-event-link");
    if (link) link.hidden = true;

    stopCountdown();
    setCountdown(0, 0, 0, 0);
}


/* ======================== COUNTDOWN ======================== */

function stopCountdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function startCountdown(target) {
    stopCountdown();

    if (!Number.isFinite(target)) {
        setCountdown(0, 0, 0, 0);
        return;
    }

    function tick() {
        const difference = target - Date.now();

        if (difference <= 0) {
            stopCountdown();
            setCountdown(0, 0, 0, 0);

            // The event just started: refresh statuses, badges
            // ("Upcoming" -> "Ongoing") and pick the next occurrence.
            refreshAll();
            return;
        }

        const days = Math.floor(difference / DAY_MS);
        const hours = Math.floor((difference % DAY_MS) / 3600000);
        const minutes = Math.floor((difference % 3600000) / 60000);
        const seconds = Math.floor((difference % 60000) / 1000);

        setCountdown(days, hours, minutes, seconds);
    }

    tick();

    // tick() may already have stopped/replaced the countdown.
    if (!countdownInterval && target - Date.now() > 0) {
        countdownInterval = setInterval(tick, 1000);
    }
}

function setCountdown(days, hours, minutes, seconds) {
    const values = { days, hours, minutes, seconds };

    Object.entries(values).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value).padStart(2, "0");
    });
}


/* ======================== FILTERS ======================== */

function initEventFilters() {
    const buttons = document.querySelectorAll(".event-filter");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            buttons.forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            activeFilter = String(button.dataset.filter || "all")
                .trim()
                .toLowerCase();

            renderEvents(getFilteredEvents());
        });
    });
}


/* ======================== UTILITIES ======================== */

function safeId(value) {
    return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "-");
}

function escapeHTML(value) {
    if (value === null || value === undefined) return "";

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}