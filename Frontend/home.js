/* =========================================================
   ROY BARI — HOME
   Firebase / Firestore
   Countdown + Gallery Hero Image
   ========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    db
} from "./firebase.js";


/* =========================================================
   ELEMENTS
   ========================================================= */

const countdown =
    document.getElementById("countdown");

const countdownLabel =
    document.getElementById("countdown-label");

const heroImage =
    document.getElementById("hero-durga");

const eyeImage =
    document.getElementById("eye");


let countdownInterval = null;


/* =========================================================
   START
   ========================================================= */

console.log("=================================");
console.log("ROY BARI HOME");
console.log("Home JS started");
console.log("Firestore:", db);
console.log("=================================");

loadNextEvent();
loadDurgaImage();


/* =========================================================
   LOAD NEXT EVENT
   ========================================================= */

async function loadNextEvent() {

    if (!countdown) {
        console.warn("#countdown element not found");
        return;
    }

    try {

        console.log(
            "ROY BARI: Loading Puja events..."
        );

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "events"
                )
            );

        console.log(
            "ROY BARI: Events found:",
            snapshot.size
        );

        const events = [];

        snapshot.forEach(doc => {

            const data = doc.data();

            console.log(
                "Event:",
                doc.id,
                data
            );

            const event = {
                id: doc.id,
                ...data
            };

            const eventDate =
                getEventDate(event);

            if (eventDate) {

                events.push({
                    ...event,
                    eventDate
                });

            }

        });


        /* =================================================
           FUTURE EVENTS
           ================================================= */

        const now = Date.now();

        const upcomingEvents =
            events
                .filter(
                    event =>
                        event.eventDate.getTime() > now
                )
                .sort(
                    (a, b) =>
                        a.eventDate.getTime() -
                        b.eventDate.getTime()
                );


        if (
            upcomingEvents.length === 0
        ) {

            showNoEvent();
            return;

        }


        const nextEvent =
            upcomingEvents[0];


        console.log(
            "ROY BARI: Next event:",
            nextEvent
        );


        const eventName =
            nextEvent.name ||
            nextEvent.title ||
            nextEvent.eventName ||
            "the next Puja event";


        if (countdownLabel) {

            countdownLabel.textContent =
                `Counting down to ${eventName}`;

        }


        startCountdown(
            nextEvent.eventDate
        );

    }

    catch (error) {

        console.error(
            "ROY BARI: EVENTS FIREBASE ERROR:",
            error
        );

        showError();

    }

}


/* =========================================================
   GET EVENT DATE
   ========================================================= */

function getEventDate(event) {

    if (!event) {
        return null;
    }


    const rawDate =
        event.date ||
        event.eventDate ||
        event.datetime ||
        event.timestamp;


    if (!rawDate) {
        return null;
    }


    /* Firestore Timestamp */

    if (
        typeof rawDate.toDate ===
        "function"
    ) {

        const date =
            rawDate.toDate();

        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;

    }


    /* JavaScript Date */

    if (
        rawDate instanceof Date
    ) {

        return Number.isNaN(
            rawDate.getTime()
        )
            ? null
            : rawDate;

    }


    /* Firestore timestamp-like object */

    if (
        typeof rawDate === "object" &&
        rawDate.seconds !== undefined
    ) {

        const date =
            new Date(
                Number(rawDate.seconds) * 1000
            );

        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;

    }


    /* String / number */

    const date =
        new Date(rawDate);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        console.warn(
            "ROY BARI: Invalid event date:",
            rawDate
        );

        return null;

    }


    return date;

}


/* =========================================================
   COUNTDOWN
   ========================================================= */

function startCountdown(
    targetDate
) {

    if (countdownInterval) {

        clearInterval(
            countdownInterval
        );

        countdownInterval = null;

    }


    function update() {

        let difference =
            targetDate.getTime() -
            Date.now();


        if (
            difference <= 0
        ) {

            countdown.innerHTML = `

                <div class="box">

                    <span class="n">
                        🪔
                    </span>

                    <span class="u">
                        The Puja is here
                    </span>

                </div>

            `;


            if (countdownLabel) {

                countdownLabel.textContent =
                    "The Puja has begun";

            }


            clearInterval(
                countdownInterval
            );

            countdownInterval = null;

            return;

        }


        const day =
            1000 * 60 * 60 * 24;

        const hour =
            1000 * 60 * 60;

        const minute =
            1000 * 60;

        const second =
            1000;


        const days =
            Math.floor(
                difference / day
            );

        difference -=
            days * day;


        const hours =
            Math.floor(
                difference / hour
            );

        difference -=
            hours * hour;


        const minutes =
            Math.floor(
                difference / minute
            );

        difference -=
            minutes * minute;


        const seconds =
            Math.floor(
                difference / second
            );


        countdown.innerHTML = `

            <div class="box">

                <span class="n">
                    ${days}
                </span>

                <span class="u">
                    Days
                </span>

            </div>

            <div class="box">

                <span class="n">
                    ${String(hours).padStart(2, "0")}
                </span>

                <span class="u">
                    Hours
                </span>

            </div>

            <div class="box">

                <span class="n">
                    ${String(minutes).padStart(2, "0")}
                </span>

                <span class="u">
                    Minutes
                </span>

            </div>

            <div class="box">

                <span class="n">
                    ${String(seconds).padStart(2, "0")}
                </span>

                <span class="u">
                    Seconds
                </span>

            </div>

        `;

    }


    update();


    countdownInterval =
        setInterval(
            update,
            1000
        );

}


/* =========================================================
   NO UPCOMING EVENT
   ========================================================= */

function showNoEvent() {

    console.log(
        "ROY BARI: No upcoming Puja event."
    );


    if (countdownLabel) {

        countdownLabel.textContent =
            "The Puja Calendar";

    }


    countdown.innerHTML = `

        <div class="box">

            <span class="n">
                🪔
            </span>

            <span class="u">
                No upcoming event
            </span>

        </div>

    `;

}


/* =========================================================
   FIREBASE ERROR
   ========================================================= */

function showError() {

    if (countdownLabel) {

        countdownLabel.textContent =
            "Puja Calendar";

    }


    countdown.innerHTML = `

        <div class="box">

            <span class="n">
                —
            </span>

            <span class="u">
                Unable to load
            </span>

        </div>

    `;

}


/* =========================================================
   LOAD DURGA IMAGE
   FROM:
   gallery
   ========================================================= */

async function loadDurgaImage() {

    try {

        console.log(
            "ROY BARI: Loading Durga image..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "gallery"
                )
            );


        console.log(
            "ROY BARI: Gallery documents:",
            snapshot.size
        );


        let durgaImageURL = "";


        snapshot.forEach(doc => {

            const data =
                doc.data();


            const title =
                String(
                    data.title || ""
                )
                    .trim()
                    .toLowerCase();


            if (
                title === "durga"
            ) {

                durgaImageURL =
                    data.link ||
                    data.image ||
                    data.url ||
                    "";

            }

        });


        if (
            !durgaImageURL
        ) {

            console.warn(
                "ROY BARI: Durga image not found."
            );

            return;

        }


        console.log(
            "ROY BARI: Drive URL:",
            durgaImageURL
        );


        const imageURL =
            convertGoogleDriveURL(
                durgaImageURL
            );


        console.log(
            "ROY BARI: Image URL:",
            imageURL
        );


        /* =================================================
           HERO
           ================================================= */

        if (heroImage) {

            heroImage.src =
                imageURL;

            heroImage.alt =
                "Roy Bari Durga";

        }


        /* =================================================
           FAMILY WORDS
           ================================================= */

        if (eyeImage) {

            eyeImage.src =
                imageURL;

            eyeImage.alt =
                "Roy Bari Durga";

        }


        console.log(
            "ROY BARI: Durga image loaded successfully."
        );

    }

    catch (error) {

        console.error(
            "ROY BARI: GALLERY FIREBASE ERROR:",
            error
        );

    }

}


/* =========================================================
   GOOGLE DRIVE URL
   ========================================================= */

function convertGoogleDriveURL(
    url
) {

    if (!url) {
        return "";
    }


    /*
     * Example:
     * https://drive.google.com/file/d/ABC123/view
     */

    const fileMatch =
        url.match(
            /drive\.google\.com\/file\/d\/([^/]+)/
        );


    if (
        fileMatch &&
        fileMatch[1]
    ) {

        const fileId =
            fileMatch[1];


        /*
         * Thumbnail endpoint is generally
         * more reliable for displaying
         * Google Drive images.
         */

        return (
            "https://drive.google.com/thumbnail?id=" +
            fileId +
            "&sz=w1600"
        );

    }


    /*
     * Example:
     * https://drive.google.com/open?id=ABC123
     */

    const idMatch =
        url.match(
            /[?&]id=([^&]+)/
        );


    if (
        idMatch &&
        idMatch[1]
    ) {

        const fileId =
            idMatch[1];


        return (
            "https://drive.google.com/thumbnail?id=" +
            fileId +
            "&sz=w1600"
        );

    }


    /*
     * Googleusercontent
     */

    if (
        url.includes(
            "googleusercontent.com"
        )
    ) {

        return url;

    }


    /*
     * Already a direct URL
     */

    return url;

}


/* =========================================================
   CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            countdownInterval
        ) {

            clearInterval(
                countdownInterval
            );

            countdownInterval = null;

        }

    }
);