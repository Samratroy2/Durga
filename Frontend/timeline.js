/* =========================================================
   ROY BARI — FAMILY TIMELINE
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
   ELEMENT
   ========================================================= */

const timeline =
    document.getElementById(
        "family-timeline"
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

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


/* =========================================================
   GET YEAR
   ========================================================= */

function getYear(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }


    return String(value).trim();

}


/* =========================================================
   YEAR FOR SORTING
   ========================================================= */

function getSortableYear(year) {

    const value =
        parseInt(
            year,
            10
        );


    if (
        Number.isNaN(value)
    ) {

        return Infinity;

    }


    return value;

}


/* =========================================================
   LOAD TIMELINE
   ========================================================= */

async function loadTimeline() {

    if (!timeline) {

        console.error(
            "ROY BARI: #family-timeline not found."
        );

        return;

    }


    try {


        /* =================================================
           FIRESTORE
           ================================================= */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "timeline"
                )
            );


        /* =================================================
           NO DATA
           ================================================= */

        if (
            snapshot.empty
        ) {

            timeline.innerHTML = `

                <div class="timeline-empty">

                    <div class="eyebrow">
                        Family Archive
                    </div>

                    <h3>
                        No timeline entries yet
                    </h3>

                    <p>

                        Family history entries
                        will appear here once
                        they are added to Firestore.

                    </p>

                </div>

            `;

            return;

        }


        /* =================================================
           GET DATA
           ================================================= */

        const entries = [];


        snapshot.forEach(
            doc => {

                const data =
                    doc.data();


                entries.push({

                    id:
                        doc.id,

                    year:
                        getYear(
                            data.year
                        ),

                    title:
                        data.title ||
                        data.name ||
                        data.event ||
                        "Untitled",

                    description:
                        data.description ||
                        data.details ||
                        data.story ||
                        data.content ||
                        "",

                    category:
                        data.category ||
                        data.type ||
                        "",

                    person:
                        data.person ||
                        data.familyMember ||
                        data.member ||
                        "",

                    image:
                        data.image ||
                        data.imageUrl ||
                        ""

                });

            }
        );


        /* =================================================
           SORT BY YEAR
           ================================================= */

        entries.sort(
            (a, b) => {

                return (
                    getSortableYear(
                        a.year
                    ) -
                    getSortableYear(
                        b.year
                    )
                );

            }
        );


        /* =================================================
           BUILD HTML
           ================================================= */

        let html = "";


        entries.forEach(
            (entry, index) => {

                const imageHTML =
                    entry.image &&
                    entry.image.trim() !== ""
                        ? `

                            <div class="timeline-image">

                                <img
                                    src="${escapeHTML(
                                        entry.image
                                    )}"
                                    alt="${escapeHTML(
                                        entry.title
                                    )}"
                                    loading="lazy"
                                >

                            </div>

                          `
                        : "";


                const categoryHTML =
                    entry.category
                        ? `

                            <div class="timeline-category">

                                ${escapeHTML(
                                    entry.category
                                )}

                            </div>

                          `
                        : "";


                const personHTML =
                    entry.person
                        ? `

                            <div class="timeline-person">

                                — ${escapeHTML(
                                    entry.person
                                )}

                            </div>

                          `
                        : "";


                html += `

                    <article
                        class="timeline-item"
                        data-index="${index}"
                    >

                        <div class="timeline-year">

                            ${escapeHTML(
                                entry.year || "—"
                            )}

                        </div>


                        <div
                            class="timeline-dot"
                            aria-hidden="true"
                        ></div>


                        <div class="timeline-content">

                            <div class="timeline-number">

                                ${String(
                                    index + 1
                                ).padStart(
                                    2,
                                    "0"
                                )}

                            </div>


                            ${categoryHTML}


                            <h4>

                                ${escapeHTML(
                                    entry.title
                                )}

                            </h4>


                            ${
                                entry.description
                                    ? `

                                        <p>

                                            ${escapeHTML(
                                                entry.description
                                            )}

                                        </p>

                                      `
                                    : ""
                            }


                            ${imageHTML}


                            ${personHTML}

                        </div>

                    </article>

                `;

            }
        );


        /* =================================================
           SHOW TIMELINE
           ================================================= */

        timeline.innerHTML =
            html;


        /* =================================================
           ANIMATION
           ================================================= */

        initTimelineAnimation();

    }

    catch (error) {

        console.error(
            "ROY BARI TIMELINE FIREBASE ERROR:",
            error
        );


        timeline.innerHTML = `

            <div class="timeline-error">

                <div class="eyebrow">
                    Family Archive
                </div>

                <h3>
                    Timeline could not be loaded
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
   TIMELINE ANIMATION
   ========================================================= */

function initTimelineAnimation() {

    const items =
        timeline.querySelectorAll(
            ".timeline-item"
        );


    if (
        !items.length
    ) {

        return;

    }


    /* =================================================
       FALLBACK
       ================================================= */

    if (
        !(
            "IntersectionObserver"
            in window
        )
    ) {

        items.forEach(
            item => {

                item.classList.add(
                    "visible"
                );

            }
        );

        return;

    }


    /* =================================================
       OBSERVER
       ================================================= */

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            !entry.isIntersecting
                        ) {

                            return;

                        }


                        entry.target.classList.add(
                            "visible"
                        );


                        observer.unobserve(
                            entry.target
                        );

                    }
                );

            },
            {
                threshold: 0.15,

                rootMargin:
                    "0px 0px -40px 0px"

            }
        );


    items.forEach(
        item => {

            observer.observe(
                item
            );

        }
    );

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTimeline();

    }
);