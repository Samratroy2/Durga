/* =========================================================
   ROY BARI — RELATED TEMPLES
   Firebase / Firestore
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

const templeGrid =
    document.getElementById("temple-grid");

const loading =
    document.getElementById("temple-loading");

const errorBox =
    document.getElementById("temple-error");

const emptyState =
    document.getElementById("temple-empty");


/* =========================================================
   GOOGLE DRIVE IMAGE URL CONVERTER
   ========================================================= */
function getDriveImageUrl(url) {

    if (!url) {
        return "";
    }

    url = String(url).trim();

    /*
     * Google Drive file URL:
     * https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
     */

    const fileMatch =
        url.match(/drive\.google\.com\/file\/d\/([^/]+)/);

    if (fileMatch && fileMatch[1]) {

        const fileId = fileMatch[1];

        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
    }


    /*
     * Google Drive open URL:
     * https://drive.google.com/open?id=FILE_ID
     */

    const openMatch =
        url.match(/[?&]id=([^&]+)/);

    if (
        url.includes("drive.google.com") &&
        openMatch &&
        openMatch[1]
    ) {

        const fileId = openMatch[1];

        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
    }


    /*
     * Already a Drive thumbnail URL
     */

    if (
        url.includes("drive.google.com/thumbnail")
    ) {

        return url;
    }


    /*
     * Normal image URL
     */

    return url;
}


/* =========================================================
   LOAD TEMPLES
   ========================================================= */

async function loadTemples() {

    try {

        /* -------------------------------------------------
           SHOW LOADING
           ------------------------------------------------- */

        if (loading) {
            loading.hidden = false;
        }

        if (errorBox) {
            errorBox.hidden = true;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }


        /* -------------------------------------------------
           GET FIRESTORE DATA
           ------------------------------------------------- */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "temples"
                )
            );


        /* -------------------------------------------------
           HIDE LOADING
           ------------------------------------------------- */

        if (loading) {
            loading.hidden = true;
        }


        /* -------------------------------------------------
           NO DOCUMENTS
           ------------------------------------------------- */

        if (snapshot.empty) {

            if (emptyState) {
                emptyState.hidden = false;
            }

            console.log(
                "No temple documents found."
            );

            return;
        }


        /* -------------------------------------------------
           READ DOCUMENTS
           ------------------------------------------------- */

        const temples = [];


        snapshot.forEach(
            (documentSnapshot) => {

                const data =
                    documentSnapshot.data();


                /*
                 * Only show active temples.
                 *
                 * If active does not exist,
                 * also allow the document.
                 */

                if (
                    data.active === true ||
                    data.active === undefined
                ) {

                    temples.push({

                        id:
                            documentSnapshot.id,

                        ...data

                    });

                }

            }
        );


        /* -------------------------------------------------
           SORT BY ORDER
           ------------------------------------------------- */

        temples.sort(
            (a, b) => {

                const orderA =
                    Number(a.order || 999999);

                const orderB =
                    Number(b.order || 999999);

                return orderA - orderB;

            }
        );


        /* -------------------------------------------------
           NO ACTIVE TEMPLES
           ------------------------------------------------- */

        if (
            temples.length === 0
        ) {

            if (emptyState) {
                emptyState.hidden = false;
            }

            console.log(
                "No active temples found."
            );

            return;
        }


        /* -------------------------------------------------
           CLEAR GRID
           ------------------------------------------------- */

        if (!templeGrid) {
            console.error(
                "Temple grid element not found."
            );
            return;
        }

        templeGrid.innerHTML = "";


        /* -------------------------------------------------
           LOG DATA FOR DEBUGGING
           ------------------------------------------------- */

        console.log(
            "Temple documents found:",
            snapshot.size
        );

        console.log(
            "Active temples:",
            temples.length
        );


        /* -------------------------------------------------
           CREATE CARDS
           ------------------------------------------------- */

        temples.forEach(
            (temple, index) => {

                const card =
                    createTempleCard(
                        temple,
                        index
                    );

                templeGrid.appendChild(
                    card
                );

            }
        );


        /* -------------------------------------------------
           REVEAL
           ------------------------------------------------- */

        revealCards();


        console.log(
            "Temples loaded successfully."
        );

    }


    catch (error) {

        console.error(
            "TEMPLE FIREBASE ERROR:",
            error
        );


        if (loading) {
            loading.hidden = true;
        }


        if (errorBox) {
            errorBox.hidden = false;
        }

    }

}


/* =========================================================
   CREATE TEMPLE CARD
   ========================================================= */

function createTempleCard(
    temple,
    index
) {

    /* -----------------------------------------------------
       ARTICLE
       ----------------------------------------------------- */

    const article =
        document.createElement("article");

    article.className =
        "temple-card";


    /* =====================================================
       IMAGE AREA
       ===================================================== */

    const imageArea =
        document.createElement("div");

    imageArea.className =
        "temple-card-image";


    /* =====================================================
       NUMBER
       ===================================================== */

    const number =
        document.createElement("div");

    number.className =
        "temple-number";

    number.textContent =
        String(index + 1)
            .padStart(2, "0");


    imageArea.appendChild(
        number
    );


    /* =====================================================
       IMAGE
       ===================================================== */

    if (
        temple.imageUrl &&
        String(temple.imageUrl).trim() !== ""
    ) {

        const imageUrl =
            getDriveImageUrl(
                temple.imageUrl
            );


        console.log(
            `Temple image [${temple.name}]:`,
            imageUrl
        );


        const image =
            document.createElement("img");


        image.src =
            imageUrl;


        image.alt =
            temple.name ||
            "Temple";


        image.loading =
            "lazy";


        image.decoding =
            "async";


        /*
         * Image loaded successfully
         */

        image.onload = () => {

            imageArea.classList.add(
                "has-image"
            );

        };


        /*
         * Image failed to load
         */

        image.onerror = () => {

            console.warn(
                "Temple image failed to load:",
                temple.imageUrl
            );


            image.remove();

            imageArea.classList.remove(
                "has-image"
            );

        };


        imageArea.appendChild(
            image
        );

    }


    /* =====================================================
       OM SYMBOL FALLBACK
       ===================================================== */

    const symbol =
        document.createElement("div");

    symbol.className =
        "temple-symbol";

    symbol.setAttribute(
        "aria-hidden",
        "true"
    );

    symbol.textContent =
        "ॐ";


    imageArea.appendChild(
        symbol
    );


    /* =====================================================
       CARD CONTENT
       ===================================================== */

    const content =
        document.createElement("div");

    content.className =
        "temple-card-content";


    /* -----------------------------------------------------
       NAME
       ----------------------------------------------------- */

    const title =
        document.createElement("h3");

    title.textContent =
        temple.name ||
        "Untitled Temple";


    content.appendChild(
        title
    );


    /* -----------------------------------------------------
       DESCRIPTION
       ----------------------------------------------------- */

    const description =
        document.createElement("p");

    description.textContent =
        temple.description ||
        "A sacred place connected with Bengal's cultural heritage.";


    content.appendChild(
        description
    );


    /* -----------------------------------------------------
       MAP
       ----------------------------------------------------- */

    if (
        temple.mapUrl &&
        String(temple.mapUrl).trim() !== ""
    ) {

        const mapLink =
            document.createElement("a");

        mapLink.className =
            "temple-link";

        mapLink.href =
            temple.mapUrl;

        mapLink.target =
            "_blank";

        mapLink.rel =
            "noopener noreferrer";

        mapLink.textContent =
            "Explore Place";


        content.appendChild(
            mapLink
        );

    }


    /* =====================================================
       APPEND
       ===================================================== */

    article.appendChild(
        imageArea
    );

    article.appendChild(
        content
    );


    return article;

}


/* =========================================================
   CARD REVEAL
   ========================================================= */

function revealCards() {

    const cards =
        document.querySelectorAll(
            ".temple-card"
        );


    cards.forEach(
        (card, index) => {

            card.style.opacity =
                "0";

            card.style.transform =
                "translateY(18px)";


            setTimeout(
                () => {

                    card.style.transition =
                        "opacity .5s ease, transform .5s ease";

                    card.style.opacity =
                        "1";

                    card.style.transform =
                        "translateY(0)";

                },
                80 * index
            );

        }
    );

}


/* =========================================================
   START
   ========================================================= */

loadTemples();