/* =========================================================
   ROY BARI — ARCHIVE
   FIREBASE FIRESTORE
   ========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { db } from "./firebase.js";


let archiveItems = [];
let memories = [];


/* =========================================================
   START
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("Archive JS started");

    loadArchive();
    loadMemories();

});


/* =========================================================
   LOAD ARCHIVE
   ========================================================= */

async function loadArchive() {

    const panels = document.getElementById("era-panels");
    const tabs = document.getElementById("era-tabs");

    if (!panels || !tabs) {

        console.error("Archive containers not found");

        return;

    }

    try {

        console.log("Loading archive collection...");

        const snapshot = await getDocs(
            collection(db, "archive")
        );

        console.log(
            "Archive documents:",
            snapshot.size
        );

        archiveItems = [];

        snapshot.forEach((doc) => {

            const data = doc.data();

            archiveItems.push({

                id: doc.id,

                year: data.year || "",

                title: data.title || "",

                description: data.description || "",

                type: data.type || "",

                era: data.era || "",

                image: data.image || ""

            });

        });


        /* =================================================
           NO DATA
           ================================================= */

        if (archiveItems.length === 0) {

            panels.innerHTML = `

                <div class="card">

                    <h3>
                        No archive entries
                    </h3>

                    <p>
                        Add documents to the
                        <strong>archive</strong>
                        collection in Firebase.
                    </p>

                </div>

            `;

            return;

        }


        /* =================================================
           SORT BY YEAR
           ================================================= */

        archiveItems.sort((a, b) => {

            return (
                Number(a.year || 0) -
                Number(b.year || 0)
            );

        });


        /* =================================================
           CREATE TABS
           ================================================= */

        createEraTabs();


        /* =================================================
           SHOW ALL
           ================================================= */

        showEra("all");

    }

    catch (error) {

        console.error(
            "Archive Firebase error:",
            error
        );

        panels.innerHTML = `

            <div class="card">

                <h3>
                    Unable to load archive
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;

    }

}


/* =========================================================
   CREATE ERA TABS
   ========================================================= */

function createEraTabs() {

    const tabs =
        document.getElementById("era-tabs");

    tabs.innerHTML = "";


    /* =================================================
       ALL BUTTON
       ================================================= */

    const allButton =
        document.createElement("button");

    allButton.type = "button";

    allButton.className =
        "pill era-tab active";

    allButton.textContent = "All";

    allButton.dataset.era = "all";

    tabs.appendChild(allButton);


    /* =================================================
       UNIQUE ERAS
       ================================================= */

    const eras = [
        ...new Set(
            archiveItems
                .map(item => item.era)
                .filter(era => era)
        )
    ];


    eras.forEach(era => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "pill era-tab";

        button.textContent = era;

        button.dataset.era = era;

        tabs.appendChild(button);

    });


    /* =================================================
       BUTTON EVENTS
       ================================================= */

    tabs
        .querySelectorAll(".era-tab")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    tabs
                        .querySelectorAll(".era-tab")
                        .forEach(btn => {

                            btn.classList.remove(
                                "active"
                            );

                        });


                    button.classList.add(
                        "active"
                    );


                    showEra(
                        button.dataset.era
                    );

                }
            );

        });

}


/* =========================================================
   SHOW ERA
   ========================================================= */

function showEra(era) {

    const panels =
        document.getElementById("era-panels");

    if (!panels) return;


    let filtered = archiveItems;


    if (era !== "all") {

        filtered =
            archiveItems.filter(
                item => item.era === era
            );

    }


    panels.innerHTML = "";


    /* =================================================
       NO RESULTS
       ================================================= */

    if (filtered.length === 0) {

        panels.innerHTML = `

            <div class="card">

                <h3>
                    No entries found
                </h3>

                <p>
                    There are no archive
                    records for this era.
                </p>

            </div>

        `;

        return;

    }


    /* =================================================
       CREATE GRID
       ================================================= */

    const grid =
        document.createElement("div");

    grid.className =
        "grid grid-3";


    filtered.forEach(item => {

        const card =
            createArchiveCard(item);

        grid.appendChild(card);

    });


    panels.appendChild(grid);

}


/* =========================================================
   CREATE ARCHIVE CARD
   ========================================================= */

function createArchiveCard(item) {

    const card =
        document.createElement("article");

    card.className =
        "card archive-card";


    let imageHTML = "";


    /* =================================================
       IMAGE
       ================================================= */

    if (
        item.image &&
        item.image.trim() !== ""
    ) {

        imageHTML = `

            <div class="archive-image-wrap">

                <img
                    src="${escapeAttribute(item.image)}"
                    alt="${escapeAttribute(item.title)}"
                    loading="lazy"
                    class="archive-image"
                >

            </div>

        `;

    }


    card.innerHTML = `

        ${imageHTML}

        <div class="num">
            ${escapeHTML(String(item.year))}
        </div>

        <h3>
            ${escapeHTML(item.title)}
        </h3>

        ${
            item.type
                ? `
                    <div class="small-caps">
                        ${escapeHTML(item.type)}
                    </div>
                `
                : ""
        }

        <p>
            ${escapeHTML(item.description)}
        </p>

    `;


    return card;

}


/* =========================================================
   LOAD MEMORIES
   ========================================================= */

async function loadMemories() {

    const grid =
        document.getElementById("memory-grid");

    if (!grid) return;


    try {

        console.log("Loading memories...");


        const snapshot =
            await getDocs(
                collection(db, "memories")
            );


        console.log(
            "Memory documents:",
            snapshot.size
        );


        memories = [];


        snapshot.forEach(doc => {

            memories.push({

                id: doc.id,

                ...doc.data()

            });

        });


        /* =================================================
           NO MEMORIES
           ================================================= */

        if (memories.length === 0) {

            grid.innerHTML = `

                <div class="card">

                    <p class="lead">

                        No family memories
                        have been added yet.

                    </p>

                </div>

            `;

            return;

        }


        /* =================================================
           SORT BY YEAR
           ================================================= */

        memories.sort((a, b) => {

            return (
                Number(a.year || 0) -
                Number(b.year || 0)
            );

        });


        renderMemories();

    }

    catch (error) {

        console.error(
            "Memory Firebase error:",
            error
        );


        grid.innerHTML = `

            <div class="card">

                <h3>
                    Unable to load memories
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>

        `;

    }

}


/* =========================================================
   RENDER MEMORIES
   ========================================================= */

function renderMemories() {

    const grid =
        document.getElementById("memory-grid");

    if (!grid) return;


    grid.innerHTML = "";


    memories.forEach(memory => {

        const card =
            document.createElement("article");

        card.className =
            "card memory-card";


        card.innerHTML = `

            ${
                memory.year
                    ? `
                        <div class="num">
                            ${escapeHTML(
                                String(memory.year)
                            )}
                        </div>
                    `
                    : ""
            }


            <h4>
                ${escapeHTML(
                    memory.title ||
                    "Family Memory"
                )}
            </h4>


            <p>
                ${escapeHTML(
                    memory.quote ||
                    memory.description ||
                    memory.story ||
                    ""
                )}
            </p>


            ${
                memory.person
                    ? `
                        <div class="small-caps">

                            — ${escapeHTML(
                                memory.person
                            )}

                        </div>
                    `
                    : ""
            }

        `;


        grid.appendChild(card);

    });

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


/* =========================================================
   ESCAPE ATTRIBUTE
   ========================================================= */

function escapeAttribute(value) {

    return escapeHTML(value);

}