/* =========================================================
   ROY BARI — PUJA / RITUALS
   Firestore-powered Puja Calendar + Ritual Accordion
   ========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { db } from "./firebase.js";


/* =========================================================
   ELEMENTS
   ========================================================= */

const calendarStrip =
    document.getElementById("calendar-strip");

const ritualAccordion =
    document.getElementById("ritual-accordion");


/* =========================================================
   DATA
   ========================================================= */

let calendarEvents = [];
let rituals = [];


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* =========================================================
   NORMALIZE DATE
   ========================================================= */

function getDateValue(data) {

    if (!data) {

        return null;

    }


    const value =
        data.date ||
        data.eventDate ||
        data.datetime ||
        data.timestamp;


    if (!value) {

        return null;

    }


    /* Firestore Timestamp */

    if (
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }


    /* JavaScript Date */

    if (
        value instanceof Date
    ) {

        return value;

    }


    /* String / number */

    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(date) {

    if (!date) {

        return "";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


/* =========================================================
   GET DAY NAME
   ========================================================= */

function getDayName(date) {

    if (!date) {

        return "";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            weekday: "long"
        }
    ).format(date);

}


/* =========================================================
   LOAD PUJA CALENDAR
   FIRESTORE COLLECTION: events
   ========================================================= */

async function loadCalendar() {

    if (!calendarStrip) {

        console.error(
            "Calendar container not found."
        );

        return;

    }


    try {

        console.log(
            "ROY BARI: Loading Puja calendar..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "events"
                )
            );


        console.log(
            "ROY BARI: Calendar events:",
            snapshot.size
        );


        calendarEvents = [];


        snapshot.forEach(doc => {

            const data =
                doc.data();


            calendarEvents.push({

                id: doc.id,

                ...data,

                eventDate:
                    getDateValue(data)

            });

        });


        /* =================================================
           NO EVENTS
           ================================================= */

        if (
            calendarEvents.length === 0
        ) {

            calendarStrip.innerHTML = `

                <div class="calendar-empty">

                    No Puja calendar events
                    have been added yet.

                </div>

            `;

            return;

        }


        /* =================================================
           SORT BY DATE
           ================================================= */

        calendarEvents.sort(
            (a, b) => {

                if (
                    !a.eventDate &&
                    !b.eventDate
                ) {

                    return 0;

                }


                if (!a.eventDate) {

                    return 1;

                }


                if (!b.eventDate) {

                    return -1;

                }


                return (
                    a.eventDate.getTime() -
                    b.eventDate.getTime()
                );

            }
        );


        /* =================================================
           RENDER CALENDAR
           ================================================= */

        let html = "";


        calendarEvents.forEach(
            (event, index) => {

                const name =
                    event.name ||
                    event.title ||
                    event.eventName ||
                    `Puja Day ${index + 1}`;


                const day =
                    event.day ||
                    event.tithi ||
                    (
                        event.eventDate
                            ? getDayName(
                                event.eventDate
                            )
                            : ""
                    );


                const date =
                    event.eventDate
                        ? formatDate(
                            event.eventDate
                        )
                        : "";


                /*
                 * If event has a ritualId,
                 * use it.
                 *
                 * Otherwise try matching
                 * ritual by day/name/order.
                 */

                const ritualId =
                    getMatchingRitualId(
                        event,
                        index
                    );


                const targetId =
                    ritualId
                        ? `ritual-${ritualId}`
                        : "";


                html += `

                    <a
                        href="${
                            targetId
                                ? `#${escapeHTML(targetId)}`
                                : "#"
                        }"
                        class="pill puja-day-pill ${
                            ritualId
                                ? ""
                                : "no-ritual"
                        }"
                        ${
                            ritualId
                                ? ""
                                : 'aria-disabled="true"'
                        }
                    >

                        <span>

                            ${escapeHTML(name)}

                        </span>


                        ${
                            day
                                ? `

                                    <small>

                                        ${escapeHTML(day)}

                                    </small>

                                  `
                                : ""
                        }


                        ${
                            date
                                ? `

                                    <small>

                                        ${escapeHTML(date)}

                                    </small>

                                  `
                                : ""
                        }

                    </a>

                `;

            }
        );


        calendarStrip.innerHTML =
            html;


        console.log(
            "ROY BARI: Puja calendar loaded."
        );


        /*
         * Calendar click events are
         * initialized after rendering.
         */

        initCalendarLinks();

    }

    catch (error) {

        console.error(
            "PUJA CALENDAR FIREBASE ERROR:",
            error
        );


        calendarStrip.innerHTML = `

            <div class="calendar-error">

                <h3>
                    Unable to load the Puja calendar
                </h3>

                <p>

                    ${escapeHTML(
                        error.message
                    )}

                </p>

            </div>

        `;

    }

}


/* =========================================================
   FIND MATCHING RITUAL
   ========================================================= */

function getMatchingRitualId(
    event,
    index
) {

    /*
     * BEST OPTION:
     * Store ritualId inside the event document.
     */

    if (event.ritualId) {

        const exists =
            rituals.some(
                ritual =>
                    ritual.id ===
                    event.ritualId
            );


        if (exists) {

            return event.ritualId;

        }

    }


    /*
     * Match using explicit ritual ID
     */

    if (event.ritual) {

        const exists =
            rituals.some(
                ritual =>
                    ritual.id ===
                    event.ritual
            );


        if (exists) {

            return event.ritual;

        }

    }


    /*
     * Match by day
     */

    const eventDay =
        String(
            event.day ||
            event.tithi ||
            ""
        )
            .trim()
            .toLowerCase();


    if (eventDay) {

        const ritualByDay =
            rituals.find(
                ritual => {

                    const ritualDay =
                        String(
                            ritual.day ||
                            ritual.tithi ||
                            ritual.dayName ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        ritualDay ===
                        eventDay
                    );

                }
            );


        if (ritualByDay) {

            return ritualByDay.id;

        }

    }


    /*
     * Match by title/name
     */

    const eventName =
        String(
            event.name ||
            event.title ||
            event.eventName ||
            ""
        )
            .trim()
            .toLowerCase();


    if (eventName) {

        const ritualByName =
            rituals.find(
                ritual => {

                    const ritualName =
                        String(
                            ritual.name ||
                            ritual.title ||
                            ritual.ritualName ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return (
                        ritualName ===
                        eventName
                    );

                }
            );


        if (ritualByName) {

            return ritualByName.id;

        }

    }


    /*
     * Final fallback:
     * match by position.
     */

    if (
        rituals[index]
    ) {

        return rituals[index].id;

    }


    return null;

}


/* =========================================================
   LOAD RITUALS
   FIRESTORE COLLECTION: rituals
   ========================================================= */

async function loadRituals() {

    if (!ritualAccordion) {

        console.error(
            "Ritual accordion container not found."
        );

        return;

    }


    try {

        console.log(
            "ROY BARI: Loading rituals..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "rituals"
                )
            );


        console.log(
            "ROY BARI: Rituals found:",
            snapshot.size
        );


        rituals = [];


        snapshot.forEach(doc => {

            const data =
                doc.data();


            rituals.push({

                id: doc.id,

                ...data,

                ritualDate:
                    getDateValue(data)

            });

        });


        /* =================================================
           NO RITUALS
           ================================================= */

        if (
            rituals.length === 0
        ) {

            ritualAccordion.innerHTML = `

                <div class="calendar-empty">

                    <h3>
                        No rituals available
                    </h3>

                    <p>

                        Ritual information has
                        not been added yet.

                    </p>

                </div>

            `;

            return;

        }


        /* =================================================
           SORT
           ================================================= */

        rituals.sort(
            (a, b) => {

                const orderA =
                    Number(a.order);


                const orderB =
                    Number(b.order);


                const validA =
                    Number.isFinite(
                        orderA
                    );


                const validB =
                    Number.isFinite(
                        orderB
                    );


                if (
                    validA &&
                    validB
                ) {

                    return (
                        orderA -
                        orderB
                    );

                }


                if (validA) {

                    return -1;

                }


                if (validB) {

                    return 1;

                }


                if (
                    a.ritualDate &&
                    b.ritualDate
                ) {

                    return (
                        a.ritualDate.getTime() -
                        b.ritualDate.getTime()
                    );

                }


                return 0;

            }
        );


        /* =================================================
           RENDER
           ================================================= */

        renderRituals();


        console.log(
            "ROY BARI: Rituals loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "RITUAL FIREBASE ERROR:",
            error
        );


        ritualAccordion.innerHTML = `

            <div class="calendar-error">

                <h3>
                    Rituals could not be loaded
                </h3>

                <p>

                    ${escapeHTML(
                        error.message
                    )}

                </p>

            </div>

        `;

    }

}


/* =========================================================
   RENDER RITUALS
   ========================================================= */

function renderRituals() {

    ritualAccordion.innerHTML = "";


    rituals.forEach(
        (ritual, index) => {

            const name =
                ritual.name ||
                ritual.title ||
                ritual.ritualName ||
                `Ritual ${index + 1}`;


            const description =
                ritual.description ||
                ritual.details ||
                ritual.content ||
                "";


            const day =
                ritual.day ||
                ritual.tithi ||
                ritual.dayName ||
                "";


            const time =
                ritual.time ||
                ritual.timings ||
                ritual.timing ||
                "";


            const location =
                ritual.location ||
                ritual.place ||
                "";


            const priest =
                ritual.priest ||
                ritual.purohit ||
                "";


            const category =
                ritual.category ||
                "Ritual";


            const date =
                ritual.ritualDate
                    ? formatDate(
                        ritual.ritualDate
                    )
                    : "";


            const ritualId =
                `ritual-${ritual.id}`;


            const isFirst =
                index === 0;


            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "ritual-item";


            article.id =
                ritualId;


            article.innerHTML = `

                <button
                    type="button"
                    class="ritual-toggle"
                    aria-expanded="${
                        isFirst
                    }"
                    aria-controls="${
                        escapeHTML(
                            ritualId
                        )
                    }-content"
                >

                    <div class="ritual-heading">

                        <span class="ritual-number">

                            ${String(
                                index + 1
                            ).padStart(2, "0")}

                        </span>


                        <div>

                            <span class="ritual-category">

                                ${escapeHTML(
                                    category
                                )}

                            </span>


                            <h3>

                                ${escapeHTML(
                                    name
                                )}

                            </h3>

                        </div>

                    </div>


                    <span class="ritual-icon">

                        ${isFirst ? "−" : "+"}

                    </span>

                </button>


                <div
                    class="ritual-content"
                    id="${
                        escapeHTML(
                            ritualId
                        )
                    }-content"
                    ${
                        isFirst
                            ? ""
                            : "hidden"
                    }
                >

                    ${
                        (
                            date ||
                            day ||
                            time ||
                            location ||
                            priest
                        )
                            ? `

                                <div class="ritual-meta">

                                    ${
                                        day
                                            ? `

                                                <div>

                                                    <span>
                                                        Day
                                                    </span>

                                                    <strong>

                                                        ${escapeHTML(
                                                            day
                                                        )}

                                                    </strong>

                                                </div>

                                              `
                                            : ""
                                    }


                                    ${
                                        date
                                            ? `

                                                <div>

                                                    <span>
                                                        Date
                                                    </span>

                                                    <strong>

                                                        ${escapeHTML(
                                                            date
                                                        )}

                                                    </strong>

                                                </div>

                                              `
                                            : ""
                                    }


                                    ${
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
                                            : ""
                                    }


                                    ${
                                        location
                                            ? `

                                                <div>

                                                    <span>
                                                        Location
                                                    </span>

                                                    <strong>

                                                        ${escapeHTML(
                                                            location
                                                        )}

                                                    </strong>

                                                </div>

                                              `
                                            : ""
                                    }


                                    ${
                                        priest
                                            ? `

                                                <div>

                                                    <span>
                                                        Purohit
                                                    </span>

                                                    <strong>

                                                        ${escapeHTML(
                                                            priest
                                                        )}

                                                    </strong>

                                                </div>

                                              `
                                            : ""
                                    }

                                </div>

                              `
                            : ""
                    }


                    ${
                        description
                            ? `

                                <div class="ritual-description">

                                    <p>

                                        ${escapeHTML(
                                            description
                                        )}

                                    </p>

                                </div>

                              `
                            : `

                                <p class="ritual-no-description">

                                    Details for this ritual
                                    have not been added yet.

                                </p>

                              `
                    }

                </div>

            `;


            ritualAccordion.appendChild(
                article
            );

        }
    );


    initRitualAccordion();

}


/* =========================================================
   RITUAL ACCORDION
   ========================================================= */

function initRitualAccordion() {

    const buttons =
        ritualAccordion.querySelectorAll(
            ".ritual-toggle"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const expanded =
                    button.getAttribute(
                        "aria-expanded"
                    ) === "true";


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


                /*
                 * Close every ritual
                 */

                buttons.forEach(
                    otherButton => {

                        const otherContentId =
                            otherButton.getAttribute(
                                "aria-controls"
                            );


                        const otherContent =
                            document.getElementById(
                                otherContentId
                            );


                        otherButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );


                        if (
                            otherContent
                        ) {

                            otherContent.hidden =
                                true;

                        }


                        const otherIcon =
                            otherButton.querySelector(
                                ".ritual-icon"
                            );


                        if (
                            otherIcon
                        ) {

                            otherIcon.textContent =
                                "+";

                        }

                    }
                );


                /*
                 * Open selected ritual
                 */

                const shouldOpen =
                    !expanded;


                button.setAttribute(
                    "aria-expanded",
                    String(
                        shouldOpen
                    )
                );


                content.hidden =
                    !shouldOpen;


                const icon =
                    button.querySelector(
                        ".ritual-icon"
                    );


                if (icon) {

                    icon.textContent =
                        shouldOpen
                            ? "−"
                            : "+";

                }

            }
        );

    });

}


/* =========================================================
   CALENDAR LINKS
   ========================================================= */

function initCalendarLinks() {

    if (!calendarStrip) {

        return;

    }


    calendarStrip
        .querySelectorAll(
            "a.puja-day-pill"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                event => {

                    const href =
                        link.getAttribute(
                            "href"
                        );


                    /*
                     * No ritual connected
                     */

                    if (
                        !href ||
                        href === "#"
                    ) {

                        event.preventDefault();

                        return;

                    }


                    const targetId =
                        href.substring(1);


                    const target =
                        document.getElementById(
                            targetId
                        );


                    if (!target) {

                        event.preventDefault();

                        console.warn(
                            "Ritual target not found:",
                            targetId
                        );

                        return;

                    }


                    event.preventDefault();


                    /*
                     * Open ritual
                     */

                    const button =
                        target.querySelector(
                            ".ritual-toggle"
                        );


                    if (
                        button &&
                        button.getAttribute(
                            "aria-expanded"
                        ) !== "true"
                    ) {

                        button.click();

                    }


                    /*
                     * Scroll
                     */

                    setTimeout(
                        () => {

                            target.scrollIntoView({

                                behavior:
                                    "smooth",

                                block:
                                    "center"

                            });

                        },
                        50
                    );

                }
            );

        });

}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializePujaPage() {

    console.log(
        "ROY BARI: Puja page initialized."
    );


    /*
     * IMPORTANT:
     * Load rituals first because the
     * calendar needs ritual IDs to
     * create working links.
     */

    await loadRituals();


    await loadCalendar();


    console.log(
        "ROY BARI: Puja page ready."
    );

}


/* =========================================================
   START
   ========================================================= */

initializePujaPage();