/* =========================================================
   ROY BARI — EVENTS ADMIN
   FIRESTORE: events
   ACTIVITY HISTORY: activityLogs
   ========================================================= */

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import {
    auth,
    db
} from "../firebase.js";


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


const dateInput =
    document.getElementById("date");


const timeInput =
    document.getElementById("time");


const locationInput =
    document.getElementById("location");


const descriptionInput =
    document.getElementById("description");


const imageInput =
    document.getElementById("image");


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


        if (adminEmail) {

            adminEmail.textContent =
                user.email || "Admin";

        }


        await loadEvents();

    }
);


/* =========================================================
   LOAD EVENTS
   ========================================================= */

async function loadEvents() {

    try {

        eventList.innerHTML =
            "Loading events...";


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "events"
                )
            );


        events = [];


        snapshot.forEach(
            item => {

                events.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


        /*
           Sort newest created records first.
        */

        events.sort(
            (a, b) =>
                getTimestamp(
                    b.createdAt
                ) -
                getTimestamp(
                    a.createdAt
                )
        );


        eventCount.textContent =
            `${events.length} event${
                events.length === 1
                    ? ""
                    : "s"
            }`;


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

    }

}


/* =========================================================
   RENDER EVENTS
   ========================================================= */

function renderEvents() {

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


            const eventDate =
                event.date || "";


            const eventTime =
                event.time
                    ? ` · ${event.time}`
                    : "";


            item.innerHTML = `

                <div class="manager-item-main">

                    <div class="manager-avatar">
                        🪔
                    </div>


                    <div>

                        <h3>
                            ${escapeHtml(
                                event.title ||
                                "Untitled"
                            )}
                        </h3>


                        <span>
                            ${escapeHtml(
                                eventDate
                            )}
                            ${escapeHtml(
                                eventTime
                            )}
                        </span>


                        ${
                            event.location
                                ? `
                                    <small>
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
                                    <small>
                                        ${escapeHtml(
                                            event.description
                                        )}
                                    </small>
                                  `
                                : ""
                        }

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
   ATTACH BUTTONS
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
   SAVE EVENT
   ========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            saveButton.disabled =
                true;


            saveButton.textContent =
                eventId.value
                    ? "Updating..."
                    : "Saving...";


            try {

                /*
                   Collect form values.
                */

                const rawData = {

                    title:
                        titleInput.value.trim(),

                    date:
                        dateInput.value.trim(),

                    time:
                        timeInput.value.trim(),

                    location:
                        locationInput.value.trim(),

                    description:
                        descriptionInput.value.trim(),

                    image:
                        imageInput.value.trim()

                };


                /*
                   Remove empty fields.

                   Example:

                   location: ""

                   will NOT be stored.
                */

                const data =
                    removeEmptyFields(
                        rawData
                    );


                /* =================================================
                   UPDATE EXISTING EVENT
                   ================================================= */

                if (eventId.value) {

                    const existingEvent =
                        events.find(
                            item =>
                                item.id ===
                                eventId.value
                        );


                    if (!existingEvent) {

                        throw new Error(
                            "Event not found."
                        );

                    }


                    /*
                       Find exactly what changed.
                    */

                    const changes =
                        getChangedFields(
                            existingEvent,
                            data
                        );


                    /*
                       Always update updatedAt.
                    */

                    data.updatedAt =
                        serverTimestamp();


                    await updateDoc(
                        doc(
                            db,
                            "events",
                            eventId.value
                        ),
                        data
                    );


                    /*
                       Save activity history.
                    */

                    const changeDescription =
                        formatChanges(
                            changes
                        );


                    await logActivity({

                        action:
                            "updated",

                        collectionName:
                            "events",

                        documentId:
                            eventId.value,

                        title:
                            data.title ||
                            existingEvent.title ||
                            "Untitled Event",

                        details:
                            changeDescription ||
                            "Event information updated."

                    });


                    showMessage(
                        "Event updated successfully.",
                        "success"
                    );

                }


                /* =================================================
                   ADD NEW EVENT
                   ================================================= */

                else {

                    data.createdAt =
                        serverTimestamp();


                    data.updatedAt =
                        serverTimestamp();


                    const newEvent =
                        await addDoc(
                            collection(
                                db,
                                "events"
                            ),
                            data
                        );


                    /*
                       Save activity history.
                    */

                    await logActivity({

                        action:
                            "created",

                        collectionName:
                            "events",

                        documentId:
                            newEvent.id,

                        title:
                            data.title ||
                            "Untitled Event",

                        details:
                            `Created new Puja event "${data.title || "Untitled Event"}".`

                    });


                    showMessage(
                        "Event added successfully.",
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
                    "Unable to save event.",
                    "error"
                );

            }


            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Event";

        }
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

        return;

    }


    eventId.value =
        event.id;


    titleInput.value =
        event.title || "";


    dateInput.value =
        event.date || "";


    timeInput.value =
        event.time || "";


    locationInput.value =
        event.location || "";


    descriptionInput.value =
        event.description || "";


    imageInput.value =
        event.image || "";


    formTitle.textContent =
        "Edit Event";


    saveButton.textContent =
        "Update Event";


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

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


    const confirmed =
        window.confirm(
            `Delete "${
                event.title ||
                "this event"
            }"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        /*
           Delete from events collection.
        */

        await deleteDoc(
            doc(
                db,
                "events",
                id
            )
        );


        /*
           IMPORTANT:
           Log BEFORE refreshing the list.
        */

        await logActivity({

            action:
                "deleted",

            collectionName:
                "events",

            documentId:
                id,

            title:
                event.title ||
                "Untitled Event",

            details:
                buildDeletedEventDetails(
                    event
                )

        });


        showMessage(
            "Event deleted successfully.",
            "success"
        );


        await loadEvents();


    } catch (error) {

        console.error(
            "Delete event error:",
            error
        );


        showMessage(
            "Unable to delete event.",
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


    eventId.value =
        "";


    formTitle.textContent =
        "Add Event";


    saveButton.textContent =
        "Save Event";

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
   REMOVE EMPTY FIELDS
   ========================================================= */

function removeEmptyFields(
    data
) {

    const cleaned = {};


    Object.entries(
        data
    ).forEach(
        ([key, value]) => {

            /*
               Do not store:

               ""
               null
               undefined
               whitespace
            */

            if (
                value === null ||
                value === undefined
            ) {

                return;

            }


            if (
                typeof value === "string" &&
                value.trim() === ""
            ) {

                return;

            }


            cleaned[key] =
                value;

        }
    );


    return cleaned;

}


/* =========================================================
   FIND CHANGED FIELDS
   ========================================================= */

function getChangedFields(
    oldData,
    newData
) {

    const changes = [];


    const fields = [

        "title",

        "date",

        "time",

        "location",

        "description",

        "image"

    ];


    fields.forEach(
        field => {

            const oldValue =
                oldData[field] ?? "";


            const newValue =
                newData[field] ?? "";


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
    );


    return changes;

}


/* =========================================================
   FORMAT CHANGES
   ========================================================= */

function formatChanges(
    changes
) {

    if (
        !changes ||
        changes.length === 0
    ) {

        return "Event information saved without changing the event fields.";

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


                return `${field}: "${oldValue}" → "${newValue}"`;

            }
        )
        .join(
            " | "
        );

}


/* =========================================================
   DELETED EVENT DETAILS
   ========================================================= */

function buildDeletedEventDetails(
    event
) {

    const details = [];


    if (event.title) {

        details.push(
            `Title: ${event.title}`
        );

    }


    if (event.date) {

        details.push(
            `Date: ${event.date}`
        );

    }


    if (event.time) {

        details.push(
            `Time: ${event.time}`
        );

    }


    if (event.location) {

        details.push(
            `Location: ${event.location}`
        );

    }


    if (event.description) {

        details.push(
            `Description: ${event.description}`
        );

    }


    if (event.image) {

        details.push(
            `Image: ${event.image}`
        );

    }


    return details.length
        ? `Deleted event. ${details.join(". ")}`
        : "Deleted event.";

}


/* =========================================================
   FORMAT FIELD NAME
   ========================================================= */

function formatFieldName(
    field
) {

    return String(field)

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
   TIMESTAMP
   ========================================================= */

function getTimestamp(
    value
) {

    if (!value) {

        return 0;

    }


    if (
        value?.toDate
    ) {

        return value
            .toDate()
            .getTime();

    }


    if (
        value?.seconds
    ) {

        return Number(
            value.seconds
        ) * 1000;

    }


    const time =
        new Date(
            value
        ).getTime();


    return Number.isNaN(
        time
    )
        ? 0
        : time;

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