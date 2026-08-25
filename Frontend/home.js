/* =========================================================
   ROY BARI — HOME
   Firebase / Firestore

   Homepage Countdown:
   Collection: homepageCountdown

   Expected fields:
   title    → "Mahalaya"
   dateTime → Firestore Timestamp

   Gallery:
   Collection: gallery
   title     → "Durga"
   link      → Google Drive / image URL
   ========================================================= */


/* =========================================================
   FIREBASE IMPORTS
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


/* =========================================================
   LOAD HOMEPAGE COUNTDOWN
   ========================================================= */

loadHomepageCountdown();


/* =========================================================
   LOAD DURGA IMAGE
   ========================================================= */

loadDurgaImage();


/* =========================================================
   HOMEPAGE COUNTDOWN
   FIRESTORE COLLECTION:

   homepageCountdown

   Example:

   homepageCountdown
   └── ELtZJg71J67kfuzjd00y
       ├── title: "Mahalaya"
       └── dateTime: Firestore Timestamp

   IMPORTANT:
   The document ID does NOT matter.
   The first document in homepageCountdown
   is used.
   ========================================================= */

async function loadHomepageCountdown() {

    if (!countdown) {

        console.warn(
            "ROY BARI: #countdown element not found."
        );

        return;

    }


    try {

        console.log(
            "ROY BARI: Loading homepageCountdown..."
        );


        /* =================================================
           GET HOMEPAGE COUNTDOWN COLLECTION
           ================================================= */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "homepageCountdown"
                )
            );


        console.log(
            "ROY BARI: homepageCountdown documents:",
            snapshot.size
        );


        /* =================================================
           CHECK COLLECTION
           ================================================= */

        if (snapshot.empty) {

            console.warn(
                "ROY BARI: homepageCountdown is empty."
            );

            showNoCountdown();

            return;

        }


        /* =================================================
           GET THE FIRST DOCUMENT

           Your current document:

           ELtZJg71J67kfuzjd00y

           ID is intentionally NOT hard-coded.
           ================================================= */

        const document =
            snapshot.docs[0];


        const data =
            document.data();


        console.log(
            "ROY BARI: Countdown document ID:",
            document.id
        );


        console.log(
            "ROY BARI: Countdown data:",
            data
        );


        /* =================================================
           GET TITLE
           ================================================= */

        const title =
            String(
                data.title || ""
            ).trim();


        /* =================================================
           GET DATE + TIME
           ================================================= */

        const targetDate =
            getCountdownDate(
                data.dateTime
            );


        /* =================================================
           CHECK TITLE
           ================================================= */

        if (!title) {

            console.error(
                "ROY BARI: homepageCountdown.title is missing."
            );

            showCountdownError();

            return;

        }


        /* =================================================
           CHECK DATE
           ================================================= */

        if (!targetDate) {

            console.error(
                "ROY BARI: homepageCountdown.dateTime is missing or invalid."
            );

            showCountdownError();

            return;

        }


        /* =================================================
           LOG DATA
           ================================================= */

        console.log(
            "ROY BARI: Countdown title:",
            title
        );


        console.log(
            "ROY BARI: Countdown date/time:",
            targetDate
        );


        console.log(
            "ROY BARI: Countdown local date/time:",
            targetDate.toLocaleString()
        );


        /* =================================================
           UPDATE COUNTDOWN LABEL

           Example:

           Counting down to Mahalaya
           ================================================= */

        if (countdownLabel) {

            countdownLabel.textContent =
                `Counting down to ${title}`;

        }


        /* =================================================
           START COUNTDOWN
           ================================================= */

        startCountdown(
            targetDate,
            title
        );

    }

    catch (error) {

        console.error(
            "ROY BARI: HOMEPAGE COUNTDOWN FIREBASE ERROR:",
            error
        );


        showCountdownError();

    }

}


/* =========================================================
   CONVERT FIRESTORE dateTime
   INTO JAVASCRIPT DATE
   ========================================================= */

function getCountdownDate(
    rawDate
) {

    /* =================================================
       NO DATE
       ================================================= */

    if (!rawDate) {

        return null;

    }


    /* =================================================
       FIRESTORE TIMESTAMP

       This is what your screenshot shows.

       Example:

       dateTime:
       10 October 2026 at 00:00:00 UTC+5:30
       ================================================= */

    if (
        typeof rawDate.toDate === "function"
    ) {

        const date =
            rawDate.toDate();


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return null;

        }


        return date;

    }


    /* =================================================
       JAVASCRIPT DATE
       ================================================= */

    if (
        rawDate instanceof Date
    ) {

        if (
            Number.isNaN(
                rawDate.getTime()
            )
        ) {

            return null;

        }


        return rawDate;

    }


    /* =================================================
       FIRESTORE TIMESTAMP-LIKE OBJECT

       Supports data such as:

       {
           seconds: 1791570600,
           nanoseconds: 0
       }
       ================================================= */

    if (
        typeof rawDate === "object" &&
        rawDate.seconds !== undefined
    ) {

        const seconds =
            Number(
                rawDate.seconds
            );


        const nanoseconds =
            Number(
                rawDate.nanoseconds || 0
            );


        if (
            Number.isNaN(seconds)
        ) {

            return null;

        }


        const milliseconds =
            (seconds * 1000) +
            Math.floor(
                nanoseconds / 1000000
            );


        const date =
            new Date(
                milliseconds
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return null;

        }


        return date;

    }


    /* =================================================
       STRING / NUMBER

       This is only a fallback.
       Your Firebase Timestamp will use
       the code above.
       ================================================= */

    const date =
        new Date(
            rawDate
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        console.warn(
            "ROY BARI: Invalid dateTime:",
            rawDate
        );

        return null;

    }


    return date;

}


/* =========================================================
   START COUNTDOWN
   ========================================================= */

function startCountdown(
    targetDate,
    title
) {

    /* =================================================
       CLEAR OLD TIMER
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
           TARGET REACHED
           ================================================= */

        if (
            difference <= 0
        ) {

            if (countdown) {

                countdown.innerHTML = `

                    <div class="box">

                        <span class="n">
                            🪔
                        </span>

                        <span class="u">
                            ${escapeHTML(title)} is here
                        </span>

                    </div>

                `;

            }


            if (countdownLabel) {

                countdownLabel.textContent =
                    `${title} is here`;

            }


            clearInterval(
                countdownInterval
            );


            countdownInterval = null;


            return;

        }


        /* =================================================
           TIME CONSTANTS
           ================================================= */

        const second =
            1000;


        const minute =
            second * 60;


        const hour =
            minute * 60;


        const day =
            hour * 24;


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
           UPDATE COUNTDOWN HTML
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
       RUN FIRST UPDATE IMMEDIATELY
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
   NO COUNTDOWN DOCUMENT
   ========================================================= */

function showNoCountdown() {

    if (countdownLabel) {

        countdownLabel.textContent =
            "Puja Calendar";

    }


    if (countdown) {

        countdown.innerHTML = `

            <div class="box">

                <span class="n">
                    🪔
                </span>

                <span class="u">
                    Countdown not set
                </span>

            </div>

        `;

    }

}


/* =========================================================
   COUNTDOWN ERROR
   ========================================================= */

function showCountdownError() {

    if (countdownLabel) {

        countdownLabel.textContent =
            "Puja Calendar";

    }


    if (countdown) {

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

}


/* =========================================================
   LOAD DURGA IMAGE
   FROM:

   gallery

   Finds:

   title = "Durga"
   ========================================================= */

async function loadDurgaImage() {

    try {

        console.log(
            "ROY BARI: Loading Durga image..."
        );


        /* =================================================
           GET GALLERY
           ================================================= */

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
            "ROY BARI: Durga image source:",
            durgaImageURL
        );


        /* =================================================
           CONVERT GOOGLE DRIVE URL
           ================================================= */

        const imageURL =
            convertGoogleDriveURL(
                durgaImageURL
            );


        console.log(
            "ROY BARI: Final image URL:",
            imageURL
        );


        /* =================================================
           HERO DURGA IMAGE
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
   GOOGLE DRIVE URL CONVERTER
   ========================================================= */

function convertGoogleDriveURL(
    url
) {

    if (!url) {

        return "";

    }


    /* =================================================
       GOOGLE DRIVE FILE URL

       Example:

       https://drive.google.com/file/d/ABC123/view
       ================================================= */

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

       Example:

       https://drive.google.com/open?id=ABC123
       ================================================= */

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
       ALREADY DIRECT IMAGE URL
       ================================================= */

    return url;

}


/* =========================================================
   BASIC HTML ESCAPE
   Prevents title text from injecting HTML.
   ========================================================= */

function escapeHTML(
    value
) {

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