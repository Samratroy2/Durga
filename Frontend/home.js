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



/* =========================================================
   COUNTDOWN STATE
   ========================================================= */

let countdownInterval = null;



/* =========================================================
   START
   ========================================================= */

console.log("=================================");
console.log("ROY BARI HOME");
console.log("Home JS started");
console.log("Firestore:", db);
console.log("=================================");


loadNextRitual();
loadDurgaImage();



/* =========================================================
   LOAD FIRST UPCOMING RITUAL
   FIRESTORE:
   rituals
   ========================================================= */

async function loadNextRitual() {

    if (!countdown) {

        console.warn(
            "ROY BARI: #countdown element not found"
        );

        return;

    }


    try {

        console.log(
            "ROY BARI: Loading rituals..."
        );


        /* =================================================
           GET RITUALS
           ================================================= */

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


        const rituals = [];


        /* =================================================
           READ ALL RITUALS
           ================================================= */

        snapshot.forEach(doc => {

            const data =
                doc.data();


            console.log(
                "Ritual:",
                doc.id,
                data
            );


            const ritual = {

                id: doc.id,

                ...data

            };


            const ritualDate =
                getEventDate(
                    ritual
                );


            if (ritualDate) {

                rituals.push({

                    ...ritual,

                    eventDate:
                        ritualDate

                });

            }

        });



        /* =================================================
           FIND UPCOMING RITUALS
           ================================================= */

        const now =
            Date.now();


        const upcomingRituals =
            rituals
                .filter(
                    ritual =>
                        ritual.eventDate.getTime() >
                        now
                )
                .sort(
                    (a, b) =>
                        a.eventDate.getTime() -
                        b.eventDate.getTime()
                );



        /* =================================================
           NO UPCOMING RITUAL
           ================================================= */

        if (
            upcomingRituals.length === 0
        ) {

            console.log(
                "ROY BARI: No upcoming rituals."
            );


            showNoEvent();

            return;

        }



        /* =================================================
           FIRST UPCOMING RITUAL
           ================================================= */

        const nextRitual =
            upcomingRituals[0];


        console.log(
            "ROY BARI: First upcoming ritual:",
            nextRitual
        );


        console.log(
            "ROY BARI: Countdown date:",
            nextRitual.eventDate
        );



        /* =================================================
           COUNTDOWN LABEL
           ================================================= */

        /*
         * Priority:
         *
         * 1. day
         * 2. category
         * 3. name
         * 4. title
         *
         * Your current Firestore document:
         *
         * day: "Sashthi"
         *
         * Therefore:
         *
         * Counting down to Sashthi
         */

        const countdownName =
            nextRitual.day ||
            nextRitual.category ||
            nextRitual.name ||
            nextRitual.title ||
            "the next Puja event";


        if (countdownLabel) {

            countdownLabel.textContent =
                `Counting down to ${countdownName}`;

        }



        /* =================================================
           START COUNTDOWN
           ================================================= */

        startCountdown(
            nextRitual.eventDate
        );

    }

    catch (error) {

        console.error(
            "ROY BARI: RITUALS FIREBASE ERROR:",
            error
        );


        showError();

    }

}



/* =========================================================
   GET EVENT / RITUAL DATE
   ========================================================= */

function getEventDate(event) {

    if (!event) {

        return null;

    }



    /* =================================================
       POSSIBLE DATE FIELDS
       ================================================= */

    const rawDate =
        event.date ||
        event.eventDate ||
        event.datetime ||
        event.timestamp;



    if (!rawDate) {

        return null;

    }



    /* =================================================
       FIRESTORE TIMESTAMP
       ================================================= */

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



    /* =================================================
       JAVASCRIPT DATE
       ================================================= */

    if (
        rawDate instanceof Date
    ) {

        return Number.isNaN(
            rawDate.getTime()
        )
            ? null
            : rawDate;

    }



    /* =================================================
       FIRESTORE TIMESTAMP-LIKE OBJECT
       ================================================= */

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



    /* =================================================
       STRING / NUMBER
       ================================================= */

    const date =
        new Date(rawDate);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        console.warn(
            "ROY BARI: Invalid ritual date:",
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

    /* =================================================
       CLEAR PREVIOUS TIMER
       ================================================= */

    if (countdownInterval) {

        clearInterval(
            countdownInterval
        );

        countdownInterval = null;

    }



    /* =================================================
       UPDATE COUNTDOWN
       ================================================= */

    function update() {

        let difference =
            targetDate.getTime() -
            Date.now();



        /* =================================================
           RITUAL HAS STARTED
           ================================================= */

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


            /*
             * Reload rituals after the current
             * ritual reaches its date.
             *
             * This allows the next ritual
             * to become the countdown target.
             */

            setTimeout(
                loadNextRitual,
                1000
            );


            return;

        }



        /* =================================================
           TIME UNITS
           ================================================= */

        const day =
            1000 *
            60 *
            60 *
            24;


        const hour =
            1000 *
            60 *
            60;


        const minute =
            1000 *
            60;


        const second =
            1000;



        /* =================================================
           DAYS
           ================================================= */

        const days =
            Math.floor(
                difference / day
            );


        difference -=
            days * day;



        /* =================================================
           HOURS
           ================================================= */

        const hours =
            Math.floor(
                difference / hour
            );


        difference -=
            hours * hour;



        /* =================================================
           MINUTES
           ================================================= */

        const minutes =
            Math.floor(
                difference / minute
            );


        difference -=
            minutes * minute;



        /* =================================================
           SECONDS
           ================================================= */

        const seconds =
            Math.floor(
                difference / second
            );



        /* =================================================
           UPDATE HTML
           ================================================= */

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



    /* =================================================
       RUN IMMEDIATELY
       ================================================= */

    update();



    /* =================================================
       UPDATE EVERY SECOND
       ================================================= */

    countdownInterval =
        setInterval(
            update,
            1000
        );

}



/* =========================================================
   NO UPCOMING RITUAL
   ========================================================= */

function showNoEvent() {

    console.log(
        "ROY BARI: No upcoming ritual."
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
                No upcoming ritual
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



        /* =================================================
           FIND DURGA IMAGE
           ================================================= */

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



        /* =================================================
           IMAGE NOT FOUND
           ================================================= */

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



        /* =================================================
           CONVERT DRIVE URL
           ================================================= */

        const imageURL =
            convertGoogleDriveURL(
                durgaImageURL
            );


        console.log(
            "ROY BARI: Image URL:",
            imageURL
        );



        /* =================================================
           HERO IMAGE
           ================================================= */

        if (heroImage) {

            heroImage.src =
                imageURL;


            heroImage.alt =
                "Roy Bari Durga";

        }



        /* =================================================
           FAMILY WORDS IMAGE
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



    /* =================================================
       GOOGLE DRIVE FILE URL
       =================================================

       Example:

       https://drive.google.com/file/d/ABC123/view
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


        return (
            "https://drive.google.com/thumbnail?id=" +
            fileId +
            "&sz=w1600"
        );

    }



    /* =================================================
       GOOGLE DRIVE OPEN URL
       =================================================

       Example:

       https://drive.google.com/open?id=ABC123
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



    /* =================================================
       GOOGLE USER CONTENT
       ================================================= */

    if (
        url.includes(
            "googleusercontent.com"
        )
    ) {

        return url;

    }



    /* =================================================
       ALREADY DIRECT URL
       ================================================= */

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