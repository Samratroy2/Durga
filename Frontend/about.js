/* =========================================================
   ROY BARI — ABOUT PAGE
   ========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    db
} from "./firebase.js";


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let idolMakers = [];

let priests = [];

let rituals = [];

let oldPictures = [];

let newspaperArticles = [];

let memories = [];


/* =========================================================
   LIGHTBOX STATE
   ========================================================= */

let lightboxItems = [];

let currentLightboxIndex = 0;

let lastFocusedElement = null;


/* =========================================================
   PAGE START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeAboutPage
);


async function initializeAboutPage() {

    setupLightbox();

    await Promise.allSettled([

        loadIdolMakers(),

        loadPriests(),

        loadRituals(),

        loadOldPictures(),

        loadNewspaperArticles(),

        loadMemories()

    ]);

}


/* =========================================================
   HELPERS
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


function escapeAttribute(value) {

    return escapeHTML(value);

}


/* =========================================================
   GOOGLE DRIVE
   ========================================================= */

/*
   Supported:

   https://drive.google.com/file/d/FILE_ID/view

   https://drive.google.com/open?id=FILE_ID

   https://drive.google.com/uc?id=FILE_ID

   https://drive.google.com/thumbnail?id=FILE_ID
*/


function getDriveFileId(url) {

    if (!url) {

        return "";

    }


    const value =
        String(url).trim();


    /*
     * /file/d/FILE_ID
     */

    let match =
        value.match(
            /drive\.google\.com\/file\/d\/([^/?#]+)/i
        );


    if (match) {

        return match[1];

    }


    /*
     * ?id=FILE_ID
     */

    match =
        value.match(
            /[?&]id=([^&#]+)/i
        );


    if (match) {

        return match[1];

    }


    /*
     * /uc/FILE_ID
     */

    match =
        value.match(
            /drive\.google\.com\/uc\/([^/?#]+)/i
        );


    if (match) {

        return match[1];

    }


    return "";

}


/* =========================================================
   IMAGE URL
   ========================================================= */

function getImageUrl(value) {

    if (!value) {

        return "";

    }


    const url =
        String(value).trim();


    const fileId =
        getDriveFileId(url);


    /*
     * Google Drive
     */

    if (fileId) {

        return (
            "https://drive.google.com/thumbnail" +
            "?id=" +
            encodeURIComponent(fileId) +
            "&sz=w2000"
        );

    }


    /*
     * Normal image URL
     */

    return url;

}


/* =========================================================
   LARGE IMAGE URL
   ========================================================= */

function getLargeImageUrl(value) {

    if (!value) {

        return "";

    }


    const url =
        String(value).trim();


    const fileId =
        getDriveFileId(url);


    /*
     * Google Drive large image.
     */

    if (fileId) {

        return (
            "https://drive.google.com/thumbnail" +
            "?id=" +
            encodeURIComponent(fileId) +
            "&sz=w4000"
        );

    }


    return url;

}


/* =========================================================
   GET FIRST AVAILABLE VALUE
   ========================================================= */

function firstValue(
    object,
    fields
) {

    for (
        const field of fields
    ) {

        if (
            object[field] !== undefined &&
            object[field] !== null &&
            String(object[field]).trim() !== ""
        ) {

            return object[field];

        }

    }


    return "";

}


/* =========================================================
   NUMBER
   ========================================================= */

function getNumber(value) {

    const number =
        Number(value);


    if (
        Number.isFinite(number)
    ) {

        return number;

    }


    return null;

}


/* =========================================================
   DATE
   ========================================================= */

function getDateValue(data) {

    const value =
        firstValue(
            data,
            [
                "date",
                "eventDate",
                "datetime",
                "timestamp"
            ]
        );


    if (!value) {

        return null;

    }


    /*
     * Firebase Firestore Timestamp
     */

    if (
        typeof value.toDate === "function"
    ) {

        return value.toDate();

    }


    /*
     * JavaScript Date
     */

    if (
        value instanceof Date
    ) {

        return value;

    }


    /*
     * Firestore-like object
     */

    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return new Date(
            Number(value.seconds) * 1000
        );

    }


    /*
     * String / number date
     */

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
   FIRESTORE LOADER
   ========================================================= */

async function getCollectionData(
    collectionName
) {

    const snapshot =
        await getDocs(
            collection(
                db,
                collectionName
            )
        );


    const result = [];


    snapshot.forEach(
        item => {

            result.push({

                id: item.id,

                ...item.data()

            });

        }
    );


    return result;

}


/* =========================================================
   =========================================================
   IDOL MAKERS
   =========================================================
   ========================================================= */

async function loadIdolMakers() {

    const feature =
        document.getElementById(
            "idol-maker-feature"
        );


    const gallery =
        document.getElementById(
            "idol-maker-gallery"
        );


    try {

        idolMakers =
            await getCollectionData(
                "idolMakers"
            );


        idolMakers.sort(
            sortByOrder
        );


        renderCurrentIdolMaker();

        renderIdolMakerGallery();

    }

    catch (error) {

        console.error(
            "ROY BARI: Idol maker error:",
            error
        );


        if (feature) {

            feature.innerHTML =
                errorBox(
                    "Unable to load idol maker information.",
                    error
                );

        }


        if (gallery) {

            gallery.innerHTML = "";

        }

    }

}


/* =========================================================
   SORT BY ORDER
   ========================================================= */

function sortByOrder(
    a,
    b
) {

    const orderA =
        getNumber(a.order);


    const orderB =
        getNumber(b.order);


    if (
        orderA !== null &&
        orderB !== null
    ) {

        return orderA - orderB;

    }


    if (
        orderA !== null
    ) {

        return -1;

    }


    if (
        orderB !== null
    ) {

        return 1;

    }


    return 0;

}


/* =========================================================
   CURRENT MAKER
   ========================================================= */

function getCurrentMaker() {

    if (
        idolMakers.length === 0
    ) {

        return null;

    }


    const current =
        idolMakers.find(
            maker =>
                maker.current === true ||
                maker.isCurrent === true ||
                maker.status === "current"
        );


    return current ||
        idolMakers[0];

}


/* =========================================================
   RENDER CURRENT MAKER
   ========================================================= */

function renderCurrentIdolMaker() {

    const maker =
        getCurrentMaker();


    const feature =
        document.getElementById(
            "idol-maker-feature"
        );


    const nameElement =
        document.getElementById(
            "current-maker-name"
        );


    const descriptionElement =
        document.getElementById(
            "current-maker-description"
        );


    const locationElement =
        document.getElementById(
            "current-maker-location"
        );


    if (!maker) {

        if (nameElement) {

            nameElement.textContent =
                "Information coming soon";

        }


        if (descriptionElement) {

            descriptionElement.textContent =
                "Current idol maker information has not been added yet.";

        }


        if (feature) {

            feature.innerHTML = `

                <div class="card">

                    <p class="lead">

                        Current idol maker
                        information will appear here.

                    </p>

                </div>

            `;

        }


        return;

    }


    const name =
        firstValue(
            maker,
            [
                "name",
                "title"
            ]
        ) ||
        "Current Idol Maker";


    const description =
        firstValue(
            maker,
            [
                "description",
                "bio",
                "story"
            ]
        );


    const location =
        firstValue(
            maker,
            [
                "location",
                "place"
            ]
        );


    const role =
        firstValue(
            maker,
            [
                "role"
            ]
        );


    const image =
        firstValue(
            maker,
            [
                "image",
                "photo",
                "imageUrl",
                "url"
            ]
        );


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    if (descriptionElement) {

        descriptionElement.textContent =
            description ||
            "Information about the current idol maker has not been added yet.";

    }


    if (locationElement) {

        locationElement.textContent =
            location
                ? `Based in ${location}`
                : "";

    }


    if (!feature) {

        return;

    }


    const imageHTML =
        image
            ? createImageButtonHTML(
                image,
                name,
                "archive-image"
            )
            : "";


    feature.innerHTML = `

        <article class="card maker-feature-card">

            ${imageHTML}

            <div class="maker-feature-content">

                <div class="small-caps">
                    Current Idol Maker
                </div>


                <h3>
                    ${escapeHTML(name)}
                </h3>


                ${
                    role
                        ? `
                            <div class="small-caps">
                                ${escapeHTML(role)}
                            </div>
                          `
                        : ""
                }


                ${
                    description
                        ? `
                            <p>
                                ${escapeHTML(description)}
                            </p>
                          `
                        : ""
                }


                ${
                    location
                        ? `
                            <p class="small-caps">
                                ${escapeHTML(location)}
                            </p>
                          `
                        : ""
                }

            </div>

        </article>

    `;


    initializeImageButtons(
        feature
    );

}


/* =========================================================
   IDOL MAKER GALLERY
   ========================================================= */

function renderIdolMakerGallery() {

    const gallery =
        document.getElementById(
            "idol-maker-gallery"
        );


    if (!gallery) {

        return;

    }


    const records =
        idolMakers.filter(
            maker =>
                firstValue(
                    maker,
                    [
                        "image",
                        "photo",
                        "imageUrl",
                        "url"
                    ]
                )
        );


    if (
        records.length === 0
    ) {

        gallery.innerHTML = `

            <div class="card">

                <p>
                    Idol maker photographs
                    have not been added yet.
                </p>

            </div>

        `;

        return;

    }


    gallery.innerHTML = "";


    records.forEach(
        maker => {

            const image =
                firstValue(
                    maker,
                    [
                        "image",
                        "photo",
                        "imageUrl",
                        "url"
                    ]
                );


            const name =
                firstValue(
                    maker,
                    [
                        "name",
                        "title"
                    ]
                ) ||
                "Idol Maker";


            const description =
                firstValue(
                    maker,
                    [
                        "caption",
                        "description",
                        "role"
                    ]
                );


            const location =
                firstValue(
                    maker,
                    [
                        "location",
                        "place"
                    ]
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "card maker-gallery-card";


            card.innerHTML = `

                ${createImageButtonHTML(
                    image,
                    name,
                    "archive-image"
                )}


                <h4>
                    ${escapeHTML(name)}
                </h4>


                ${
                    location
                        ? `
                            <div class="small-caps">
                                ${escapeHTML(location)}
                            </div>
                          `
                        : ""
                }


                ${
                    description
                        ? `
                            <p>
                                ${escapeHTML(description)}
                            </p>
                          `
                        : ""
                }

            `;


            gallery.appendChild(
                card
            );

        }
    );


    initializeImageButtons(
        gallery
    );

}


/* =========================================================
   =========================================================
   PRIESTS & PUROHITS
   =========================================================
   ========================================================= */

async function loadPriests() {

    const feature =
        document.getElementById(
            "priest-feature"
        );


    const gallery =
        document.getElementById(
            "priest-gallery"
        );


    try {

        priests =
            await getCollectionData(
                "priests"
            );


        priests.sort(
            sortByOrder
        );


        renderCurrentPriest();

        renderPriestGallery();

    }

    catch (error) {

        console.error(
            "ROY BARI: Priest error:",
            error
        );


        if (feature) {

            feature.innerHTML =
                errorBox(
                    "Unable to load priest information.",
                    error
                );

        }


        if (gallery) {

            gallery.innerHTML = "";

        }

    }

}


/* =========================================================
   CURRENT PRIEST
   ========================================================= */

function getCurrentPriest() {

    if (
        priests.length === 0
    ) {

        return null;

    }


    const current =
        priests.find(
            priest =>
                priest.current === true ||
                priest.isCurrent === true ||
                priest.status === "current"
        );


    return current ||
        priests[0];

}


/* =========================================================
   RENDER CURRENT PRIEST
   ========================================================= */

function renderCurrentPriest() {

    const priest =
        getCurrentPriest();


    const feature =
        document.getElementById(
            "priest-feature"
        );


    const nameElement =
        document.getElementById(
            "current-priest-name"
        );


    const descriptionElement =
        document.getElementById(
            "current-priest-description"
        );


    const locationElement =
        document.getElementById(
            "current-priest-location"
        );


    if (!priest) {

        if (nameElement) {

            nameElement.textContent =
                "Information coming soon";

        }


        if (descriptionElement) {

            descriptionElement.textContent =
                "Current priest information has not been added yet.";

        }


        if (feature) {

            feature.innerHTML = `

                <div class="card">

                    <p class="lead">

                        Current priest
                        information will appear here.

                    </p>

                </div>

            `;

        }


        return;

    }


    const name =
        firstValue(
            priest,
            [
                "name",
                "title"
            ]
        ) ||
        "Current Priest";


    const description =
        firstValue(
            priest,
            [
                "description",
                "bio",
                "story"
            ]
        );


    const location =
        firstValue(
            priest,
            [
                "location",
                "place"
            ]
        );


    const role =
        firstValue(
            priest,
            [
                "role"
            ]
        );


    const image =
        firstValue(
            priest,
            [
                "image",
                "photo",
                "imageUrl",
                "url"
            ]
        );


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    if (descriptionElement) {

        descriptionElement.textContent =
            description ||
            "Information about the current priest has not been added yet.";

    }


    if (locationElement) {

        locationElement.textContent =
            location
                ? `Based in ${location}`
                : "";

    }


    if (!feature) {

        return;

    }


    const imageHTML =
        image
            ? createImageButtonHTML(
                image,
                name,
                "archive-image"
            )
            : "";


    feature.innerHTML = `

        <article class="card maker-feature-card">

            ${imageHTML}

            <div class="maker-feature-content">

                <div class="small-caps">
                    Current Priest
                </div>


                <h3>
                    ${escapeHTML(name)}
                </h3>


                ${
                    role
                        ? `
                            <div class="small-caps">
                                ${escapeHTML(role)}
                            </div>
                          `
                        : ""
                }


                ${
                    description
                        ? `
                            <p>
                                ${escapeHTML(description)}
                            </p>
                          `
                        : ""
                }


                ${
                    location
                        ? `
                            <p class="small-caps">
                                ${escapeHTML(location)}
                            </p>
                          `
                        : ""
                }

            </div>

        </article>

    `;


    initializeImageButtons(
        feature
    );

}


/* =========================================================
   PRIEST GALLERY
   ========================================================= */

function renderPriestGallery() {

    const gallery =
        document.getElementById(
            "priest-gallery"
        );


    if (!gallery) {

        return;

    }


    const records =
        priests.filter(
            priest =>
                firstValue(
                    priest,
                    [
                        "image",
                        "photo",
                        "imageUrl",
                        "url"
                    ]
                )
        );


    if (
        records.length === 0
    ) {

        gallery.innerHTML = `

            <div class="card">

                <p>
                    Priest photographs
                    have not been added yet.
                </p>

            </div>

        `;

        return;

    }


    gallery.innerHTML = "";


    records.forEach(
        priest => {

            const image =
                firstValue(
                    priest,
                    [
                        "image",
                        "photo",
                        "imageUrl",
                        "url"
                    ]
                );


            const name =
                firstValue(
                    priest,
                    [
                        "name",
                        "title"
                    ]
                ) ||
                "Priest";


            const description =
                firstValue(
                    priest,
                    [
                        "caption",
                        "description",
                        "role"
                    ]
                );


            const location =
                firstValue(
                    priest,
                    [
                        "location",
                        "place"
                    ]
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "card maker-gallery-card";


            card.innerHTML = `

                ${createImageButtonHTML(
                    image,
                    name,
                    "archive-image"
                )}


                <h4>
                    ${escapeHTML(name)}
                </h4>


                ${
                    location
                        ? `
                            <div class="small-caps">
                                ${escapeHTML(location)}
                            </div>
                          `
                        : ""
                }


                ${
                    description
                        ? `
                            <p>
                                ${escapeHTML(description)}
                            </p>
                          `
                        : ""
                }

            `;


            gallery.appendChild(
                card
            );

        }
    );


    initializeImageButtons(
        gallery
    );

}


/* =========================================================
   =========================================================
   RITUALS
   =========================================================
   ========================================================= */

async function loadRituals() {

    const container =
        document.getElementById(
            "ritual-accordion"
        );


    if (!container) {

        return;

    }


    try {

        rituals =
            await getCollectionData(
                "rituals"
            );


        rituals.sort(
            sortByOrder
        );


        renderRituals();

    }

    catch (error) {

        console.error(
            "ROY BARI: Ritual error:",
            error
        );


        container.innerHTML =
            errorBox(
                "Unable to load rituals.",
                error
            );

    }

}


/* =========================================================
   RENDER RITUALS
   ========================================================= */

function renderRituals() {

    const container =
        document.getElementById(
            "ritual-accordion"
        );


    if (!container) {

        return;

    }


    if (
        rituals.length === 0
    ) {

        container.innerHTML = `

            <div class="card">

                <p>
                    No ritual information
                    has been added yet.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = "";


    rituals.forEach(
        (
            ritual,
            index
        ) => {

            const title =
                firstValue(
                    ritual,
                    [
                        "title",
                        "name",
                        "ritualName"
                    ]
                ) ||
                `Ritual ${index + 1}`;


            const description =
                firstValue(
                    ritual,
                    [
                        "description",
                        "details",
                        "content"
                    ]
                );


            const day =
                firstValue(
                    ritual,
                    [
                        "day",
                        "tithi",
                        "dayName"
                    ]
                );


            const time =
                firstValue(
                    ritual,
                    [
                        "time",
                        "timing",
                        "timings"
                    ]
                );


            const location =
                firstValue(
                    ritual,
                    [
                        "location",
                        "place"
                    ]
                );


            const category =
                firstValue(
                    ritual,
                    [
                        "category"
                    ]
                ) ||
                "Ritual";


            const date =
                getDateValue(
                    ritual
                );


            const id =
                `ritual-${index}-${escapeAttribute(
                    ritual.id
                )}`;


            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "ritual-item";


            article.innerHTML = `

                <button
                    type="button"
                    class="ritual-toggle"
                    aria-expanded="false"
                    aria-controls="${id}-content"
                >

                    <div class="ritual-heading">

                        <span class="ritual-number">
                            ${String(
                                index + 1
                            ).padStart(
                                2,
                                "0"
                            )}
                        </span>


                        <div>

                            <span class="ritual-category">
                                ${escapeHTML(category)}
                            </span>


                            <h3>
                                ${escapeHTML(title)}
                            </h3>

                        </div>

                    </div>


                    <span class="ritual-icon">
                        +
                    </span>

                </button>


                <div
                    class="ritual-content"
                    id="${id}-content"
                    hidden
                >

                    ${
                        (
                            day ||
                            date ||
                            time ||
                            location
                        )
                            ? `
                                <div class="ritual-meta">

                                    ${
                                        day
                                            ? `
                                                <div>
                                                    <span>Day</span>
                                                    <strong>
                                                        ${escapeHTML(day)}
                                                    </strong>
                                                </div>
                                              `
                                            : ""
                                    }


                                    ${
                                        date
                                            ? `
                                                <div>
                                                    <span>Date</span>
                                                    <strong>
                                                        ${escapeHTML(
                                                            formatDate(date)
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
                                                    <span>Time</span>
                                                    <strong>
                                                        ${escapeHTML(time)}
                                                    </strong>
                                                </div>
                                              `
                                            : ""
                                    }


                                    ${
                                        location
                                            ? `
                                                <div>
                                                    <span>Location</span>
                                                    <strong>
                                                        ${escapeHTML(location)}
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
                                        ${escapeHTML(description)}
                                    </p>

                                </div>
                              `
                            : `
                                <p>
                                    Details for this ritual
                                    have not been added yet.
                                </p>
                              `
                    }

                </div>

            `;


            container.appendChild(
                article
            );

        }
    );


    setupRitualAccordion();

}


/* =========================================================
   RITUAL ACCORDION
   ========================================================= */

function setupRitualAccordion() {

    const container =
        document.getElementById(
            "ritual-accordion"
        );


    if (!container) {

        return;

    }


    const buttons =
        container.querySelectorAll(
            ".ritual-toggle"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const isOpen =
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
                     * Close every item.
                     */

                    buttons.forEach(
                        other => {

                            other.setAttribute(
                                "aria-expanded",
                                "false"
                            );


                            const otherContent =
                                document.getElementById(
                                    other.getAttribute(
                                        "aria-controls"
                                    )
                                );


                            if (
                                otherContent
                            ) {

                                otherContent.hidden =
                                    true;

                            }


                            const icon =
                                other.querySelector(
                                    ".ritual-icon"
                                );


                            if (icon) {

                                icon.textContent =
                                    "+";

                            }

                        }
                    );


                    /*
                     * Open clicked item.
                     */

                    if (!isOpen) {

                        button.setAttribute(
                            "aria-expanded",
                            "true"
                        );


                        content.hidden =
                            false;


                        const icon =
                            button.querySelector(
                                ".ritual-icon"
                            );


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
   =========================================================
   OLD PICTURES
   =========================================================
   ========================================================= */

async function loadOldPictures() {

    const grid =
        document.getElementById(
            "old-photo-grid"
        );


    if (!grid) {

        return;

    }


    try {

        oldPictures =
            await getCollectionData(
                "oldPictures"
            );


        oldPictures.sort(
            (
                a,
                b
            ) => {

                const yearA =
                    getNumber(a.year) ?? 999999;


                const yearB =
                    getNumber(b.year) ?? 999999;


                return yearA - yearB;

            }
        );


        renderOldPictures();

    }

    catch (error) {

        console.error(
            "ROY BARI: Old picture error:",
            error
        );


        grid.innerHTML =
            errorBox(
                "Unable to load old photographs.",
                error
            );

    }

}


/* =========================================================
   RENDER OLD PICTURES
   ========================================================= */
/* =========================================================
   RENDER OLD PICTURES — SLIDESHOW
   ========================================================= */

function renderOldPictures() {

    const container =
        document.getElementById(
            "old-photo-grid"
        );


    if (!container) {

        return;

    }


    const records =
        oldPictures.filter(
            picture =>
                firstValue(
                    picture,
                    [
                        "image",
                        "photo",
                        "imageUrl",
                        "url"
                    ]
                )
        );


    if (records.length === 0) {

        container.innerHTML = `

            <div class="card">

                <p>
                    No old photographs
                    have been added yet.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = `

        <div class="old-album-stage">

            <div
                class="old-album-counter"
                id="old-album-counter"
            >
                1 / ${records.length}
            </div>


            <div
                id="old-album-slides"
                class="old-album-slides"
            ></div>


            <button
                type="button"
                class="old-album-prev"
                id="old-album-prev"
                aria-label="Previous photograph"
            >
                ‹
            </button>


            <button
                type="button"
                class="old-album-next"
                id="old-album-next"
                aria-label="Next photograph"
            >
                ›
            </button>

        </div>


        <div
            class="old-album-dots"
            id="old-album-dots"
            aria-label="Photograph navigation"
        ></div>


        <div
            class="old-album-thumbnails"
            id="old-album-thumbnails"
            aria-label="Photograph thumbnails"
        ></div>

    `;


    const slides =
        document.getElementById(
            "old-album-slides"
        );


    const dots =
        document.getElementById(
            "old-album-dots"
        );


    const thumbnails =
        document.getElementById(
            "old-album-thumbnails"
        );


    records.forEach(
        (picture, index) => {

            const image =
                firstValue(
                    picture,
                    [
                        "image",
                        "photo",
                        "imageUrl",
                        "url"
                    ]
                );


            const title =
                firstValue(
                    picture,
                    [
                        "title",
                        "caption"
                    ]
                ) ||
                "Roy Bari Archive Photograph";


            const description =
                firstValue(
                    picture,
                    [
                        "description",
                        "story"
                    ]
                );


            const category =
                firstValue(
                    picture,
                    [
                        "category"
                    ]
                );


            const year =
                firstValue(
                    picture,
                    [
                        "year"
                    ]
                );


            const thumbnail =
                getImageUrl(image);


            const largeImage =
                getLargeImageUrl(image);


            /* =================================================
               SLIDE
               ================================================= */

            const slide =
                document.createElement(
                    "article"
                );


            slide.className =
                "old-album-slide";


            if (index === 0) {

                slide.classList.add(
                    "active"
                );

            }


            slide.dataset.index =
                String(index);


            slide.innerHTML = `

                <button
                    type="button"
                    class="old-album-image-button"
                    data-lightbox-image="${escapeAttribute(
                        largeImage
                    )}"
                    data-lightbox-alt="${escapeAttribute(
                        title
                    )}"
                    aria-label="Open photograph in full screen"
                >

                    <div class="old-album-image-wrap">

                        <img
                            src="${escapeAttribute(
                                thumbnail
                            )}"
                            alt="${escapeAttribute(
                                title
                            )}"
                            class="old-album-image"
                            loading="${
                                index === 0
                                    ? "eager"
                                    : "lazy"
                            }"
                            decoding="async"
                        >

                    </div>

                </button>


                <div class="old-album-caption">

                    ${
                        year
                            ? `
                                <div class="old-album-year">
                                    ${escapeHTML(year)}
                                </div>
                              `
                            : ""
                    }


                    <h3>
                        ${escapeHTML(title)}
                    </h3>


                    ${
                        description
                            ? `
                                <p>
                                    ${escapeHTML(
                                        description
                                    )}
                                </p>
                              `
                            : ""
                    }


                    ${
                        category
                            ? `
                                <div class="small-caps old-album-category">
                                    ${escapeHTML(
                                        category
                                    )}
                                </div>
                              `
                            : ""
                    }

                </div>

            `;


            slides.appendChild(
                slide
            );


            /* =================================================
               DOT
               ================================================= */

            const dot =
                document.createElement(
                    "button"
                );


            dot.type =
                "button";


            dot.className =
                "old-album-dot";


            if (index === 0) {

                dot.classList.add(
                    "active"
                );

            }


            dot.dataset.index =
                String(index);


            dot.setAttribute(
                "aria-label",
                `Go to photograph ${index + 1}`
            );


            dots.appendChild(
                dot
            );


            /* =================================================
               THUMBNAIL
               ================================================= */

            const thumbnailButton =
                document.createElement(
                    "button"
                );


            thumbnailButton.type =
                "button";


            thumbnailButton.className =
                "old-album-thumbnail";


            if (index === 0) {

                thumbnailButton.classList.add(
                    "active"
                );

            }


            thumbnailButton.dataset.index =
                String(index);


            thumbnailButton.setAttribute(
                "aria-label",
                `Show ${title}`
            );


            thumbnailButton.innerHTML = `

                <img
                    src="${escapeAttribute(
                        thumbnail
                    )}"
                    alt="${escapeAttribute(
                        title
                    )}"
                    loading="lazy"
                    decoding="async"
                >

            `;


            thumbnails.appendChild(
                thumbnailButton
            );

        }
    );


    let currentIndex = 0;


    let autoSlideTimer = null;


    function showSlide(
        index,
        resetTimer = true
    ) {

        if (
            records.length === 0
        ) {

            return;

        }


        if (
            index < 0
        ) {

            index =
                records.length - 1;

        }


        if (
            index >= records.length
        ) {

            index = 0;

        }


        currentIndex =
            index;


        const allSlides =
            slides.querySelectorAll(
                ".old-album-slide"
            );


        allSlides.forEach(
            (slide, slideIndex) => {

                slide.classList.toggle(
                    "active",
                    slideIndex === currentIndex
                );

            }
        );


        const allDots =
            dots.querySelectorAll(
                ".old-album-dot"
            );


        allDots.forEach(
            (dot, dotIndex) => {

                dot.classList.toggle(
                    "active",
                    dotIndex === currentIndex
                );

            }
        );


        const allThumbnails =
            thumbnails.querySelectorAll(
                ".old-album-thumbnail"
            );


        allThumbnails.forEach(
            (
                thumbnail,
                thumbnailIndex
            ) => {

                thumbnail.classList.toggle(
                    "active",
                    thumbnailIndex === currentIndex
                );

            }
        );


        const counter =
            document.getElementById(
                "old-album-counter"
            );


        if (counter) {

            counter.textContent =
                `${currentIndex + 1} / ${records.length}`;

        }


        const activeThumbnail =
            thumbnails.querySelector(
                `.old-album-thumbnail[data-index="${currentIndex}"]`
            );


        if (
            activeThumbnail &&
            window.innerWidth <= 700
        ) {

            activeThumbnail.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });

        }


        if (resetTimer) {

            startAutoSlide();

        }

    }


    function startAutoSlide() {

        clearInterval(
            autoSlideTimer
        );


        if (
            records.length <= 1
        ) {

            return;

        }


        autoSlideTimer =
            setInterval(
                () => {

                    showSlide(
                        currentIndex + 1,
                        false
                    );

                },
                5000
            );

    }


    function stopAutoSlide() {

        clearInterval(
            autoSlideTimer
        );

    }


    const previous =
        document.getElementById(
            "old-album-prev"
        );


    const next =
        document.getElementById(
            "old-album-next"
        );


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                showSlide(
                    currentIndex - 1
                );

            }
        );

    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

                showSlide(
                    currentIndex + 1
                );

            }
        );

    }


    dots.querySelectorAll(
        ".old-album-dot"
    ).forEach(
        dot => {

            dot.addEventListener(
                "click",
                () => {

                    showSlide(
                        Number(
                            dot.dataset.index
                        )
                    );

                }
            );

        }
    );


    thumbnails.querySelectorAll(
        ".old-album-thumbnail"
    ).forEach(
        thumbnail => {

            thumbnail.addEventListener(
                "click",
                () => {

                    showSlide(
                        Number(
                            thumbnail.dataset.index
                        )
                    );

                }
            );

        }
    );


    /* =================================================
       PAUSE WHILE HOVERING
       ================================================= */

    container.addEventListener(
        "mouseenter",
        stopAutoSlide
    );


    container.addEventListener(
        "mouseleave",
        startAutoSlide
    );


    /* =================================================
       TOUCH / SWIPE
       ================================================= */

    let touchStartX = 0;


    let touchEndX = 0;


    slides.addEventListener(
        "touchstart",
        event => {

            touchStartX =
                event.changedTouches[0].screenX;

        },
        {
            passive: true
        }
    );


    slides.addEventListener(
        "touchend",
        event => {

            touchEndX =
                event.changedTouches[0].screenX;


            const difference =
                touchStartX -
                touchEndX;


            if (
                Math.abs(difference) < 50
            ) {

                return;

            }


            if (
                difference > 0
            ) {

                showSlide(
                    currentIndex + 1
                );

            }
            else {

                showSlide(
                    currentIndex - 1
                );

            }

        },
        {
            passive: true
        }
    );


    /* =================================================
       LIGHTBOX
       ================================================= */

    initializeImageButtons(
        slides
    );


    showSlide(
        0,
        false
    );


    startAutoSlide();

}


/* =========================================================
   =========================================================
   NEWSPAPER ARTICLES
   =========================================================
   ========================================================= */

async function loadNewspaperArticles() {

    const grid =
        document.getElementById(
            "newspaper-grid"
        );


    if (!grid) {

        console.error(
            "ROY BARI: #newspaper-grid not found."
        );

        return;

    }


    try {

        newspaperArticles =
            await getCollectionData(
                "newspaperArticles"
            );


        /*
         * Sort newest first.
         *
         * Firestore Timestamp is supported.
         */

        newspaperArticles.sort(
            (a, b) => {

                const dateA =
                    getDateValue(a);

                const dateB =
                    getDateValue(b);


                if (
                    dateA &&
                    dateB
                ) {

                    return (
                        dateB.getTime() -
                        dateA.getTime()
                    );

                }


                if (dateA) {

                    return -1;

                }


                if (dateB) {

                    return 1;

                }


                /*
                 * Fallback for records
                 * containing only year.
                 */

                const yearA =
                    getNumber(a.year);

                const yearB =
                    getNumber(b.year);


                if (
                    yearA !== null &&
                    yearB !== null
                ) {

                    return yearB - yearA;

                }


                return 0;

            }
        );


        renderNewspaperArticles();

    }

    catch (error) {

        console.error(
            "ROY BARI: Newspaper error:",
            error
        );


        grid.innerHTML =
            errorBox(
                "Unable to load newspaper articles.",
                error
            );

    }

}


/* =========================================================
   RENDER NEWSPAPER ARTICLES
   ========================================================= */

function renderNewspaperArticles() {

    const grid =
        document.getElementById(
            "newspaper-grid"
        );


    if (!grid) {

        return;

    }


    if (
        newspaperArticles.length === 0
    ) {

        grid.innerHTML = `

            <div class="card">

                <p>
                    No newspaper articles
                    have been added yet.
                </p>

            </div>

        `;

        return;

    }


    grid.innerHTML = "";


    newspaperArticles.forEach(
        article => {

            const image =
                firstValue(
                    article,
                    [
                        "image",
                        "photo",
                        "imageUrl",
                        "url"
                    ]
                );


            const title =
                firstValue(
                    article,
                    [
                        "title"
                    ]
                ) ||
                "Roy Bari Durga Puja";


            const headline =
                firstValue(
                    article,
                    [
                        "headline",
                        "description"
                    ]
                );


            const newspaper =
                firstValue(
                    article,
                    [
                        "newspaper",
                        "publication"
                    ]
                );


            const page =
                firstValue(
                    article,
                    [
                        "page"
                    ]
                );


            const articleDate =
                getDateValue(
                    article
                );


            const displayDate =
                articleDate
                    ? formatDate(
                        articleDate
                    )
                    : firstValue(
                        article,
                        [
                            "dateText",
                            "displayDate"
                        ]
                    );


            let year =
                firstValue(
                    article,
                    [
                        "year"
                    ]
                );


            if (
                !year &&
                articleDate
            ) {

                year =
                    articleDate.getFullYear();

            }


            const source =
                firstValue(
                    article,
                    [
                        "source"
                    ]
                );


            const sourceUrl =
                firstValue(
                    article,
                    [
                        "sourceUrl",
                        "articleUrl",
                        "link"
                    ]
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "newspaper-card";


            const imageHTML =
                image
                    ? createImageButtonHTML(
                        image,
                        title,
                        "newspaper-image"
                    )
                    : `
                        <div class="newspaper-no-image">
                            Newspaper Archive
                        </div>
                    `;


            card.innerHTML = `

                ${imageHTML}


                <div class="newspaper-content">


                    ${
                        newspaper
                            ? `
                                <div class="small-caps">

                                    ${escapeHTML(
                                        newspaper
                                    )}

                                </div>
                              `
                            : ""
                    }


                    <h3>

                        ${escapeHTML(
                            title
                        )}

                    </h3>


                    ${
                        headline
                            ? `
                                <p>

                                    ${escapeHTML(
                                        headline
                                    )}

                                </p>
                              `
                            : ""
                    }


                    <div class="newspaper-meta">


                        ${
                            year
                                ? `
                                    <span>

                                        ${escapeHTML(
                                            year
                                        )}

                                    </span>
                                  `
                                : ""
                        }


                        ${
                            displayDate
                                ? `
                                    <span>

                                        ${escapeHTML(
                                            displayDate
                                        )}

                                    </span>
                                  `
                                : ""
                        }


                        ${
                            page
                                ? `
                                    <span>

                                        Page
                                        ${escapeHTML(
                                            page
                                        )}

                                    </span>
                                  `
                                : ""
                        }


                        ${
                            source
                                ? `
                                    <span>

                                        ${escapeHTML(
                                            source
                                        )}

                                    </span>
                                  `
                                : ""
                        }


                    </div>


                    ${
                        sourceUrl
                            ? `
                                <a
                                    href="${escapeAttribute(
                                        sourceUrl
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="newspaper-source-link"
                                >

                                    View Source

                                </a>
                              `
                            : ""
                    }


                </div>

            `;


            grid.appendChild(
                card
            );

        }
    );


    initializeImageButtons(
        grid
    );

}


/* =========================================================
   =========================================================
   MEMORIES
   =========================================================
   ========================================================= */

async function loadMemories() {

    const grid =
        document.getElementById(
            "memory-grid"
        );


    if (!grid) {

        return;

    }


    try {

        memories =
            await getCollectionData(
                "memories"
            );


        memories.sort(
            (
                a,
                b
            ) => {

                const yearA =
                    getNumber(a.year) ?? 999999;


                const yearB =
                    getNumber(b.year) ?? 999999;


                return yearA - yearB;

            }
        );


        renderMemories();

    }

    catch (error) {

        console.error(
            "ROY BARI: Memory error:",
            error
        );


        grid.innerHTML =
            errorBox(
                "Unable to load family memories.",
                error
            );

    }

}


/* =========================================================
   RENDER MEMORIES
   ========================================================= */

function renderMemories() {

    const grid =
        document.getElementById(
            "memory-grid"
        );


    if (!grid) {

        return;

    }


    if (
        memories.length === 0
    ) {

        grid.innerHTML = `

            <div class="card">

                <p>
                    No family memories
                    have been added yet.
                </p>

            </div>

        `;

        return;

    }


    grid.innerHTML = "";


    memories.forEach(
        memory => {

            const title =
                firstValue(
                    memory,
                    [
                        "title",
                        "name"
                    ]
                ) ||
                "Family Memory";


            const text =
                firstValue(
                    memory,
                    [
                        "quote",
                        "description",
                        "story",
                        "content"
                    ]
                );


            const person =
                firstValue(
                    memory,
                    [
                        "person",
                        "author"
                    ]
                );


            const category =
                firstValue(
                    memory,
                    [
                        "category"
                    ]
                );


            const year =
                firstValue(
                    memory,
                    [
                        "year"
                    ]
                );


            const image =
                firstValue(
                    memory,
                    [
                        "image",
                        "photo",
                        "imageUrl"
                    ]
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "card memory-card";


            card.innerHTML = `

                ${
                    image
                        ? createImageButtonHTML(
                            image,
                            title,
                            "archive-image"
                        )
                        : ""
                }


                ${
                    year
                        ? `
                            <div class="num">
                                ${escapeHTML(year)}
                            </div>
                          `
                        : ""
                }


                ${
                    category
                        ? `
                            <div class="small-caps">
                                ${escapeHTML(category)}
                            </div>
                          `
                        : ""
                }


                <h4>
                    ${escapeHTML(title)}
                </h4>


                ${
                    text
                        ? `
                            <p>
                                “${escapeHTML(text)}”
                            </p>
                          `
                        : ""
                }


                ${
                    person
                        ? `
                            <div class="small-caps">
                                — ${escapeHTML(person)}
                            </div>
                          `
                        : ""
                }

            `;


            grid.appendChild(
                card
            );

        }
    );


    initializeImageButtons(
        grid
    );

}


/* =========================================================
   IMAGE BUTTON HTML
   ========================================================= */

function createImageButtonHTML(
    image,
    alt,
    imageClass
) {

    const thumbnail =
        getImageUrl(image);


    const large =
        getLargeImageUrl(image);


    if (!thumbnail) {

        return "";

    }


    return `

        <button
            type="button"
            class="about-image-button"
            data-lightbox-image="${escapeAttribute(large)}"
            data-lightbox-alt="${escapeAttribute(alt)}"
            aria-label="Open full image"
        >

            <div class="archive-image-wrap">

                <img
                    src="${escapeAttribute(thumbnail)}"
                    alt="${escapeAttribute(alt)}"
                    class="${escapeAttribute(imageClass)}"
                    loading="lazy"
                    decoding="async"
                >

            </div>

        </button>

    `;

}


/* =========================================================
   IMAGE BUTTON EVENTS
   ========================================================= */

function initializeImageButtons(
    container
) {

    if (!container) {

        return;

    }


    const buttons =
        container.querySelectorAll(
            ".about-image-button"
        );


    buttons.forEach(
        button => {

            if (
                button.dataset.ready === "true"
            ) {

                return;

            }


            button.dataset.ready =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const image =
                        button.getAttribute(
                            "data-lightbox-image"
                        );


                    const alt =
                        button.getAttribute(
                            "data-lightbox-alt"
                        ) ||
                        "";


                    if (!image) {

                        return;

                    }


                    openLightbox(
                        image,
                        alt
                    );

                }
            );

        }
    );

}


/* =========================================================
   =========================================================
   LIGHTBOX
   =========================================================
   ========================================================= */

function setupLightbox() {

    const lightbox =
        document.getElementById(
            "about-lightbox"
        );


    const close =
        document.getElementById(
            "about-lightbox-close"
        );


    const backdrop =
        document.getElementById(
            "about-lightbox-backdrop"
        );


    const previous =
        document.getElementById(
            "about-lightbox-prev"
        );


    const next =
        document.getElementById(
            "about-lightbox-next"
        );


    if (!lightbox) {

        console.error(
            "ROY BARI: Lightbox element missing."
        );

        return;

    }


    if (close) {

        close.addEventListener(
            "click",
            closeLightbox
        );

    }


    if (backdrop) {

        backdrop.addEventListener(
            "click",
            closeLightbox
        );

    }


    if (previous) {

        previous.addEventListener(
            "click",
            () => {

                showLightboxImage(
                    currentLightboxIndex - 1
                );

            }
        );

    }


    if (next) {

        next.addEventListener(
            "click",
            () => {

                showLightboxImage(
                    currentLightboxIndex + 1
                );

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                !lightbox.classList.contains(
                    "is-open"
                )
            ) {

                return;

            }


            if (
                event.key === "Escape"
            ) {

                event.preventDefault();

                closeLightbox();

            }


            if (
                event.key === "ArrowLeft"
            ) {

                event.preventDefault();

                showLightboxImage(
                    currentLightboxIndex - 1
                );

            }


            if (
                event.key === "ArrowRight"
            ) {

                event.preventDefault();

                showLightboxImage(
                    currentLightboxIndex + 1
                );

            }

        }
    );

}


/* =========================================================
   OPEN LIGHTBOX
   ========================================================= */

function openLightbox(
    image,
    alt
) {

    const lightbox =
        document.getElementById(
            "about-lightbox"
        );


    if (!lightbox) {

        return;

    }


    /*
     * Remember clicked element.
     */

    lastFocusedElement =
        document.activeElement;


    /*
     * Collect every image currently
     * available on the page.
     */

    const buttons =
        Array.from(
            document.querySelectorAll(
                ".about-image-button[data-lightbox-image]"
            )
        );


    lightboxItems =
        buttons.map(
            button => ({

                src:
                    button.getAttribute(
                        "data-lightbox-image"
                    ),

                alt:
                    button.getAttribute(
                        "data-lightbox-alt"
                    ) || ""

            })
        );


    /*
     * Find clicked image.
     */

    currentLightboxIndex =
        lightboxItems.findIndex(
            item =>
                item.src === image &&
                item.alt === alt
        );


    /*
     * If not found, create one.
     */

    if (
        currentLightboxIndex < 0
    ) {

        lightboxItems = [

            {
                src: image,
                alt: alt
            }

        ];

        currentLightboxIndex = 0;

    }


    showLightboxImage(
        currentLightboxIndex
    );


    lightbox.classList.add(
        "is-open"
    );


    lightbox.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "about-lightbox-open"
    );


    /*
     * Focus close button AFTER opening.
     */

    const close =
        document.getElementById(
            "about-lightbox-close"
        );


    if (close) {

        requestAnimationFrame(
            () => {

                close.focus();

            }
        );

    }

}


/* =========================================================
   SHOW LIGHTBOX IMAGE
   ========================================================= */

function showLightboxImage(
    index
) {

    if (
        lightboxItems.length === 0
    ) {

        return;

    }


    /*
     * Circular navigation.
     */

    if (
        index < 0
    ) {

        index =
            lightboxItems.length - 1;

    }


    if (
        index >= lightboxItems.length
    ) {

        index = 0;

    }


    currentLightboxIndex =
        index;


    const item =
        lightboxItems[
            currentLightboxIndex
        ];


    const image =
        document.getElementById(
            "about-lightbox-image"
        );


    const caption =
        document.getElementById(
            "about-lightbox-caption"
        );


    const previous =
        document.getElementById(
            "about-lightbox-prev"
        );


    const next =
        document.getElementById(
            "about-lightbox-next"
        );


    if (image) {

        image.src =
            item.src;


        image.alt =
            item.alt || "";

    }


    if (caption) {

        caption.textContent =
            item.alt || "";

    }


    const multiple =
        lightboxItems.length > 1;


    if (previous) {

        previous.hidden =
            !multiple;

    }


    if (next) {

        next.hidden =
            !multiple;

    }

}


/* =========================================================
   CLOSE LIGHTBOX
   ========================================================= */

function closeLightbox() {

    const lightbox =
        document.getElementById(
            "about-lightbox"
        );


    if (!lightbox) {

        return;

    }


    /*
     * Remove focus BEFORE aria-hidden=true.
     *
     * This prevents the Chrome warning:
     *
     * "Blocked aria-hidden on an element because
     * its descendant retained focus."
     */

    if (
        lightbox.contains(
            document.activeElement
        )
    ) {

        document.activeElement.blur();

    }


    lightbox.classList.remove(
        "is-open"
    );


    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "about-lightbox-open"
    );


    const image =
        document.getElementById(
            "about-lightbox-image"
        );


    const caption =
        document.getElementById(
            "about-lightbox-caption"
        );


    if (image) {

        image.removeAttribute(
            "src"
        );


        image.alt = "";

    }


    if (caption) {

        caption.textContent = "";

    }


    lightboxItems = [];

    currentLightboxIndex = 0;


    /*
     * Return focus to the image button
     * that opened the lightbox.
     */

    if (
        lastFocusedElement &&
        document.contains(
            lastFocusedElement
        )
    ) {

        requestAnimationFrame(
            () => {

                try {

                    lastFocusedElement.focus();

                }

                catch (_) {}

            }
        );

    }


    lastFocusedElement =
        null;

}


/* =========================================================
   ERROR BOX
   ========================================================= */

function errorBox(
    message,
    error
) {

    return `

        <div class="card">

            <h3>
                ${escapeHTML(message)}
            </h3>

            <p>

                ${
                    error &&
                    error.message
                        ? escapeHTML(
                            error.message
                        )
                        : "Please try again later."
                }

            </p>

        </div>

    `;

}


/* =========================================================
   IMAGE ERROR DEBUGGING
   ========================================================= */

document.addEventListener(
    "error",
    event => {

        const target =
            event.target;


        if (
            target &&
            target.tagName === "IMG"
        ) {

            console.warn(
                "ROY BARI: Image failed:",
                target.src
            );

        }

    },
    true
);


/* =========================================================
   GLOBAL DEBUG
   ========================================================= */

window.royBariAbout = {

    getGoogleDriveFileId:
        getDriveFileId,

    getImageUrl:
        getImageUrl,

    getLargeImageUrl:
        getLargeImageUrl,

    closeLightbox:
        closeLightbox

};