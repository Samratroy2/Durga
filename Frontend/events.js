/* =========================================================
   ROY BARI — EVENTS
   FIREBASE FIRESTORE
   ========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { db } from "./firebase.js";


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let events = [];

let countdownInterval = null;


/* =========================================================
   START
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("Events JS started");

    loadEvents();

    initEventFilters();

});


/* =========================================================
   LOAD EVENTS
   ========================================================= */

async function loadEvents() {

    const grid =
        document.getElementById("events-grid");


    if (!grid) {

        console.error(
            "events-grid not found"
        );

        return;
    }


    try {

        console.log(
            "Connecting to Firestore..."
        );


        const eventsRef =
            collection(db, "events");


        const snapshot =
            await getDocs(eventsRef);


        console.log(
            "Firestore connected"
        );


        console.log(
            "Number of events:",
            snapshot.size
        );


        events = [];


        snapshot.forEach((doc) => {

            const data = doc.data();


            console.log(
                "Event:",
                doc.id,
                data
            );


            /*
             * CATEGORY
             *
             * Your Firestore category
             * is an ARRAY.
             *
             * Example:
             *
             * category: [
             *   "ritual",
             *   "family",
             *   "visitors"
             * ]
             */

            let category = [];


            if (Array.isArray(data.category)) {

                category =
                    data.category
                        .map(item =>
                            String(item)
                                .trim()
                                .toLowerCase()
                        )
                        .filter(Boolean);

            }

            else if (data.category) {

                category = [
                    String(data.category)
                        .trim()
                        .toLowerCase()
                ];

            }


            events.push({

                id: doc.id,

                title:
                    data.title || "Untitled Event",

                description:
                    data.description || "",

                about:
                    data.about || "",

                date:
                    data.date || null,

                location:
                    data.location || "",

                category:
                    category

            });

        });


        /* =================================================
           NO EVENTS
           ================================================= */

        if (events.length === 0) {

            grid.innerHTML = `

                <div class="event-card">

                    <div class="event-content">

                        <h3>
                            No events found
                        </h3>

                        <p>
                            Your Firestore
                            "events" collection
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

        events.sort((a, b) => {

            return (
                getEventDate(a) -
                getEventDate(b)
            );

        });


        /* =================================================
           DISPLAY EVENTS
           ================================================= */

        renderEvents(events);


        /* =================================================
           FIND NEXT EVENT
           ================================================= */

        findNextEvent(events);


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
                        Check your Firestore
                        security rules and
                        Firebase configuration.
                    </small>

                </div>

            </div>

        `;

    }

}


/* =========================================================
   GET EVENT DATE
   ========================================================= */

function getEventDate(event) {

    if (!event.date) {

        return Infinity;

    }


    /* Firestore Timestamp */

    if (
        event.date &&
        typeof event.date.toDate === "function"
    ) {

        return event.date
            .toDate()
            .getTime();

    }


    /* JavaScript Date */

    if (
        event.date instanceof Date
    ) {

        return event.date.getTime();

    }


    /* String / number */

    const parsed =
        new Date(event.date)
            .getTime();


    return isNaN(parsed)
        ? Infinity
        : parsed;

}


/* =========================================================
   GET DATE OBJECT
   ========================================================= */

function getDateObject(event) {

    if (!event.date) {

        return null;

    }


    /* Firestore Timestamp */

    if (
        event.date &&
        typeof event.date.toDate === "function"
    ) {

        return event.date.toDate();

    }


    /* JavaScript Date */

    if (
        event.date instanceof Date
    ) {

        return event.date;

    }


    const date =
        new Date(event.date);


    if (isNaN(date.getTime())) {

        return null;

    }


    return date;

}


/* =========================================================
   FORMAT EVENT DATE
   ========================================================= */

function formatEventDate(event) {

    const date =
        getDateObject(event);


    if (!date) {

        return "Date not available";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


/* =========================================================
   FORMAT EVENT TIME
   ========================================================= */

function formatEventTime(event) {

    const date =
        getDateObject(event);


    if (!date) {

        return "";

    }


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        }
    );

}


/* =========================================================
   GET DAY
   ========================================================= */

function getEventDay(event) {

    const date =
        getDateObject(event);


    if (!date) {

        return "";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            weekday: "long"
        }
    );

}


/* =========================================================
   RENDER EVENTS
   ========================================================= */

function renderEvents(eventList) {

    const grid =
        document.getElementById(
            "events-grid"
        );


    if (!grid) {

        return;

    }


    grid.innerHTML = "";


    /* =====================================================
       NO FILTER RESULTS
       ===================================================== */

    if (eventList.length === 0) {

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
        (event, index) => {


            const eventDate =
                getEventDate(event);


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "event-card";


            /*
             * UPCOMING / TODAY
             */

            if (
                eventDate > now
            ) {

                card.classList.add(
                    "upcoming"
                );

            }


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
               EVENT DATE
            ================================================= */

            const dateHTML =
                eventDate !== Infinity
                    ? `

                        <div class="event-date">

                            <span class="event-day">
                                ${escapeHTML(
                                    getEventDay(event)
                                )}
                            </span>

                            <span class="event-full-date">
                                ${escapeHTML(
                                    formatEventDate(event)
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
                formatEventTime(event);


            const timeHTML =
                time
                    ? `

                        <div>

                            <span>
                                Time
                            </span>

                            <strong>
                                ${escapeHTML(time)}
                            </strong>

                        </div>

                    `
                    : "";


            /* =================================================
               ABOUT
            ================================================= */

            let aboutHTML = "";


            if (
                event.about &&
                event.about.trim()
            ) {

                const aboutId =
                    `event-about-${index}-${event.id}`;


                aboutHTML = `

                    <div class="event-about">

                        <button
                            type="button"
                            class="event-about-toggle"
                            aria-expanded="false"
                            aria-controls="${aboutId}"
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
                            id="${aboutId}"
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
               CARD HTML
            ================================================= */

            card.innerHTML = `

                ${dateHTML}


                <div class="event-content">

                    <h3>
                        ${escapeHTML(
                            event.title
                        )}
                    </h3>


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
                        locationHTML ||
                        timeHTML
                            ? `

                                <div class="event-details">

                                    ${timeHTML}

                                    ${locationHTML}

                                </div>

                              `
                            : ""
                    }


                    ${aboutHTML}

                </div>

            `;


            grid.appendChild(card);

        }
    );


    /* =====================================================
       ABOUT BUTTONS
    ===================================================== */

    initAboutButtons();

}


/* =========================================================
   ABOUT BUTTON
   ========================================================= */

function initAboutButtons() {

    const buttons =
        document.querySelectorAll(
            ".event-about-toggle"
        );


    buttons.forEach(button => {

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


                if (isOpen) {

                    button.setAttribute(
                        "aria-expanded",
                        "false"
                    );


                    content.hidden =
                        true;


                    const icon =
                        button.querySelector(
                            ".about-icon"
                        );


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


                    const icon =
                        button.querySelector(
                            ".about-icon"
                        );


                    if (icon) {

                        icon.textContent =
                            "−";

                    }

                }

            }
        );

    });

}


/* =========================================================
   FIND NEXT EVENT
   ========================================================= */

function findNextEvent(eventList) {

    const now =
        Date.now();


    const upcoming =
        eventList
            .filter(event => {

                const date =
                    getEventDate(event);

                return (
                    date !== Infinity &&
                    date > now
                );

            })
            .sort((a, b) => {

                return (
                    getEventDate(a) -
                    getEventDate(b)
                );

            });


    const nameElement =
        document.getElementById(
            "next-event-name"
        );


    const descriptionElement =
        document.getElementById(
            "next-event-description"
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


        setCountdown(
            0,
            0,
            0,
            0
        );


        if (countdownInterval) {

            clearInterval(
                countdownInterval
            );

            countdownInterval =
                null;

        }


        return;

    }


    /* =====================================================
       NEXT EVENT
    ===================================================== */

    const nextEvent =
        upcoming[0];


    console.log(
        "Next event:",
        nextEvent
    );


    nameElement.textContent =
        nextEvent.title;


    descriptionElement.textContent =
        nextEvent.description ||
        "";


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


    if (nameElement) {

        nameElement.textContent =
            "No events found";

    }


    if (descriptionElement) {

        descriptionElement.textContent =
            "The Puja calendar is currently empty.";

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

function startCountdown(event) {

    const target =
        getEventDate(event);


    if (
        target === Infinity ||
        isNaN(target)
    ) {

        setCountdown(
            0,
            0,
            0,
            0
        );

        return;

    }


    if (countdownInterval) {

        clearInterval(
            countdownInterval
        );

    }


    function updateCountdown() {

        let difference =
            target -
            Date.now();


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
             * Reload events so that
             * the next event becomes
             * active automatically.
             */

            findNextEvent(
                events
            );


            return;

        }


        const days =
            Math.floor(
                difference /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        difference -=
            days *
            1000 *
            60 *
            60 *
            24;


        const hours =
            Math.floor(
                difference /
                (
                    1000 *
                    60 *
                    60
                )
            );


        difference -=
            hours *
            1000 *
            60 *
            60;


        const minutes =
            Math.floor(
                difference /
                (
                    1000 *
                    60
                )
            );


        difference -=
            minutes *
            1000 *
            60;


        const seconds =
            Math.floor(
                difference /
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
            String(days)
                .padStart(2, "0");

    }


    if (hourElement) {

        hourElement.textContent =
            String(hours)
                .padStart(2, "0");

    }


    if (minuteElement) {

        minuteElement.textContent =
            String(minutes)
                .padStart(2, "0");

    }


    if (secondElement) {

        secondElement.textContent =
            String(seconds)
                .padStart(2, "0");

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


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {


                /* Remove active */

                buttons.forEach(btn => {

                    btn.classList.remove(
                        "active"
                    );

                });


                /* Add active */

                button.classList.add(
                    "active"
                );


                const filter =
                    button.dataset.filter;


                /* =================================================
                   ALL
                ================================================= */

                if (
                    filter === "all"
                ) {

                    renderEvents(
                        events
                    );

                    return;

                }


                /* =================================================
                   FILTER ARRAY
                ================================================= */

                const filteredEvents =
                    events.filter(event => {

                        return event.category
                            .some(category => {

                                return (
                                    category
                                        .trim()
                                        .toLowerCase()
                                    ===
                                    filter
                                        .trim()
                                        .toLowerCase()
                                );

                            });

                    });


                renderEvents(
                    filteredEvents
                );

            }
        );

    });

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
        new Date(timestamp1);


    const d2 =
        new Date(timestamp2);


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
   ESCAPE HTML
   Prevents Firestore text from being
   interpreted as HTML.
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
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