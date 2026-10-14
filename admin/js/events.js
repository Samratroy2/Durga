/* =========================================================
   ROY BARI — EVENTS ADMIN
   Firestore collection: events
   Multiple dates stored in dates: Timestamp[]
   Legacy date field retained for compatibility.
   URL can be removed (field is deleted from the document).
   ========================================================= */

import {
    onAuthStateChanged,
    getIdTokenResult,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
    deleteField
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { auth, db } from "../firebase.js";
import { logActivity } from "./activityLogger.js";

/* ======================== ELEMENTS ======================== */

const form = document.getElementById("eventForm");
const eventId = document.getElementById("eventId");
const titleInput = document.getElementById("title");
const aboutInput = document.getElementById("about");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const descriptionInput = document.getElementById("description");
const locationInput = document.getElementById("location");
const urlInput = document.getElementById("url");

const categoryInputs = document.querySelectorAll(
    'input[name="category"]'
);

const eventList = document.getElementById("eventList");
const eventCount = document.getElementById("eventCount");
const formTitle = document.getElementById("formTitle");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const message = document.getElementById("eventMessage");
const logoutButton = document.getElementById("logoutButton");
const adminEmail = document.getElementById("adminEmail");
const userAvatar = document.getElementById("userAvatar");

let events = [];

/* ================= REMOVE URL (FORM BUTTON) ================= */

const REMOVE_URL_STYLE = `
    display: inline-flex;
    width: fit-content;
    padding: 6px 12px;
    border: 1px solid #edc8c3;
    border-radius: 8px;
    background: #fff;
    color: #a33b3b;
    font-family: inherit;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
`;

const removeUrlButton = (() => {
    if (!urlInput) return null;

    const button = document.createElement("button");
    button.type = "button";
    button.id = "removeUrlButton";
    button.textContent = "Remove URL";
    button.style.cssText = REMOVE_URL_STYLE;
    button.hidden = true;

    urlInput.insertAdjacentElement("afterend", button);

    urlInput.addEventListener("input", syncRemoveUrlButton);

    button.addEventListener("click", () => {
        urlInput.value = "";
        syncRemoveUrlButton();
        urlInput.focus();

        showMessage(
            "URL cleared. Click Update Event to remove it from the event.",
            "success"
        );
    });

    return button;
})();

function syncRemoveUrlButton() {
    if (removeUrlButton && urlInput) {
        removeUrlButton.hidden = !urlInput.value.trim();
    }
}

/* ================= MULTIPLE DATE INPUTS ================= */

// Reuse the existing #date input as the first date.
// Additional date inputs are generated dynamically.

const eventDatesContainer = (() => {
    if (!dateInput || !dateInput.parentElement) {
        return null;
    }

    const container = document.createElement("div");
    container.id = "eventDatesContainer";
    container.className = "event-dates-container";
    container.style.display = "grid";
    container.style.gap = "10px";

    dateInput.parentElement.insertBefore(container, dateInput);
    container.appendChild(dateInput);

    dateInput.classList.add("event-date-input");
    dateInput.required = true;

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.id = "addEventDate";
    addButton.className = "cancel-button";
    addButton.textContent = "+ Add another date";

    addButton.style.cssText = `
        display: inline-block;
        width: fit-content;
        margin-top: 8px;
        padding: 8px 14px;
        background: #6f4b35;
        color: #ffffff;
        border: 1px solid #6f4b35;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s ease;
    `;

    addButton.addEventListener("mouseenter", () => {
        addButton.style.background = "#5c3d2b";
    });

    addButton.addEventListener("mouseleave", () => {
        addButton.style.background = "#6f4b35";
    });

    container.insertAdjacentElement("afterend", addButton);

    addButton.addEventListener("click", () => {
        addEventDateInput("");
    });

    return container;
})();

function addEventDateInput(value = "") {
    if (!eventDatesContainer) return null;

    const row = document.createElement("div");
    row.className = "event-date-row";
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";

    const input = document.createElement("input");
    input.type = "date";
    input.className = "event-date-input";
    input.value = value;
    input.style.flex = "1";
    input.style.minWidth = "0";
    input.setAttribute("aria-label", "Additional event date");

    // NOTE: intentionally NOT using the .delete-button class,
    // so the event-delete handlers never attach to this button.
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-date-button";
    removeButton.textContent = "Remove";
    removeButton.style.cssText = `
        padding: 9px 13px;
        border: 1px solid #edc8c3;
        border-radius: 8px;
        background: #fff;
        color: #a33b3b;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        cursor: pointer;
    `;
    removeButton.setAttribute(
        "aria-label",
        "Remove this event date"
    );

    removeButton.addEventListener("click", () => {
        row.remove();
    });

    row.append(input, removeButton);
    eventDatesContainer.appendChild(row);

    return input;
}

/* ================= READ SELECTED DATES ================= */

function getSelectedEventDates() {
    if (!eventDatesContainer) {
        return dateInput && dateInput.value
            ? [dateInput.value]
            : [];
    }

    const inputs = [
        ...eventDatesContainer.querySelectorAll(
            ".event-date-input"
        )
    ];

    const values = inputs.map(input => input.value.trim());

    if (values.some(value => !value)) {
        throw new Error(
            "Please fill in every event date field or remove the empty field."
        );
    }

    const uniqueDates = [...new Set(values)].sort();

    return uniqueDates;
}

/* ================= RESTORE DATES IN EDIT FORM ================= */

function setEventDateInputs(values) {
    if (!eventDatesContainer || !dateInput) return;

    const dates = Array.isArray(values)
        ? values.filter(Boolean)
        : [];

    const normalized = dates.length ? dates : [""];

    // Remove the existing date elements from the container.
    // Keep the original input node so it can be reused.
    eventDatesContainer.replaceChildren();

    normalized.forEach((value, index) => {
        if (index === 0) {
            dateInput.value = value;
            dateInput.classList.add("event-date-input");
            dateInput.required = true;
            eventDatesContainer.appendChild(dateInput);
        } else {
            addEventDateInput(value);
        }
    });
}

/* ================= DATE NORMALIZATION ================= */

// Supports new documents with dates[] and old documents
// containing only date.

function getEventDateValues(event) {
    const values =
        Array.isArray(event?.dates) && event.dates.length
            ? event.dates
            : event?.date
                ? [event.date]
                : [];

    const unique = new Map();

    values.forEach(value => {
        const date = convertToDate(value);

        if (!date) return;

        const key = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");

        unique.set(key, value);
    });

    return [...unique.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, value]) => value);
}

function formatEventDates(event) {
    const dates = getEventDateValues(event)
        .map(formatEventDate)
        .filter(value => value && value !== "Date not set");

    return dates.length
        ? dates.join(", ")
        : "Date not set";
}

/* ================= AUTHENTICATION ================= */

let eventsAuthCheckInProgress = false;

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.replace("./index.html");
        return;
    }

    if (eventsAuthCheckInProgress) return;

    eventsAuthCheckInProgress = true;

    try {
        let tokenResult = await getIdTokenResult(user);

        if (tokenResult.claims.admin !== true) {
            tokenResult = await getIdTokenResult(user, true);
        }

        if (tokenResult.claims.admin !== true) {
            await signOut(auth);
            window.location.replace("./index.html");
            return;
        }

        updateAdminUser(user);
        await loadEvents();

    } catch (error) {
        console.error(
            "Events authorization/loading error:",
            error
        );

        showMessage(
            "Unable to verify or load events. Please retry.",
            "error"
        );

    } finally {
        eventsAuthCheckInProgress = false;
    }
});

function updateAdminUser(user) {
    const email = user.email || "Admin";

    if (adminEmail) {
        adminEmail.textContent = email;
    }

    if (userAvatar) {
        userAvatar.textContent =
            email.charAt(0).toUpperCase() || "A";
    }
}

/* ================= LOAD EVENTS ================= */

async function loadEvents() {
    if (!eventList) return;

    try {
        eventList.innerHTML = `
            <div class="loading-state">
                Loading events...
            </div>
        `;

        const snapshot = await getDocs(
            collection(db, "events")
        );

        events = [];

        snapshot.forEach(documentSnapshot => {
            events.push({
                id: documentSnapshot.id,
                ...documentSnapshot.data()
            });
        });

        events.sort((a, b) => {
            const dateA = getDateTimestamp(
                getEventDateValues(a)[0] || a.date
            );

            const dateB = getDateTimestamp(
                getEventDateValues(b)[0] || b.date
            );

            if (dateA !== dateB) {
                return dateA - dateB;
            }

            return (
                getTimeMinutes(a.time) -
                getTimeMinutes(b.time)
            );
        });

        updateEventCount();
        renderEvents();

    } catch (error) {
        console.error("Unable to load events:", error);

        eventList.innerHTML = `
            <p class="message error">
                Unable to load events.
            </p>
        `;

        if (eventCount) {
            eventCount.textContent = "0 events";
        }
    }
}

function updateEventCount() {
    if (!eventCount) return;

    const count = events.length;

    eventCount.textContent =
        `${count} event${count === 1 ? "" : "s"}`;
}

/* ================= RENDER EVENTS ================= */

function renderEvents() {
    if (!eventList) return;

    if (!events.length) {
        eventList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🪔</div>
                <h3>No events yet</h3>
                <p>Add your first Puja event.</p>
            </div>
        `;
        return;
    }

    eventList.innerHTML = "";

    events.forEach(event => {
        const item = document.createElement("div");
        item.className = "manager-item";

        const formattedDate = formatEventDates(event);
        const formattedTime = formatEventTime(event.time);
        const categories = getCategories(event.category);

        const categoryHTML = categories.length
            ? `
                <div class="event-categories">
                    ${categories.map(category => `
                        <span class="category-tag">
                            ${escapeHtml(category)}
                        </span>
                    `).join("")}
                </div>
            `
            : "";

        const urlHTML = event.url
            ? `
                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                    <a
                        class="event-url"
                        href="${escapeHtml(event.url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        Open URL
                    </a>

                    <button
                        type="button"
                        class="remove-url-button"
                        data-id="${escapeHtml(event.id)}"
                        style="${REMOVE_URL_STYLE} margin-top: 8px;"
                    >Remove URL</button>
                </div>
            `
            : `
                <span class="event-url-missing">
                    <i class="fa-solid fa-link-slash"></i>
                    URL not set
                </span>
            `;

        item.innerHTML = `
            <div class="manager-item-main">
                <div class="manager-avatar">🪔</div>

                <div class="manager-item-content">
                    <h3>${escapeHtml(event.title || "Untitled")}</h3>

                    <span class="event-date">
                        <i class="fa-regular fa-calendar"></i>
                        ${escapeHtml(formattedDate)}

                        ${
                            formattedTime
                                ? `
                                    <span class="event-time">
                                        <i class="fa-regular fa-clock"></i>
                                        ${escapeHtml(formattedTime)}
                                    </span>
                                `
                                : ""
                        }
                    </span>

                    ${
                        event.location
                            ? `
                                <small>
                                    <i class="fa-solid fa-location-dot"></i>
                                    ${escapeHtml(event.location)}
                                </small>
                            `
                            : ""
                    }

                    ${
                        event.description
                            ? `
                                <small class="event-description">
                                    ${escapeHtml(event.description)}
                                </small>
                            `
                            : ""
                    }

                    ${categoryHTML}
                    ${urlHTML}
                </div>
            </div>

            <div class="manager-actions">
                <button
                    type="button"
                    class="edit-button"
                    data-id="${escapeHtml(event.id)}"
                >Edit</button>

                <button
                    type="button"
                    class="delete-button"
                    data-id="${escapeHtml(event.id)}"
                >Delete</button>
            </div>
        `;

        eventList.appendChild(item);
    });

    attachEventButtons();
}

function attachEventButtons() {
    document.querySelectorAll(".edit-button").forEach(button => {
        button.addEventListener("click", () => {
            editEvent(button.dataset.id);
        });
    });

    document.querySelectorAll(".delete-button").forEach(button => {
        button.addEventListener("click", () => {
            deleteEvent(button.dataset.id);
        });
    });

    document.querySelectorAll(".remove-url-button").forEach(button => {
        button.addEventListener("click", () => {
            removeEventUrl(button.dataset.id);
        });
    });
}

/* ================= CATEGORY HELPERS ================= */

function getSelectedCategories() {
    const categories = [];

    categoryInputs.forEach(input => {
        if (input.checked) {
            categories.push(input.value);
        }
    });

    return categories;
}

function setSelectedCategories(categories) {
    const selected = getCategories(categories);

    categoryInputs.forEach(input => {
        input.checked = selected.includes(input.value);
    });
}

function getCategories(category) {
    if (Array.isArray(category)) {
        return category;
    }

    if (typeof category === "string" && category.trim()) {
        return [category.trim()];
    }

    return [];
}


/* ================= SAVE AND UPDATE EVENTS ================= */

if (form) {
    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent =
                eventId && eventId.value
                    ? "Updating..."
                    : "Saving...";
        }

        try {
            const title = titleInput
                ? titleInput.value.trim()
                : "";

            const about = aboutInput
                ? aboutInput.value.trim()
                : "";

            const selectedDates = getSelectedEventDates();

            const time = timeInput
                ? timeInput.value.trim()
                : "";

            const description = descriptionInput
                ? descriptionInput.value.trim()
                : "";

            const location = locationInput
                ? locationInput.value.trim()
                : "";

            const url = urlInput
                ? urlInput.value.trim()
                : "";

            const categories = getSelectedCategories();

            if (!title) {
                showMessage(
                    "Please enter an event title.",
                    "error"
                );
                return;
            }

            if (!selectedDates.length) {
                showMessage(
                    "Please select at least one event date.",
                    "error"
                );
                return;
            }

            if (!time) {
                showMessage(
                    "Please select an event time.",
                    "error"
                );
                return;
            }

            if (url && !isValidUrl(url)) {
                showMessage(
                    "Please enter a valid URL beginning with https:// or http://.",
                    "error"
                );
                return;
            }

            if (!categories.length) {
                showMessage(
                    "Please select at least one category.",
                    "error"
                );
                return;
            }

            // Convert every selected date to a Firestore Timestamp.
            const firestoreDates = selectedDates.map(
                createFirestoreDate
            );

            // Maintain the legacy date field.
            const firestoreDate = firestoreDates[0];

            const storedTime = formatTimeForStorage(time);

            /* ================= CREATE EVENT ================= */

            if (!eventId || !eventId.value) {
                const data = {
                    title,
                    about,
                    category: categories,

                    // New multiple-date field.
                    dates: firestoreDates,

                    // Backward compatibility.
                    date: firestoreDate,

                    time: storedTime,
                    description,
                    location,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };

                // Only store url when one was entered.
                if (url) {
                    data.url = url;
                }

                const newEvent = await addDoc(
                    collection(db, "events"),
                    data
                );

                await safeLogActivity({
                    action: "created",
                    collectionName: "events",
                    documentId: newEvent.id,
                    title,
                    details: buildEventDetails({
                        title,
                        about,
                        category: categories,
                        dates: firestoreDates,
                        date: firestoreDate,
                        time: storedTime,
                        description,
                        location,
                        url
                    })
                });

                showMessage(
                    "Event added successfully.",
                    "success"
                );
            }

            /* ================= UPDATE EVENT ================= */

            else {
                const id = eventId.value;

                const existingEvent = events.find(
                    item => item.id === id
                );

                if (!existingEvent) {
                    throw new Error("Event not found.");
                }

                const newEventData = {
                    title,
                    about,
                    category: categories,
                    dates: firestoreDates,
                    date: firestoreDate,
                    time: storedTime,
                    description,
                    location,
                    url
                };

                const changes = getChangedFields(
                    existingEvent,
                    newEventData
                );

                const updateData = {
                    title,
                    category: categories,

                    // Update the complete array.
                    dates: firestoreDates,

                    // Update the legacy first date.
                    date: firestoreDate,

                    time: storedTime,
                    updatedAt: serverTimestamp()
                };

                if (about) {
                    updateData.about = about;
                } else {
                    updateData.about = deleteField();
                }

                if (description) {
                    updateData.description = description;
                } else {
                    updateData.description = deleteField();
                }

                if (location) {
                    updateData.location = location;
                } else {
                    updateData.location = deleteField();
                }

                // URL: save it, or delete the field completely.
                if (url) {
                    updateData.url = url;
                } else {
                    updateData.url = deleteField();
                }

                await updateDoc(
                    doc(db, "events", id),
                    updateData
                );

                await safeLogActivity({
                    action: "updated",
                    collectionName: "events",
                    documentId: id,
                    title,
                    details: formatChanges(changes)
                });

                showMessage(
                    "Event updated successfully.",
                    "success"
                );
            }

            resetForm();
            await loadEvents();

        } catch (error) {
            console.error("Save event error:", error);

            showMessage(
                getFirestoreErrorMessage(error),
                "error"
            );

        } finally {
            if (saveButton) {
                saveButton.disabled = false;
                saveButton.textContent =
                    eventId && eventId.value
                        ? "Update Event"
                        : "Save Event";
            }
        }
    });
}

/* ================= FIRESTORE DATE CREATION ================= */

function createFirestoreDate(dateString) {
    const parts = dateString.split("-");

    if (parts.length !== 3) {
        throw new Error("Invalid event date.");
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    const date = new Date(
        year,
        month - 1,
        day,
        0,
        0,
        0,
        0
    );

    if (
        Number.isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        throw new Error("Invalid event date.");
    }

    return Timestamp.fromDate(date);
}

/* ================= TIME FORMATTING ================= */

// HTML time input: 19:00
// Firestore time string: 7:00 PM

function formatTimeForStorage(time) {
    if (!time) return "";

    const parts = time.split(":");

    if (parts.length < 2) return time;

    let hour = Number(parts[0]);
    const minute = Number(parts[1]);

    if (
        Number.isNaN(hour) ||
        Number.isNaN(minute)
    ) {
        return time;
    }

    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

function formatEventTime(time) {
    if (!time) return "";

    if (/AM|PM/i.test(time)) {
        return time;
    }

    const parts = time.split(":");

    if (parts.length < 2) return time;

    let hour = Number(parts[0]);
    const minute = Number(parts[1]);

    if (
        Number.isNaN(hour) ||
        Number.isNaN(minute)
    ) {
        return time;
    }

    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;

    return `${hour}:${String(minute).padStart(2, "0")} ${period}`;
}

function getTimeMinutes(time) {
    if (!time) return 0;

    const value = String(time).trim().toUpperCase();

    const match = value.match(
        /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/
    );

    if (!match) return 0;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const period = match[3];

    if (period === "PM" && hour !== 12) {
        hour += 12;
    }

    if (period === "AM" && hour === 12) {
        hour = 0;
    }

    return hour * 60 + minute;
}

/* ================= EDIT EVENT ================= */

function editEvent(id) {
    const event = events.find(item => item.id === id);

    if (!event) {
        showMessage(
            "Event could not be found.",
            "error"
        );
        return;
    }

    if (eventId) {
        eventId.value = event.id;
    }

    if (titleInput) {
        titleInput.value = event.title || "";
    }

    if (aboutInput) {
        aboutInput.value = event.about || "";
    }

    // Load every saved date into the form.
    // Old records containing only date still work.
    setEventDateInputs(
        getEventDateValues(event).map(formatDateForInput)
    );

    if (timeInput) {
        timeInput.value = formatTimeForInput(event.time);
    }

    if (descriptionInput) {
        descriptionInput.value = event.description || "";
    }

    if (locationInput) {
        locationInput.value = event.location || "";
    }

    if (urlInput) {
        urlInput.value = event.url || "";
    }

    syncRemoveUrlButton();

    setSelectedCategories(event.category);

    if (formTitle) {
        formTitle.textContent = "Edit Event";
    }

    if (saveButton) {
        saveButton.textContent = "Update Event";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

/* ================= TIME FOR HTML INPUT ================= */

function formatTimeForInput(time) {
    if (!time) return "";

    const value = String(time).trim().toUpperCase();

    const match = value.match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
    );

    if (!match) {
        if (/^\d{1,2}:\d{2}$/.test(value)) {
            return value;
        }

        return "";
    }

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const period = match[3];

    if (period === "PM" && hour !== 12) {
        hour += 12;
    }

    if (period === "AM" && hour === 12) {
        hour = 0;
    }

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}


/* ================= DELETE EVENT ================= */

async function deleteEvent(id) {
    const event = events.find(item => item.id === id);

    if (!event) return;

    const title = event.title || "this event";

    const confirmed = window.confirm(
        `Delete "${title}"?`
    );

    if (!confirmed) return;

    try {
        await deleteDoc(doc(db, "events", id));

        await safeLogActivity({
            action: "deleted",
            collectionName: "events",
            documentId: id,
            title,
            details: buildEventDetails(event)
        });

        showMessage(
            "Event deleted successfully.",
            "success"
        );

        resetForm();
        await loadEvents();

    } catch (error) {
        console.error("Delete event error:", error);

        showMessage(
            getFirestoreErrorMessage(error),
            "error"
        );
    }
}

/* ================= REMOVE URL (LIST BUTTON) ================= */

async function removeEventUrl(id) {
    const event = events.find(item => item.id === id);

    if (!event || !event.url) return;

    const title = event.title || "this event";

    const confirmed = window.confirm(
        `Remove the URL from "${title}"?`
    );

    if (!confirmed) return;

    try {
        await updateDoc(doc(db, "events", id), {
            url: deleteField(),
            updatedAt: serverTimestamp()
        });

        await safeLogActivity({
            action: "updated",
            collectionName: "events",
            documentId: id,
            title,
            details: formatChanges([
                {
                    field: "url",
                    oldValue: event.url,
                    newValue: ""
                }
            ])
        });

        // If this event is currently open in the form,
        // clear the URL there as well.
        if (
            eventId &&
            eventId.value === id &&
            urlInput
        ) {
            urlInput.value = "";
            syncRemoveUrlButton();
        }

        showMessage(
            "URL removed successfully.",
            "success"
        );

        await loadEvents();

    } catch (error) {
        console.error("Remove URL error:", error);

        showMessage(
            getFirestoreErrorMessage(error),
            "error"
        );
    }
}

/* ================= RESET FORM ================= */

if (cancelButton) {
    cancelButton.addEventListener("click", resetForm);
}

function resetForm() {
    if (form) {
        form.reset();
    }

    // Restore exactly one empty date field.
    setEventDateInputs([""]);

    if (eventId) {
        eventId.value = "";
    }

    setSelectedCategories([]);

    if (formTitle) {
        formTitle.textContent = "Add Event";
    }

    if (saveButton) {
        saveButton.textContent = "Save Event";
    }

    if (message) {
        message.textContent = "";
        message.className = "message";
    }

    syncRemoveUrlButton();
}

/* ================= ACTIVITY LOGGING ================= */

async function safeLogActivity(activity) {
    try {
        await logActivity(activity);
    } catch (error) {
        console.error("Activity logging failed:", error);
    }
}

/* ================= BUILD EVENT DETAILS ================= */

function buildEventDetails(event) {
    const details = [];

    if (event.title) {
        details.push(`Title: ${event.title}`);
    }

    if (event.about) {
        details.push(`About: ${event.about}`);
    }

    const categories = getCategories(event.category);

    if (categories.length) {
        details.push(`Category: ${categories.join(", ")}`);
    }

    if (getEventDateValues(event).length) {
        details.push(`Dates: ${formatEventDates(event)}`);
    }

    if (event.time) {
        details.push(`Time: ${formatEventTime(event.time)}`);
    }

    if (event.description) {
        details.push(`Description: ${event.description}`);
    }

    if (event.location) {
        details.push(`Location: ${event.location}`);
    }

    if (event.url) {
        details.push(`URL: ${event.url}`);
    }

    return details.length
        ? details.join(". ")
        : "Event information.";
}

/* ================= CHANGE TRACKING ================= */

function getChangedFields(oldData, newData) {
    const changes = [];

    compareField(
        changes,
        "title",
        oldData.title || "",
        newData.title || ""
    );

    compareField(
        changes,
        "about",
        oldData.about || "",
        newData.about || ""
    );

    const oldCategories = getCategories(oldData.category);
    const newCategories = getCategories(newData.category);

    if (
        JSON.stringify([...oldCategories].sort()) !==
        JSON.stringify([...newCategories].sort())
    ) {
        changes.push({
            field: "category",
            oldValue: oldCategories.join(", "),
            newValue: newCategories.join(", ")
        });
    }

    const oldDates = getEventDateValues(oldData)
        .map(formatEventDate)
        .join(", ");

    const newDates = getEventDateValues(newData)
        .map(formatEventDate)
        .join(", ");

    compareField(
        changes,
        "dates",
        oldDates,
        newDates
    );

    compareField(
        changes,
        "time",
        formatEventTime(oldData.time || ""),
        formatEventTime(newData.time || "")
    );

    compareField(
        changes,
        "description",
        oldData.description || "",
        newData.description || ""
    );

    compareField(
        changes,
        "location",
        oldData.location || "",
        newData.location || ""
    );

    compareField(
        changes,
        "url",
        oldData.url || "",
        newData.url || ""
    );

    return changes;
}

function compareField(
    changes,
    field,
    oldValue,
    newValue
) {
    if (String(oldValue) !== String(newValue)) {
        changes.push({
            field,
            oldValue,
            newValue
        });
    }
}

function formatChanges(changes) {
    if (!changes || !changes.length) {
        return "Event information updated.";
    }

    return changes.map(change => {
        const field = formatFieldName(change.field);

        const oldValue =
            change.oldValue === ""
                ? "(empty)"
                : String(change.oldValue);

        const newValue =
            change.newValue === ""
                ? "(empty)"
                : String(change.newValue);

        return `${field}: "${oldValue}" → "${newValue}"`;
    }).join(" | ");
}

/* ================= DATE FORMATTING ================= */

function formatEventDate(value) {
    const date = convertToDate(value);

    if (!date) {
        return "Date not set";
    }

    return new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(date);
}

function formatDateForInput(value) {
    const date = convertToDate(value);

    if (!date) return "";

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function convertToDate(value) {
    if (!value) return null;

    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    if (
        typeof value === "object" &&
        typeof value.seconds === "number"
    ) {
        return new Date(value.seconds * 1000);
    }

    if (value instanceof Date) {
        return value;
    }

    if (typeof value === "string") {
        const simpleDate = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

        if (simpleDate) {
            return new Date(
                Number(simpleDate[1]),
                Number(simpleDate[2]) - 1,
                Number(simpleDate[3])
            );
        }

        const parsed = new Date(value);

        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }

    if (typeof value === "number") {
        const date = new Date(value);

        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
}

function getDateTimestamp(value) {
    const date = convertToDate(value);

    if (!date) {
        return Number.MAX_SAFE_INTEGER;
    }

    return date.getTime();
}

/* ================= URL VALIDATION ================= */

function isValidUrl(value) {
    try {
        const url = new URL(value);

        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );

    } catch {
        return false;
    }
}

/* ================= FIELD NAME FORMATTING ================= */

function formatFieldName(field) {
    return String(field)
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(
            /^./,
            character => character.toUpperCase()
        );
}

/* ================= FIRESTORE ERRORS ================= */

function getFirestoreErrorMessage(error) {
    if (!error) {
        return "Something went wrong.";
    }

    switch (error.code) {
        case "permission-denied":
            return "Permission denied. Check your Firebase security rules.";

        case "unauthenticated":
            return "Your admin session has expired. Please login again.";

        case "network-request-failed":
            return "Network error. Please check your internet connection.";

        default:
            return error.message || "Unable to complete the operation.";
    }
}

/* ================= STATUS MESSAGES ================= */

function showMessage(text, type) {
    if (!message) return;

    message.textContent = text;
    message.className = `message ${type}`;

    window.setTimeout(() => {
        if (message.textContent === text) {
            message.textContent = "";
            message.className = "message";
        }
    }, 5000);
}

/* ================= LOGOUT ================= */

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.replace("./index.html");

        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}

/* ================= HTML ESCAPING ================= */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* ================= DEBUG HELPERS ================= */

window.reloadRoyBariEvents = loadEvents;
window.resetRoyBariEventForm = resetForm;