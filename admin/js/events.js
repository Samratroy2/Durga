/* =========================================================
   ROY BARI — EVENTS ADMIN
   =========================================================

   FIRESTORE COLLECTION:
   events

   FIELDS:
   - title
   - about
   - category       -> Array
   - date           -> Firestore Timestamp
   - time           -> String
   - description
   - location
   - url            -> REQUIRED String
   - createdAt
   - updatedAt

   ACTIVITY HISTORY:
   activityLogs

   ========================================================= */


/* =========================================================
   FIREBASE AUTH
   ========================================================= */

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


/* =========================================================
   FIRESTORE
   ========================================================= */

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


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

import {
    auth,
    db
} from "../firebase.js";


/* =========================================================
   ACTIVITY LOGGER
   ========================================================= */

import {
    logActivity
} from "./activityLogger.js";


/* =========================================================
   ELEMENTS
   ========================================================= */

const form =
    document.getElementById("eventForm");


const eventId =
    document.getElementById("eventId");


const titleInput =
    document.getElementById("title");


const aboutInput =
    document.getElementById("about");


const dateInput =
    document.getElementById("date");


const timeInput =
    document.getElementById("time");


const descriptionInput =
    document.getElementById("description");


const locationInput =
    document.getElementById("location");


const urlInput =
    document.getElementById("url");


const categoryInputs =
    document.querySelectorAll(
        'input[name="category"]'
    );


const eventList =
    document.getElementById("eventList");


const eventCount =
    document.getElementById("eventCount");


const formTitle =
    document.getElementById("formTitle");


const saveButton =
    document.getElementById("saveButton");


const cancelButton =
    document.getElementById("cancelButton");


const message =
    document.getElementById("eventMessage");


const logoutButton =
    document.getElementById("logoutButton");


const adminEmail =
    document.getElementById("adminEmail");


const userAvatar =
    document.getElementById("userAvatar");


/* =========================================================
   DATA
   ========================================================= */

let events = [];


/* =========================================================
   AUTH
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "./index.html"
            );

            return;

        }


        updateAdminUser(user);


        await loadEvents();

    }
);


/* =========================================================
   UPDATE ADMIN USER
   ========================================================= */

function updateAdminUser(user) {

    const email =
        user.email || "Admin";


    if (adminEmail) {

        adminEmail.textContent =
            email;

    }


    if (userAvatar) {

        userAvatar.textContent =
            email
                .charAt(0)
                .toUpperCase() || "A";

    }

}


/* =========================================================
   LOAD EVENTS
   ========================================================= */

async function loadEvents() {

    if (!eventList) {

        return;

    }


    try {

        eventList.innerHTML = `
            <div class="loading-state">
                Loading events...
            </div>
        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "events"
                )
            );


        events = [];


        snapshot.forEach(
            documentSnapshot => {

                events.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        /*
           Sort events by date first,
           then time where possible.
        */

        events.sort(
            (a, b) => {

                const dateA =
                    getDateTimestamp(
                        a.date
                    );

                const dateB =
                    getDateTimestamp(
                        b.date
                    );


                if (
                    dateA !==
                    dateB
                ) {

                    return dateA - dateB;

                }


                return (
                    getTimeMinutes(
                        a.time
                    ) -
                    getTimeMinutes(
                        b.time
                    )
                );

            }
        );


        updateEventCount();


        renderEvents();


    } catch (error) {

        console.error(
            "Unable to load events:",
            error
        );


        eventList.innerHTML = `
            <p class="message error">
                Unable to load events.
            </p>
        `;


        if (eventCount) {

            eventCount.textContent =
                "0 events";

        }

    }

}


/* =========================================================
   EVENT COUNT
   ========================================================= */

function updateEventCount() {

    if (!eventCount) {

        return;

    }


    const count =
        events.length;


    eventCount.textContent =
        `${count} event${count === 1 ? "" : "s"}`;

}


/* =========================================================
   RENDER EVENTS
   ========================================================= */

function renderEvents() {

    if (!eventList) {

        return;

    }


    if (!events.length) {

        eventList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🪔
                </div>

                <h3>
                    No events yet
                </h3>

                <p>
                    Add your first Puja event.
                </p>

            </div>
        `;

        return;

    }


    eventList.innerHTML = "";


    events.forEach(
        event => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "manager-item";


            const formattedDate =
                formatEventDate(
                    event.date
                );


            const formattedTime =
                formatEventTime(
                    event.time
                );


            const categories =
                getCategories(
                    event.category
                );


            const categoryHTML =
                categories.length
                    ? `
                        <div class="event-categories">

                            ${categories
                                .map(
                                    category => `
                                        <span class="category-tag">
                                            ${escapeHtml(
                                                category
                                            )}
                                        </span>
                                    `
                                )
                                .join("")}

                        </div>
                      `
                    : "";


            const urlHTML =
                event.url
                    ? `
                        <a
                            class="event-url"
                            href="${escapeHtml(
                                event.url
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            Open URL
                        </a>
                      `
                    : `
                        <span class="event-url-missing">
                            <i class="fa-solid fa-link-slash"></i>
                            URL not set
                        </span>
                      `;


            item.innerHTML = `

                <div class="manager-item-main">

                    <div class="manager-avatar">
                        🪔
                    </div>


                    <div class="manager-item-content">

                        <h3>
                            ${escapeHtml(
                                event.title ||
                                "Untitled"
                            )}
                        </h3>


                        <span class="event-date">

                            <i class="fa-regular fa-calendar"></i>

                            ${escapeHtml(
                                formattedDate
                            )}

                            ${
                                formattedTime
                                    ? `
                                        <span class="event-time">
                                            <i class="fa-regular fa-clock"></i>
                                            ${escapeHtml(
                                                formattedTime
                                            )}
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
                                        ${escapeHtml(
                                            event.location
                                        )}
                                    </small>
                                  `
                                : ""
                        }


                        ${
                            event.description
                                ? `
                                    <small class="event-description">
                                        ${escapeHtml(
                                            event.description
                                        )}
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
                        data-id="${escapeHtml(
                            event.id
                        )}"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="delete-button"
                        data-id="${escapeHtml(
                            event.id
                        )}"
                    >
                        Delete
                    </button>

                </div>

            `;


            eventList.appendChild(
                item
            );

        }
    );


    attachEventButtons();

}


/* =========================================================
   ATTACH EVENT BUTTONS
   ========================================================= */

function attachEventButtons() {

    document
        .querySelectorAll(
            ".edit-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editEvent(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".delete-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteEvent(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   GET SELECTED CATEGORIES
   ========================================================= */

function getSelectedCategories() {

    const categories = [];


    categoryInputs.forEach(
        input => {

            if (input.checked) {

                categories.push(
                    input.value
                );

            }

        }
    );


    return categories;

}


/* =========================================================
   SET SELECTED CATEGORIES
   ========================================================= */

function setSelectedCategories(
    categories
) {

    const selected =
        getCategories(
            categories
        );


    categoryInputs.forEach(
        input => {

            input.checked =
                selected.includes(
                    input.value
                );

        }
    );

}


/* =========================================================
   CATEGORY NORMALIZATION
   ========================================================= */

function getCategories(
    category
) {

    if (
        Array.isArray(
            category
        )
    ) {

        return category;

    }


    /*
       Backwards compatibility if an
       older document has a string.
    */

    if (
        typeof category === "string" &&
        category.trim()
    ) {

        return [
            category.trim()
        ];

    }


    return [];

}


/* =========================================================
   SAVE EVENT
   ========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    eventId &&
                    eventId.value
                        ? "Updating..."
                        : "Saving...";

            }


            try {

                /* =================================================
                   GET FORM VALUES
                   ================================================= */

                const title =
                    titleInput
                        ? titleInput.value.trim()
                        : "";


                const about =
                    aboutInput
                        ? aboutInput.value.trim()
                        : "";


                const date =
                    dateInput
                        ? dateInput.value.trim()
                        : "";


                const time =
                    timeInput
                        ? timeInput.value.trim()
                        : "";


                const description =
                    descriptionInput
                        ? descriptionInput.value.trim()
                        : "";


                const location =
                    locationInput
                        ? locationInput.value.trim()
                        : "";


                const url =
                    urlInput
                        ? urlInput.value.trim()
                        : "";


                const categories =
                    getSelectedCategories();


                /* =================================================
                   VALIDATION — TITLE
                   ================================================= */

                if (!title) {

                    showMessage(
                        "Please enter an event title.",
                        "error"
                    );

                    return;

                }


                /* =================================================
                   VALIDATION — DATE
                   ================================================= */

                if (!date) {

                    showMessage(
                        "Please select an event date.",
                        "error"
                    );

                    return;

                }


                /* =================================================
                   VALIDATION — TIME
                   ================================================= */

                if (!time) {

                    showMessage(
                        "Please select an event time.",
                        "error"
                    );

                    return;

                }


                /* =================================================
                   VALIDATION — URL
                   ================================================= */

                if (!url) {

                    showMessage(
                        "URL is required.",
                        "error"
                    );

                    return;

                }


                if (!isValidUrl(url)) {

                    showMessage(
                        "Please enter a valid URL beginning with https:// or http://.",
                        "error"
                    );

                    return;

                }


                /* =================================================
                   VALIDATION — CATEGORY
                   ================================================= */

                if (!categories.length) {

                    showMessage(
                        "Please select at least one category.",
                        "error"
                    );

                    return;

                }


                /* =================================================
                   CREATE FIRESTORE DATE
                   ================================================= */

                const firestoreDate =
                    createFirestoreDate(
                        date
                    );


                /* =================================================
                   NEW EVENT
                   ================================================= */

                if (
                    !eventId ||
                    !eventId.value
                ) {

                    const data = {

                        title:
                            title,

                        about:
                            about,

                        category:
                            categories,

                        date:
                            firestoreDate,

                        time:
                            formatTimeForStorage(
                                time
                            ),

                        description:
                            description,

                        location:
                            location,

                        url:
                            url,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    };


                    const newEvent =
                        await addDoc(
                            collection(
                                db,
                                "events"
                            ),
                            data
                        );


                    await safeLogActivity({

                        action:
                            "created",

                        collectionName:
                            "events",

                        documentId:
                            newEvent.id,

                        title:
                            title,

                        details:
                            buildEventDetails(
                                {
                                    title,
                                    about,
                                    category:
                                        categories,
                                    date:
                                        firestoreDate,
                                    time:
                                        formatTimeForStorage(
                                            time
                                        ),
                                    description,
                                    location,
                                    url
                                }
                            )

                    });


                    showMessage(
                        "Event added successfully.",
                        "success"
                    );

                }


                /* =================================================
                   UPDATE EVENT
                   ================================================= */

                else {

                    const id =
                        eventId.value;


                    const existingEvent =
                        events.find(
                            item =>
                                item.id ===
                                id
                        );


                    if (!existingEvent) {

                        throw new Error(
                            "Event not found."
                        );

                    }


                    const storedTime =
                        formatTimeForStorage(
                            time
                        );


                    const newEventData = {

                        title:
                            title,

                        about:
                            about,

                        category:
                            categories,

                        date:
                            firestoreDate,

                        time:
                            storedTime,

                        description:
                            description,

                        location:
                            location,

                        url:
                            url

                    };


                    const changes =
                        getChangedFields(
                            existingEvent,
                            newEventData
                        );


                    const updateData = {

                        title:
                            title,

                        category:
                            categories,

                        date:
                            firestoreDate,

                        time:
                            storedTime,

                        url:
                            url,

                        updatedAt:
                            serverTimestamp()

                    };


                    /* =================================================
                       ABOUT
                       ================================================= */

                    if (about) {

                        updateData.about =
                            about;

                    } else {

                        updateData.about =
                            deleteField();

                    }


                    /* =================================================
                       DESCRIPTION
                       ================================================= */

                    if (description) {

                        updateData.description =
                            description;

                    } else {

                        updateData.description =
                            deleteField();

                    }


                    /* =================================================
                       LOCATION
                       ================================================= */

                    if (location) {

                        updateData.location =
                            location;

                    } else {

                        updateData.location =
                            deleteField();

                    }


                    await updateDoc(
                        doc(
                            db,
                            "events",
                            id
                        ),
                        updateData
                    );


                    await safeLogActivity({

                        action:
                            "updated",

                        collectionName:
                            "events",

                        documentId:
                            id,

                        title:
                            title,

                        details:
                            formatChanges(
                                changes
                            )

                    });


                    showMessage(
                        "Event updated successfully.",
                        "success"
                    );

                }


                resetForm();


                await loadEvents();


            } catch (error) {

                console.error(
                    "Save event error:",
                    error
                );


                showMessage(
                    getFirestoreErrorMessage(
                        error
                    ),
                    "error"
                );

            } finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "Save Event";

                }

            }

        }
    );

}


/* =========================================================
   CREATE FIRESTORE DATE
   ========================================================= */

function createFirestoreDate(
    dateString
) {

    const parts =
        dateString.split("-");


    if (
        parts.length !== 3
    ) {

        throw new Error(
            "Invalid event date."
        );

    }


    const year =
        Number(
            parts[0]
        );


    const month =
        Number(
            parts[1]
        );


    const day =
        Number(
            parts[2]
        );


    const date =
        new Date(
            year,
            month - 1,
            day,
            0,
            0,
            0,
            0
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        throw new Error(
            "Invalid event date."
        );

    }


    return Timestamp.fromDate(
        date
    );

}


/* =========================================================
   FORMAT TIME FOR FIRESTORE
   =========================================================

   HTML time input gives:

   19:00

   Firestore stores:

   7:00 PM

   ========================================================= */

function formatTimeForStorage(
    time
) {

    if (!time) {

        return "";

    }


    const parts =
        time.split(":");


    if (
        parts.length < 2
    ) {

        return time;

    }


    let hour =
        Number(
            parts[0]
        );


    const minute =
        Number(
            parts[1]
        );


    if (
        Number.isNaN(hour) ||
        Number.isNaN(minute)
    ) {

        return time;

    }


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return (
        `${hour}:${String(minute).padStart(2, "0")} ${period}`
    );

}


/* =========================================================
   FORMAT EVENT TIME
   ========================================================= */

function formatEventTime(
    time
) {

    if (!time) {

        return "";

    }


    /*
       Existing records may already contain
       values such as:

       7:00 PM
       Evening
       19:00
    */

    if (
        /AM|PM/i.test(
            time
        )
    ) {

        return time;

    }


    const parts =
        time.split(":");


    if (
        parts.length < 2
    ) {

        return time;

    }


    let hour =
        Number(
            parts[0]
        );


    const minute =
        Number(
            parts[1]
        );


    if (
        Number.isNaN(hour) ||
        Number.isNaN(minute)
    ) {

        return time;

    }


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 || 12;


    return (
        `${hour}:${String(minute).padStart(2, "0")} ${period}`
    );

}


/* =========================================================
   GET TIME MINUTES
   ========================================================= */

function getTimeMinutes(
    time
) {

    if (!time) {

        return 0;

    }


    const value =
        String(
            time
        )
        .trim()
        .toUpperCase();


    const match =
        value.match(
            /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/
        );


    if (!match) {

        return 0;

    }


    let hour =
        Number(
            match[1]
        );


    const minute =
        Number(
            match[2]
        );


    const period =
        match[3];


    if (
        period === "PM" &&
        hour !== 12
    ) {

        hour += 12;

    }


    if (
        period === "AM" &&
        hour === 12
    ) {

        hour = 0;

    }


    return (
        hour * 60 +
        minute
    );

}


/* =========================================================
   EDIT EVENT
   ========================================================= */

function editEvent(id) {

    const event =
        events.find(
            item =>
                item.id === id
        );


    if (!event) {

        showMessage(
            "Event could not be found.",
            "error"
        );

        return;

    }


    /* =====================================================
       ID
       ===================================================== */

    if (eventId) {

        eventId.value =
            event.id;

    }


    /* =====================================================
       TITLE
       ===================================================== */

    if (titleInput) {

        titleInput.value =
            event.title || "";

    }


    /* =====================================================
       ABOUT
       ===================================================== */

    if (aboutInput) {

        aboutInput.value =
            event.about || "";

    }


    /* =====================================================
       DATE
       ===================================================== */

    if (dateInput) {

        dateInput.value =
            formatDateForInput(
                event.date
            );

    }


    /* =====================================================
       TIME
       ===================================================== */

    if (timeInput) {

        timeInput.value =
            formatTimeForInput(
                event.time
            );

    }


    /* =====================================================
       DESCRIPTION
       ===================================================== */

    if (descriptionInput) {

        descriptionInput.value =
            event.description || "";

    }


    /* =====================================================
       LOCATION
       ===================================================== */

    if (locationInput) {

        locationInput.value =
            event.location || "";

    }


    /* =====================================================
       URL
       ===================================================== */

    if (urlInput) {

        urlInput.value =
            event.url || "";

    }


    /* =====================================================
       CATEGORY
       ===================================================== */

    setSelectedCategories(
        event.category
    );


    /* =====================================================
       FORM TITLE
       ===================================================== */

    if (formTitle) {

        formTitle.textContent =
            "Edit Event";

    }


    if (saveButton) {

        saveButton.textContent =
            "Update Event";

    }


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


/* =========================================================
   FORMAT TIME FOR HTML INPUT
   =========================================================

   Firestore:

   7:00 PM

   HTML:

   19:00

   ========================================================= */

function formatTimeForInput(
    time
) {

    if (!time) {

        return "";

    }


    const value =
        String(
            time
        )
        .trim()
        .toUpperCase();


    const match =
        value.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
        );


    if (!match) {

        /*
           Already looks like 19:00
        */

        if (
            /^\d{1,2}:\d{2}$/.test(
                value
            )
        ) {

            return value;

        }


        return "";

    }


    let hour =
        Number(
            match[1]
        );


    const minute =
        Number(
            match[2]
        );


    const period =
        match[3];


    if (
        period === "PM" &&
        hour !== 12
    ) {

        hour += 12;

    }


    if (
        period === "AM" &&
        hour === 12
    ) {

        hour = 0;

    }


    return (
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    );

}


/* =========================================================
   DELETE EVENT
   ========================================================= */

async function deleteEvent(
    id
) {

    const event =
        events.find(
            item =>
                item.id === id
        );


    if (!event) {

        return;

    }


    const title =
        event.title ||
        "this event";


    const confirmed =
        window.confirm(
            `Delete "${title}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "events",
                id
            )
        );


        await safeLogActivity({

            action:
                "deleted",

            collectionName:
                "events",

            documentId:
                id,

            title:
                title,

            details:
                buildEventDetails(
                    event
                )

        });


        showMessage(
            "Event deleted successfully.",
            "success"
        );


        resetForm();


        await loadEvents();


    } catch (error) {

        console.error(
            "Delete event error:",
            error
        );


        showMessage(
            getFirestoreErrorMessage(
                error
            ),
            "error"
        );

    }

}


/* =========================================================
   RESET FORM
   ========================================================= */

if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        resetForm
    );

}


function resetForm() {

    if (form) {

        form.reset();

    }


    if (eventId) {

        eventId.value =
            "";

    }


    setSelectedCategories(
        []
    );


    if (formTitle) {

        formTitle.textContent =
            "Add Event";

    }


    if (saveButton) {

        saveButton.textContent =
            "Save Event";

    }


    if (message) {

        message.textContent =
            "";

        message.className =
            "message";

    }

}


/* =========================================================
   ACTIVITY LOGGING
   ========================================================= */

async function safeLogActivity(
    activity
) {

    try {

        await logActivity(
            activity
        );

    } catch (error) {

        console.error(
            "Activity logging failed:",
            error
        );

    }

}


/* =========================================================
   BUILD EVENT DETAILS
   ========================================================= */

function buildEventDetails(
    event
) {

    const details = [];


    if (event.title) {

        details.push(
            `Title: ${event.title}`
        );

    }


    if (event.about) {

        details.push(
            `About: ${event.about}`
        );

    }


    const categories =
        getCategories(
            event.category
        );


    if (categories.length) {

        details.push(
            `Category: ${categories.join(", ")}`
        );

    }


    if (event.date) {

        details.push(
            `Date: ${formatEventDate(
                event.date
            )}`
        );

    }


    if (event.time) {

        details.push(
            `Time: ${formatEventTime(
                event.time
            )}`
        );

    }


    if (event.description) {

        details.push(
            `Description: ${event.description}`
        );

    }


    if (event.location) {

        details.push(
            `Location: ${event.location}`
        );

    }


    if (event.url) {

        details.push(
            `URL: ${event.url}`
        );

    }


    return details.length
        ? details.join(". ")
        : "Event information.";

}


/* =========================================================
   GET CHANGED FIELDS
   ========================================================= */

function getChangedFields(
    oldData,
    newData
) {

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


    /* =====================================================
       CATEGORY
       ===================================================== */

    const oldCategories =
        getCategories(
            oldData.category
        );


    const newCategories =
        getCategories(
            newData.category
        );


    if (
        JSON.stringify(
            [...oldCategories].sort()
        ) !==
        JSON.stringify(
            [...newCategories].sort()
        )
    ) {

        changes.push({

            field:
                "category",

            oldValue:
                oldCategories.join(
                    ", "
                ),

            newValue:
                newCategories.join(
                    ", "
                )

        });

    }


    /* =====================================================
       DATE
       ===================================================== */

    const oldDate =
        getDateTimestamp(
            oldData.date
        );


    const newDate =
        getDateTimestamp(
            newData.date
        );


    if (
        oldDate !==
        newDate
    ) {

        changes.push({

            field:
                "date",

            oldValue:
                formatEventDate(
                    oldData.date
                ),

            newValue:
                formatEventDate(
                    newData.date
                )

        });

    }


    /* =====================================================
       TIME
       ===================================================== */

    compareField(
        changes,
        "time",
        formatEventTime(
            oldData.time || ""
        ),
        formatEventTime(
            newData.time || ""
        )
    );


    /* =====================================================
       DESCRIPTION
       ===================================================== */

    compareField(
        changes,
        "description",
        oldData.description || "",
        newData.description || ""
    );


    /* =====================================================
       LOCATION
       ===================================================== */

    compareField(
        changes,
        "location",
        oldData.location || "",
        newData.location || ""
    );


    /* =====================================================
       URL
       ===================================================== */

    compareField(
        changes,
        "url",
        oldData.url || "",
        newData.url || ""
    );


    return changes;

}


/* =========================================================
   COMPARE FIELD
   ========================================================= */

function compareField(
    changes,
    field,
    oldValue,
    newValue
) {

    if (
        String(oldValue) !==
        String(newValue)
    ) {

        changes.push({

            field:
                field,

            oldValue:
                oldValue,

            newValue:
                newValue

        });

    }

}


/* =========================================================
   FORMAT CHANGES
   ========================================================= */

function formatChanges(
    changes
) {

    if (
        !changes ||
        !changes.length
    ) {

        return "Event information updated.";

    }


    return changes
        .map(
            change => {

                const field =
                    formatFieldName(
                        change.field
                    );


                const oldValue =
                    change.oldValue === ""
                        ? "(empty)"
                        : String(
                            change.oldValue
                        );


                const newValue =
                    change.newValue === ""
                        ? "(empty)"
                        : String(
                            change.newValue
                        );


                return (
                    `${field}: "${oldValue}" → "${newValue}"`
                );

            }
        )
        .join(
            " | "
        );

}


/* =========================================================
   FORMAT EVENT DATE
   ========================================================= */

function formatEventDate(
    value
) {

    const date =
        convertToDate(
            value
        );


    if (!date) {

        return "Date not set";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    ).format(
        date
    );

}


/* =========================================================
   FORMAT DATE FOR INPUT
   ========================================================= */

function formatDateForInput(
    value
) {

    const date =
        convertToDate(
            value
        );


    if (!date) {

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}


/* =========================================================
   CONVERT TO DATE
   ========================================================= */

function convertToDate(
    value
) {

    if (!value) {

        return null;

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    if (
        typeof value === "object" &&
        typeof value.seconds === "number"
    ) {

        return new Date(
            value.seconds * 1000
        );

    }


    if (
        value instanceof Date
    ) {

        return value;

    }


    if (
        typeof value === "string"
    ) {

        const simpleDate =
            /^(\d{4})-(\d{2})-(\d{2})$/
                .exec(
                    value
                );


        if (simpleDate) {

            return new Date(

                Number(
                    simpleDate[1]
                ),

                Number(
                    simpleDate[2]
                ) - 1,

                Number(
                    simpleDate[3]
                )

            );

        }


        const parsed =
            new Date(
                value
            );


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            return parsed;

        }

    }


    if (
        typeof value === "number"
    ) {

        const date =
            new Date(
                value
            );


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return date;

        }

    }


    return null;

}


/* =========================================================
   GET DATE TIMESTAMP
   ========================================================= */

function getDateTimestamp(
    value
) {

    const date =
        convertToDate(
            value
        );


    if (!date) {

        return Number.MAX_SAFE_INTEGER;

    }


    return date.getTime();

}


/* =========================================================
   URL VALIDATION
   ========================================================= */

function isValidUrl(
    value
) {

    try {

        const url =
            new URL(
                value
            );


        return (
            url.protocol ===
                "http:" ||
            url.protocol ===
                "https:"
        );

    } catch {

        return false;

    }

}


/* =========================================================
   FORMAT FIELD NAME
   ========================================================= */

function formatFieldName(
    field
) {

    return String(
        field
    )

        .replace(
            /([A-Z])/g,
            " $1"
        )

        .replace(
            /[_-]/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        .replace(
            /^./,
            character =>
                character.toUpperCase()
        );

}


/* =========================================================
   FIRESTORE ERROR MESSAGE
   ========================================================= */

function getFirestoreErrorMessage(
    error
) {

    if (!error) {

        return "Something went wrong.";

    }


    switch (
        error.code
    ) {

        case "permission-denied":

            return (
                "Permission denied. Check your Firebase security rules."
            );


        case "unauthenticated":

            return (
                "Your admin session has expired. Please login again."
            );


        case "network-request-failed":

            return (
                "Network error. Please check your internet connection."
            );


        default:

            return (
                error.message ||
                "Unable to complete the operation."
            );

    }

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    text,
    type
) {

    if (!message) {

        return;

    }


    message.textContent =
        text;


    message.className =
        `message ${type}`;


    window.setTimeout(
        () => {

            if (
                message.textContent ===
                text
            ) {

                message.textContent =
                    "";

                message.className =
                    "message";

            }

        },
        5000
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                window.location.replace(
                    "./index.html"
                );


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   DEBUG HELPERS
   ========================================================= */

window.reloadRoyBariEvents =
    loadEvents;


window.resetRoyBariEventForm =
    resetForm;