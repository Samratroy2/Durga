/* =========================================================
   ROY BARI — GALLERY
   FIRESTORE + GOOGLE DRIVE
   ========================================================= */


/* =========================================================
   FIRESTORE
   ========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    db
} from "./firebase.js";


/* =========================================================
   START
   ========================================================= */

console.log("=================================");
console.log("ROY BARI GALLERY");
console.log("Gallery JS started");
console.log("Firestore database:", db);
console.log("=================================");


/* =========================================================
   ELEMENTS
   ========================================================= */

const galleryGrid =
    document.getElementById("gallery-grid");

const compareBox =
    document.getElementById("gallery-compare");

const videoList =
    document.getElementById("video-list");

const navToggle =
    document.getElementById("nav-toggle");

const navLinks =
    document.getElementById("nav-links");

const lightboxRoot =
    document.getElementById("lightbox-root") ||
    document.body;


/* =========================================================
   LIGHTBOX STATE
   ========================================================= */

const lightboxState = {

    items: [],

    currentIndex: -1,

    triggerElement: null

};


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

if (navToggle && navLinks) {

    navToggle.addEventListener(
        "click",
        function () {

            const isOpen =
                navLinks.classList.toggle("open");

            navToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );

        }
    );


    navLinks
        .querySelectorAll("a")
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        navLinks.classList.remove(
                            "open"
                        );

                        navToggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            }
        );

}


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
   GOOGLE DRIVE FILE ID
   ========================================================= */

function getGoogleDriveFileId(link) {

    if (!link) {

        return "";

    }


    const url =
        String(link).trim();


    /*
       FORMAT:

       https://drive.google.com/file/d/FILE_ID/view
    */

    let match =
        url.match(
            /drive\.google\.com\/file\/d\/([^/]+)/
        );


    if (match) {

        return match[1];

    }


    /*
       FORMAT:

       https://drive.google.com/open?id=FILE_ID
    */

    match =
        url.match(
            /drive\.google\.com\/open\?id=([^&]+)/
        );


    if (match) {

        return match[1];

    }


    /*
       FORMAT:

       https://drive.google.com/uc?id=FILE_ID
    */

    match =
        url.match(
            /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&]+)/
        );


    if (match) {

        return match[1];

    }


    return "";

}


/* =========================================================
   GOOGLE DRIVE FULL IMAGE URL
   ========================================================= */

function getGoogleDriveImageUrl(link) {

    if (!link) {

        return "";

    }


    const fileId =
        getGoogleDriveFileId(link);


    /*
       If Firestore already contains
       a normal image URL.
    */

    if (!fileId) {

        return String(link).trim();

    }


    /*
       Full image URL.
    */

    return (
        "https://drive.google.com/uc?export=view&id=" +
        encodeURIComponent(fileId)
    );

}


/* =========================================================
   GOOGLE DRIVE FALLBACK THUMBNAIL
   ========================================================= */

function getGoogleDriveThumbnailUrl(link) {

    if (!link) {

        return "";

    }


    const fileId =
        getGoogleDriveFileId(link);


    if (!fileId) {

        return String(link).trim();

    }


    return (
        "https://drive.google.com/thumbnail" +
        "?id=" +
        encodeURIComponent(fileId) +
        "&sz=w2000"
    );

}


/* =========================================================
   GOOGLE DRIVE VIDEO URL
   ========================================================= */

function getGoogleDriveVideoUrl(link) {

    if (!link) {

        return "";

    }


    const fileId =
        getGoogleDriveFileId(link);


    /*
       If it isn't a Google Drive URL,
       return the original URL.
    */

    if (!fileId) {

        return String(link).trim();

    }


    /*
       Google Drive preview URL.
    */

    return (
        "https://drive.google.com/file/d/" +
        encodeURIComponent(fileId) +
        "/preview"
    );

}


/* =========================================================
   IMAGE ERROR
   ========================================================= */

function imageError(image) {

    if (!image) {

        return;

    }


    const parent =
        image.parentElement;


    if (!parent) {

        return;

    }


    image.style.display =
        "none";


    const error =
        document.createElement("div");


    error.className =
        "gallery-no-image";


    error.innerHTML = `

        <span>
            Image unavailable
        </span>

        <small>
            Please check Google Drive
            sharing permissions.
        </small>

    `;


    parent.appendChild(error);

}


/* =========================================================
   IMAGE LOADED
   ========================================================= */

function markImageLoaded(image) {

    if (!image) {

        return;

    }


    image.classList.add(
        "is-loaded"
    );


    const wrapper =
        image.closest(
            ".gallery-image"
        );


    if (wrapper) {

        wrapper.classList.add(
            "is-loaded"
        );

    }

}


/* =========================================================
   LOAD GALLERY
   ========================================================= */

async function loadGallery() {

    console.log(
        "Loading gallery collection..."
    );


    if (!galleryGrid) {

        console.error(
            "#gallery-grid was not found."
        );

        return;

    }


    try {

        /*
           FIRESTORE COLLECTION
        */

        const galleryRef =
            collection(
                db,
                "gallery"
            );


        /*
           GET DOCUMENTS
        */

        const snapshot =
            await getDocs(
                galleryRef
            );


        console.log(
            "Gallery documents:",
            snapshot.size
        );


        /*
           EMPTY
        */

        if (snapshot.empty) {

            galleryGrid.innerHTML = `

                <div class="gallery-empty">

                    <h3>
                        No photographs yet
                    </h3>

                    <p>
                        No photographs have been
                        added to the archive yet.
                    </p>

                </div>

            `;

            return;

        }


        /*
           CREATE ARRAY
        */

        const galleryItems = [];


        snapshot.forEach(
            function (doc) {

                const data =
                    doc.data();


                console.log(
                    "Gallery document:",
                    doc.id,
                    data
                );


                /*
                   IMPORTANT

                   If someone accidentally puts
                   a video document inside the
                   gallery collection, ignore it.

                   Videos belong in "videos".
                */

                if (
                    data.type &&
                    String(data.type).toLowerCase() === "video"
                ) {

                    console.log(
                        "Skipping video from gallery:",
                        doc.id
                    );

                    return;

                }


                galleryItems.push({

                    id:
                        doc.id,

                    title:
                        data.title ||
                        "Roy Bari Photograph",

                    description:
                        data.description ||
                        "",

                    category:
                        data.category ||
                        "Archive",

                    year:
                        data.year ||
                        "",

                    link:
                        data.link ||
                        data.imageUrl ||
                        data.url ||
                        ""

                });

            }
        );


        /*
           SORT
           NEWEST YEAR FIRST
        */

        galleryItems.sort(
            function (a, b) {

                const yearA =
                    parseInt(a.year) || 0;

                const yearB =
                    parseInt(b.year) || 0;


                return yearB - yearA;

            }
        );


        /*
           IF ALL DOCUMENTS WERE VIDEOS
        */

        if (!galleryItems.length) {

            galleryGrid.innerHTML = `

                <div class="gallery-empty">

                    <h3>
                        No photographs yet
                    </h3>

                    <p>
                        Add photographs to the
                        gallery collection.
                    </p>

                </div>

            `;

            return;

        }


        /*
           CREATE GALLERY HTML
        */

        let html = "";


        /*
           Reset lightbox list.
        */

        lightboxState.items = [];


        galleryItems.forEach(
            function (item, index) {

                const imageUrl =
                    getGoogleDriveImageUrl(
                        item.link
                    );


                const thumbnailUrl =
                    getGoogleDriveThumbnailUrl(
                        item.link
                    );


                /*
                   Record item in lightbox.
                */

                const lightboxIndex =
                    lightboxState.items.length;


                if (imageUrl) {

                    lightboxState.items.push({

                        fullImage:
                            imageUrl,

                        fallbackImage:
                            thumbnailUrl,

                        title:
                            item.title

                    });

                }


                html += `

                    <article
                        class="gallery-card"
                        data-category="${escapeHTML(item.category)}"
                    >


                        <!-- IMAGE -->

                        <div class="gallery-image">

                            ${
                                imageUrl

                                ?

                                `

                                <img
                                    src="${escapeHTML(imageUrl)}"

                                    data-full-image="${escapeHTML(imageUrl)}"

                                    data-fallback="${escapeHTML(thumbnailUrl)}"

                                    data-lightbox-index="${lightboxIndex}"

                                    alt="${escapeHTML(item.title)}"

                                    loading="${index < 3 ? "eager" : "lazy"}"

                                    referrerpolicy="no-referrer"

                                    decoding="async"
                                >


                                <button
                                    type="button"
                                    class="gallery-view-button"

                                    data-lightbox-index="${lightboxIndex}"

                                    aria-label="View ${escapeHTML(item.title)} at full size"
                                >
                                    View
                                </button>

                                `

                                :

                                `

                                <div class="gallery-no-image">

                                    <span>
                                        Image link missing
                                    </span>

                                </div>

                                `

                            }

                        </div>


                        <!-- CAPTION -->

                        <div class="gallery-content">


                            <div class="gallery-meta">

                                ${escapeHTML(item.category)}

                                ${
                                    item.year
                                    ?

                                    `
                                    <span>
                                        ·
                                    </span>

                                    ${escapeHTML(item.year)}
                                    `

                                    :

                                    ""
                                }

                            </div>


                            <h3>
                                ${escapeHTML(item.title)}
                            </h3>


                            ${
                                item.description

                                ?

                                `

                                <p>
                                    ${escapeHTML(item.description)}
                                </p>

                                `

                                :

                                ""

                            }


                        </div>


                    </article>

                `;

            }
        );


        /*
           INSERT GALLERY
        */

        galleryGrid.innerHTML =
            html;


        /*
           IMAGE EVENTS
        */

        const images =
            galleryGrid.querySelectorAll(
                ".gallery-image img"
            );


        images.forEach(
            function (image) {


                /*
                   CHECK IF ALREADY LOADED
                */

                if (
                    image.complete &&
                    image.naturalWidth > 0
                ) {

                    markImageLoaded(
                        image
                    );

                }
                else {

                    image.addEventListener(
                        "load",
                        function () {

                            markImageLoaded(
                                image
                            );

                        }
                    );

                }


                /*
                   IMAGE ERROR

                   First try Drive thumbnail.
                */

                image.addEventListener(
                    "error",
                    function () {

                        const fallback =
                            image.dataset.fallback;


                        if (
                            fallback &&
                            image.src !== fallback &&
                            !image.dataset.fallbackUsed
                        ) {

                            console.log(
                                "Trying Drive fallback:",
                                fallback
                            );


                            image.dataset.fallbackUsed =
                                "true";


                            image.src =
                                fallback;


                            return;

                        }


                        /*
                           Stop shimmer.
                        */

                        const wrapper =
                            image.closest(
                                ".gallery-image"
                            );


                        if (wrapper) {

                            wrapper.classList.add(
                                "is-loaded"
                            );

                        }


                        imageError(
                            image
                        );

                    }
                );


                /*
                   CLICK IMAGE
                */

                image.addEventListener(
                    "click",
                    function () {

                        const lightboxIndex =
                            parseInt(
                                image.dataset.lightboxIndex,
                                10
                            );


                        openImageViewer(
                            lightboxIndex,
                            image
                        );

                    }
                );

            }
        );


        /*
           VIEW BUTTONS
        */

        const viewButtons =
            galleryGrid.querySelectorAll(
                ".gallery-view-button"
            );


        viewButtons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();


                        const lightboxIndex =
                            parseInt(
                                button.dataset.lightboxIndex,
                                10
                            );


                        openImageViewer(
                            lightboxIndex,
                            button
                        );

                    }
                );

            }
        );


        console.log(
            "Gallery loaded successfully."
        );

    }


    catch (error) {

        console.error(
            "GALLERY FIREBASE ERROR:",
            error
        );


        galleryGrid.innerHTML = `

            <div class="gallery-error">

                <h3>
                    Gallery could not be loaded
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;

    }

}


/* =========================================================
   FULLSCREEN IMAGE VIEWER
   ========================================================= */

let activeLightbox = null;


function openImageViewer(
    index,
    triggerElement
) {

    if (
        !lightboxState.items.length ||
        index < 0 ||
        index >= lightboxState.items.length
    ) {

        return;

    }


    lightboxState.triggerElement =
        triggerElement ||
        document.activeElement;


    closeImageViewer({
        skipFocusRestore: true
    });


    const lightbox =
        document.createElement("div");


    lightbox.id =
        "gallery-lightbox";


    lightbox.className =
        "gallery-lightbox";


    lightbox.setAttribute(
        "role",
        "dialog"
    );


    lightbox.setAttribute(
        "aria-modal",
        "true"
    );


    lightbox.setAttribute(
        "aria-label",
        "Photograph viewer"
    );


    lightbox.innerHTML = `

        <div
            class="gallery-lightbox-backdrop"
        ></div>


        <div
            class="gallery-lightbox-content"
        >


            <button
                type="button"
                class="gallery-lightbox-close"
                aria-label="Close image viewer"
            >
                ×
            </button>


            <button
                type="button"
                class="gallery-lightbox-nav gallery-lightbox-prev"
                aria-label="Previous photograph"
            >
                ‹
            </button>


            <button
                type="button"
                class="gallery-lightbox-nav gallery-lightbox-next"
                aria-label="Next photograph"
            >
                ›
            </button>


            <div class="gallery-lightbox-frame">

                <div class="gallery-lightbox-spinner"></div>

                <img
                    class="gallery-lightbox-image"
                    alt=""
                    referrerpolicy="no-referrer"
                >

            </div>


            <div class="gallery-lightbox-title"></div>


        </div>

    `;


    lightboxRoot.appendChild(
        lightbox
    );


    document.body.style.overflow =
        "hidden";


    activeLightbox =
        lightbox;


    lightboxState.currentIndex =
        index;


    /*
       ELEMENT REFERENCES
    */

    const closeButton =
        lightbox.querySelector(
            ".gallery-lightbox-close"
        );


    const prevButton =
        lightbox.querySelector(
            ".gallery-lightbox-prev"
        );


    const nextButton =
        lightbox.querySelector(
            ".gallery-lightbox-next"
        );


    const backdrop =
        lightbox.querySelector(
            ".gallery-lightbox-backdrop"
        );


    /*
       EVENTS
    */

    closeButton.addEventListener(
        "click",
        function () {

            closeImageViewer();

        }
    );


    backdrop.addEventListener(
        "click",
        function () {

            closeImageViewer();

        }
    );


    prevButton.addEventListener(
        "click",
        function () {

            showLightboxItem(
                lightboxState.currentIndex - 1
            );

        }
    );


    nextButton.addEventListener(
        "click",
        function () {

            showLightboxItem(
                lightboxState.currentIndex + 1
            );

        }
    );


    lightbox.addEventListener(
        "keydown",
        lightboxKeydownHandler
    );


    /*
       INITIAL RENDER
    */

    renderLightboxItem(
        index
    );


    updateLightboxNavVisibility();


    closeButton.focus();

}


/* =========================================================
   RENDER LIGHTBOX ITEM
   ========================================================= */

function renderLightboxItem(index) {

    if (!activeLightbox) {

        return;

    }


    const item =
        lightboxState.items[index];


    if (!item) {

        return;

    }


    const frame =
        activeLightbox.querySelector(
            ".gallery-lightbox-frame"
        );


    const image =
        activeLightbox.querySelector(
            ".gallery-lightbox-image"
        );


    const titleBox =
        activeLightbox.querySelector(
            ".gallery-lightbox-title"
        );


    frame.classList.add(
        "is-loading"
    );


    image.classList.remove(
        "is-loaded"
    );


    image.removeAttribute(
        "data-fallback-used"
    );


    image.alt =
        item.title ||
        "Roy Bari photograph";


    titleBox.textContent =
        item.title ||
        "";


    function handleLoad() {

        frame.classList.remove(
            "is-loading"
        );


        image.classList.add(
            "is-loaded"
        );

    }


    function handleError() {

        const fallback =
            item.fallbackImage;


        if (
            fallback &&
            image.src !== fallback &&
            !image.dataset.fallbackUsed
        ) {

            image.dataset.fallbackUsed =
                "true";


            image.src =
                fallback;


            return;

        }


        frame.classList.remove(
            "is-loading"
        );


        frame.classList.add(
            "has-error"
        );

    }


    image.onload =
        handleLoad;


    image.onerror =
        handleError;


    frame.classList.remove(
        "has-error"
    );


    image.src =
        item.fullImage;

}


/* =========================================================
   SHOW LIGHTBOX ITEM
   ========================================================= */

function showLightboxItem(index) {

    const total =
        lightboxState.items.length;


    if (!total) {

        return;

    }


    const wrappedIndex =
        (index + total) % total;


    lightboxState.currentIndex =
        wrappedIndex;


    renderLightboxItem(
        wrappedIndex
    );


    updateLightboxNavVisibility();

}


/* =========================================================
   NAVIGATION VISIBILITY
   ========================================================= */

function updateLightboxNavVisibility() {

    if (!activeLightbox) {

        return;

    }


    const showNav =
        lightboxState.items.length > 1;


    activeLightbox

        .querySelectorAll(
            ".gallery-lightbox-nav"
        )

        .forEach(
            function (button) {

                button.style.display =
                    showNav
                        ? "flex"
                        : "none";

            }
        );

}


/* =========================================================
   KEYBOARD
   ========================================================= */

function lightboxKeydownHandler(event) {

    if (event.key === "Escape") {

        event.preventDefault();

        closeImageViewer();

        return;

    }


    if (event.key === "ArrowLeft") {

        event.preventDefault();

        showLightboxItem(
            lightboxState.currentIndex - 1
        );

        return;

    }


    if (event.key === "ArrowRight") {

        event.preventDefault();

        showLightboxItem(
            lightboxState.currentIndex + 1
        );

        return;

    }


    if (event.key === "Tab") {

        trapLightboxFocus(
            event
        );

    }

}


/* =========================================================
   TRAP LIGHTBOX FOCUS
   ========================================================= */

function trapLightboxFocus(event) {

    if (!activeLightbox) {

        return;

    }


    const focusable =
        Array.from(

            activeLightbox.querySelectorAll(
                "button"
            )

        ).filter(
            function (element) {

                return (
                    element.offsetParent !== null
                );

            }
        );


    if (!focusable.length) {

        return;

    }


    const first =
        focusable[0];


    const last =
        focusable[focusable.length - 1];


    if (
        event.shiftKey &&
        document.activeElement === first
    ) {

        event.preventDefault();

        last.focus();

    }

    else if (
        !event.shiftKey &&
        document.activeElement === last
    ) {

        event.preventDefault();

        first.focus();

    }

}


/* =========================================================
   CLOSE LIGHTBOX
   ========================================================= */

function closeImageViewer(options) {

    const settings =
        options || {};


    if (!activeLightbox) {

        return;

    }


    activeLightbox.removeEventListener(
        "keydown",
        lightboxKeydownHandler
    );


    activeLightbox.remove();


    activeLightbox =
        null;


    document.body.style.overflow =
        "";


    if (
        !settings.skipFocusRestore &&
        lightboxState.triggerElement &&
        typeof lightboxState.triggerElement.focus === "function"
    ) {

        lightboxState.triggerElement.focus();

    }

}


/* =========================================================
   LOAD COMPARISON
   ========================================================= */

async function loadComparison() {

    if (!compareBox) {

        return;

    }


    console.log(
        "Loading gallery comparison..."
    );


    try {

        const comparisonRef =
            collection(
                db,
                "comparisons"
            );


        const snapshot =
            await getDocs(
                comparisonRef
            );


        console.log(
            "Comparison documents:",
            snapshot.size
        );


        if (snapshot.empty) {

            compareBox.innerHTML = `

                <div class="compare-loading">

                    No comparison images available.

                </div>

            `;

            return;

        }


        const data =
            snapshot.docs[0].data();


        const oldImage =
            getGoogleDriveImageUrl(

                data.oldImage ||
                data.before ||
                data.oldLink ||
                data.old ||
                ""

            );


        const newImage =
            getGoogleDriveImageUrl(

                data.newImage ||
                data.after ||
                data.newLink ||
                data.new ||
                ""

            );


        if (
            !oldImage ||
            !newImage
        ) {

            compareBox.innerHTML = `

                <div class="compare-loading">

                    Comparison images are incomplete.

                </div>

            `;

            return;

        }


        compareBox.innerHTML = `

            <div class="compare-container">


                <img
                    src="${escapeHTML(newImage)}"
                    class="compare-after"
                    alt="Roy Bari today"
                    referrerpolicy="no-referrer"
                >


                <div
                    class="compare-before"
                    style="width:50%;"
                >

                    <img
                        src="${escapeHTML(oldImage)}"
                        alt="Roy Bari historical photograph"
                        referrerpolicy="no-referrer"
                    >

                </div>


                <input
                    type="range"
                    min="0"
                    max="100"
                    value="50"
                    class="compare-slider"
                    aria-label="Compare historical and current photograph"
                >


                <span
                    class="compare-label compare-label-before"
                >
                    Then
                </span>


                <span
                    class="compare-label compare-label-after"
                >
                    Now
                </span>


            </div>

        `;


        const slider =
            compareBox.querySelector(
                ".compare-slider"
            );


        const before =
            compareBox.querySelector(
                ".compare-before"
            );


        if (
            slider &&
            before
        ) {

            slider.addEventListener(
                "input",
                function () {

                    before.style.width =
                        this.value + "%";

                }
            );

        }


        console.log(
            "Comparison loaded successfully."
        );

    }


    catch (error) {

        console.error(
            "COMPARISON FIREBASE ERROR:",
            error
        );


        compareBox.innerHTML = `

            <div class="compare-loading">

                Comparison could not be loaded.

            </div>

        `;

    }

}


/* =========================================================
   LOAD VIDEOS
   ========================================================= */

async function loadVideos() {

    if (!videoList) {

        return;

    }


    console.log(
        "Loading videos collection..."
    );


    try {

        const videosRef =
            collection(
                db,
                "videos"
            );


        const snapshot =
            await getDocs(
                videosRef
            );


        console.log(
            "Video documents:",
            snapshot.size
        );


        if (snapshot.empty) {

            videoList.innerHTML = `

                <div class="video-row">

                    <div class="play">
                        ▶
                    </div>


                    <div class="video-info">

                        <h4>
                            No films yet
                        </h4>


                        <p class="dur">
                            Films will appear here.
                        </p>

                    </div>

                </div>

            `;

            return;

        }


        let html = "";


        snapshot.forEach(
            function (doc) {

                const data =
                    doc.data();


                console.log(
                    "Video document:",
                    doc.id,
                    data
                );


                const title =
                    data.title ||
                    "Roy Bari Film";


                const description =
                    data.description ||
                    "";


                const year =
                    data.year ||
                    "";


                const duration =
                    data.duration ||
                    "";


                const link =
                    data.youtubeUrl ||
                    data.youtube ||
                    data.link ||
                    data.url ||
                    "";


                /*
                   Convert Google Drive link
                   to preview URL.
                */

                const videoUrl =
                    getGoogleDriveVideoUrl(
                        link
                    );


                /*
                   If there is no URL,
                   don't create a broken button.
                */

                if (!videoUrl) {

                    console.warn(
                        "Video has no valid link:",
                        doc.id
                    );

                    return;

                }


                html += `

                    <button
                        type="button"

                        class="video-row"

                        data-video-url="${escapeHTML(videoUrl)}"

                        data-video-title="${escapeHTML(title)}"
                    >


                        <div class="play">
                            ▶
                        </div>


                        <div class="video-info">


                            <h4>
                                ${escapeHTML(title)}
                            </h4>


                            ${
                                description

                                ?

                                `

                                <p>
                                    ${escapeHTML(description)}
                                </p>

                                `

                                :

                                ""

                            }


                            ${
                                year

                                ?

                                `

                                <p class="dur">
                                    ${escapeHTML(year)}
                                </p>

                                `

                                :

                                ""

                            }


                            ${
                                duration

                                ?

                                `

                                <p class="dur">
                                    ${escapeHTML(duration)}
                                </p>

                                `

                                :

                                ""

                            }


                        </div>


                    </button>

                `;

            }
        );


        /*
           If documents existed but none
           had a usable link.
        */

        if (!html) {

            videoList.innerHTML = `

                <div class="video-row">

                    <div class="play">
                        !
                    </div>


                    <div class="video-info">

                        <h4>
                            No playable films
                        </h4>


                        <p class="dur">
                            Please check the video links.
                        </p>

                    </div>

                </div>

            `;

            return;

        }


        videoList.innerHTML =
            html;


        /*
           VIDEO CLICK EVENTS
        */

        const videoRows =
            videoList.querySelectorAll(
                ".video-row"
            );


        videoRows.forEach(
            function (row) {

                row.addEventListener(
                    "click",
                    function () {

                        const videoUrl =
                            row.dataset.videoUrl;


                        const title =
                            row.dataset.videoTitle;


                        openVideoViewer(
                            videoUrl,
                            title
                        );

                    }
                );

            }
        );


        console.log(
            "Videos loaded successfully."
        );

    }


    catch (error) {

        console.error(
            "VIDEOS FIREBASE ERROR:",
            error
        );


        videoList.innerHTML = `

            <div class="video-row">

                <div class="play">
                    !
                </div>


                <div class="video-info">

                    <h4>
                        Videos could not be loaded.
                    </h4>


                    <p class="dur">
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                </div>

            </div>

        `;

    }

}


/* =========================================================
   VIDEO VIEWER
   ========================================================= */

function openVideoViewer(
    videoUrl,
    title
) {

    if (!videoUrl) {

        return;

    }


    /*
       Remove an existing viewer if one exists.
    */

    const existingViewer =
        document.querySelector(
            ".video-viewer"
        );


    if (existingViewer) {

        existingViewer.remove();

    }


    const viewer =
        document.createElement("div");


    viewer.className =
        "video-viewer";


    viewer.setAttribute(
        "role",
        "dialog"
    );


    viewer.setAttribute(
        "aria-modal",
        "true"
    );


    viewer.setAttribute(
        "aria-label",
        title || "Roy Bari film"
    );


    viewer.innerHTML = `

        <div
            class="video-viewer-backdrop"
        ></div>


        <div
            class="video-viewer-content"
        >


            <button
                type="button"
                class="video-viewer-close"
                aria-label="Close video"
            >
                ×
            </button>


            <div class="video-viewer-title">

                ${escapeHTML(title)}

            </div>


            <div class="video-frame">

                <iframe
                    src="${escapeHTML(videoUrl)}"

                    title="${escapeHTML(title)}"

                    allow="autoplay; fullscreen; picture-in-picture"

                    allowfullscreen

                    referrerpolicy="no-referrer"
                ></iframe>

            </div>


        </div>

    `;


    document.body.appendChild(
        viewer
    );


    document.body.style.overflow =
        "hidden";


    const closeButton =
        viewer.querySelector(
            ".video-viewer-close"
        );


    const backdrop =
        viewer.querySelector(
            ".video-viewer-backdrop"
        );


    function closeViewer() {

        viewer.remove();

        document.body.style.overflow =
            "";

        document.removeEventListener(
            "keydown",
            handleKeydown
        );

    }


    function handleKeydown(event) {

        if (event.key === "Escape") {

            event.preventDefault();

            closeViewer();

        }

    }


    closeButton.addEventListener(
        "click",
        closeViewer
    );


    backdrop.addEventListener(
        "click",
        closeViewer
    );


    document.addEventListener(
        "keydown",
        handleKeydown
    );


    closeButton.focus();

}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeGallery() {

    console.log(
        "Gallery page initialized"
    );


    await Promise.allSettled([

        loadGallery(),

        loadComparison(),

        loadVideos()

    ]);


    console.log(
        "Gallery initialization complete."
    );

}


/* =========================================================
   START
   ========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeGallery
    );

}
else {

    initializeGallery();

}