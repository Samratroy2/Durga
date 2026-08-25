/* =========================================================
   ROY BARI — GALLERY
   =========================================================

   FIRESTORE COLLECTIONS

   gallery
   videos
   comparisons


   COMPARISON FIELDS

   title
   description
   year
   oldImage
   newImage

   SIMPLE VERSION:

   THEN | NOW

   No slider.
   No overlay.
   No dragging.
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

const galleryGrid =
    document.getElementById(
        "gallery-grid"
    );


const galleryPrev =
    document.getElementById(
        "gallery-prev"
    );


const galleryNext =
    document.getElementById(
        "gallery-next"
    );


const compareBox =
    document.getElementById(
        "gallery-compare"
    );


const videoList =
    document.getElementById(
        "video-list"
    );


const navToggle =
    document.getElementById(
        "nav-toggle"
    );


const navLinks =
    document.getElementById(
        "nav-links"
    );


/* =========================================================
   LIGHTBOX ELEMENTS
   ========================================================= */

const lightbox =
    document.getElementById(
        "simple-lightbox"
    );


const lightboxImage =
    document.getElementById(
        "simple-lightbox-image"
    );


const lightboxTitle =
    document.getElementById(
        "simple-lightbox-title"
    );


const lightboxClose =
    document.getElementById(
        "simple-lightbox-close"
    );


/* =========================================================
   VIDEO ELEMENTS
   ========================================================= */

const videoViewer =
    document.getElementById(
        "video-viewer"
    );


const videoFrame =
    document.getElementById(
        "video-frame"
    );


const videoViewerClose =
    document.getElementById(
        "video-viewer-close"
    );


/* =========================================================
   STATE
   ========================================================= */

let comparisonItems = [];

let comparisonIndex = 0;


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

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
   GOOGLE DRIVE FILE ID
   ========================================================= */

function getGoogleDriveFileId(
    link
) {

    if (!link) {

        return "";

    }


    const url =
        String(link).trim();


    /*

       https://drive.google.com/file/d/FILE_ID/view

    */

    let match =
        url.match(
            /drive\.google\.com\/file\/d\/([^/?#]+)/
        );


    if (match) {

        return match[1];

    }


    /*

       https://drive.google.com/open?id=FILE_ID

    */

    match =
        url.match(
            /drive\.google\.com\/open\?id=([^&#]+)/
        );


    if (match) {

        return match[1];

    }


    /*

       https://drive.google.com/uc?id=FILE_ID

    */

    match =
        url.match(
            /drive\.google\.com\/uc\?(?:[^#]*&)?id=([^&#]+)/
        );


    if (match) {

        return match[1];

    }


    /*

       https://drive.google.com/thumbnail?id=FILE_ID

    */

    match =
        url.match(
            /drive\.google\.com\/thumbnail\?[^#]*id=([^&#]+)/
        );


    if (match) {

        return match[1];

    }


    /*
       If it already looks like a file ID.
    */

    if (
        !url.includes("/") &&
        !url.includes(":") &&
        url.length > 15
    ) {

        return url;

    }


    return "";

}


/* =========================================================
   GOOGLE DRIVE IMAGE URL
   ========================================================= */

function getGoogleDriveImageUrl(
    link
) {

    if (!link) {

        return "";

    }


    const fileId =
        getGoogleDriveFileId(
            link
        );


    if (!fileId) {

        return String(
            link
        ).trim();

    }


    return (
        "https://drive.google.com/uc" +
        "?export=view&id=" +
        encodeURIComponent(
            fileId
        )
    );

}


/* =========================================================
   GOOGLE DRIVE THUMBNAIL
   ========================================================= */

function getGoogleDriveThumbnailUrl(
    link,
    size = 2000
) {

    if (!link) {

        return "";

    }


    const fileId =
        getGoogleDriveFileId(
            link
        );


    if (!fileId) {

        return String(
            link
        ).trim();

    }


    return (
        "https://drive.google.com/thumbnail" +
        "?id=" +
        encodeURIComponent(
            fileId
        ) +
        "&sz=w" +
        encodeURIComponent(
            size
        )
    );

}


/* =========================================================
   GOOGLE DRIVE VIDEO URL
   ========================================================= */

function getGoogleDriveVideoUrl(
    link
) {

    if (!link) {

        return "";

    }


    const value =
        String(link).trim();


    /*
       YouTube
    */

    if (
        value.includes(
            "youtube.com"
        ) ||
        value.includes(
            "youtu.be"
        )
    ) {

        const youtubeId =
            getYouTubeVideoId(
                value
            );


        if (youtubeId) {

            return (
                "https://www.youtube.com/embed/" +
                encodeURIComponent(
                    youtubeId
                ) +
                "?rel=0"
            );

        }

    }


    /*
       Google Drive
    */

    const fileId =
        getGoogleDriveFileId(
            value
        );


    if (!fileId) {

        return value;

    }


    return (
        "https://drive.google.com/file/d/" +
        encodeURIComponent(
            fileId
        ) +
        "/preview"
    );

}


/* =========================================================
   YOUTUBE ID
   ========================================================= */

function getYouTubeVideoId(
    url
) {

    if (!url) {

        return "";

    }


    let match =
        String(url).match(
            /youtu\.be\/([^?&#/]+)/
        );


    if (match) {

        return match[1];

    }


    match =
        String(url).match(
            /youtube\.com\/watch\?[^#]*v=([^&#]+)/
        );


    if (match) {

        return match[1];

    }


    match =
        String(url).match(
            /youtube\.com\/embed\/([^?&#/]+)/
        );


    if (match) {

        return match[1];

    }


    return "";

}


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

if (
    navToggle &&
    navLinks
) {

    navToggle.addEventListener(
        "click",
        function () {

            const isOpen =
                navLinks.classList.toggle(
                    "open"
                );


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
   GALLERY SCROLL AMOUNT
   ========================================================= */

function getGalleryScrollAmount() {

    if (
        !galleryGrid
    ) {

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
        parseFloat(
            style.gap
        ) || 20;


    return (
        card.getBoundingClientRect().width +
        gap
    );

}


/* =========================================================
   GALLERY ARROWS
   ========================================================= */

if (
    galleryPrev &&
    galleryGrid
) {

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


if (
    galleryNext &&
    galleryGrid
) {

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


/* =========================================================
   LOAD GALLERY
   ========================================================= */

async function loadGallery() {

    if (
        !galleryGrid
    ) {

        return;

    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "gallery"
                )
            );


        if (
            snapshot.empty
        ) {

            galleryGrid.innerHTML = `

                <div class="gallery-loading">

                    <p>
                        No photographs available yet.
                    </p>

                </div>

            `;

            return;

        }


        const items = [];


        snapshot.forEach(
            function (doc) {

                const data =
                    doc.data();


                /*
                   Skip videos stored in gallery.
                */

                if (
                    data.type &&
                    String(
                        data.type
                    ).toLowerCase() ===
                    "video"
                ) {

                    return;

                }


                const image =
                    data.image ||
                    data.imageUrl ||
                    data.link ||
                    data.url ||
                    "";


                if (!image) {

                    return;

                }


                items.push({

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

                    image

                });

            }
        );


        /*
           Newest year first.
        */

        items.sort(
            function (
                a,
                b
            ) {

                return (
                    (parseInt(b.year) || 0) -
                    (parseInt(a.year) || 0)
                );

            }
        );


        if (
            !items.length
        ) {

            galleryGrid.innerHTML = `

                <div class="gallery-loading">

                    <p>
                        No photographs available yet.
                    </p>

                </div>

            `;

            return;

        }


        let html = "";


        items.forEach(
            function (
                item
            ) {

                const imageUrl =
                    getGoogleDriveImageUrl(
                        item.image
                    );


                const thumbnailUrl =
                    getGoogleDriveThumbnailUrl(
                        item.image,
                        1600
                    );


                html += `

                    <article
                        class="gallery-card"
                    >

                        <div
                            class="gallery-image"
                        >

                            <img

                                src="${escapeHTML(
                                    thumbnailUrl ||
                                    imageUrl
                                )}"

                                alt="${escapeHTML(
                                    item.title
                                )}"

                                data-full="${escapeHTML(
                                    imageUrl
                                )}"

                                data-title="${escapeHTML(
                                    item.title
                                )}"

                                loading="lazy"

                                referrerpolicy="no-referrer"

                                draggable="false"
                            >


                            <button
                                type="button"
                                class="gallery-view-button"
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
                                        ? `
                                            <span>
                                                ·
                                            </span>

                                            ${escapeHTML(
                                                item.year
                                            )}
                                          `
                                        : ""
                                }

                            </div>


                            <h3>

                                ${escapeHTML(
                                    item.title
                                )}

                            </h3>


                            ${
                                item.description
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                item.description
                                            )}
                                        </p>
                                      `
                                    : ""
                            }

                        </div>

                    </article>

                `;

            }
        );


        galleryGrid.innerHTML =
            html;


        /*
           Image click.
        */

        galleryGrid
            .querySelectorAll(
                ".gallery-card"
            )
            .forEach(
                function (card) {

                    const image =
                        card.querySelector(
                            "img"
                        );


                    const button =
                        card.querySelector(
                            ".gallery-view-button"
                        );


                    function open() {

                        openLightbox(

                            image.dataset.full,

                            image.dataset.title

                        );

                    }


                    image.addEventListener(
                        "click",
                        open
                    );


                    button.addEventListener(
                        "click",
                        open
                    );

                }
            );

    }
    catch (error) {

        console.error(
            "GALLERY ERROR:",
            error
        );


        galleryGrid.innerHTML = `

            <div class="gallery-loading">

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
   COMPARISON IMAGE GETTER
   ========================================================= */

function getComparisonImage(
    data,
    type
) {

    if (!data) {

        return "";

    }


    if (
        type === "old"
    ) {

        return (
            data.oldImage ||
            data.before ||
            data.oldLink ||
            data.old ||
            ""
        );

    }


    return (
        data.newImage ||
        data.after ||
        data.newLink ||
        data.new ||
        ""
    );

}


/* =========================================================
   LOAD COMPARISONS
   ========================================================= */

async function loadComparisons() {

    if (
        !compareBox
    ) {

        return;

    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "comparisons"
                )
            );


        comparisonItems = [];


        snapshot.forEach(
            function (doc) {

                const data =
                    doc.data();


                const oldImage =
                    getComparisonImage(
                        data,
                        "old"
                    );


                const newImage =
                    getComparisonImage(
                        data,
                        "new"
                    );


                /*
                   Both images are required.
                */

                if (
                    !oldImage ||
                    !newImage
                ) {

                    return;

                }


                comparisonItems.push({

                    id:
                        doc.id,

                    title:
                        data.title ||
                        "Roy Bari — Then & Now",

                    description:
                        data.description ||
                        "",

                    year:
                        data.year ||
                        "",

                    oldImage,

                    newImage

                });

            }
        );


        /*
           Sort by year.
        */

        comparisonItems.sort(
            function (
                a,
                b
            ) {

                return (
                    (parseInt(b.year) || 0) -
                    (parseInt(a.year) || 0)
                );

            }
        );


        if (
            !comparisonItems.length
        ) {

            compareBox.innerHTML = `

                <div
                    class="comparison-error"
                >

                    <h3>
                        No comparison images found
                    </h3>

                    <p>

                        Add a document to the
                        <strong>
                            comparisons
                        </strong>
                        collection with:

                        <br><br>

                        oldImage

                        <br>

                        newImage

                    </p>

                </div>

            `;

            return;

        }


        comparisonIndex =
            0;


        renderComparison(
            comparisonIndex
        );

    }
    catch (error) {

        console.error(
            "COMPARISON ERROR:",
            error
        );


        compareBox.innerHTML = `

            <div
                class="comparison-error"
            >

                <h3>
                    Comparison could not be loaded
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
   RENDER SIMPLE SIDE-BY-SIDE COMPARISON
   ========================================================= */

function renderComparison(
    index
) {

    if (
        !comparisonItems.length ||
        !compareBox
    ) {

        return;

    }


    const total =
        comparisonItems.length;


    comparisonIndex =
        (
            index +
            total
        ) % total;


    const item =
        comparisonItems[
            comparisonIndex
        ];


    const oldImage =
        getGoogleDriveThumbnailUrl(
            item.oldImage,
            2400
        );


    const newImage =
        getGoogleDriveThumbnailUrl(
            item.newImage,
            2400
        );


    const oldDirect =
        getGoogleDriveImageUrl(
            item.oldImage
        );


    const newDirect =
        getGoogleDriveImageUrl(
            item.newImage
        );


    compareBox.innerHTML = `

        <div
            class="comparison-item"
        >


            <!-- =============================================
                 TWO IMAGES
                 ============================================= -->

            <div
                class="comparison-images"
            >


                <!-- =========================================
                     THEN
                     ========================================= -->

                <div
                    class="comparison-photo"
                >

                    <div
                        class="comparison-label"
                    >
                        Then
                    </div>


                    <img

                        src="${escapeHTML(
                            oldImage
                        )}"

                        alt="${escapeHTML(
                            item.title +
                            " — Then"
                        )}"

                        data-direct="${escapeHTML(
                            oldDirect
                        )}"

                        referrerpolicy="no-referrer"

                        loading="eager"

                        draggable="false"
                    >

                </div>


                <!-- =========================================
                     NOW
                     ========================================= -->

                <div
                    class="comparison-photo"
                >

                    <div
                        class="comparison-label"
                    >
                        Now
                    </div>


                    <img

                        src="${escapeHTML(
                            newImage
                        )}"

                        alt="${escapeHTML(
                            item.title +
                            " — Now"
                        )}"

                        data-direct="${escapeHTML(
                            newDirect
                        )}"

                        referrerpolicy="no-referrer"

                        loading="eager"

                        draggable="false"
                    >

                </div>


            </div>


            <!-- =============================================
                 INFORMATION
                 ============================================= -->

            <div
                class="comparison-info"
            >

                <h3>

                    ${escapeHTML(
                        item.title
                    )}

                </h3>


                ${
                    item.description
                        ? `

                            <p>

                                ${escapeHTML(
                                    item.description
                                )}

                            </p>

                          `
                        : ""
                }


                ${
                    item.year
                        ? `

                            <div
                                class="comparison-year"
                            >

                                ${escapeHTML(
                                    item.year
                                )}

                            </div>

                          `
                        : ""
                }

            </div>


            <!-- =============================================
                 NAVIGATION
                 Only appears if there are multiple
                 comparisons.
                 ============================================= -->

            ${
                total > 1
                    ? `

                        <div
                            class="comparison-navigation"
                        >

                            <button
                                type="button"
                                id="comparison-prev"
                            >
                                Previous
                            </button>


                            <button
                                type="button"
                                id="comparison-next"
                            >
                                Next
                            </button>

                        </div>

                      `
                    : ""
            }


        </div>

    `;


    /*
       Image fallback.
    */

    compareBox
        .querySelectorAll(
            ".comparison-photo img"
        )
        .forEach(
            function (image) {

                image.addEventListener(
                    "error",
                    function () {

                        const fallback =
                            image.dataset.direct;


                        if (
                            fallback &&
                            image.src !== fallback &&
                            !image.dataset.used
                        ) {

                            image.dataset.used =
                                "true";

                            image.src =
                                fallback;

                        }

                    }
                );


                /*
                   Clicking the comparison image
                   also opens the full image.
                */

                image.addEventListener(
                    "click",
                    function () {

                        openLightbox(

                            image.src,

                            image.alt

                        );

                    }
                );

            }
        );


    /*
       Previous.
    */

    const previous =
        document.getElementById(
            "comparison-prev"
        );


    if (
        previous
    ) {

        previous.addEventListener(
            "click",
            function () {

                renderComparison(
                    comparisonIndex -
                    1
                );

            }
        );

    }


    /*
       Next.
    */

    const next =
        document.getElementById(
            "comparison-next"
        );


    if (
        next
    ) {

        next.addEventListener(
            "click",
            function () {

                renderComparison(
                    comparisonIndex +
                    1
                );

            }
        );

    }

}


/* =========================================================
   LOAD VIDEOS
   ========================================================= */

async function loadVideos() {

    if (
        !videoList
    ) {

        return;

    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "videos"
                )
            );


        if (
            snapshot.empty
        ) {

            videoList.innerHTML = `

                <div class="video-row">

                    <div class="play">
                        ▶
                    </div>

                    <div class="video-info">

                        <h4>
                            No films yet
                        </h4>

                        <p>
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


                const link =
                    data.youtubeUrl ||
                    data.youtube ||
                    data.link ||
                    data.url ||
                    data.videoUrl ||
                    "";


                if (!link) {

                    return;

                }


                const videoUrl =
                    getGoogleDriveVideoUrl(
                        link
                    );


                html += `

                    <button

                        type="button"

                        class="video-row"

                        data-video-url="${escapeHTML(
                            videoUrl
                        )}"

                        data-video-title="${escapeHTML(
                            data.title ||
                            "Roy Bari Film"
                        )}"
                    >

                        <div class="play">
                            ▶
                        </div>


                        <div class="video-info">

                            <h4>

                                ${escapeHTML(
                                    data.title ||
                                    "Roy Bari Film"
                                )}

                            </h4>


                            ${
                                data.description
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                data.description
                                            )}
                                        </p>
                                      `
                                    : ""
                            }


                            ${
                                data.year
                                    ? `
                                        <p class="dur">
                                            ${escapeHTML(
                                                data.year
                                            )}
                                        </p>
                                      `
                                    : ""
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

                    </div>

                </div>

            `;

            return;

        }


        videoList.innerHTML =
            html;


        videoList
            .querySelectorAll(
                ".video-row"
            )
            .forEach(
                function (row) {

                    row.addEventListener(
                        "click",
                        function () {

                            openVideo(

                                row.dataset.videoUrl,

                                row.dataset.videoTitle

                            );

                        }
                    );

                }
            );

    }
    catch (error) {

        console.error(
            "VIDEO ERROR:",
            error
        );


        videoList.innerHTML = `

            <div class="video-row">

                <div class="play">
                    !
                </div>

                <div class="video-info">

                    <h4>
                        Films could not be loaded
                    </h4>

                    <p>
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
   IMAGE LIGHTBOX
   ========================================================= */

function openLightbox(
    image,
    title
) {

    if (
        !lightbox ||
        !lightboxImage
    ) {

        return;

    }


    lightboxImage.src =
        image;


    lightboxImage.alt =
        title || "";


    if (
        lightboxTitle
    ) {

        lightboxTitle.textContent =
            title || "";

    }


    lightbox.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE LIGHTBOX
   ========================================================= */

function closeLightbox() {

    if (
        !lightbox
    ) {

        return;

    }


    lightbox.classList.remove(
        "open"
    );


    lightboxImage.src =
        "";


    document.body.style.overflow =
        "";

}


/* =========================================================
   LIGHTBOX EVENTS
   ========================================================= */

if (
    lightboxClose
) {

    lightboxClose.addEventListener(
        "click",
        closeLightbox
    );

}


if (
    lightbox
) {

    lightbox.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                lightbox
            ) {

                closeLightbox();

            }

        }
    );

}


/* =========================================================
   VIDEO VIEWER
   ========================================================= */

function openVideo(
    url,
    title
) {

    if (
        !videoViewer ||
        !videoFrame
    ) {

        return;

    }


    videoFrame.src =
        url;


    videoFrame.title =
        title || "Roy Bari Film";


    videoViewer.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE VIDEO
   ========================================================= */

function closeVideo() {

    if (
        !videoViewer ||
        !videoFrame
    ) {

        return;

    }


    videoViewer.classList.remove(
        "open"
    );


    videoFrame.src =
        "";


    document.body.style.overflow =
        "";

}


/* =========================================================
   VIDEO CLOSE BUTTON
   ========================================================= */

if (
    videoViewerClose
) {

    videoViewerClose.addEventListener(
        "click",
        closeVideo
    );

}


/* =========================================================
   VIDEO BACKGROUND CLICK
   ========================================================= */

if (
    videoViewer
) {

    videoViewer.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                videoViewer
            ) {

                closeVideo();

            }

        }
    );

}


/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeLightbox();

            closeVideo();

        }

    }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializeGallery() {

    console.log(
        "ROY BARI GALLERY START"
    );


    await Promise.all([

        loadGallery(),

        loadComparisons(),

        loadVideos()

    ]);


    console.log(
        "ROY BARI GALLERY READY"
    );

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
        initializeGallery
    );

}
else {

    initializeGallery();

}