/* =========================================================
   ROY BARI — GALLERY
   FIRESTORE + GOOGLE DRIVE

   COLLECTIONS:

   gallery
   videos
   comparisons

   GALLERY IMAGE FIELD:

   image
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

const galleryPrev =
    document.getElementById("gallery-prev");

const galleryNext =
    document.getElementById("gallery-next");

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


let activeLightbox = null;


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
                isOpen
                    ? "true"
                    : "false"
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


    /* ---------------------------------------------
       /file/d/FILE_ID/view
       --------------------------------------------- */

    let match =
        url.match(
            /drive\.google\.com\/file\/d\/([^/?#]+)/
        );


    if (match) {

        return match[1];

    }


    /* ---------------------------------------------
       open?id=FILE_ID
       --------------------------------------------- */

    match =
        url.match(
            /drive\.google\.com\/open\?id=([^&#]+)/
        );


    if (match) {

        return match[1];

    }


    /* ---------------------------------------------
       uc?id=FILE_ID
       --------------------------------------------- */

    match =
        url.match(
            /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&#]+)/
        );


    if (match) {

        return match[1];

    }


    /* ---------------------------------------------
       thumbnail?id=FILE_ID
       --------------------------------------------- */

    match =
        url.match(
            /drive\.google\.com\/thumbnail\?[^#]*id=([^&#]+)/
        );


    if (match) {

        return match[1];

    }


    return "";

}


/* =========================================================
   GOOGLE DRIVE IMAGE URL
   ========================================================= */

function getGoogleDriveImageUrl(link) {

    if (!link) {

        return "";

    }


    const fileId =
        getGoogleDriveFileId(link);


    /*
       If normal image URL,
       return it directly.
    */

    if (!fileId) {

        return String(link).trim();

    }


    return (

        "https://drive.google.com/uc?export=view&id=" +

        encodeURIComponent(fileId)

    );

}


/* =========================================================
   GOOGLE DRIVE THUMBNAIL
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

        "&sz=w1600"

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


    if (!fileId) {

        return String(link).trim();

    }


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
   HORIZONTAL GALLERY SCROLL
   ========================================================= */

function getGalleryScrollAmount() {

    if (!galleryGrid) {

        return 300;

    }


    const card =
        galleryGrid.querySelector(
            ".gallery-card"
        );


    if (!card) {

        return 300;

    }


    const style =
        window.getComputedStyle(
            galleryGrid
        );


    const gap =
        parseFloat(style.gap) || 16;


    return (

        card.getBoundingClientRect().width +

        gap

    );

}


/* =========================================================
   UPDATE GALLERY ARROWS
   ========================================================= */

function updateGalleryArrows() {

    if (
        !galleryGrid ||
        !galleryPrev ||
        !galleryNext
    ) {

        return;

    }


    const maxScroll =
        galleryGrid.scrollWidth -
        galleryGrid.clientWidth;


    /*
       If everything fits on screen,
       hide both buttons.
    */

    if (maxScroll <= 5) {

        galleryPrev.classList.add(
            "is-hidden"
        );

        galleryNext.classList.add(
            "is-hidden"
        );

        return;

    }


    /*
       Previous
    */

    if (
        galleryGrid.scrollLeft <= 5
    ) {

        galleryPrev.style.opacity =
            "0.35";

    }
    else {

        galleryPrev.style.opacity =
            "1";

    }


    /*
       Next
    */

    if (
        galleryGrid.scrollLeft >=
        maxScroll - 5
    ) {

        galleryNext.style.opacity =
            "0.35";

    }
    else {

        galleryNext.style.opacity =
            "1";

    }


    galleryPrev.classList.remove(
        "is-hidden"
    );

    galleryNext.classList.remove(
        "is-hidden"
    );

}


/* =========================================================
   SETUP HORIZONTAL GALLERY
   ========================================================= */

function setupGalleryHorizontalScroll() {

    if (!galleryGrid) {

        return;

    }


    if (galleryPrev) {

        galleryPrev.addEventListener(
            "click",
            function () {

                galleryGrid.scrollBy({

                    left:
                        -getGalleryScrollAmount(),

                    behavior:
                        "smooth"

                });

            }
        );

    }


    if (galleryNext) {

        galleryNext.addEventListener(
            "click",
            function () {

                galleryGrid.scrollBy({

                    left:
                        getGalleryScrollAmount(),

                    behavior:
                        "smooth"

                });

            }
        );

    }


    galleryGrid.addEventListener(
        "scroll",
        updateGalleryArrows
    );


    window.addEventListener(
        "resize",
        updateGalleryArrows
    );


    /*
       Mouse wheel support.
       Shift + wheel / trackpad can scroll naturally.
    */

    updateGalleryArrows();

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

        const galleryRef =
            collection(
                db,
                "gallery"
            );


        const snapshot =
            await getDocs(
                galleryRef
            );


        console.log(
            "Gallery documents:",
            snapshot.size
        );


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

            updateGalleryArrows();

            return;

        }


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
                   Skip videos.
                */

                if (
                    data.type &&
                    String(
                        data.type
                    ).toLowerCase() === "video"
                ) {

                    console.log(
                        "Skipping video:",
                        doc.id
                    );

                    return;

                }


                /*
                   IMPORTANT

                   Firestore now uses:

                   image

                   Old fields are kept as
                   fallback for compatibility.
                */

                const imageLink =

                    data.image ||

                    data.imageUrl ||

                    data.link ||

                    data.url ||

                    "";


                /*
                   Skip documents without image.
                */

                if (!imageLink) {

                    console.warn(
                        "Gallery image missing:",
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

                    image:
                        imageLink

                });

            }
        );


        /*
           SORT BY YEAR
           NEWEST FIRST
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


        if (!galleryItems.length) {

            galleryGrid.innerHTML = `

                <div class="gallery-empty">

                    <h3>
                        No photographs yet
                    </h3>

                    <p>
                        Add photographs with
                        an image field.
                    </p>

                </div>

            `;

            updateGalleryArrows();

            return;

        }


        /*
           RESET LIGHTBOX
        */

        lightboxState.items = [];


        let html = "";


        /*
           CREATE EVERY IMAGE

           IMPORTANT:
           There is NO limit of 4 here.

           If Firestore has 5 images,
           all 5 are created.
        */

        galleryItems.forEach(
            function (item, index) {

                const imageUrl =
                    getGoogleDriveImageUrl(
                        item.image
                    );


                const thumbnailUrl =
                    getGoogleDriveThumbnailUrl(
                        item.image
                    );


                if (!imageUrl) {

                    return;

                }


                const lightboxIndex =
                    lightboxState.items.length;


                lightboxState.items.push({

                    fullImage:
                        imageUrl,

                    fallbackImage:
                        thumbnailUrl,

                    title:
                        item.title

                });


                html += `

                    <article
                        class="gallery-card"
                        data-category="${escapeHTML(item.category)}"
                    >


                        <div
                            class="gallery-image"
                        >

                            <img
                                src="${escapeHTML(imageUrl)}"

                                data-full-image="${escapeHTML(imageUrl)}"

                                data-fallback="${escapeHTML(thumbnailUrl)}"

                                data-lightbox-index="${lightboxIndex}"

                                alt="${escapeHTML(item.title)}"

                                loading="${
                                    index < 4
                                        ? "eager"
                                        : "lazy"
                                }"

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

                        </div>


                        <div
                            class="gallery-content"
                        >


                            <div
                                class="gallery-meta"
                            >

                                ${escapeHTML(
                                    item.category
                                )}

                                ${
                                    item.year
                                    ?

                                    `

                                        <span>
                                            ·
                                        </span>

                                        ${escapeHTML(
                                            item.year
                                        )}

                                    `

                                    :

                                    ""

                                }

                            </div>


                            <h3>

                                ${escapeHTML(
                                    item.title
                                )}

                            </h3>


                            ${
                                item.description

                                ?

                                `

                                    <p>
                                        ${escapeHTML(
                                            item.description
                                        )}
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
           INSERT ALL CARDS
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
                   Already loaded
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

                        },
                        {
                            once: true
                        }
                    );

                }


                /*
                   IMAGE ERROR

                   Try Drive thumbnail.
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

                        const index =
                            parseInt(
                                image.dataset.lightboxIndex,
                                10
                            );


                        openImageViewer(
                            index,
                            image
                        );

                    }
                );

            }
        );


        /*
           VIEW BUTTON
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


                        const index =
                            parseInt(
                                button.dataset.lightboxIndex,
                                10
                            );


                        openImageViewer(
                            index,
                            button
                        );

                    }
                );

            }
        );


        /*
           SETUP HORIZONTAL SCROLL
        */

        updateGalleryArrows();


        /*
           Wait for image layout before
           calculating scroll width.
        */

        requestAnimationFrame(
            function () {

                updateGalleryArrows();

            }
        );


        console.log(
            "Gallery loaded successfully."
        );

        console.log(
            "Total gallery images:",
            galleryItems.length
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
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    }

}


/* =========================================================
   FULLSCREEN IMAGE VIEWER
   ========================================================= */

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

        skipFocusRestore:
            true

    });


    const lightbox =
        document.createElement(
            "div"
        );


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
        >
        </div>


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


            <div
                class="gallery-lightbox-frame"
            >

                <div
                    class="gallery-lightbox-spinner"
                >
                </div>


                <img
                    class="gallery-lightbox-image"

                    alt=""

                    referrerpolicy="no-referrer"
                >

            </div>


            <div
                class="gallery-lightbox-title"
            >
            </div>

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


    frame.classList.remove(
        "has-error"
    );


    image.classList.remove(
        "is-loaded"
    );


    image.dataset.fallbackUsed =
        "";


    image.alt =
        item.title ||
        "Roy Bari photograph";


    titleBox.textContent =
        item.title ||
        "";


    image.onload =
        function () {

            frame.classList.remove(
                "is-loading"
            );

            image.classList.add(
                "is-loaded"
            );

        };


    image.onerror =
        function () {

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

        };


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
        (
            index + total
        ) % total;


    lightboxState.currentIndex =
        wrappedIndex;


    renderLightboxItem(
        wrappedIndex
    );


    updateLightboxNavVisibility();

}


/* =========================================================
   LIGHTBOX NAVIGATION
   ========================================================= */

function updateLightboxNavVisibility() {

    if (!activeLightbox) {

        return;

    }


    const show =
        lightboxState.items.length > 1;


    activeLightbox
        .querySelectorAll(
            ".gallery-lightbox-nav"
        )
        .forEach(
            function (button) {

                button.style.display =
                    show
                        ? "flex"
                        : "none";

            }
        );

}


/* =========================================================
   LIGHTBOX KEYBOARD
   ========================================================= */

function lightboxKeydownHandler(event) {

    if (
        event.key === "Escape"
    ) {

        event.preventDefault();

        closeImageViewer();

        return;

    }


    if (
        event.key === "ArrowLeft"
    ) {

        event.preventDefault();

        showLightboxItem(
            lightboxState.currentIndex - 1
        );

        return;

    }


    if (
        event.key === "ArrowRight"
    ) {

        event.preventDefault();

        showLightboxItem(
            lightboxState.currentIndex + 1
        );

        return;

    }


    if (
        event.key === "Tab"
    ) {

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
        )
        .filter(
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
        focusable[
            focusable.length - 1
        ];


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
   CLOSE IMAGE VIEWER
   ========================================================= */

function closeImageViewer(
    options
) {

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

        typeof
            lightboxState.triggerElement.focus ===
            "function"
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


                const videoUrl =
                    getGoogleDriveVideoUrl(
                        link
                    );


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
                                        ${escapeHTML(
                                            description
                                        )}
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
                                        ${escapeHTML(
                                            year
                                        )}
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
                                        ${escapeHTML(
                                            duration
                                        )}
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


    const existingViewer =
        document.querySelector(
            ".video-viewer"
        );


    if (existingViewer) {

        existingViewer.remove();

    }


    const viewer =
        document.createElement(
            "div"
        );


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
        title ||
        "Roy Bari film"
    );


    viewer.innerHTML = `

        <div
            class="video-viewer-backdrop"
        >
        </div>


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


            <div
                class="video-viewer-title"
            >

                ${escapeHTML(title)}

            </div>


            <div
                class="video-frame"
            >

                <iframe
                    src="${escapeHTML(videoUrl)}"

                    title="${escapeHTML(title)}"

                    allow="autoplay; fullscreen; picture-in-picture"

                    allowfullscreen

                    referrerpolicy="no-referrer"
                >
                </iframe>

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

        if (
            event.key === "Escape"
        ) {

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


    /*
       Setup arrows first.
    */

    setupGalleryHorizontalScroll();


    /*
       Load everything.
    */

    await Promise.allSettled([

        loadGallery(),

        loadComparison(),

        loadVideos()

    ]);


    /*
       Recalculate after gallery loads.
    */

    updateGalleryArrows();


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