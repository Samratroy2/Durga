/* =========================================================
   ROY BARI — EVENTS
   FIREBASE FIRESTORE
   =========================================================

   FIRESTORE COLLECTION:
   events

   EXPECTED FIELDS:

   title
   about
   category      -> Array
   date          -> Firestore Timestamp
   time          -> String, e.g. "7:30 PM"
   description
   location
   url           -> Google Drive image URL
   createdAt
   updatedAt

   ========================================================= */


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import {
    db
} from "./firebase.js";



/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let events = [];

let countdownInterval = null;

let currentNextEventId = null;



/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /*
           Initialize the event image modal
           before loading Firestore events.
        */

        initEventImageModal();


        /*
           Load events from Firestore.
        */

        loadEvents();


        /*
           Initialize category filters.
        */

        initEventFilters();

    }
);



/* =========================================================
   LOAD EVENTS
   ========================================================= */

async function loadEvents() {

    const grid =
        document.getElementById(
            "events-grid"
        );


    if (!grid) {

        return;

    }


    try {


        const eventsRef =
            collection(
                db,
                "events"
            );


        const snapshot =
            await getDocs(
                eventsRef
            );


        events = [];


        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                /* =================================================
                   CATEGORY
                   ================================================= */

                let category = [];


                if (
                    Array.isArray(
                        data.category
                    )
                ) {

                    category =
                        data.category
                            .map(
                                item =>
                                    String(item)
                                        .trim()
                                        .toLowerCase()
                            )
                            .filter(
                                Boolean
                            );

                }

                else if (
                    data.category
                ) {

                    category = [

                        String(
                            data.category
                        )
                            .trim()
                            .toLowerCase()

                    ];

                }


                /* =================================================
                   EVENT OBJECT
                   ================================================= */

                events.push({

                    id:
                        documentSnapshot.id,

                    title:
                        data.title ||
                        "Untitled Event",

                    about:
                        data.about ||
                        "",

                    category:
                        category,

                    date:
                        data.date ||
                        null,

                    time:
                        data.time ||
                        "",

                    description:
                        data.description ||
                        "",

                    location:
                        data.location ||
                        "",

                    url:
                        data.url ||
                        ""

                });

            }
        );


        /* =================================================
           NO EVENTS
           ================================================= */

        if (
            events.length === 0
        ) {

            grid.innerHTML = `

                <div class="event-card">

                    <div class="event-content">

                        <h3>
                            No events found
                        </h3>

                        <p>
                            The Roy Bari Puja calendar
                            is currently empty.
                        </p>

                    </div>

                </div>

            `;


            updateNextEventEmpty();


            return;

        }


        /* =================================================
           SORT EVENTS
           ================================================= */

        events.sort(
            (a, b) => {

                return (
                    getEventDate(a) -
                    getEventDate(b)
                );

            }
        );


        /* =================================================
           DISPLAY
           ================================================= */

        renderEvents(
            events
        );


        /* =================================================
           FIND NEXT EVENT
           ================================================= */

        findNextEvent(
            events
        );

    }

    catch (error) {

        console.error(
            "FIREBASE ERROR:",
            error
        );


        grid.innerHTML = `

            <div class="event-card">

                <div class="event-content">

                    <h3>
                        Unable to load events
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                    <small>
                        Please check your Firebase
                        configuration and Firestore
                        security rules.
                    </small>

                </div>

            </div>

        `;


        updateNextEventError();

    }

}



/* =========================================================
   GET EVENT DATE + TIME
   ========================================================= */

function getEventDate(
    event
) {

    const date =
        getDateObject(
            event
        );


    if (!date) {

        return Infinity;

    }


    /*
       Firestore stores the event date
       separately from the event time.

       Example:

       date = 17 October 2026
       time = 7:30 PM
    */

    if (
        event.time &&
        String(
            event.time
        ).trim()
    ) {

        const timeParts =
            parseEventTime(
                event.time
            );


        if (timeParts) {

            date.setHours(
                timeParts.hours,
                timeParts.minutes,
                0,
                0
            );

        }

    }


    return date.getTime();

}



/* =========================================================
   GET DATE OBJECT
   ========================================================= */

function getDateObject(
    event
) {

    if (
        !event ||
        !event.date
    ) {

        return null;

    }


    /* =====================================================
       FIRESTORE TIMESTAMP
       ===================================================== */

    if (
        event.date &&
        typeof event.date.toDate ===
            "function"
    ) {

        const date =
            event.date.toDate();


        return new Date(
            date.getTime()
        );

    }


    /* =====================================================
       JAVASCRIPT DATE
       ===================================================== */

    if (
        event.date instanceof Date
    ) {

        return new Date(
            event.date.getTime()
        );

    }


    /* =====================================================
       FIRESTORE SERIALIZED TIMESTAMP
       ===================================================== */

    if (
        typeof event.date ===
            "object" &&
        typeof event.date.seconds ===
            "number"
    ) {

        return new Date(
            event.date.seconds * 1000
        );

    }


    /* =====================================================
       STRING DATE
       ===================================================== */

    if (
        typeof event.date ===
            "string"
    ) {

        /*
           YYYY-MM-DD

           Create a local date to avoid
           timezone shifting.
        */

        const match =
            event.date.match(
                /^(\d{4})-(\d{2})-(\d{2})$/
            );


        if (match) {

            const date =
                new Date(
                    Number(
                        match[1]
                    ),
                    Number(
                        match[2]
                    ) - 1,
                    Number(
                        match[3]
                    )
                );


            return date;

        }


        const parsed =
            new Date(
                event.date
            );


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            return parsed;

        }

    }


    return null;

}



/* =========================================================
   PARSE EVENT TIME
   =========================================================

   Supports:

   7:00 PM
   7:30 PM
   12:00 PM
   12:00 AM
   19:30
   07:30

   ========================================================= */

function parseEventTime(
    time
) {

    if (!time) {

        return null;

    }


    const value =
        String(
            time
        )
            .trim()
            .toUpperCase();


    /* =====================================================
       12-HOUR FORMAT
       ===================================================== */

    const twelveHour =
        value.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
        );


    if (twelveHour) {

        let hours =
            Number(
                twelveHour[1]
            );


        const minutes =
            Number(
                twelveHour[2]
            );


        const period =
            twelveHour[3];


        if (
            hours < 1 ||
            hours > 12 ||
            minutes < 0 ||
            minutes > 59
        ) {

            return null;

        }


        if (
            period === "PM" &&
            hours !== 12
        ) {

            hours += 12;

        }


        if (
            period === "AM" &&
            hours === 12
        ) {

            hours = 0;

        }


        return {

            hours:
                hours,

            minutes:
                minutes

        };

    }


    /* =====================================================
       24-HOUR FORMAT
       ===================================================== */

    const twentyFourHour =
        value.match(
            /^(\d{1,2}):(\d{2})$/
        );


    if (twentyFourHour) {

        const hours =
            Number(
                twentyFourHour[1]
            );


        const minutes =
            Number(
                twentyFourHour[2]
            );


        if (
            hours < 0 ||
            hours > 23 ||
            minutes < 0 ||
            minutes > 59
        ) {

            return null;

        }


        return {

            hours:
                hours,

            minutes:
                minutes

        };

    }


    return null;

}



/* =========================================================
   FORMAT EVENT DATE
   ========================================================= */

function formatEventDate(
    event
) {

    const date =
        getDateObject(
            event
        );


    if (!date) {

        return "Date not available";

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            day:
                "numeric",

            month:
                "long",

            year:
                "numeric"

        }
    );

}



/* =========================================================
   FORMAT EVENT TIME
   ========================================================= */

function formatEventTime(
    event
) {

    /*
       Prefer the separate Firestore time field.
    */

    if (
        event.time &&
        String(
            event.time
        ).trim()
    ) {

        const parsed =
            parseEventTime(
                event.time
            );


        if (parsed) {

            const date =
                new Date();


            date.setHours(
                parsed.hours,
                parsed.minutes,
                0,
                0
            );


            return date.toLocaleTimeString(
                "en-IN",
                {

                    hour:
                        "numeric",

                    minute:
                        "2-digit",

                    hour12:
                        true

                }
            );

        }


        /*
           If the stored value is something
           like "Evening", display it as-is.
        */

        return String(
            event.time
        );

    }


    /*
       Backwards compatibility.

       If there is no separate time field,
       use the Firestore timestamp.
    */

    const date =
        getDateObject(
            event
        );


    if (!date) {

        return "";

    }


    /*
       Don't show midnight as 12:00 AM
       when the timestamp only contains
       a date.
    */

    if (
        date.getHours() === 0 &&
        date.getMinutes() === 0
    ) {

        return "";

    }


    return date.toLocaleTimeString(
        "en-IN",
        {

            hour:
                "numeric",

            minute:
                "2-digit",

            hour12:
                true

        }
    );

}



/* =========================================================
   GET EVENT DAY
   ========================================================= */

function getEventDay(
    event
) {

    const date =
        getDateObject(
            event
        );


    if (!date) {

        return "";

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            weekday:
                "long"

        }
    );

}



/* =========================================================
   RENDER EVENTS
   ========================================================= */

function renderEvents(
    eventList
) {

    const grid =
        document.getElementById(
            "events-grid"
        );


    if (!grid) {

        return;

    }


    grid.innerHTML =
        "";


    /* =====================================================
       NO FILTER RESULTS
       ===================================================== */

    if (
        eventList.length === 0
    ) {

        grid.innerHTML = `

            <div class="event-card">

                <div class="event-content">

                    <h3>
                        No events found
                    </h3>

                    <p>
                        There are no events
                        in this category.
                    </p>

                </div>

            </div>

        `;


        return;

    }


    const now =
        Date.now();


    eventList.forEach(
        (
            event,
            index
        ) => {

            const eventDate =
                getEventDate(
                    event
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "event-card";


            /* =================================================
               UPCOMING
               ================================================= */

            if (
                eventDate !== Infinity &&
                eventDate > now
            ) {

                card.classList.add(
                    "upcoming"
                );

            }


            /* =================================================
               TODAY
               ================================================= */

            if (
                isSameDay(
                    eventDate,
                    now
                )
            ) {

                card.classList.add(
                    "today"
                );

            }


            /* =================================================
               DATE
               ================================================= */

            const dateHTML =
                eventDate !== Infinity
                    ? `

                        <div class="event-date">

                            <span class="event-day">
                                ${escapeHTML(
                                    getEventDay(
                                        event
                                    )
                                )}
                            </span>

                            <span class="event-full-date">
                                ${escapeHTML(
                                    formatEventDate(
                                        event
                                    )
                                )}
                            </span>

                        </div>

                      `
                    : `

                        <div class="event-date">

                            <span class="event-day">
                                Date
                            </span>

                            <span class="event-full-date">
                                Not available
                            </span>

                        </div>

                      `;


            /* =================================================
               LOCATION
               ================================================= */

            const locationHTML =
                event.location
                    ? `

                        <div>

                            <span>
                                Location
                            </span>

                            <strong>
                                ${escapeHTML(
                                    event.location
                                )}
                            </strong>

                        </div>

                      `
                    : "";


            /* =================================================
               TIME
               ================================================= */

            const time =
                formatEventTime(
                    event
                );


            const timeHTML =
                time
                    ? `

                        <div>

                            <span>
                                Time
                            </span>

                            <strong>
                                ${escapeHTML(
                                    time
                                )}
                            </strong>

                        </div>

                      `
                    : "";


            /* =================================================
               CATEGORY
               ================================================= */

            const categoryHTML =
                buildCategoryHTML(
                    event.category
                );


            /* =================================================
               VIEW EVENT
               ================================================= */

            const urlHTML =
                buildURLHTML(
                    event.url,
                    event.id
                );


            /* =================================================
               ABOUT
               ================================================= */

            let aboutHTML =
                "";


            if (
                event.about &&
                event.about.trim()
            ) {

                const aboutId =
                    `event-about-${index}-${safeId(event.id)}`;


                aboutHTML = `

                    <div class="event-about">

                        <button
                            type="button"
                            class="event-about-toggle"
                            aria-expanded="false"
                            aria-controls="${escapeHTML(
                                aboutId
                            )}"
                        >

                            <span>
                                About this event
                            </span>

                            <span
                                class="about-icon"
                                aria-hidden="true"
                            >
                                +
                            </span>

                        </button>


                        <div
                            id="${escapeHTML(
                                aboutId
                            )}"
                            class="event-about-content"
                            hidden
                        >

                            <p>
                                ${escapeHTML(
                                    event.about
                                )}
                            </p>

                        </div>

                    </div>

                `;

            }


            /* =================================================
               CARD
               ================================================= */

            card.innerHTML = `

                ${dateHTML}


                <div class="event-content">

                    <h3>
                        ${escapeHTML(
                            event.title
                        )}
                    </h3>


                    ${categoryHTML}


                    ${
                        event.description
                            ? `

                                <p>
                                    ${escapeHTML(
                                        event.description
                                    )}
                                </p>

                              `
                            : ""
                    }


                    ${
                        timeHTML ||
                        locationHTML
                            ? `

                                <div class="event-details">

                                    ${timeHTML}

                                    ${locationHTML}

                                </div>

                              `
                            : ""
                    }


                    ${urlHTML}


                    ${aboutHTML}

                </div>

            `;


            grid.appendChild(
                card
            );

        }
    );


    initAboutButtons();

}



/* =========================================================
   CATEGORY HTML
   ========================================================= */

function buildCategoryHTML(
    categories
) {

    if (
        !Array.isArray(
            categories
        ) ||
        categories.length === 0
    ) {

        return "";

    }


    const uniqueCategories =
        [
            ...new Set(
                categories
                    .map(
                        category =>
                            String(
                                category
                            )
                                .trim()
                                .toLowerCase()
                    )
                    .filter(
                        Boolean
                    )
            )
        ];


    if (
        uniqueCategories.length === 0
    ) {

        return "";

    }


    return `

        <div class="event-categories">

            ${uniqueCategories
                .map(
                    category => `

                        <span class="event-category">

                            ${escapeHTML(
                                formatCategoryName(
                                    category
                                )
                            )}

                        </span>

                    `
                )
                .join("")}

        </div>

    `;

}



/* =========================================================
   FORMAT CATEGORY NAME
   ========================================================= */

function formatCategoryName(
    category
) {

    const names = {

        ritual:
            "Ritual",

        family:
            "Family",

        visitors:
            "Visitors",

        visitor:
            "Visitors",

        culturals:
            "Culturals",

        cultural:
            "Culturals"

    };


    return (
        names[category] ||
        category
            .charAt(0)
            .toUpperCase() +
        category.slice(1)
    );

}



/* =========================================================
   BUILD VIEW EVENT BUTTON
   ========================================================= */

function buildURLHTML(
    url,
    eventId
) {

    if (
        !url ||
        !String(
            url
        ).trim()
    ) {

        return "";

    }


    const cleanURL =
        String(
            url
        ).trim();


    /*
       Only allow HTTP and HTTPS URLs.
    */

    if (
        !isSafeURL(
            cleanURL
        )
    ) {

        return "";

    }


    return `

        <div class="event-link">

            <button
                type="button"
                class="event-url event-view-button"
                data-event-id="${escapeHTML(
                    eventId
                )}"
            >

                <span>
                    View Event Image
                </span>

            </button>

        </div>

    `;

}



/* =========================================================
   SAFE URL
   ========================================================= */

function isSafeURL(
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

    }

    catch {

        return false;

    }

}



/* =========================================================
   CONVERT GOOGLE DRIVE URL
   =========================================================

   Supports:

   https://drive.google.com/file/d/FILE_ID/view

   and:

   https://drive.google.com/open?id=FILE_ID

   The resulting URL is used by the <img> element.

   ========================================================= */

function convertGoogleDriveURL(
    url
) {

    if (!url) {

        return "";

    }


    const cleanURL =
        String(
            url
        ).trim();


    /* =====================================================
       GOOGLE DRIVE FILE URL
       ===================================================== */

    const fileMatch =
        cleanURL.match(
            /drive\.google\.com\/file\/d\/([^/?#]+)/
        );


    if (fileMatch) {

        const fileId =
            fileMatch[1];


        return (
            "https://drive.google.com/thumbnail" +
            "?id=" +
            encodeURIComponent(
                fileId
            ) +
            "&sz=w2000"
        );

    }


    /* =====================================================
       GOOGLE DRIVE OPEN URL
       ===================================================== */

    try {

        const parsedURL =
            new URL(
                cleanURL
            );


        if (
            parsedURL.hostname ===
                "drive.google.com" ||
            parsedURL.hostname.endsWith(
                ".drive.google.com"
            )
        ) {

            const fileId =
                parsedURL.searchParams.get(
                    "id"
                );


            if (fileId) {

                return (
                    "https://drive.google.com/thumbnail" +
                    "?id=" +
                    encodeURIComponent(
                        fileId
                    ) +
                    "&sz=w2000"
                );

            }

        }

    }

    catch {

        /*
           If parsing fails, use the
           original URL.
        */

        return cleanURL;

    }


    /* =====================================================
       NORMAL IMAGE URL
       ===================================================== */

    return cleanURL;

}



/* =========================================================
   EVENT IMAGE MODAL
   ========================================================= */

function initEventImageModal() {

    const modal =
        document.getElementById(
            "event-image-modal"
        );


    const image =
        document.getElementById(
            "event-image"
        );


    const loading =
        document.getElementById(
            "event-image-loading"
        );


    const errorBox =
        document.getElementById(
            "event-image-error"
        );


    const title =
        document.getElementById(
            "event-image-title"
        );


    const closeButton =
        document.getElementById(
            "event-image-close"
        );


    const nextEventButton =
        document.getElementById(
            "next-event-link"
        );


    if (
        !modal ||
        !image ||
        !loading ||
        !errorBox ||
        !title ||
        !closeButton
    ) {

        console.error(
            "Event image modal elements not found."
        );

        return;

    }


    /*
       Store the button that opened
       the modal.

       This is used to restore focus
       when the modal closes.
    */

    let lastFocusedElement =
        null;



    /* =====================================================
       OPEN MODAL
       ===================================================== */

    function openModal(
        event
    ) {

        if (
            !event ||
            !event.url
        ) {

            return;

        }


        /*
           Remember the currently focused
           element.
        */

        lastFocusedElement =
            document.activeElement;


        /*
           Set modal title.
        */

        title.textContent =
            event.title ||
            "Event";


        /*
           IMPORTANT:

           Do not use image.src = "".

           Removing src prevents the browser
           from trying to load the current
           events.html page as an image.
        */

        image.removeAttribute(
            "src"
        );


        image.alt =
            event.title ||
            "Roy Bari event";


        image.hidden =
            true;


        errorBox.hidden =
            true;


        loading.hidden =
            false;


        /*
           Show modal.
        */

        modal.hidden =
            false;


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.classList.add(
            "event-modal-open"
        );


        /*
           Convert the Firestore URL
           into an image URL.
        */

        const imageURL =
            convertGoogleDriveURL(
                event.url
            );



        /*
           Start loading the image.
        */

        requestAnimationFrame(
            () => {

                image.src =
                    imageURL;

            }
        );


        /*
           Put keyboard focus on the
           close button.
        */

        requestAnimationFrame(
            () => {

                closeButton.focus();

            }
        );

    }



    /* =====================================================
       CLOSE MODAL
       ===================================================== */

    function closeModal() {

        /*
           Remove focus from anything inside
           the modal before applying aria-hidden.
        */

        if (
            document.activeElement &&
            modal.contains(
                document.activeElement
            )
        ) {

            document.activeElement.blur();

        }


        /*
           Mark modal as hidden.
        */

        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        modal.hidden =
            true;


        document.body.classList.remove(
            "event-modal-open"
        );


        /*
           IMPORTANT:

           Never do:

               image.src = "";

           because an empty src causes the browser
           to request the current page as an image.

           Instead remove the src attribute.
        */

        image.removeAttribute(
            "src"
        );


        image.hidden =
            true;


        loading.hidden =
            true;


        errorBox.hidden =
            true;


        /*
           Return focus to the button that
           opened the modal.
        */

        if (
            lastFocusedElement &&
            typeof lastFocusedElement.focus ===
                "function"
        ) {

            requestAnimationFrame(
                () => {

                    try {

                        /*
                           Only focus it if it still
                           exists in the document.
                        */

                        if (
                            document.contains(
                                lastFocusedElement
                            )
                        ) {

                            lastFocusedElement.focus();

                        }

                    }

                    catch {

                        /*
                           Ignore focus restoration
                           errors.
                        */

                    }

                }
            );

        }


        lastFocusedElement =
            null;

    }



    /* =====================================================
       IMAGE LOADED
       ===================================================== */

    image.addEventListener(
        "load",
        () => {

            /*
               Image loaded successfully.
            */


            loading.hidden =
                true;


            errorBox.hidden =
                true;


            image.hidden =
                false;

        }
    );



    /* =====================================================
       IMAGE ERROR
       ===================================================== */

    image.addEventListener(
        "error",
        () => {

            /*
               Ignore errors if the modal has
               already been closed.

               This prevents the false error
               that happened with:

                   image.src = "";
            */

            if (
                modal.hidden ||
                !image.getAttribute(
                    "src"
                )
            ) {

                return;

            }


            console.error(
                "Event image could not be loaded:",
                image.src
            );


            loading.hidden =
                true;


            image.hidden =
                true;


            errorBox.hidden =
                false;

        }
    );



    /* =====================================================
       CLOSE BUTTON
       ===================================================== */

    closeButton.addEventListener(
        "click",
        () => {

            closeModal();

        }
    );



    /* =====================================================
       CLICK DARK BACKGROUND
       ===================================================== */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target.matches(
                    "[data-close-event-modal]"
                )
            ) {

                closeModal();

            }

        }
    );



    /* =====================================================
       ESC KEY
       ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !modal.hidden
            ) {

                closeModal();

            }

        }
    );



    /* =====================================================
       EVENT CARD VIEW EVENT BUTTON
       ===================================================== */

    document.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".event-view-button"
                );


            if (!button) {

                return;

            }


            const eventId =
                button.dataset.eventId;


            const selectedEvent =
                events.find(
                    item =>
                        item.id ===
                        eventId
                );


            if (!selectedEvent) {

                console.error(
                    "Event not found:",
                    eventId
                );

                return;

            }


            openModal(
                selectedEvent
            );

        }
    );



    /* =====================================================
       NEXT EVENT VIEW EVENT BUTTON
       ===================================================== */

    if (nextEventButton) {

        nextEventButton.addEventListener(
            "click",
            () => {

                const selectedEvent =
                    events.find(
                        event =>
                            event.id ===
                            currentNextEventId
                    );


                if (!selectedEvent) {

                    console.error(
                        "Next event not found."
                    );

                    return;

                }


                openModal(
                    selectedEvent
                );

            }
        );

    }

}



/* =========================================================
   ABOUT BUTTONS
   ========================================================= */

function initAboutButtons() {

    const buttons =
        document.querySelectorAll(
            ".event-about-toggle"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const contentId =
                        button.getAttribute(
                            "aria-controls"
                        );


                    const content =
                        document.getElementById(
                            contentId
                        );


                    if (!content) {

                        return;

                    }


                    const isOpen =
                        button.getAttribute(
                            "aria-expanded"
                        ) === "true";


                    const icon =
                        button.querySelector(
                            ".about-icon"
                        );


                    if (isOpen) {

                        button.setAttribute(
                            "aria-expanded",
                            "false"
                        );


                        content.hidden =
                            true;


                        if (icon) {

                            icon.textContent =
                                "+";

                        }

                    }

                    else {

                        button.setAttribute(
                            "aria-expanded",
                            "true"
                        );


                        content.hidden =
                            false;


                        if (icon) {

                            icon.textContent =
                                "−";

                        }

                    }

                }
            );

        }
    );

}



/* =========================================================
   FIND NEXT EVENT
   ========================================================= */

function findNextEvent(
    eventList
) {

    const now =
        Date.now();


    const upcoming =
        eventList
            .filter(
                event => {

                    const date =
                        getEventDate(
                            event
                        );


                    return (
                        date !== Infinity &&
                        date > now
                    );

                }
            )
            .sort(
                (a, b) => {

                    return (
                        getEventDate(a) -
                        getEventDate(b)
                    );

                }
            );


    const nameElement =
        document.getElementById(
            "next-event-name"
        );


    const descriptionElement =
        document.getElementById(
            "next-event-description"
        );


    const dateElement =
        document.getElementById(
            "next-event-date"
        );


    const timeElement =
        document.getElementById(
            "next-event-time"
        );


    const linkElement =
        document.getElementById(
            "next-event-link"
        );


    if (
        !nameElement ||
        !descriptionElement
    ) {

        return;

    }


    /* =====================================================
       NO UPCOMING EVENTS
       ===================================================== */

    if (
        upcoming.length === 0
    ) {

        nameElement.textContent =
            "No upcoming events";


        descriptionElement.textContent =
            "The Puja calendar will appear here.";


        if (dateElement) {

            dateElement.textContent =
                "";

        }


        if (timeElement) {

            timeElement.textContent =
                "";

        }


        if (linkElement) {

            linkElement.hidden =
                true;

        }


        setCountdown(
            0,
            0,
            0,
            0
        );


        if (
            countdownInterval
        ) {

            clearInterval(
                countdownInterval
            );


            countdownInterval =
                null;

        }


        currentNextEventId =
            null;


        return;

    }


    /* =====================================================
       NEXT EVENT
       ===================================================== */

    const nextEvent =
        upcoming[0];


    currentNextEventId =
        nextEvent.id;

    nameElement.textContent =
        nextEvent.title;


    descriptionElement.textContent =
        nextEvent.description ||
        nextEvent.about ||
        "";


    if (dateElement) {

        dateElement.textContent =
            formatEventDate(
                nextEvent
            );

    }


    if (timeElement) {

        const time =
            formatEventTime(
                nextEvent
            );


        timeElement.textContent =
            time
                ? ` · ${time}`
                : "";

    }


    /*
       Show the next-event View Event
       button only when a valid URL exists.
    */

    if (linkElement) {

        if (
            nextEvent.url &&
            isSafeURL(
                nextEvent.url
            )
        ) {

            linkElement.hidden =
                false;

        }

        else {

            linkElement.hidden =
                true;

        }

    }


    startCountdown(
        nextEvent
    );

}



/* =========================================================
   EMPTY NEXT EVENT
   ========================================================= */

function updateNextEventEmpty() {

    const nameElement =
        document.getElementById(
            "next-event-name"
        );


    const descriptionElement =
        document.getElementById(
            "next-event-description"
        );


    const dateElement =
        document.getElementById(
            "next-event-date"
        );


    const timeElement =
        document.getElementById(
            "next-event-time"
        );


    const linkElement =
        document.getElementById(
            "next-event-link"
        );


    if (nameElement) {

        nameElement.textContent =
            "No events found";

    }


    if (descriptionElement) {

        descriptionElement.textContent =
            "The Puja calendar is currently empty.";

    }


    if (dateElement) {

        dateElement.textContent =
            "";

    }


    if (timeElement) {

        timeElement.textContent =
            "";

    }


    if (linkElement) {

        linkElement.hidden =
            true;

    }


    setCountdown(
        0,
        0,
        0,
        0
    );

}



/* =========================================================
   FIREBASE ERROR NEXT EVENT
   ========================================================= */

function updateNextEventError() {

    const nameElement =
        document.getElementById(
            "next-event-name"
        );


    const descriptionElement =
        document.getElementById(
            "next-event-description"
        );


    const linkElement =
        document.getElementById(
            "next-event-link"
        );


    if (nameElement) {

        nameElement.textContent =
            "Unable to load events";

    }


    if (descriptionElement) {

        descriptionElement.textContent =
            "Please try again later.";

    }


    if (linkElement) {

        linkElement.hidden =
            true;

    }


    setCountdown(
        0,
        0,
        0,
        0
    );

}



/* =========================================================
   COUNTDOWN
   ========================================================= */

function startCountdown(
    event
) {

    const target =
        getEventDate(
            event
        );


    if (
        target === Infinity ||
        Number.isNaN(
            target
        )
    ) {

        setCountdown(
            0,
            0,
            0,
            0
        );


        return;

    }


    if (
        countdownInterval
    ) {

        clearInterval(
            countdownInterval
        );

    }


    function updateCountdown() {

        const difference =
            target -
            Date.now();


        /* =================================================
           EVENT HAS STARTED
           ================================================= */

        if (
            difference <= 0
        ) {

            setCountdown(
                0,
                0,
                0,
                0
            );


            clearInterval(
                countdownInterval
            );


            countdownInterval =
                null;


            /*
               Find the next event using
               the already-loaded Firestore data.
            */

            findNextEvent(
                events
            );


            return;

        }


        let remaining =
            difference;


        /* =================================================
           DAYS
           ================================================= */

        const days =
            Math.floor(
                remaining /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        remaining -=
            days *
            1000 *
            60 *
            60 *
            24;


        /* =================================================
           HOURS
           ================================================= */

        const hours =
            Math.floor(
                remaining /
                (
                    1000 *
                    60 *
                    60
                )
            );


        remaining -=
            hours *
            1000 *
            60 *
            60;


        /* =================================================
           MINUTES
           ================================================= */

        const minutes =
            Math.floor(
                remaining /
                (
                    1000 *
                    60
                )
            );


        remaining -=
            minutes *
            1000 *
            60;


        /* =================================================
           SECONDS
           ================================================= */

        const seconds =
            Math.floor(
                remaining /
                1000
            );


        setCountdown(
            days,
            hours,
            minutes,
            seconds
        );

    }


    updateCountdown();


    countdownInterval =
        setInterval(
            updateCountdown,
            1000
        );

}



/* =========================================================
   SET COUNTDOWN
   ========================================================= */

function setCountdown(
    days,
    hours,
    minutes,
    seconds
) {

    const dayElement =
        document.getElementById(
            "days"
        );


    const hourElement =
        document.getElementById(
            "hours"
        );


    const minuteElement =
        document.getElementById(
            "minutes"
        );


    const secondElement =
        document.getElementById(
            "seconds"
        );


    if (dayElement) {

        dayElement.textContent =
            String(
                days
            ).padStart(
                2,
                "0"
            );

    }


    if (hourElement) {

        hourElement.textContent =
            String(
                hours
            ).padStart(
                2,
                "0"
            );

    }


    if (minuteElement) {

        minuteElement.textContent =
            String(
                minutes
            ).padStart(
                2,
                "0"
            );

    }


    if (secondElement) {

        secondElement.textContent =
            String(
                seconds
            ).padStart(
                2,
                "0"
            );

    }

}



/* =========================================================
   FILTERS
   ========================================================= */

function initEventFilters() {

    const buttons =
        document.querySelectorAll(
            ".event-filter"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    /* =========================================
                       REMOVE ACTIVE
                       ========================================= */

                    buttons.forEach(
                        btn => {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    /* =========================================
                       ADD ACTIVE
                       ========================================= */

                    button.classList.add(
                        "active"
                    );


                    const filter =
                        String(
                            button.dataset.filter ||
                            "all"
                        )
                            .trim()
                            .toLowerCase();


                    /* =========================================
                       ALL
                       ========================================= */

                    if (
                        filter === "all"
                    ) {

                        renderEvents(
                            events
                        );


                        return;

                    }


                    /* =========================================
                       FILTER
                       ========================================= */

                    const filteredEvents =
                        events.filter(
                            event => {

                                return (
                                    Array.isArray(
                                        event.category
                                    ) &&
                                    event.category.some(
                                        category => {

                                            const normalized =
                                                String(
                                                    category
                                                )
                                                    .trim()
                                                    .toLowerCase();


                                            /*
                                               Accept both:

                                               visitor

                                               visitors
                                            */

                                            if (
                                                filter ===
                                                    "visitors"
                                            ) {

                                                return (
                                                    normalized ===
                                                        "visitors" ||
                                                    normalized ===
                                                        "visitor"
                                                );

                                            }


                                            return (
                                                normalized ===
                                                filter
                                            );

                                        }
                                    )
                                );

                            }
                        );


                    renderEvents(
                        filteredEvents
                    );

                }
            );

        }
    );

}



/* =========================================================
   SAME DAY CHECK
   ========================================================= */

function isSameDay(
    timestamp1,
    timestamp2
) {

    if (
        timestamp1 === Infinity ||
        timestamp2 === Infinity
    ) {

        return false;

    }


    const d1 =
        new Date(
            timestamp1
        );


    const d2 =
        new Date(
            timestamp2
        );


    return (

        d1.getFullYear() ===
            d2.getFullYear()

        &&

        d1.getMonth() ===
            d2.getMonth()

        &&

        d1.getDate() ===
            d2.getDate()

    );

}



/* =========================================================
   SAFE ID
   ========================================================= */

function safeId(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /[^a-zA-Z0-9_-]/g,
            "-"
        );

}



/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}