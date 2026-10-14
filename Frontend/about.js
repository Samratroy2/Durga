/* =========================================================
   ROY BARI — ABOUT PAGE
   ========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { db } from "./firebase.js";


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

document.addEventListener("DOMContentLoaded", initializeAboutPage);

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

    if (value === null || value === undefined) {
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

   Supported:
   https://drive.google.com/file/d/FILE_ID/view
   https://drive.google.com/open?id=FILE_ID
   https://drive.google.com/uc?id=FILE_ID
   https://drive.google.com/thumbnail?id=FILE_ID
   ========================================================= */

function getDriveFileId(url) {

    if (!url) {
        return "";
    }

    const value = String(url).trim();

    // /file/d/FILE_ID
    let match = value.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);

    if (match) {
        return match[1];
    }

    // ?id=FILE_ID
    match = value.match(/[?&]id=([^&#]+)/i);

    if (match) {
        return match[1];
    }

    // /uc/FILE_ID
    match = value.match(/drive\.google\.com\/uc\/([^/?#]+)/i);

    if (match) {
        return match[1];
    }

    return "";

}

function getImageUrl(value) {

    if (!value) {
        return "";
    }

    const url = String(value).trim();
    const fileId = getDriveFileId(url);

    if (fileId) {
        return (
            "https://drive.google.com/thumbnail" +
            "?id=" + encodeURIComponent(fileId) +
            "&sz=w2000"
        );
    }

    return url;

}

function getLargeImageUrl(value) {

    if (!value) {
        return "";
    }

    const url = String(value).trim();
    const fileId = getDriveFileId(url);

    if (fileId) {
        return (
            "https://drive.google.com/thumbnail" +
            "?id=" + encodeURIComponent(fileId) +
            "&sz=w4000"
        );
    }

    return url;

}


/* =========================================================
   VALUE HELPERS
   ========================================================= */

function firstValue(object, fields) {

    for (const field of fields) {

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

function getNumber(value) {

    const number = Number(value);

    if (Number.isFinite(number)) {
        return number;
    }

    return null;

}

function getDateValue(data) {

    const value = firstValue(
        data,
        ["date", "eventDate", "datetime", "timestamp"]
    );

    if (!value) {
        return null;
    }

    // Firebase Firestore Timestamp
    if (typeof value.toDate === "function") {
        return value.toDate();
    }

    // JavaScript Date
    if (value instanceof Date) {
        return value;
    }

    // Firestore-like object
    if (typeof value === "object" && value.seconds !== undefined) {
        return new Date(Number(value.seconds) * 1000);
    }

    // String / number date
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;

}

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

async function getCollectionData(collectionName) {

    const snapshot = await getDocs(
        collection(db, collectionName)
    );

    const result = [];

    snapshot.forEach(item => {
        result.push({
            id: item.id,
            ...item.data()
        });
    });

    return result;

}

function sortByOrder(a, b) {

    const orderA = getNumber(a.order);
    const orderB = getNumber(b.order);

    if (orderA !== null && orderB !== null) {
        return orderA - orderB;
    }

    if (orderA !== null) {
        return -1;
    }

    if (orderB !== null) {
        return 1;
    }

    return 0;

}

const IMAGE_FIELDS = ["image", "photo", "imageUrl", "url"];


/* =========================================================
   =========================================================
   CURRENT PERSON + GALLERY
   (shared by Idol Makers and Priests)
   =========================================================
   ========================================================= */

function getCurrentRecord(records) {

    if (records.length === 0) {
        return null;
    }

    const current = records.find(
        record =>
            record.current === true ||
            record.isCurrent === true ||
            record.status === "current"
    );

    return current || records[0];

}

/*
   config:
   featureId, nameId, descriptionId, locationId,
   defaultName, label, emptyDescription, filledFallback,
   emptyFeatureText
*/

function renderCurrentPerson(record, config) {

    const feature = document.getElementById(config.featureId);
    const nameElement = document.getElementById(config.nameId);
    const descriptionElement = document.getElementById(config.descriptionId);
    const locationElement = document.getElementById(config.locationId);

    if (!record) {

        if (nameElement) {
            nameElement.textContent = "Information coming soon";
        }

        if (descriptionElement) {
            descriptionElement.textContent = config.emptyDescription;
        }

        if (feature) {
            feature.innerHTML = `
                <div class="card">
                    <p class="lead">
                        ${escapeHTML(config.emptyFeatureText)}
                    </p>
                </div>
            `;
        }

        return;

    }

    const name =
        firstValue(record, ["name", "title"]) ||
        config.defaultName;

    const description =
        firstValue(record, ["description", "bio", "story"]);

    const location =
        firstValue(record, ["location", "place"]);

    const role =
        firstValue(record, ["role"]);

    const image =
        firstValue(record, IMAGE_FIELDS);

    if (nameElement) {
        nameElement.textContent = name;
    }

    if (descriptionElement) {
        descriptionElement.textContent =
            description || config.filledFallback;
    }

    if (locationElement) {
        locationElement.textContent =
            location ? `Based in ${location}` : "";
    }

    if (!feature) {
        return;
    }

    const imageHTML = image
        ? createImageButtonHTML(image, name, "archive-image")
        : "";

    feature.innerHTML = `

        <article class="card maker-feature-card">

            ${imageHTML}

            <div class="maker-feature-content">

                <div class="small-caps">
                    ${escapeHTML(config.label)}
                </div>

                <h3>
                    ${escapeHTML(name)}
                </h3>

                ${
                    role
                        ? `<div class="small-caps">${escapeHTML(role)}</div>`
                        : ""
                }

                ${
                    description
                        ? `<p>${escapeHTML(description)}</p>`
                        : ""
                }

                ${
                    location
                        ? `<p class="small-caps">${escapeHTML(location)}</p>`
                        : ""
                }

            </div>

        </article>

    `;

    initializeImageButtons(feature);

}


function renderPersonGallery(
    allRecords,
    galleryId,
    defaultName,
    emptyText,
    options = {}
) {
    const gallery = document.getElementById(galleryId);

    if (!gallery) {
        return;
    }

    let records = allRecords.filter(
        record => firstValue(record, IMAGE_FIELDS)
    );

    // Sort by year only when requested by the gallery.
    if (options.sortByYear) {
        records.sort((a, b) => {
            const yearA = getGalleryYear(a);
            const yearB = getGalleryYear(b);

            // Records with no year appear last.
            if (yearA === null && yearB !== null) return 1;
            if (yearA !== null && yearB === null) return -1;

            // Chronological order: oldest to newest.
            if (yearA !== null && yearB !== null) {
                if (yearA !== yearB) {
                    return yearA - yearB;
                }
            }

            // Preserve the existing order as a tie-breaker.
            return sortByOrder(a, b);
        });
    }

    if (records.length === 0) {
        gallery.innerHTML = `
            <div class="card">
                <p>${escapeHTML(emptyText)}</p>
            </div>
        `;
        return;
    }

    gallery.innerHTML = "";

    records.forEach(record => {
        const image = firstValue(record, IMAGE_FIELDS);

        const name =
            firstValue(record, ["name", "title"]) ||
            defaultName;

        const description = firstValue(
            record,
            ["caption", "description", "role"]
        );

        const location = firstValue(
            record,
            ["location", "place"]
        );

        const year = options.showYear
            ? getGalleryYear(record)
            : null;

        const card = document.createElement("article");
        card.className = "card maker-gallery-card";

        card.innerHTML = `
            ${createImageButtonHTML(image, name, "archive-image")}

            <h4>${escapeHTML(name)}</h4>

            ${
                year !== null
                    ? `<div class="old-album-year">
                           ${escapeHTML(year)}
                       </div>`
                    : ""
            }

            ${
                location
                    ? `<div class="small-caps">
                           ${escapeHTML(location)}
                       </div>`
                    : ""
            }

            ${
                description
                    ? `<p>${escapeHTML(description)}</p>`
                    : ""
            }
        `;

        gallery.appendChild(card);
    });

    initializeImageButtons(gallery);
}

// Get a record's year from its year field or date.

function getGalleryYear(record) {
    // First, try a dedicated year field.
    const rawYear = firstValue(record, ["year"]);

    if (rawYear !== "") {
        const match = String(rawYear).match(/\b\d{4}\b/);

        if (match) {
            return Number(match[0]);
        }
    }

    // Next, check common fields that may contain
    // ranges such as "1980-2015" or "2019–Current".
    const yearRange = firstValue(record, [
        "period",
        "years",
        "duration",
        "tenure",
        "activeYears",
        "yearRange",
        "dateRange",
        "servicePeriod",
        "description"
    ]);

    if (yearRange !== "") {
        const match = String(yearRange).match(/\b\d{4}\b/);

        if (match) {
            return Number(match[0]);
        }
    }

    // Finally, derive the year from a date field.
    const date = getDateValue(record);

    if (date) {
        return date.getFullYear();
    }

    return null;
}


/* =========================================================
   IDOL MAKERS
   ========================================================= */

async function loadIdolMakers() {

    const feature = document.getElementById("idol-maker-feature");
    const gallery = document.getElementById("idol-maker-gallery");

    try {

        idolMakers = await getCollectionData("idolMakers");

        idolMakers.sort(sortByOrder);

        renderCurrentIdolMaker();
        renderIdolMakerGallery();

    }

    catch (error) {

        console.error("ROY BARI: Idol maker error:", error);

        if (feature) {
            feature.innerHTML = errorBox(
                "Unable to load idol maker information.",
                error
            );
        }

        if (gallery) {
            gallery.innerHTML = "";
        }

    }

}

function getCurrentMaker() {
    return getCurrentRecord(idolMakers);
}

function renderCurrentIdolMaker() {

    renderCurrentPerson(
        getCurrentMaker(),
        {
            featureId: "idol-maker-feature",
            nameId: "current-maker-name",
            descriptionId: "current-maker-description",
            locationId: "current-maker-location",
            defaultName: "Current Idol Maker",
            label: "Current Idol Maker",
            emptyDescription:
                "Current idol maker information has not been added yet.",
            filledFallback:
                "Information about the current idol maker has not been added yet.",
            emptyFeatureText:
                "Current idol maker information will appear here."
        }
    );

}

function renderIdolMakerGallery() {

    renderPersonGallery(
        idolMakers,
        "idol-maker-gallery",
        "Idol Maker",
        "Idol maker photographs have not been added yet."
    );

}


/* =========================================================
   PRIESTS & PUROHITS
   ========================================================= */

async function loadPriests() {

    const feature = document.getElementById("priest-feature");
    const gallery = document.getElementById("priest-gallery");

    try {

        priests = await getCollectionData("priests");

        priests.sort(sortByOrder);

        renderCurrentPriests();
        renderPriestGallery();

    }

    catch (error) {

        console.error("ROY BARI: Priest error:", error);

        if (feature) {
            feature.innerHTML = errorBox(
                "Unable to load priest information.",
                error
            );
        }

        if (gallery) {
            gallery.innerHTML = "";
        }

    }

}

function getCurrentPriests() {
    return priests
        .filter(priest =>
            priest.current === true ||
            priest.isCurrent === true ||
            priest.status === "current"
        )
        .sort(sortByOrder)
        .slice(0, 2);
}


function renderCurrentPriests() {
    const feature = document.getElementById("priest-feature");

    if (!feature) {
        console.error('ROY BARI: #priest-feature not found.');
        return;
    }

    const currentPriests = getCurrentPriests();

    if (currentPriests.length === 0) {
        feature.innerHTML = `
            <div class="card">
                <p class="lead">
                    Current priest information will appear here.
                </p>
            </div>
        `;
        return;
    }

    feature.innerHTML = `
        <div class="priest-current-grid">
            ${currentPriests.map(priest => {
                const name =
                    firstValue(priest, ["name", "title"]) ||
                    "Current Priest";

                const description =
                    firstValue(priest, ["description", "bio", "story"]);

                const location =
                    firstValue(priest, ["location", "place"]);

                const role =
                    firstValue(priest, ["role"]);

                const image =
                    firstValue(priest, IMAGE_FIELDS);

                const imageHTML = image
                    ? createImageButtonHTML(image, name, "archive-image")
                    : "";

                return `
                    <article class="card maker-feature-card priest-current-card">
                        ${imageHTML}

                        <div class="maker-feature-content">
                            <div class="small-caps">
                                Current Priest
                            </div>

                            <h3>${escapeHTML(name)}</h3>

                            ${role ? `
                                <div class="small-caps">
                                    ${escapeHTML(role)}
                                </div>
                            ` : ""}

                            ${description ? `
                                <p>${escapeHTML(description)}</p>
                            ` : ""}

                            ${location ? `
                                <p class="small-caps">
                                    ${escapeHTML(location)}
                                </p>
                            ` : ""}
                        </div>
                    </article>
                `;
            }).join("")}
        </div>
    `;

    initializeImageButtons(feature);
}


/* =========================================================
   PRIESTS & CEREMONIAL MOMENTS — SLIDESHOW
   Chronological order: oldest year to newest
   ========================================================= */

let priestSlideshowTimer = null;
let priestSlideshowIndex = 0;
let priestSlideshowPaused = false;

function renderPriestGallery() {
    const gallery = document.getElementById("priest-gallery");

    if (!gallery) return;

    // Sort by starting year, preserving original order for ties.
    const records = priests
        .filter(record => firstValue(record, IMAGE_FIELDS))
        .map((record, originalIndex) => ({
            record,
            originalIndex,
            year: getGalleryYear(record)
        }))
        .sort((a, b) => {
            if (a.year === null && b.year !== null) return 1;
            if (a.year !== null && b.year === null) return -1;

            if (a.year !== null && b.year !== null &&
                a.year !== b.year) {
                return a.year - b.year;
            }

            return a.originalIndex - b.originalIndex;
        })
        .map(item => item.record);

    if (priestSlideshowTimer) {
        clearInterval(priestSlideshowTimer);
        priestSlideshowTimer = null;
    }

    priestSlideshowIndex = 0;
    priestSlideshowPaused = false;

    if (!records.length) {
        gallery.innerHTML = `
            <div class="card">
                <p>Priest photographs have not been added yet.</p>
            </div>
        `;
        return;
    }

    gallery.className = "priest-slideshow";

    gallery.innerHTML = `
        <div class="priest-slideshow-stage"
             aria-roledescription="carousel"
             aria-label="Priests and ceremonial moments">

            <div class="priest-slideshow-counter"
                 id="priest-slide-counter"></div>

            <div class="priest-slideshow-slide"
                 id="priest-slide"></div>

            <button type="button"
                    class="priest-slide-control priest-slide-prev"
                    id="priest-slide-prev"
                    aria-label="Previous photograph">
                ‹
            </button>

            <button type="button"
                    class="priest-slide-control priest-slide-next"
                    id="priest-slide-next"
                    aria-label="Next photograph">
                ›
            </button>
        </div>

        <div class="priest-slideshow-footer">
            <div class="priest-slide-caption"
                 id="priest-slide-caption"></div>

            <div class="priest-slideshow-actions">
                <button type="button"
                        id="priest-slide-play"
                        aria-pressed="false">
                    Pause slideshow
                </button>
            </div>
        </div>

        <div class="priest-slideshow-dots"
             id="priest-slide-dots"
             aria-label="Choose a photograph"></div>
    `;

    const previousButton =
        document.getElementById("priest-slide-prev");

    const nextButton =
        document.getElementById("priest-slide-next");

    const playButton =
        document.getElementById("priest-slide-play");

    previousButton.addEventListener("click", () => {
        showPriestSlide(
            (priestSlideshowIndex - 1 + records.length) %
                records.length,
            records
        );
    });

    nextButton.addEventListener("click", () => {
        showPriestSlide(
            (priestSlideshowIndex + 1) % records.length,
            records
        );
    });

    playButton.addEventListener("click", () => {
        priestSlideshowPaused = !priestSlideshowPaused;

        playButton.textContent = priestSlideshowPaused
            ? "Play slideshow"
            : "Pause slideshow";

        playButton.setAttribute(
            "aria-pressed",
            String(priestSlideshowPaused)
        );
    });

    gallery.addEventListener("mouseenter", () => {
        priestSlideshowPaused = true;
    });

    gallery.addEventListener("mouseleave", () => {
        priestSlideshowPaused = false;
    });

    gallery.addEventListener("focusin", () => {
        priestSlideshowPaused = true;
    });

    gallery.addEventListener("focusout", event => {
        if (!gallery.contains(event.relatedTarget)) {
            priestSlideshowPaused = false;
        }
    });

    const dotsContainer =
        document.getElementById("priest-slide-dots");

    records.forEach((record, index) => {
        const dot = document.createElement("button");

        dot.type = "button";
        dot.className = "priest-slide-dot";
        dot.setAttribute(
            "aria-label",
            `Show photograph ${index + 1}`
        );

        dot.addEventListener("click", () => {
            showPriestSlide(index, records);
        });

        dotsContainer.appendChild(dot);
    });

    showPriestSlide(0, records);

    if (records.length > 1) {
        priestSlideshowTimer = setInterval(() => {
            if (!priestSlideshowPaused) {
                showPriestSlide(
                    (priestSlideshowIndex + 1) % records.length,
                    records
                );
            }
        }, 5000);
    }
}


function showPriestSlide(index, records) {
    if (!records.length) return;

    priestSlideshowIndex = index;

    const record = records[index];

    const slide = document.getElementById("priest-slide");
    const counter =
        document.getElementById("priest-slide-counter");
    const caption =
        document.getElementById("priest-slide-caption");
    const dots =
        document.querySelectorAll(".priest-slide-dot");

    if (!slide || !counter || !caption) return;

    const name =
        firstValue(record, ["name", "title"]) ||
        "Priest & Ceremonial Moment";

    const image = firstValue(record, IMAGE_FIELDS);

    const description = firstValue(
        record,
        ["caption", "description", "bio", "story", "role"]
    );

    const location = firstValue(
        record,
        ["location", "place"]
    );

    const year = getGalleryYear(record);

    const period = firstValue(record, [
        "period",
        "years",
        "duration",
        "tenure",
        "activeYears",
        "yearRange",
        "dateRange",
        "servicePeriod"
    ]);

    slide.innerHTML = `
        ${createImageButtonHTML(image, name, "archive-image")}
    `;

    caption.innerHTML = `
        <h3>${escapeHTML(name)}</h3>

        ${
            period
                ? `<p class="priest-slide-period">
                       ${escapeHTML(period)}
                   </p>`
                : year !== null
                    ? `<p class="priest-slide-period">
                           ${escapeHTML(year)}
                       </p>`
                    : ""
        }

        ${
            location
                ? `<p class="small-caps">
                       ${escapeHTML(location)}
                   </p>`
                : ""
        }

        ${
            description
                ? `<p>${escapeHTML(description)}</p>`
                : ""
        }
    `;

    counter.textContent =
        `${index + 1} / ${records.length}`;

    dots.forEach((dot, dotIndex) => {
        dot.classList.toggle(
            "active",
            dotIndex === index
        );

        if (dotIndex === index) {
            dot.setAttribute("aria-current", "true");
        } else {
            dot.removeAttribute("aria-current");
        }
    });

    initializeImageButtons(slide);
}


/* =========================================================
   =========================================================
   RITUALS & TRADITIONS  (section 06)
   =========================================================

   Data comes only from Firestore:

   1. "rituals" collection  -> the ritual explanations
   2. "events"  collection  -> ONLY events tagged "ritual"

   Event rituals show their date(s), time, location,
   description and about text. If an event has the same
   title as an item in the "rituals" collection, the
   "rituals" item is kept and the event is not repeated.
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

        const [
            ritualResult,
            eventResult
        ] = await Promise.allSettled([

            getCollectionData(
                "rituals"
            ),

            getCollectionData(
                "events"
            )

        ]);


        /*
         * If BOTH requests fail, show the error.
         */

        if (
            ritualResult.status === "rejected" &&
            eventResult.status === "rejected"
        ) {

            throw ritualResult.reason;

        }


        if (
            ritualResult.status === "rejected"
        ) {

            console.error(
                "ROY BARI: Rituals collection error:",
                ritualResult.reason
            );

        }


        if (
            eventResult.status === "rejected"
        ) {

            console.error(
                "ROY BARI: Ritual events error:",
                eventResult.reason
            );

        }


        /*
         * 1. Rituals collection
         */

        const ritualRecords =
            ritualResult.status === "fulfilled"
                ? ritualResult.value
                : [];


        ritualRecords.sort(
            sortByOrder
        );


        /*
         * 2. Events tagged "ritual"
         */

        const eventRecords =
            eventResult.status === "fulfilled"
                ? eventResult.value
                : [];


        const usedTitles =
            new Set(
                ritualRecords.map(
                    ritual =>
                        String(
                            firstValue(
                                ritual,
                                [
                                    "title",
                                    "name",
                                    "ritualName"
                                ]
                            )
                        )
                            .trim()
                            .toLowerCase()
                )
            );


        const eventRituals =
            eventRecords
                .filter(
                    isRitualEvent
                )
                .map(
                    eventToRitual
                )
                .filter(
                    ritual => {

                        const key =
                            ritual.title
                                .trim()
                                .toLowerCase();


                        if (
                            usedTitles.has(key)
                        ) {

                            return false;

                        }


                        usedTitles.add(key);

                        return true;

                    }
                )
                .sort(
                    (a, b) => {

                        if (
                            a._firstDay !== b._firstDay
                        ) {

                            return (
                                a._firstDay -
                                b._firstDay
                            );

                        }


                        return (
                            a._timeMinutes -
                            b._timeMinutes
                        );

                    }
                );


        rituals = [

            ...ritualRecords,

            ...eventRituals

        ];


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
   EVENT HELPERS
   ========================================================= */

function isRitualEvent(event) {

    const category =
        event.category;


    const list =
        Array.isArray(category)
            ? category
            : category
                ? [category]
                : [];


    return list.some(
        item =>
            String(item)
                .trim()
                .toLowerCase() === "ritual"
    );

}


/*
 * Sorted, de-duplicated local dates.
 * Supports dates[] and the legacy date field.
 */

function getEventDays(event) {

    const raw =
        Array.isArray(event.dates) &&
        event.dates.length
            ? event.dates
            : event.date
                ? [event.date]
                : [];


    const unique =
        new Map();


    raw.forEach(
        value => {

            const date =
                getDateValue({
                    date: value
                });


            if (!date) {

                return;

            }


            const day =
                new Date(
                    date.getFullYear(),
                    date.getMonth(),
                    date.getDate()
                );


            unique.set(
                day.getTime(),
                day
            );

        }
    );


    return [
        ...unique.values()
    ].sort(
        (a, b) => a - b
    );

}


/*
 * "17 Oct 2026"
 * "11 – 15 Oct 2026"
 * "11 Oct, 13 Oct, 15 Oct 2026"
 */

function formatEventDays(days) {

    if (days.length === 0) {

        return "";

    }


    if (days.length === 1) {

        return formatDate(
            days[0]
        );

    }


    const first =
        days[0];

    const last =
        days[days.length - 1];


    const short =
        date =>
            new Intl.DateTimeFormat(
                "en-IN",
                {
                    day: "numeric",
                    month: "short"
                }
            ).format(date);


    const sameYear =
        first.getFullYear() ===
        last.getFullYear();


    const sameMonth =
        sameYear &&
        first.getMonth() ===
        last.getMonth();


    const contiguous =
        days.every(
            (day, index) =>
                index === 0 ||
                Math.round(
                    (
                        day -
                        days[index - 1]
                    ) /
                    86400000
                ) === 1
        );


    if (contiguous) {

        if (sameMonth) {

            return `${first.getDate()} – ${formatDate(last)}`;

        }


        if (sameYear) {

            return `${short(first)} – ${formatDate(last)}`;

        }


        return `${formatDate(first)} – ${formatDate(last)}`;

    }


    if (sameYear) {

        return (
            days
                .map(short)
                .join(", ") +
            ` ${last.getFullYear()}`
        );

    }


    return days
        .map(formatDate)
        .join(", ");

}


function timeToMinutes(time) {

    const match =
        String(time || "")
            .trim()
            .toUpperCase()
            .match(
                /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/
            );


    if (!match) {

        return 0;

    }


    let hour =
        Number(match[1]);

    const minute =
        Number(match[2]);


    if (
        match[3] === "PM" &&
        hour !== 12
    ) {

        hour += 12;

    }


    if (
        match[3] === "AM" &&
        hour === 12
    ) {

        hour = 0;

    }


    return hour * 60 + minute;

}


/*
 * Convert an event document into the same
 * shape used by the ritual accordion.
 */

function eventToRitual(event) {

    const days =
        getEventDays(event);


    const paragraphs =
        [
            event.description,
            event.about
        ]
            .map(
                value =>
                    String(value || "").trim()
            )
            .filter(Boolean);


    return {

        id:
            `event-${event.id}`,

        title:
            event.title ||
            "Ritual",

        category:
            "Ritual",

        time:
            event.time || "",

        location:
            event.location || "",

        _fromEvent:
            true,

        _dateText:
            formatEventDays(days),

        _dateLabel:
            days.length > 1
                ? "Dates"
                : "Date",

        _timeLabel:
            days.length > 1
                ? "Time (each day)"
                : "Time",

        _paragraphs:
            paragraphs,

        _firstDay:
            days.length
                ? days[0].getTime()
                : Infinity,

        _timeMinutes:
            timeToMinutes(
                event.time
            )

    };

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


            /*
             * Event rituals already have a
             * ready-made date text (supports
             * multiple dates).
             */

            const date =
                getDateValue(
                    ritual
                );


            const dateText =
                ritual._dateText ||
                (
                    date
                        ? formatDate(date)
                        : ""
                );


            const dateLabel =
                ritual._dateLabel ||
                "Date";


            const timeLabel =
                ritual._timeLabel ||
                "Time";


            const paragraphs =
                Array.isArray(
                    ritual._paragraphs
                )
                    ? ritual._paragraphs
                    : description
                        ? [description]
                        : [];


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
                            dateText ||
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
                                        dateText
                                            ? `
                                                <div>
                                                    <span>${escapeHTML(dateLabel)}</span>
                                                    <strong>
                                                        ${escapeHTML(dateText)}
                                                    </strong>
                                                </div>
                                              `
                                            : ""
                                    }


                                    ${
                                        time
                                            ? `
                                                <div>
                                                    <span>${escapeHTML(timeLabel)}</span>
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
                        paragraphs.length
                            ? `
                                <div class="ritual-description">

                                    ${paragraphs
                                        .map(
                                            paragraph => `
                                                <p>
                                                    ${escapeHTML(paragraph)}
                                                </p>
                                            `
                                        )
                                        .join("")}

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

    const container = document.getElementById("ritual-accordion");

    if (!container) {
        return;
    }

    const buttons = container.querySelectorAll(".ritual-toggle");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const isOpen =
                button.getAttribute("aria-expanded") === "true";

            const content = document.getElementById(
                button.getAttribute("aria-controls")
            );

            if (!content) {
                return;
            }

            // Close every item.
            buttons.forEach(other => {

                other.setAttribute("aria-expanded", "false");

                const otherContent = document.getElementById(
                    other.getAttribute("aria-controls")
                );

                if (otherContent) {
                    otherContent.hidden = true;
                }

                const icon = other.querySelector(".ritual-icon");

                if (icon) {
                    icon.textContent = "+";
                }

            });

            // Open clicked item.
            if (!isOpen) {

                button.setAttribute("aria-expanded", "true");

                content.hidden = false;

                const icon = button.querySelector(".ritual-icon");

                if (icon) {
                    icon.textContent = "−";
                }

            }

        });

    });

}


/* =========================================================
   =========================================================
   OLD PICTURES
   =========================================================
   ========================================================= */

async function loadOldPictures() {

    const grid = document.getElementById("old-photo-grid");

    if (!grid) {
        return;
    }

    try {

        oldPictures = await getCollectionData("oldPictures");

        oldPictures.sort((a, b) => {

            const yearA = getNumber(a.year) ?? 999999;
            const yearB = getNumber(b.year) ?? 999999;

            return yearA - yearB;

        });

        renderOldPictures();

    }

    catch (error) {

        console.error("ROY BARI: Old picture error:", error);

        grid.innerHTML = errorBox(
            "Unable to load old photographs.",
            error
        );

    }

}


/* =========================================================
   RENDER OLD PICTURES — SLIDESHOW
   ========================================================= */

function renderOldPictures() {

    const container = document.getElementById("old-photo-grid");

    if (!container) {
        return;
    }

    const records = oldPictures.filter(
        picture => firstValue(picture, IMAGE_FIELDS)
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

    // Stop the browser adjusting the page position
    // when the active slide changes.
    container.style.overflowAnchor = "none";

    container.innerHTML = `

        <div class="old-album-stage">

            <div class="old-album-counter" id="old-album-counter">
                1 / ${records.length}
            </div>

            <div id="old-album-slides" class="old-album-slides"></div>

            <button
                type="button"
                class="old-album-prev"
                id="old-album-prev"
                aria-label="Previous photograph"
            >‹</button>

            <button
                type="button"
                class="old-album-next"
                id="old-album-next"
                aria-label="Next photograph"
            >›</button>

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

    const slides = document.getElementById("old-album-slides");
    const dots = document.getElementById("old-album-dots");
    const thumbnails = document.getElementById("old-album-thumbnails");

    if (!slides || !dots || !thumbnails) {
        return;
    }

    /* ---------- CREATE SLIDES, DOTS, THUMBNAILS ---------- */

    records.forEach((picture, index) => {

        const image = firstValue(picture, IMAGE_FIELDS);

        const title =
            firstValue(picture, ["title", "caption"]) ||
            "Roy Bari Archive Photograph";

        const description = firstValue(picture, ["description", "story"]);
        const category = firstValue(picture, ["category"]);
        const year = firstValue(picture, ["year"]);

        const thumbnail = getImageUrl(image);
        const largeImage = getLargeImageUrl(image);

        // SLIDE
        const slide = document.createElement("article");

        slide.className = "old-album-slide";

        if (index === 0) {
            slide.classList.add("active");
        }

        slide.dataset.index = String(index);

        slide.innerHTML = `

            <button
                type="button"
                class="old-album-image-button"
                data-lightbox-image="${escapeAttribute(largeImage)}"
                data-lightbox-alt="${escapeAttribute(title)}"
                aria-label="Open photograph in full screen"
            >

                <div class="old-album-image-wrap">

                    <img
                        src="${escapeAttribute(thumbnail)}"
                        alt="${escapeAttribute(title)}"
                        class="old-album-image"
                        loading="${index === 0 ? "eager" : "lazy"}"
                        decoding="async"
                    >

                </div>

            </button>

            <div class="old-album-caption">

                ${
                    year
                        ? `<div class="old-album-year">${escapeHTML(year)}</div>`
                        : ""
                }

                <h3>
                    ${escapeHTML(title)}
                </h3>

                ${
                    description
                        ? `<p>${escapeHTML(description)}</p>`
                        : ""
                }

                ${
                    category
                        ? `
                            <div class="small-caps old-album-category">
                                ${escapeHTML(category)}
                            </div>
                          `
                        : ""
                }

            </div>

        `;

        slides.appendChild(slide);

        // DOT
        const dot = document.createElement("button");

        dot.type = "button";
        dot.className = "old-album-dot";

        if (index === 0) {
            dot.classList.add("active");
        }

        dot.dataset.index = String(index);

        dot.setAttribute(
            "aria-label",
            `Go to photograph ${index + 1}`
        );

        dots.appendChild(dot);

        // THUMBNAIL
        const thumbnailButton = document.createElement("button");

        thumbnailButton.type = "button";
        thumbnailButton.className = "old-album-thumbnail";

        if (index === 0) {
            thumbnailButton.classList.add("active");
        }

        thumbnailButton.dataset.index = String(index);

        thumbnailButton.setAttribute("aria-label", `Show ${title}`);

        thumbnailButton.innerHTML = `
            <img
                src="${escapeAttribute(thumbnail)}"
                alt="${escapeAttribute(title)}"
                loading="lazy"
                decoding="async"
            >
        `;

        thumbnails.appendChild(thumbnailButton);

    });

    /* ---------- SLIDESHOW STATE ---------- */

    let currentIndex = 0;
    let autoSlideTimer = null;
    let userInteracting = false;

    /*
       SHOW SLIDE

       There is NO scrollIntoView() here, so changing the
       image never moves the webpage to the slideshow.
    */

    function showSlide(index, resetTimer = true) {

        if (records.length === 0) {
            return;
        }

        if (index < 0) {
            index = records.length - 1;
        }

        if (index >= records.length) {
            index = 0;
        }

        currentIndex = index;

        // Remember the page position.
        const currentScrollPosition = window.scrollY;

        slides.querySelectorAll(".old-album-slide").forEach(
            (slide, slideIndex) => {
                slide.classList.toggle("active", slideIndex === currentIndex);
            }
        );

        dots.querySelectorAll(".old-album-dot").forEach(
            (dot, dotIndex) => {
                dot.classList.toggle("active", dotIndex === currentIndex);
            }
        );

        thumbnails.querySelectorAll(".old-album-thumbnail").forEach(
            (thumb, thumbIndex) => {
                thumb.classList.toggle("active", thumbIndex === currentIndex);
            }
        );

        const counter = document.getElementById("old-album-counter");

        if (counter) {
            counter.textContent =
                `${currentIndex + 1} / ${records.length}`;
        }

        // Restore the exact page position.
        if (window.scrollY !== currentScrollPosition) {
            window.scrollTo(0, currentScrollPosition);
        }

        if (resetTimer) {
            startAutoSlide();
        }

    }

    function startAutoSlide() {

        clearInterval(autoSlideTimer);

        if (records.length <= 1) {
            return;
        }

        if (userInteracting) {
            return;
        }

        autoSlideTimer = setInterval(() => {
            showSlide(currentIndex + 1, false);
        }, 5000);

    }

    function stopAutoSlide() {

        clearInterval(autoSlideTimer);

        autoSlideTimer = null;

    }

    function manualShow(index) {

        userInteracting = true;

        stopAutoSlide();

        showSlide(index, false);

    }

    /* ---------- CONTROLS ---------- */

    const previous = document.getElementById("old-album-prev");

    if (previous) {
        previous.addEventListener("click", () => {
            manualShow(currentIndex - 1);
        });
    }

    const next = document.getElementById("old-album-next");

    if (next) {
        next.addEventListener("click", () => {
            manualShow(currentIndex + 1);
        });
    }

    dots.querySelectorAll(".old-album-dot").forEach(dot => {
        dot.addEventListener("click", () => {
            manualShow(Number(dot.dataset.index));
        });
    });

    thumbnails.querySelectorAll(".old-album-thumbnail").forEach(thumb => {
        thumb.addEventListener("click", () => {
            manualShow(Number(thumb.dataset.index));
        });
    });

    // Pause while hovering.
    container.addEventListener("mouseenter", () => {
        stopAutoSlide();
    });

    container.addEventListener("mouseleave", () => {

        // If the visitor chose an image manually,
        // don't start changing images again.
        if (!userInteracting) {
            startAutoSlide();
        }

    });

    /* ---------- TOUCH / SWIPE ---------- */

    let touchStartX = 0;
    let touchEndX = 0;

    slides.addEventListener(
        "touchstart",
        event => {

            userInteracting = true;

            stopAutoSlide();

            touchStartX = event.changedTouches[0].screenX;

        },
        { passive: true }
    );

    slides.addEventListener(
        "touchend",
        event => {

            touchEndX = event.changedTouches[0].screenX;

            const difference = touchStartX - touchEndX;

            if (Math.abs(difference) < 50) {
                return;
            }

            if (difference > 0) {
                showSlide(currentIndex + 1, false);
            } else {
                showSlide(currentIndex - 1, false);
            }

        },
        { passive: true }
    );

    /* ---------- LIGHTBOX ---------- */

    initializeImageButtons(slides);

    /* ---------- START ---------- */

    showSlide(0, false);

    startAutoSlide();

}


/* =========================================================
   =========================================================
   NEWSPAPER ARTICLES
   =========================================================
   ========================================================= */

async function loadNewspaperArticles() {

    const grid = document.getElementById("newspaper-grid");

    if (!grid) {

        console.error("ROY BARI: #newspaper-grid not found.");

        return;

    }

    try {

        newspaperArticles = await getCollectionData("newspaperArticles");

        // Newest first (Firestore Timestamp supported).
        newspaperArticles.sort((a, b) => {

            const dateA = getDateValue(a);
            const dateB = getDateValue(b);

            if (dateA && dateB) {
                return dateB.getTime() - dateA.getTime();
            }

            if (dateA) {
                return -1;
            }

            if (dateB) {
                return 1;
            }

            // Fallback for records containing only year.
            const yearA = getNumber(a.year);
            const yearB = getNumber(b.year);

            if (yearA !== null && yearB !== null) {
                return yearB - yearA;
            }

            return 0;

        });

        renderNewspaperArticles();

    }

    catch (error) {

        console.error("ROY BARI: Newspaper error:", error);

        grid.innerHTML = errorBox(
            "Unable to load newspaper articles.",
            error
        );

    }

}

function renderNewspaperArticles() {

    const grid = document.getElementById("newspaper-grid");

    if (!grid) {
        return;
    }

    if (newspaperArticles.length === 0) {

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

    newspaperArticles.forEach(article => {

        const image = firstValue(article, IMAGE_FIELDS);

        const title =
            firstValue(article, ["title"]) ||
            "Roy Bari Durga Puja";

        const headline = firstValue(article, ["headline", "description"]);
        const newspaper = firstValue(article, ["newspaper", "publication"]);
        const page = firstValue(article, ["page"]);
        const articleDate = getDateValue(article);

        const displayDate = articleDate
            ? formatDate(articleDate)
            : firstValue(article, ["dateText", "displayDate"]);

        let year = firstValue(article, ["year"]);

        if (!year && articleDate) {
            year = articleDate.getFullYear();
        }

        const source = firstValue(article, ["source"]);

        const sourceUrl = firstValue(
            article,
            ["sourceUrl", "articleUrl", "link"]
        );

        const card = document.createElement("article");

        card.className = "newspaper-card";

        const imageHTML = image
            ? createImageButtonHTML(image, title, "newspaper-image")
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
                        ? `<div class="small-caps">${escapeHTML(newspaper)}</div>`
                        : ""
                }

                <h3>
                    ${escapeHTML(title)}
                </h3>

                ${
                    headline
                        ? `<p>${escapeHTML(headline)}</p>`
                        : ""
                }

                <div class="newspaper-meta">

                    ${year ? `<span>${escapeHTML(year)}</span>` : ""}

                    ${displayDate ? `<span>${escapeHTML(displayDate)}</span>` : ""}

                    ${page ? `<span>Page ${escapeHTML(page)}</span>` : ""}

                    ${source ? `<span>${escapeHTML(source)}</span>` : ""}

                </div>

                ${
                    sourceUrl
                        ? `
                            <a
                                href="${escapeAttribute(sourceUrl)}"
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

        grid.appendChild(card);

    });

    initializeImageButtons(grid);

}


/* =========================================================
   =========================================================
   MEMORIES
   =========================================================
   ========================================================= */

async function loadMemories() {

    const grid = document.getElementById("memory-grid");

    if (!grid) {
        return;
    }

    try {

        memories = await getCollectionData("memories");

        memories.sort((a, b) => {

            const yearA = getNumber(a.year) ?? 999999;
            const yearB = getNumber(b.year) ?? 999999;

            return yearA - yearB;

        });

        renderMemories();

    }

    catch (error) {

        console.error("ROY BARI: Memory error:", error);

        grid.innerHTML = errorBox(
            "Unable to load family memories.",
            error
        );

    }

}

function renderMemories() {

    const grid = document.getElementById("memory-grid");

    if (!grid) {
        return;
    }

    if (memories.length === 0) {

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

    memories.forEach(memory => {

        const title =
            firstValue(memory, ["title", "name"]) ||
            "Family Memory";

        const text = firstValue(
            memory,
            ["quote", "description", "story", "content"]
        );

        const person = firstValue(memory, ["person", "author"]);
        const category = firstValue(memory, ["category"]);
        const year = firstValue(memory, ["year"]);
        const image = firstValue(memory, ["image", "photo", "imageUrl"]);

        const card = document.createElement("article");

        card.className = "card memory-card";

        card.innerHTML = `

            ${
                image
                    ? createImageButtonHTML(image, title, "archive-image")
                    : ""
            }

            ${
                year
                    ? `<div class="num">${escapeHTML(year)}</div>`
                    : ""
            }

            ${
                category
                    ? `<div class="small-caps">${escapeHTML(category)}</div>`
                    : ""
            }

            <h4>
                ${escapeHTML(title)}
            </h4>

            ${
                text
                    ? `<p>“${escapeHTML(text)}”</p>`
                    : ""
            }

            ${
                person
                    ? `<div class="small-caps">— ${escapeHTML(person)}</div>`
                    : ""
            }

        `;

        grid.appendChild(card);

    });

    initializeImageButtons(grid);

}


/* =========================================================
   IMAGE BUTTON HTML
   ========================================================= */

function createImageButtonHTML(image, alt, imageClass) {

    const thumbnail = getImageUrl(image);
    const large = getLargeImageUrl(image);

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

function initializeImageButtons(container) {

    if (!container) {
        return;
    }

    const buttons = container.querySelectorAll(".about-image-button");

    buttons.forEach(button => {

        if (button.dataset.ready === "true") {
            return;
        }

        button.dataset.ready = "true";

        button.addEventListener("click", event => {

            event.preventDefault();

            const image = button.getAttribute("data-lightbox-image");

            const alt =
                button.getAttribute("data-lightbox-alt") || "";

            if (!image) {
                return;
            }

            openLightbox(image, alt);

        });

    });

}


/* =========================================================
   =========================================================
   LIGHTBOX
   =========================================================
   ========================================================= */

function setupLightbox() {

    const lightbox = document.getElementById("about-lightbox");
    const close = document.getElementById("about-lightbox-close");
    const backdrop = document.getElementById("about-lightbox-backdrop");
    const previous = document.getElementById("about-lightbox-prev");
    const next = document.getElementById("about-lightbox-next");

    if (!lightbox) {

        console.error("ROY BARI: Lightbox element missing.");

        return;

    }

    if (close) {
        close.addEventListener("click", closeLightbox);
    }

    if (backdrop) {
        backdrop.addEventListener("click", closeLightbox);
    }

    if (previous) {
        previous.addEventListener("click", () => {
            showLightboxImage(currentLightboxIndex - 1);
        });
    }

    if (next) {
        next.addEventListener("click", () => {
            showLightboxImage(currentLightboxIndex + 1);
        });
    }

    document.addEventListener("keydown", event => {

        if (!lightbox.classList.contains("is-open")) {
            return;
        }

        if (event.key === "Escape") {

            event.preventDefault();

            closeLightbox();

        }

        if (event.key === "ArrowLeft") {

            event.preventDefault();

            showLightboxImage(currentLightboxIndex - 1);

        }

        if (event.key === "ArrowRight") {

            event.preventDefault();

            showLightboxImage(currentLightboxIndex + 1);

        }

    });

}

function openLightbox(image, alt) {

    const lightbox = document.getElementById("about-lightbox");

    if (!lightbox) {
        return;
    }

    // Remember the clicked element.
    lastFocusedElement = document.activeElement;

    // Collect every image currently on the page.
    const buttons = Array.from(
        document.querySelectorAll(
            ".about-image-button[data-lightbox-image]"
        )
    );

    lightboxItems = buttons.map(button => ({
        src: button.getAttribute("data-lightbox-image"),
        alt: button.getAttribute("data-lightbox-alt") || ""
    }));

    // Find the clicked image.
    currentLightboxIndex = lightboxItems.findIndex(
        item => item.src === image && item.alt === alt
    );

    // If not found, create one.
    if (currentLightboxIndex < 0) {

        lightboxItems = [{ src: image, alt: alt }];

        currentLightboxIndex = 0;

    }

    showLightboxImage(currentLightboxIndex);

    lightbox.classList.add("is-open");

    lightbox.setAttribute("aria-hidden", "false");

    document.body.classList.add("about-lightbox-open");

    // Focus the close button AFTER opening.
    const close = document.getElementById("about-lightbox-close");

    if (close) {
        requestAnimationFrame(() => {
            close.focus();
        });
    }

}

function showLightboxImage(index) {

    if (lightboxItems.length === 0) {
        return;
    }

    // Circular navigation.
    if (index < 0) {
        index = lightboxItems.length - 1;
    }

    if (index >= lightboxItems.length) {
        index = 0;
    }

    currentLightboxIndex = index;

    const item = lightboxItems[currentLightboxIndex];

    const image = document.getElementById("about-lightbox-image");
    const caption = document.getElementById("about-lightbox-caption");
    const previous = document.getElementById("about-lightbox-prev");
    const next = document.getElementById("about-lightbox-next");

    if (image) {
        image.src = item.src;
        image.alt = item.alt || "";
    }

    if (caption) {
        caption.textContent = item.alt || "";
    }

    const multiple = lightboxItems.length > 1;

    if (previous) {
        previous.hidden = !multiple;
    }

    if (next) {
        next.hidden = !multiple;
    }

}

function closeLightbox() {

    const lightbox = document.getElementById("about-lightbox");

    if (!lightbox) {
        return;
    }

    // Remove focus BEFORE aria-hidden=true, to avoid the Chrome
    // warning about a hidden element retaining focus.
    if (lightbox.contains(document.activeElement)) {
        document.activeElement.blur();
    }

    lightbox.classList.remove("is-open");

    lightbox.setAttribute("aria-hidden", "true");

    document.body.classList.remove("about-lightbox-open");

    const image = document.getElementById("about-lightbox-image");
    const caption = document.getElementById("about-lightbox-caption");

    if (image) {
        image.removeAttribute("src");
        image.alt = "";
    }

    if (caption) {
        caption.textContent = "";
    }

    lightboxItems = [];

    currentLightboxIndex = 0;

    // Return focus to the image button that opened the lightbox.
    if (lastFocusedElement && document.contains(lastFocusedElement)) {

        requestAnimationFrame(() => {

            try {
                lastFocusedElement.focus();
            }

            catch (_) {}

        });

    }

    lastFocusedElement = null;

}


/* =========================================================
   ERROR BOX
   ========================================================= */

function errorBox(message, error) {

    return `

        <div class="card">

            <h3>
                ${escapeHTML(message)}
            </h3>

            <p>
                ${
                    error && error.message
                        ? escapeHTML(error.message)
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

        const target = event.target;

        if (target && target.tagName === "IMG") {

            console.warn("ROY BARI: Image failed:", target.src);

        }

    },
    true
);


/* =========================================================
   GLOBAL DEBUG
   ========================================================= */

window.royBariAbout = {
    getGoogleDriveFileId: getDriveFileId,
    getImageUrl: getImageUrl,
    getLargeImageUrl: getLargeImageUrl,
    closeLightbox: closeLightbox
};