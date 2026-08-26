/* =========================================================
   ROY BARI — VISIT PAGE
   Firebase / Firestore
   =========================================================

   FIRESTORE COLLECTION:

   visit

   CURRENT DOCUMENT FIELDS:

   address
   mapUrl
   parking
   railOne
   railTwo

   OPTIONAL FIELDS:

   mapEmbedUrl

   timings
   pujaTimings

   guide
   visitorGuide
   ========================================================= */


/* =========================================================
   FIREBASE
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

const address =
    document.getElementById(
        "visit-address"
    );

const railOne =
    document.getElementById(
        "rail-one"
    );

const railTwo =
    document.getElementById(
        "rail-two"
    );

const parking =
    document.getElementById(
        "parking"
    );

const googleMap =
    document.getElementById(
        "google-map"
    );

const timings =
    document.getElementById(
        "visit-timings"
    );

const visitorGuide =
    document.getElementById(
        "visitor-guide"
    );


/* =========================================================
   DEBUG
   ========================================================= */

console.log(
    "================================="
);

console.log(
    "ROY BARI — VISIT JS"
);

console.log(
    "Firestore:",
    db
);

console.log(
    "================================="
);


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
   SAFE HTTP URL CHECK
   ========================================================= */

function isValidHttpUrl(url) {

    if (!url) {

        return false;

    }

    try {

        const parsed =
            new URL(
                String(url).trim()
            );

        return (

            parsed.protocol === "http:" ||

            parsed.protocol === "https:"

        );

    }
    catch (error) {

        return false;

    }

}


/* =========================================================
   GOOGLE MAP EMBED
   ========================================================= */

function setupGoogleMap(data) {

    if (!googleMap) {

        return;

    }


    /* -----------------------------------------------------
       1. BEST OPTION — mapEmbedUrl
       ----------------------------------------------------- */

    if (

        data.mapEmbedUrl &&

        isValidHttpUrl(
            data.mapEmbedUrl
        )

    ) {

        googleMap.src =
            data.mapEmbedUrl;

        console.log(
            "Using Firestore mapEmbedUrl"
        );

        return;

    }


    /* -----------------------------------------------------
       2. If mapUrl is already an embed URL
       ----------------------------------------------------- */

    if (

        data.mapUrl &&

        isValidHttpUrl(
            data.mapUrl
        )

    ) {

        const mapUrl =
            String(
                data.mapUrl
            ).trim();


        if (

            mapUrl.includes(
                "google.com/maps/embed"
            )

        ) {

            googleMap.src =
                mapUrl;

            console.log(
                "Using Firestore mapUrl as embed URL"
            );

            return;

        }

    }


    /* -----------------------------------------------------
       3. Address-based Google Maps embed
       -----------------------------------------------------

       Your current Firestore mapUrl is:

       https://share.google/...

       That is a sharing URL and should NOT be
       placed directly inside an iframe.

       Therefore we use the Firestore address.
       ----------------------------------------------------- */

    const mapAddress =

        data.address ||

        "Chhota Nohari, West Bengal 721121";


    const embedUrl =

        "https://www.google.com/maps?q=" +

        encodeURIComponent(
            mapAddress
        ) +

        "&output=embed";


    googleMap.src =
        embedUrl;


    console.log(
        "Using address-based Google Maps embed"
    );

}


/* =========================================================
   LOAD VISIT INFORMATION
   ========================================================= */

async function loadVisitInfo() {

    console.log(
        "Loading visit collection..."
    );


    try {

        /* -------------------------------------------------
           GET COLLECTION
           ------------------------------------------------- */

        const visitCollection =
            collection(
                db,
                "visit"
            );


        const snapshot =
            await getDocs(
                visitCollection
            );


        console.log(
            "Visit documents:",
            snapshot.size
        );


        /* -------------------------------------------------
           NO DOCUMENT
           ------------------------------------------------- */

        if (
            snapshot.empty
        ) {

            console.warn(
                "No documents found in visit collection."
            );


            showNoVisitData();

            return;

        }


        /* -------------------------------------------------
           SELECT DOCUMENT
           -------------------------------------------------

           Prefer:

           visit/main

           Otherwise use the first document.
           ------------------------------------------------- */

        let selectedDocument =
            null;


        const mainDocument =
            snapshot.docs.find(
                function (doc) {

                    return (
                        doc.id === "main"
                    );

                }
            );


        if (mainDocument) {

            selectedDocument =
                mainDocument;

        }
        else {

            selectedDocument =
                snapshot.docs[0];

        }


        const data =
            selectedDocument.data();


        console.log(
            "Selected visit document:",
            selectedDocument.id
        );


        console.log(
            "Visit document data:",
            data
        );


        /* -------------------------------------------------
           LOCATION
           ------------------------------------------------- */

        loadLocation(
            data
        );


        /* -------------------------------------------------
           GOOGLE MAP
           ------------------------------------------------- */

        setupGoogleMap(
            data
        );


        /* -------------------------------------------------
           TIMINGS
           ------------------------------------------------- */

        if (
            Array.isArray(
                data.timings
            )
        ) {

            loadTimings(
                data.timings
            );

        }
        else if (
            Array.isArray(
                data.pujaTimings
            )
        ) {

            loadTimings(
                data.pujaTimings
            );

        }
        else {

            showNoTimings();

        }


        /* -------------------------------------------------
           VISITOR GUIDE
           ------------------------------------------------- */

        if (
            Array.isArray(
                data.guide
            )
        ) {

            loadVisitorGuide(
                data.guide
            );

        }
        else if (
            Array.isArray(
                data.visitorGuide
            )
        ) {

            loadVisitorGuide(
                data.visitorGuide
            );

        }
        else {

            showNoGuide();

        }


        console.log(
            "ROY BARI: Visit page loaded successfully."
        );

    }
    catch (error) {

        console.error(
            "ROY BARI VISIT FIREBASE ERROR:",
            error
        );


        showVisitError();

    }

}


/* =========================================================
   LOAD LOCATION
   ========================================================= */

function loadLocation(data) {

    if (!data) {

        return;

    }


    /* -----------------------------------------------------
       ADDRESS
       ----------------------------------------------------- */

    if (address) {

        address.textContent =

            data.address ||

            "Chhota Nohari, West Bengal 721121";

    }


    /* -----------------------------------------------------
       RAIL ONE
       -----------------------------------------------------

       IMPORTANT:

       Correct field:

       railOne

       NOT:

       raiIOne
       ----------------------------------------------------- */

    if (railOne) {

        railOne.textContent =

            data.railOne ||

            data.nearestRailOne ||

            "Information not available";

    }


    /* -----------------------------------------------------
       RAIL TWO
       ----------------------------------------------------- */

    if (railTwo) {

        railTwo.textContent =

            data.railTwo ||

            data.nearestRailTwo ||

            "Information not available";

    }


    /* -----------------------------------------------------
       PARKING
       ----------------------------------------------------- */

    if (parking) {

        parking.textContent =

            data.parking ||

            "Information not available";

    }

}


/* =========================================================
   LOAD PUJA TIMINGS
   ========================================================= */

function loadTimings(data) {

    if (!timings) {

        return;

    }


    if (

        !Array.isArray(data) ||

        data.length === 0

    ) {

        showNoTimings();

        return;

    }


    let html = "";


    data.forEach(
        function (
            item,
            index
        ) {

            /*
               Support both object and string
               timing formats.
            */

            if (
                typeof item === "string"
            ) {

                html += `

                    <div
                        class="visit-timing-card"
                    >

                        <div
                            class="visit-timing-time"
                        >

                            ${escapeHTML(
                                item
                            )}

                        </div>

                    </div>

                `;

                return;

            }


            const day =

                item.day ||

                item.name ||

                `Day ${index + 1}`;


            const date =

                item.date ||

                "";


            const time =

                item.time ||

                item.timing ||

                "";


            const description =

                item.description ||

                "";


            html += `

                <div
                    class="visit-timing-card"
                >

                    <div
                        class="visit-timing-day"
                    >

                        ${escapeHTML(
                            day
                        )}

                    </div>


                    ${
                        date
                        ?
                        `

                            <div
                                class="visit-timing-date"
                            >

                                ${escapeHTML(
                                    date
                                )}

                            </div>

                        `
                        :
                        ""
                    }


                    ${
                        time
                        ?
                        `

                            <div
                                class="visit-timing-time"
                            >

                                ${escapeHTML(
                                    time
                                )}

                            </div>

                        `
                        :
                        ""
                    }


                    ${
                        description
                        ?
                        `

                            <p>

                                ${escapeHTML(
                                    description
                                )}

                            </p>

                        `
                        :
                        ""
                    }

                </div>

            `;

        }
    );


    if (!html) {

        showNoTimings();

        return;

    }


    timings.innerHTML =
        html;


    console.log(
        "Puja timings loaded:",
        data.length
    );

}


/* =========================================================
   LOAD VISITOR GUIDE
   ========================================================= */

function loadVisitorGuide(data) {

    if (!visitorGuide) {

        return;

    }


    if (

        !Array.isArray(data) ||

        data.length === 0

    ) {

        showNoGuide();

        return;

    }


    let html = "";


    data.forEach(
        function (
            item,
            index
        ) {

            /*
               Support simple string entries.
            */

            if (
                typeof item === "string"
            ) {

                html += `

                    <article
                        class="card"
                    >

                        <div class="num">

                            ${String(
                                index + 1
                            ).padStart(
                                2,
                                "0"
                            )}

                        </div>


                        <h4>
                            Visitor Information
                        </h4>


                        <p>

                            ${escapeHTML(
                                item
                            )}

                        </p>

                    </article>

                `;

                return;

            }


            const number =

                item.number ||

                String(
                    index + 1
                ).padStart(
                    2,
                    "0"
                );


            const title =

                item.title ||

                "Visitor Information";


            const description =

                item.description ||

                "";


            html += `

                <article
                    class="card"
                >

                    <div class="num">

                        ${escapeHTML(
                            number
                        )}

                    </div>


                    <h4>

                        ${escapeHTML(
                            title
                        )}

                    </h4>


                    <p>

                        ${escapeHTML(
                            description
                        )}

                    </p>

                </article>

            `;

        }
    );


    if (!html) {

        showNoGuide();

        return;

    }


    visitorGuide.innerHTML =
        html;


    console.log(
        "Visitor guide loaded:",
        data.length
    );

}


/* =========================================================
   NO TIMINGS
   ========================================================= */

function showNoTimings() {

    if (!timings) {

        return;

    }


    timings.innerHTML = `

        <div
            class="visit-empty"
        >

            <div class="eyebrow">
                Puja Calendar
            </div>


            <h4>
                Timings will be announced soon
            </h4>


            <p>

                Puja timings will appear here
                when they are added to the
                family calendar.

            </p>

        </div>

    `;

}


/* =========================================================
   NO VISITOR GUIDE
   ========================================================= */

function showNoGuide() {

    if (!visitorGuide) {

        return;

    }


    visitorGuide.innerHTML = `

        <article
            class="card"
        >

            <div class="num">
                01
            </div>


            <h4>
                Visitor information
            </h4>


            <p>

                Visitor guidelines will be
                added here before the Puja.

            </p>

        </article>

    `;

}


/* =========================================================
   NO VISIT DATA
   ========================================================= */

function showNoVisitData() {

    if (address) {

        address.textContent =
            "Visit information is not available.";

    }


    if (railOne) {

        railOne.textContent =
            "Not available";

    }


    if (railTwo) {

        railTwo.textContent =
            "Not available";

    }


    if (parking) {

        parking.textContent =
            "Not available";

    }


    if (googleMap) {

        const defaultMap =

            "https://www.google.com/maps?q=" +

            encodeURIComponent(
                "Chhota Nohari, West Bengal 721121"
            ) +

            "&output=embed";


        googleMap.src =
            defaultMap;

    }


    showNoTimings();

    showNoGuide();

}


/* =========================================================
   FIREBASE ERROR
   ========================================================= */

function showVisitError() {

    if (address) {

        address.textContent =
            "Unable to load visit information.";

    }


    if (railOne) {

        railOne.textContent =
            "Unable to load";

    }


    if (railTwo) {

        railTwo.textContent =
            "Unable to load";

    }


    if (parking) {

        parking.textContent =
            "Unable to load";

    }


    if (googleMap) {

        const defaultMap =

            "https://www.google.com/maps?q=" +

            encodeURIComponent(
                "Chhota Nohari, West Bengal 721121"
            ) +

            "&output=embed";


        googleMap.src =
            defaultMap;

    }


    showNoTimings();

    showNoGuide();

}


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        function () {

            console.log(
                "Visit page initialized"
            );

            loadVisitInfo();

        }
    );

}
else {

    console.log(
        "Visit page initialized"
    );

    loadVisitInfo();

}