/* =========================================================
   ROY BARI — FAMILY TREE
   FIREBASE FIRESTORE

   COLLECTION:
       familyMembers

   ID-BASED FAMILY STRUCTURE
   ---------------------------------------------------------
   Example:

       1114321
          ↓
       111432
          ↓
       11143
          ↓
       1114
          ↓
       111
          ↓
       11
          ↓
       1

   IMPORTANT
   ---------------------------------------------------------
   • Names are NOT unique.
   • Document ID is the unique identity.
   • Never identify a person by name.
   • Tree sorting is by document ID.
   • Search results are identified by document ID.
   • Father chain is calculated from document ID.

   ADDITIONAL DOCUMENT
   ---------------------------------------------------------
   • familyMembers/image
       - caption
       - url (Google Drive share link)
       This document is NOT a family member and is
       excluded from the tree, search, and generations.
   ========================================================= */


/* =========================================================
   FIREBASE IMPORTS
   ========================================================= */

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    db
} from "./firebase.js";


/* =========================================================
   NON-MEMBER DOCUMENT IDS
   =========================================================
   Documents inside familyMembers that are NOT
   people and must be excluded everywhere.
   ========================================================= */

const NON_MEMBER_DOC_IDS =
    new Set([
        "image"
    ]);


/* =========================================================
   DOM ELEMENTS — TREE
   ========================================================= */

const familyTree =
    document.getElementById("familyTree");

const treeStage =
    document.getElementById("treeStage");

const treeWrapper =
    document.getElementById("treeWrapper");

const treeLines =
    document.getElementById("treeLines");

const status =
    document.getElementById("status");


/* =========================================================
   DOM ELEMENTS — CONTROLS
   ========================================================= */

const zoomIn =
    document.getElementById("zoomIn");

const zoomOut =
    document.getElementById("zoomOut");

const resetZoom =
    document.getElementById("resetZoom");

const searchInput =
    document.getElementById("personSearch");

const showFathersButton =
    document.getElementById("showFathers");


/* =========================================================
   DOM ELEMENTS — PERSON MODAL
   ========================================================= */

const personModal =
    document.getElementById("personModal");

const personModalBody =
    document.getElementById("personModalBody");

const personModalClose =
    document.getElementById("personModalClose");


/* =========================================================
   DOM ELEMENTS — FATHERS MODAL
   ========================================================= */

const fathersModal =
    document.getElementById("fathersModal");

const fathersModalBody =
    document.getElementById("fathersModalBody");

const fathersModalClose =
    document.getElementById("fathersModalClose");


/* =========================================================
   DOM ELEMENTS — FAMILY PHOTO
   ========================================================= */

const familyPhotoImg =
    document.getElementById("familyTreeImage");

const familyPhotoStatus =
    document.getElementById("familyImageStatus");

const familyPhotoCaption =
    document.getElementById("familyImageCaption");


/* =========================================================
   DOM ELEMENTS — FAMILY PHOTO MODAL (LIGHTBOX)
   ========================================================= */

const familyPhotoModal =
    document.getElementById("familyPhotoModal");

const familyPhotoModalImg =
    document.getElementById("familyPhotoModalImg");

const familyPhotoModalCaption =
    document.getElementById("familyPhotoModalCaption");

const familyPhotoModalClose =
    document.getElementById("familyPhotoModalClose");


/* =========================================================
   SEARCH RESULTS CONTAINER
   ========================================================= */

let searchResults =
    document.getElementById(
        "familySearchResults"
    );


if (
    !searchResults &&
    searchInput
) {

    searchResults =
        document.createElement(
            "div"
        );


    searchResults.id =
        "familySearchResults";


    searchResults.className =
        "family-search-results";


    if (
        searchInput.parentElement
    ) {

        searchInput.parentElement.appendChild(
            searchResults
        );

    }

}


/* =========================================================
   FAMILY DATA
   ========================================================= */

let members = {};

let generations = {};

let childrenOf = {};

let parentsOf = {};


/* =========================================================
   SELECTED PERSON
   ========================================================= */

let selectedPerson =
    null;


/* =========================================================
   ZOOM STATE
   ========================================================= */

let zoom =
    1;

const MIN_ZOOM =
    0.5;

const MAX_ZOOM =
    2;

const ZOOM_STEP =
    0.1;


/* =========================================================
   LOAD FAMILY TREE
   ========================================================= */

async function loadFamilyTree() {

    try {

        if (
            status
        ) {

            status.textContent =
                "Loading family tree…";

        }


        /* =================================================
           GET FIRESTORE DOCUMENTS
           ================================================= */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "familyMembers"
                )
            );


        members = {};


        snapshot.forEach(
            documentSnapshot => {

                const documentId =
                    String(
                        documentSnapshot.id
                    );


                /*
                   Skip non-member documents
                   (e.g. "image").
                */

                if (
                    NON_MEMBER_DOC_IDS.has(
                        documentId
                    )
                ) {

                    return;

                }


                members[
                    documentId
                ] = {

                    id:
                        documentId,

                    ...documentSnapshot.data()

                };

            }
        );


        console.log(
            "Family members loaded:",
            Object.keys(
                members
            ).length
        );


        /* =================================================
           BUILD RELATIONSHIPS
           ================================================= */

        buildRelationshipMaps();


        /* =================================================
           BUILD GENERATIONS
           ================================================= */

        createGenerationGroups();


        /* =================================================
           RENDER
           ================================================= */

        renderTree();


        /* =================================================
           STATUS
           ================================================= */

        const count =
            Object.keys(
                members
            ).length;


        if (
            status
        ) {

            status.textContent =
                count === 1
                    ? "1 family member"
                    : `${count} family members`;

        }

    } catch (
        error
    ) {

        console.error(
            "Family tree loading error:",
            error
        );


        if (
            status
        ) {

            status.textContent =
                "Unable to load family tree.";

        }

    }

}


/* =========================================================
   LOAD FAMILY PHOTO
   =========================================================
   Reads the single document:

       familyMembers/image

   Fields:

       caption
       url (Google Drive share link)
   ========================================================= */

async function loadFamilyPhoto() {

    if (
        !familyPhotoImg
    ) {

        return;

    }


    try {

        if (
            familyPhotoStatus
        ) {

            familyPhotoStatus.style.display =
                "block";


            familyPhotoStatus.textContent =
                "Loading photo…";

        }


        const snapshot =
            await getDoc(
                doc(
                    db,
                    "familyMembers",
                    "image"
                )
            );


        if (
            !snapshot.exists()
        ) {

            if (
                familyPhotoStatus
            ) {

                familyPhotoStatus.textContent =
                    "No family photo available.";

            }


            return;

        }


        const data =
            snapshot.data();


        const driveUrl =
            String(
                data.url ||
                ""
            );


        const caption =
            data.caption ||
            "";


        /* =================================================
           EXTRACT DRIVE FILE ID

           Example URL:

               https://drive.google.com/file/d/FILE_ID/view?usp=...
           ================================================= */

        const match =
            driveUrl.match(
                /\/d\/([a-zA-Z0-9_-]+)/
            );


        const fileId =
            match
                ? match[1]
                : null;


        if (
            !fileId
        ) {

            if (
                familyPhotoStatus
            ) {

                familyPhotoStatus.textContent =
                    "Family photo unavailable.";

            }


            return;

        }


        /* =================================================
           DIRECT EMBEDDABLE URL

           Requires the Drive file to be
           shared as "Anyone with the link".
           ================================================= */

        const directUrl =
            `https://lh3.googleusercontent.com/d/${fileId}`;


        familyPhotoImg.onload =
            () => {

                familyPhotoImg.style.display =
                    "block";


                if (
                    familyPhotoStatus
                ) {

                    familyPhotoStatus.style.display =
                        "none";

                }

            };


        familyPhotoImg.onerror =
            () => {

                if (
                    familyPhotoStatus
                ) {

                    familyPhotoStatus.style.display =
                        "block";


                    familyPhotoStatus.textContent =
                        "Unable to load family photo.";

                }

            };


        familyPhotoImg.src =
            directUrl;


        familyPhotoImg.alt =
            caption ||
            "Roy Bari family tree";


        if (
            familyPhotoCaption
        ) {

            familyPhotoCaption.textContent =
                caption;

        }


        /* =================================================
           OPEN LIGHTBOX ON CLICK / KEYBOARD
           ================================================= */

        familyPhotoImg.addEventListener(
            "click",
            openFamilyPhotoModal
        );


        familyPhotoImg.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                        "Enter" ||
                    event.key ===
                        " "
                ) {

                    event.preventDefault();


                    openFamilyPhotoModal();

                }

            }
        );

    } catch (
        error
    ) {

        console.error(
            "Family photo loading error:",
            error
        );


        if (
            familyPhotoStatus
        ) {

            familyPhotoStatus.style.display =
                "block";


            familyPhotoStatus.textContent =
                "Unable to load family photo.";

        }

    }

}


/* =========================================================
   OPEN FAMILY PHOTO MODAL
   ========================================================= */

function openFamilyPhotoModal() {

    if (
        !familyPhotoImg ||
        !familyPhotoImg.src ||
        !familyPhotoModal ||
        !familyPhotoModalImg
    ) {

        return;

    }


    familyPhotoModalImg.src =
        familyPhotoImg.src;


    familyPhotoModalImg.alt =
        familyPhotoImg.alt ||
        "";


    if (
        familyPhotoModalCaption
    ) {

        familyPhotoModalCaption.textContent =
            familyPhotoCaption
                ? familyPhotoCaption.textContent
                : "";

    }


    familyPhotoModal.classList.add(
        "open"
    );


    if (
        familyPhotoModalClose
    ) {

        familyPhotoModalClose.focus();

    }

}


/* =========================================================
   CLOSE FAMILY PHOTO MODAL
   ========================================================= */

function closeFamilyPhotoModal() {

    if (
        familyPhotoModal
    ) {

        familyPhotoModal.classList.remove(
            "open"
        );

    }

}


if (
    familyPhotoModalClose
) {

    familyPhotoModalClose.addEventListener(
        "click",
        closeFamilyPhotoModal
    );

}


if (
    familyPhotoModal
) {

    familyPhotoModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                familyPhotoModal
            ) {

                closeFamilyPhotoModal();

            }

        }
    );

}


/* =========================================================
   BUILD RELATIONSHIP MAPS
   =========================================================
   Father ID is always:

       child ID without final digit

   Example:

       1114321 → 111432
   ========================================================= */

function buildRelationshipMaps() {

    childrenOf = {};

    parentsOf = {};


    Object.keys(
        members
    ).forEach(
        childId => {

            const id =
                String(
                    childId
                );


            if (
                id.length <= 1
            ) {

                return;

            }


            const fatherId =
                id.slice(
                    0,
                    -1
                );


            /*
               Only create relationship
               if father exists.
            */

            if (
                !members[
                    fatherId
                ]
            ) {

                return;

            }


            /* =========================================
               FATHER → CHILDREN
               ========================================= */

            if (
                !childrenOf[
                    fatherId
                ]
            ) {

                childrenOf[
                    fatherId
                ] = new Set();

            }


            childrenOf[
                fatherId
            ].add(
                id
            );


            /* =========================================
               CHILD → FATHER
               ========================================= */

            if (
                !parentsOf[
                    id
                ]
            ) {

                parentsOf[
                    id
                ] = new Set();

            }


            parentsOf[
                id
            ].add(
                fatherId
            );

        }
    );

}


/* =========================================================
   CREATE GENERATION GROUPS
   ========================================================= */

function createGenerationGroups() {

    generations = {};


    Object.values(
        members
    ).forEach(
        person => {

            const generation =
                Number(
                    person.generation
                );


            if (
                !Number.isFinite(
                    generation
                )
            ) {

                return;

            }


            if (
                !generations[
                    generation
                ]
            ) {

                generations[
                    generation
                ] = [];

            }


            generations[
                generation
            ].push(
                person
            );

        }
    );

}


/* =========================================================
   COMPARE DOCUMENT IDS
   =========================================================
   IDs are sorted numerically whenever possible.

   IMPORTANT:
       Name is NEVER used here.
   ========================================================= */

function compareIds(
    a,
    b
) {

    const idA =
        String(
            a ?? ""
        );

    const idB =
        String(
            b ?? ""
        );


    if (
        /^\d+$/.test(idA) &&
        /^\d+$/.test(idB)
    ) {

        try {

            const numberA =
                BigInt(
                    idA
                );

            const numberB =
                BigInt(
                    idB
                );


            if (numberA < numberB) {

                return -1;

            }


            if (
                numberA >
                numberB
            ) {

                return 1;

            }


            return 0;

        } catch {

            /* Continue to fallback */

        }

    }


    return idA.localeCompare(
        idB,
        undefined,
        {
            numeric:
                true
        }
    );

}


/* =========================================================
   SORT PEOPLE BY ID
   ========================================================= */

function sortPeopleById(
    people
) {

    return [
        ...people
    ].sort(
        (
            a,
            b
        ) =>
            compareIds(
                a.id,
                b.id
            )
    );

}


/* =========================================================
   RENDER TREE
   ========================================================= */

function renderTree() {

    if (
        !familyTree
    ) {

        return;

    }


    familyTree.innerHTML =
        "";


    if (
        treeLines
    ) {

        treeLines.innerHTML =
            "";

    }


    const generationNumbers =
        Object.keys(
            generations
        )
            .map(
                Number
            )
            .filter(
                Number.isFinite
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a - b
            );


    if (
        generationNumbers.length ===
        0
    ) {

        familyTree.innerHTML = `

            <div class="empty-tree">

                No family members found.

            </div>

        `;

        return;

    }


    generationNumbers.forEach(
        generation => {

            const people =
                sortPeopleById(
                    generations[
                        generation
                    ]
                );


            createGenerationRow(
                generation,
                people
            );

        }
    );


    applyZoom();


    requestAnimationFrame(
        () => {

            requestAnimationFrame(
                () => {

                    drawConnections();

                }
            );

        }
    );

}


/* =========================================================
   CREATE GENERATION ROW
   ========================================================= */

function createGenerationRow(
    generation,
    people
) {

    const row =
        document.createElement(
            "section"
        );


    row.className =
        "generation-row";


    row.dataset.generation =
        String(
            generation
        );


    /* =====================================================
       GENERATION LABEL
       ===================================================== */

    const label =
        document.createElement(
            "div"
        );


    label.className =
        "generation-label";


    label.innerHTML = `

        <div class="generation-seal">

            ${escapeHTML(
                generation
            )}

        </div>

        <span class="generation-seal-label">

            GEN

        </span>

    `;


    row.appendChild(
        label
    );


    /* =====================================================
       PEOPLE
       ===================================================== */

    const peopleContainer =
        document.createElement(
            "div"
        );


    peopleContainer.className =
        "generation-people";


    people.forEach(
        person => {

            peopleContainer.appendChild(
                createPersonCard(
                    person
                )
            );

        }
    );


    row.appendChild(
        peopleContainer
    );


    familyTree.appendChild(
        row
    );

}


/* =========================================================
   CREATE PERSON CARD
   ========================================================= */

function createPersonCard(
    person
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "person-card";


    /*
       UNIQUE ID.

       Never use name here.
    */

    card.dataset.personId =
        String(
            person.id
        );


    card.tabIndex =
        0;


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(
        "aria-label",
        `View details for ${
            person.name ||
            "Unknown"
        }`
    );


    const years = [

        person.birthYear,

        person.deathYear

    ]
        .filter(
            value =>
                value !==
                    undefined &&
                value !==
                    null &&
                value !==
                    ""
        )
        .join(
            " – "
        );


    card.innerHTML = `

        <div class="person-name">

            ${escapeHTML(
                person.name ||
                "Unknown"
            )}

        </div>


        <div class="person-meta">

            <span class="person-years">

                ${escapeHTML(
                    years
                )}

            </span>

        </div>

    `;


    /* =====================================================
       CLICK
       ===================================================== */

    card.addEventListener(
        "click",
        event => {

            event.stopPropagation();


            /*
               Get the exact person
               using UNIQUE ID.
            */

            const personId =
                String(
                    card.dataset.personId
                );


            const exactPerson =
                members[
                    personId
                ];


            if (
                !exactPerson
            ) {

                return;

            }


            selectedPerson =
                exactPerson;


            showPerson(
                exactPerson
            );

        }
    );


    /* =====================================================
       KEYBOARD
       ===================================================== */

    card.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Enter" ||
                event.key ===
                    " "
            ) {

                event.preventDefault();


                const personId =
                    String(
                        card.dataset.personId
                    );


                const exactPerson =
                    members[
                        personId
                    ];


                if (
                    !exactPerson
                ) {

                    return;

                }


                selectedPerson =
                    exactPerson;


                showPerson(
                    exactPerson
                );

            }

        }
    );


    return card;

}


/* =========================================================
   FIND CARD BY UNIQUE ID
   ========================================================= */

function findCard(
    personId
) {

    const id =
        String(
            personId
        );


    const cards =
        document.querySelectorAll(
            ".person-card"
        );


    for (
        const card of cards
    ) {

        if (
            String(
                card.dataset.personId
            ) === id
        ) {

            return card;

        }

    }


    return null;

}


/* =========================================================
   SEARCH
   =========================================================
   IMPORTANT:

   Duplicate names are allowed.

   Example:

       SAMIR ROY
       ID 111114334

       SAMIR ROY
       ID 11111433

       SAMIR ROY
       ID 1111143

   Search displays ALL matches.

   Clicking a result uses the ID,
   not the name.
   ========================================================= */

function renderSearchResults(
    query
) {

    if (
        !searchResults
    ) {

        return;

    }


    searchResults.innerHTML =
        "";


    const search =
        String(
            query ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        !search
    ) {

        searchResults.style.display =
            "none";

        return;

    }


    /* =====================================================
       FIND MATCHES
       ===================================================== */

    const results =
        Object.values(
            members
        )
            .filter(
                person => {

                    const name =
                        String(
                            person.name ||
                            ""
                        )
                            .toLowerCase();


                    const id =
                        String(
                            person.id ||
                            ""
                        )
                            .toLowerCase();


                    /*
                       Search by either:

                       • name
                       • document ID
                    */

                    return (
                        name.includes(
                            search
                        ) ||
                        id.includes(
                            search
                        )
                    );

                }
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    compareIds(
                        a.id,
                        b.id
                    )
            );


    /* =====================================================
       NO RESULT
       ===================================================== */

    if (
        results.length ===
        0
    ) {

        const noResult =
            document.createElement(
                "div"
            );


        noResult.className =
            "family-search-no-result";


        noResult.textContent =
            "No family member found.";


        searchResults.appendChild(
            noResult
        );


        searchResults.style.display =
            "block";


        return;

    }


    /* =====================================================
       RESULT COUNT
       ===================================================== */

    /*
       Optional heading.
       Does not identify people.
    */

    if (
        results.length >
        1
    ) {

        const count =
            document.createElement(
                "div"
            );


        count.className =
            "family-search-count";


        count.textContent =
            `${results.length} family members found`;


        searchResults.appendChild(
            count
        );

    }


    /* =====================================================
       CREATE EACH RESULT
       ===================================================== */

    results.forEach(
        person => {

            const result =
                document.createElement(
                    "button"
                );


            result.type =
                "button";


            result.className =
                "family-search-result";


            /*
               UNIQUE ID IS STORED HERE.

               This is what fixes duplicate
               names.
            */

            result.dataset.personId =
                String(
                    person.id
                );


            /* =================================================
               NAME
               ================================================= */

            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "family-search-result-name";


            name.textContent =
                person.name ||
                "Unknown";


            /* =================================================
               DETAILS
               ================================================= */

            const details =
                document.createElement(
                    "span"
                );


            details.className =
                "family-search-result-father";


            const father =
                getFather(
                    person.id
                );


            const fatherName =
                father
                    ? (
                        father.name ||
                        "Unknown"
                    )
                    : "No recorded father";


            details.innerHTML = `

                ID:
                <strong>
                    ${escapeHTML(
                        person.id
                    )}
                </strong>

                &nbsp; · &nbsp;

                Generation:
                <strong>
                    ${escapeHTML(
                        person.generation ??
                        "—"
                    )}
                </strong>

                <br>

                Father:
                <strong>
                    ${escapeHTML(
                        fatherName
                    )}
                </strong>

            `;


            result.appendChild(
                name
            );


            result.appendChild(
                details
            );


            /* =================================================
               CLICK EXACT RESULT
               ================================================= */

            result.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    /*
                       READ UNIQUE ID
                    */

                    const personId =
                        String(
                            result.dataset.personId
                        );


                    /*
                       GET EXACT PERSON

                       NOT:

                           members[name]

                       BUT:

                           members[id]
                    */

                    const exactPerson =
                        members[
                            personId
                        ];


                    if (
                        !exactPerson
                    ) {

                        console.error(
                            "Person not found:",
                            personId
                        );

                        return;

                    }


                    selectedPerson =
                        exactPerson;


                    /* =========================================
                       CLEAR OLD HIGHLIGHTS
                       ========================================= */

                    document
                        .querySelectorAll(
                            ".person-card"
                        )
                        .forEach(
                            card => {

                                card.classList.remove(
                                    "is-match"
                                );

                            }
                        );


                    /* =========================================
                       HIGHLIGHT EXACT CARD
                       ========================================= */

                    const card =
                        findCard(
                            exactPerson.id
                        );


                    if (
                        card
                    ) {

                        card.classList.add(
                            "is-match"
                        );


                        card.scrollIntoView(
                            {
                                behavior:
                                    "smooth",

                                block:
                                    "center",

                                inline:
                                    "center"
                            }
                        );

                    }


                    /* =========================================
                       CLOSE SEARCH RESULTS
                       ========================================= */

                    searchResults.style.display =
                        "none";


                    /*
                       Keep the typed search text.

                       This makes it clear which
                       duplicate name was searched.
                    */

                    if (
                        searchInput
                    ) {

                        searchInput.value =
                            exactPerson.name ||
                            "";

                    }


                    /* =========================================
                       OPEN EXACT PERSON
                       ========================================= */

                    showPerson(
                        exactPerson
                    );

                }
            );


            searchResults.appendChild(
                result
            );

        }
    );


    searchResults.style.display =
        "block";

}


/* =========================================================
   SEARCH INPUT
   ========================================================= */

if (
    searchInput
) {

    searchInput.addEventListener(
        "input",
        () => {

            /*
               Clear card highlights
               while searching.
            */

            document
                .querySelectorAll(
                    ".person-card"
                )
                .forEach(
                    card => {

                        card.classList.remove(
                            "is-match"
                        );

                    }
                );


            renderSearchResults(
                searchInput.value
            );

        }
    );


    /* =====================================================
       FOCUS
       ===================================================== */

    searchInput.addEventListener(
        "focus",
        () => {

            if (
                searchInput.value.trim()
            ) {

                renderSearchResults(
                    searchInput.value
                );

            }

        }
    );


    /* =====================================================
       KEYBOARD
       ===================================================== */

    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                if (
                    searchResults
                ) {

                    searchResults.style.display =
                        "none";

                }


                return;

            }


            /*
               If exactly one result exists,
               Enter opens that exact person.
            */

            if (
                event.key ===
                "Enter"
            ) {

                const results =
                    searchResults
                        ? searchResults.querySelectorAll(
                            ".family-search-result"
                        )
                        : [];


                if (
                    results.length ===
                    1
                ) {

                    event.preventDefault();


                    results[0].click();

                }

            }

        }
    );

}


/* =========================================================
   CLOSE SEARCH WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        if (
            !searchResults ||
            !searchInput
        ) {

            return;

        }


        if (
            event.target ===
                searchInput ||
            searchResults.contains(
                event.target
            )
        ) {

            return;

        }


        searchResults.style.display =
            "none";

    }
);


/* =========================================================
   SHOW PERSON
   ========================================================= */

function showPerson(
    person
) {

    if (
        !personModalBody ||
        !personModal
    ) {

        return;

    }


    selectedPerson =
        person;


    const father =
        getFather(
            person.id
        );


    const children =
        getChildren(
            person.id
        );


    let html = `

        <p class="modal-eyebrow">

            GENERATION
            ${escapeHTML(
                person.generation ??
                "—"
            )}

        </p>


        <h2 id="personModalName">

            ${escapeHTML(
                person.name ||
                "Unknown"
            )}

        </h2>

    `;


    /* =====================================================
       PERSON DATA
       ===================================================== */

    html += `

        <div class="modal-section">

            <p class="modal-section-label">

                Family Information

            </p>


            <div class="person-data">

    `;


    const fields =
        getPersonFieldOrder(
            person
        );


    fields.forEach(
        field => {

            html +=
                createDataRow(
                    field.label,
                    field.value
                );

        }
    );


    html += `

            </div>

        </div>

    `;


    /* =====================================================
       FATHER
       ===================================================== */

    if (
        father
    ) {

        html += `

            <div class="modal-section">

                <p class="modal-section-label">

                    Father

                </p>


                <p class="relation-person">

                    ${escapeHTML(
                        father.name ||
                        "Unknown"
                    )}

                </p>

            </div>

        `;

    }


    /* =====================================================
       CHILDREN
       ===================================================== */

    if (
        children.length >
        0
    ) {

        html += `

            <div class="modal-section">

                <p class="modal-section-label">

                    Children

                </p>


                <ul>

        `;


        children.forEach(
            child => {

                html += `

                    <li>

                        ${escapeHTML(
                            child.name ||
                            "Unknown"
                        )}

                    </li>

                `;

            }
        );


        html += `

                </ul>

            </div>

        `;

    }


    personModalBody.innerHTML =
        html;


    personModal.classList.add(
        "open"
    );


    if (
        personModalClose
    ) {

        personModalClose.focus();

    }

}


/* =========================================================
   PERSON FIELD ORDER
   =========================================================
   Fixed order:

       ID
       Generation
       Father ID
       Created At
       Updated At

   Firestore insertion order does NOT matter.
   ========================================================= */

function getPersonFieldOrder(
    person
) {

    const fields = [

        {
            key:
                "id",

            label:
                "ID",

            value:
                person.id

        },

        {
            key:
                "generation",

            label:
                "Generation",

            value:
                person.generation

        },

        {
            key:
                "fatherId",

            label:
                "Father ID",

            value:
                person.fatherId ??
                getFatherId(
                    person.id
                )

        },

        {
            key:
                "createdAt",

            label:
                "Created At",

            value:
                person.createdAt

        },

        {
            key:
                "updatedAt",

            label:
                "Updated At",

            value:
                person.updatedAt

        }

    ];


    const fixedKeys =
        new Set(
            fields.map(
                field =>
                    field.key
            )
        );


    /*
       Additional fields are placed
       after standard fields.
    */

    Object.keys(
        person
    )
        .filter(
            key =>
                !fixedKeys.has(
                    key
                ) &&
                key !== "name"
        )
        .sort(
            (
                a,
                b
            ) =>
                a.localeCompare(
                    b
                )
        )
        .forEach(
            key => {

                fields.push({

                    key,

                    label:
                        formatFieldName(
                            key
                        ),

                    value:
                        person[
                            key
                        ]

                });

            }
        );


    return fields;

}


/* =========================================================
   CREATE DATA ROW
   ========================================================= */

function createDataRow(
    label,
    value
) {

    return `

        <div class="data-row">

            <span class="data-label">

                ${escapeHTML(
                    label
                )}

            </span>


            <span class="data-value">

                ${escapeHTML(
                    formatValue(
                        value
                    )
                )}

            </span>

        </div>

    `;

}


/* =========================================================
   GET FATHER ID
   ========================================================= */

function getFatherId(
    personId
) {

    const id =
        String(
            personId ??
            ""
        ).trim();


    if (
        id.length <= 1
    ) {

        return null;

    }


    const fatherId =
        id.slice(
            0,
            -1
        );


    if (
        !members[
            fatherId
        ]
    ) {

        return null;

    }


    return fatherId;

}


/* =========================================================
   GET FATHER
   ========================================================= */

function getFather(
    personId
) {

    const fatherId =
        getFatherId(
            personId
        );


    if (
        !fatherId
    ) {

        return null;

    }


    return (
        members[
            fatherId
        ] ||
        null
    );

}


/* =========================================================
   BUILD FATHER CHAIN
   ========================================================= */

function buildFatherChain(
    personId
) {

    const chain =
        [];


    let currentId =
        String(
            personId ??
            ""
        ).trim();


    const visited =
        new Set();


    while (
        currentId.length >
        1
    ) {

        const fatherId =
            currentId.slice(
                0,
                -1
            );


        if (
            visited.has(
                fatherId
            )
        ) {

            break;

        }


        visited.add(
            fatherId
        );


        const father =
            members[
                fatherId
            ];


        if (
            !father
        ) {

            break;

        }


        chain.push(
            father
        );


        currentId =
            fatherId;

    }


    return chain;

}


/* =========================================================
   GET CHILDREN
   ========================================================= */

function getChildren(
    parentId
) {

    const childIds =
        Array.from(
            childrenOf[
                String(
                    parentId
                )
            ] || []
        );


    return childIds
        .map(
            childId =>
                members[
                    childId
                ]
        )
        .filter(
            Boolean
        )
        .sort(
            (
                a,
                b
            ) =>
                compareIds(
                    a.id,
                    b.id
                )
        );

}


/* =========================================================
   FATHER RELATIONSHIP LABEL
   ========================================================= */

function getFatherRelationshipLabel(
    index
) {

    if (
        index ===
        0
    ) {

        return "Father";

    }


    if (
        index ===
        1
    ) {

        return "Grandfather";

    }


    if (
        index ===
        2
    ) {

        return "Great-grandfather";

    }


    return (
        "Great-".repeat(
            index - 2
        ) +
        "grandfather"
    );

}


/* =========================================================
   SHOW ALL FATHERS
   ========================================================= */

function showAllFathers() {

    if (
        !fathersModalBody ||
        !fathersModal
    ) {

        return;

    }


    if (
        !selectedPerson
    ) {

        fathersModalBody.innerHTML = `

            <p class="modal-eyebrow">

                ROY BARI

            </p>


            <h2 id="fathersModalTitle">

                Fathers

            </h2>


            <p class="modal-description">

                Select a family member first
                to view their paternal lineage.

            </p>

        `;


        fathersModal.classList.add(
            "open"
        );


        if (
            fathersModalClose
        ) {

            fathersModalClose.focus();

        }


        return;

    }


    /* =====================================================
       GET COMPLETE FATHER CHAIN
       ===================================================== */

    const fathers =
        buildFatherChain(
            selectedPerson.id
        );


    /* =====================================================
       NO FATHERS
       ===================================================== */

    if (
        fathers.length ===
        0
    ) {

        fathersModalBody.innerHTML = `

            <p class="modal-eyebrow">

                ROY BARI

            </p>


            <h2 id="fathersModalTitle">

                Fathers

            </h2>


            <p class="modal-description">

                No recorded paternal ancestor
                was found for

                <strong>

                    ${escapeHTML(
                        selectedPerson.name ||
                        "Unknown"
                    )}

                </strong>.

            </p>

        `;


        fathersModal.classList.add(
            "open"
        );


        if (
            fathersModalClose
        ) {

            fathersModalClose.focus();

        }


        return;

    }


    /* =====================================================
       HEADER
       ===================================================== */

    let html = `

        <p class="modal-eyebrow">

            ROY BARI

        </p>


        <h2 id="fathersModalTitle">

            Fathers

        </h2>


        <p class="modal-description">

            Paternal lineage of

            <strong>

                ${escapeHTML(
                    selectedPerson.name ||
                    "Unknown"
                )}

            </strong>

        </p>

    `;


    /* =====================================================
       FATHER RECORDS
       ===================================================== */

    fathers.forEach(
        (
            father,
            index
        ) => {

            const relationship =
                getFatherRelationshipLabel(
                    index
                );


            html += `

                <div class="father-record">

                    <div class="father-number">

                        ${index + 1}

                    </div>


                    <div class="father-information">

                        <p class="modal-eyebrow">

                            ${escapeHTML(
                                relationship
                            )}

                        </p>


                        <h3>

                            ${escapeHTML(
                                father.name ||
                                "Unknown"
                            )}

                        </h3>


                        <div class="person-data">

            `;


            /* =================================================
               FIXED FIELD ORDER

               ALWAYS:

               ID
               Generation
               Father ID
               Created At
               Updated At
               ================================================= */

            const standardFields = [

                {
                    key:
                        "id",

                    label:
                        "ID",

                    value:
                        father.id

                },

                {
                    key:
                        "generation",

                    label:
                        "Generation",

                    value:
                        father.generation

                },

                {
                    key:
                        "fatherId",

                    label:
                        "Father ID",

                    value:
                        father.fatherId ??
                        getFatherId(
                            father.id
                        )

                },

                {
                    key:
                        "createdAt",

                    label:
                        "Created At",

                    value:
                        father.createdAt

                },

                {
                    key:
                        "updatedAt",

                    label:
                        "Updated At",

                    value:
                        father.updatedAt

                }

            ];


            standardFields.forEach(
                field => {

                    html +=
                        createDataRow(
                            field.label,
                            field.value
                        );

                }
            );


            /* =================================================
               ADDITIONAL CUSTOM FIELDS

               Keep them after the standard fields.
               ================================================= */

            const standardKeys =
                new Set(
                    standardFields.map(
                        field =>
                            field.key
                    )
                );


            Object.keys(
                father
            )
                .filter(
                    key =>
                        !standardKeys.has(
                            key
                        ) &&
                        key !== "name"
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        a.localeCompare(
                            b
                        )
                )
                .forEach(
                    key => {

                        html +=
                            createDataRow(
                                formatFieldName(
                                    key
                                ),
                                father[
                                    key
                                ]
                            );

                    }
                );


            html += `

                        </div>

                    </div>

                </div>

            `;

        }
    );


    fathersModalBody.innerHTML =
        html;


    fathersModal.classList.add(
        "open"
    );


    if (
        fathersModalClose
    ) {

        fathersModalClose.focus();

    }

}


/* =========================================================
   ZOOM
   ========================================================= */

function applyZoom() {

    if (
        !treeStage
    ) {

        return;

    }


    zoom =
        Math.max(
            MIN_ZOOM,
            Math.min(
                MAX_ZOOM,
                zoom
            )
        );


    treeStage.style.transform =
        `scale(${zoom})`;


    treeStage.style.transformOrigin =
        "top left";


    treeStage.dataset.zoom =
        String(
            zoom
        );


    if (
        resetZoom
    ) {

        resetZoom.textContent =
            `${Math.round(
                zoom * 100
            )}%`;

    }


    requestAnimationFrame(
        () => {

            drawConnections();

        }
    );

}


/* =========================================================
   ZOOM IN
   ========================================================= */

if (
    zoomIn
) {

    zoomIn.addEventListener(
        "click",
        () => {

            zoom =
                Number(
                    (
                        zoom +
                        ZOOM_STEP
                    ).toFixed(
                        2
                    )
                );


            applyZoom();

        }
    );

}


/* =========================================================
   ZOOM OUT
   ========================================================= */

if (
    zoomOut
) {

    zoomOut.addEventListener(
        "click",
        () => {

            zoom =
                Number(
                    (
                        zoom -
                        ZOOM_STEP
                    ).toFixed(
                        2
                    )
                );


            applyZoom();

        }
    );

}


/* =========================================================
   RESET ZOOM
   ========================================================= */

if (
    resetZoom
) {

    resetZoom.addEventListener(
        "click",
        () => {

            zoom =
                1;


            applyZoom();

        }
    );

}


/* =========================================================
   DRAW TREE CONNECTIONS
   =========================================================
   The SVG and cards are both inside
   treeStage.

   Coordinates are converted back from
   viewport coordinates into stage
   coordinates.

   This keeps lines aligned after zoom.
   ========================================================= */

function drawConnections() {

    if (
        !treeStage ||
        !treeLines
    ) {

        return;

    }


    treeLines.innerHTML =
        "";


    const scale =
        zoom >
        0
            ? zoom
            : 1;


    const stageRect =
        treeStage.getBoundingClientRect();


    const width =
        Math.max(
            treeStage.scrollWidth,
            treeStage.offsetWidth,
            1
        );


    const height =
        Math.max(
            treeStage.scrollHeight,
            treeStage.offsetHeight,
            1
        );


    treeLines.setAttribute(
        "width",
        String(
            width
        )
    );


    treeLines.setAttribute(
        "height",
        String(
            height
        )
    );


    treeLines.setAttribute(
        "viewBox",
        `0 0 ${width} ${height}`
    );


    Object.keys(
        parentsOf
    ).forEach(
        childId => {

            drawParentToChild(
                childId,
                stageRect,
                scale
            );

        }
    );

}


/* =========================================================
   DRAW PARENT → CHILD
   ========================================================= */

function drawParentToChild(
    childId,
    stageRect,
    scale
) {

    const parentIds =
        Array.from(
            parentsOf[
                childId
            ] || []
        );


    if (
        parentIds.length ===
        0
    ) {

        return;

    }


    const childCard =
        findCard(
            childId
        );


    if (
        !childCard
    ) {

        return;

    }


    let parentX =
        0;

    let parentY =
        0;

    let parentCount =
        0;


    parentIds.forEach(
        parentId => {

            const parentCard =
                findCard(
                    parentId
                );


            if (
                !parentCard
            ) {

                return;

            }


            const rect =
                parentCard.getBoundingClientRect();


            const x =
                (
                    rect.left -
                    stageRect.left
                ) /
                scale;


            const y =
                (
                    rect.top -
                    stageRect.top
                ) /
                scale;


            const width =
                rect.width /
                scale;


            const height =
                rect.height /
                scale;


            parentX +=
                x +
                width / 2;


            parentY =
                Math.max(
                    parentY,
                    y +
                    height
                );


            parentCount++;

        }
    );


    if (
        parentCount ===
        0
    ) {

        return;

    }


    parentX /=
        parentCount;


    const childRect =
        childCard.getBoundingClientRect();


    const childX =
        (
            childRect.left -
            stageRect.left
        ) /
        scale +
        (
            childRect.width /
            scale
        ) / 2;


    const childY =
        (
            childRect.top -
            stageRect.top
        ) /
        scale;


    if (
        childY <=
        parentY
    ) {

        return;

    }


    createCurve(
        parentX,
        parentY,
        childX,
        childY
    );

}


/* =========================================================
   CREATE SVG CURVE
   ========================================================= */

function createCurve(
    x1,
    y1,
    x2,
    y2
) {

    if (
        !treeLines
    ) {

        return;

    }


    const distance =
        y2 -
        y1;


    const middleY =
        y1 +
        Math.max(
            25,
            distance * 0.5
        );


    const path =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
        );


    path.setAttribute(
        "d",
        `
            M ${x1} ${y1}

            C
            ${x1} ${middleY},
            ${x2} ${middleY},
            ${x2} ${y2}
        `
    );


    path.classList.add(
        "tree-line"
    );


    treeLines.appendChild(
        path
    );

}


/* =========================================================
   PERSON MODAL CLOSE
   ========================================================= */

if (
    personModalClose
) {

    personModalClose.addEventListener(
        "click",
        () => {

            personModal.classList.remove(
                "open"
            );

        }
    );

}


/* =========================================================
   FATHERS MODAL CLOSE
   ========================================================= */

if (
    fathersModalClose
) {

    fathersModalClose.addEventListener(
        "click",
        () => {

            fathersModal.classList.remove(
                "open"
            );

        }
    );

}


/* =========================================================
   CLICK OUTSIDE PERSON MODAL
   ========================================================= */

if (
    personModal
) {

    personModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                personModal
            ) {

                personModal.classList.remove(
                    "open"
                );

            }

        }
    );

}


/* =========================================================
   CLICK OUTSIDE FATHERS MODAL
   ========================================================= */

if (
    fathersModal
) {

    fathersModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                fathersModal
            ) {

                fathersModal.classList.remove(
                    "open"
                );

            }

        }
    );

}


/* =========================================================
   ESCAPE
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        if (
            personModal
        ) {

            personModal.classList.remove(
                "open"
            );

        }


        if (
            fathersModal
        ) {

            fathersModal.classList.remove(
                "open"
            );

        }


        closeFamilyPhotoModal();


        if (
            searchResults
        ) {

            searchResults.style.display =
                "none";

        }

    }
);


/* =========================================================
   SHOW FATHERS BUTTON
   ========================================================= */

if (
    showFathersButton
) {

    showFathersButton.addEventListener(
        "click",
        showAllFathers
    );

}


/* =========================================================
   MOUSE PAN
   ========================================================= */

let isPanning =
    false;

let panStartX =
    0;

let panStartY =
    0;

let scrollStartX =
    0;

let scrollStartY =
    0;


/* =========================================================
   MOUSE DOWN
   ========================================================= */

if (
    treeWrapper
) {

    treeWrapper.addEventListener(
        "mousedown",
        event => {

            if (
                event.target.closest(
                    ".person-card"
                )
            ) {

                return;

            }


            if (
                event.target.closest(
                    "button, input"
                )
            ) {

                return;

            }


            isPanning =
                true;


            treeWrapper.classList.add(
                "is-panning"
            );


            panStartX =
                event.clientX;


            panStartY =
                event.clientY;


            scrollStartX =
                treeWrapper.scrollLeft;


            scrollStartY =
                treeWrapper.scrollTop;


            event.preventDefault();

        }
    );

}


/* =========================================================
   MOUSE MOVE
   ========================================================= */

window.addEventListener(
    "mousemove",
    event => {

        if (
            !isPanning ||
            !treeWrapper
        ) {

            return;

        }


        treeWrapper.scrollLeft =
            scrollStartX -
            (
                event.clientX -
                panStartX
            );


        treeWrapper.scrollTop =
            scrollStartY -
            (
                event.clientY -
                panStartY
            );

    }
);


/* =========================================================
   MOUSE UP
   ========================================================= */

window.addEventListener(
    "mouseup",
    () => {

        isPanning =
            false;


        if (
            treeWrapper
        ) {

            treeWrapper.classList.remove(
                "is-panning"
            );

        }

    }
);


/* =========================================================
   TOUCH PAN
   ========================================================= */

let touchStartX =
    0;

let touchStartY =
    0;

let touchScrollX =
    0;

let touchScrollY =
    0;


if (
    treeWrapper
) {

    treeWrapper.addEventListener(
        "touchstart",
        event => {

            if (
                event.target.closest(
                    ".person-card"
                )
            ) {

                return;

            }


            if (
                event.target.closest(
                    "button, input"
                )
            ) {

                return;

            }


            const touch =
                event.touches[0];


            if (
                !touch
            ) {

                return;

            }


            touchStartX =
                touch.clientX;


            touchStartY =
                touch.clientY;


            touchScrollX =
                treeWrapper.scrollLeft;


            touchScrollY =
                treeWrapper.scrollTop;

        },
        {
            passive:
                true
        }
    );

}


/* =========================================================
   TOUCH MOVE
   ========================================================= */

if (
    treeWrapper
) {

    treeWrapper.addEventListener(
        "touchmove",
        event => {

            if (
                event.target.closest(
                    ".person-card"
                )
            ) {

                return;

            }


            if (
                event.target.closest(
                    "button, input"
                )
            ) {

                return;

            }


            const touch =
                event.touches[0];


            if (
                !touch
            ) {

                return;

            }


            const dx =
                touch.clientX -
                touchStartX;


            const dy =
                touch.clientY -
                touchStartY;


            treeWrapper.scrollLeft =
                touchScrollX -
                dx;


            treeWrapper.scrollTop =
                touchScrollY -
                dy;

        },
        {
            passive:
                true
        }
    );

}


/* =========================================================
   RESIZE
   ========================================================= */

let resizeFrame =
    null;


window.addEventListener(
    "resize",
    () => {

        if (
            resizeFrame
        ) {

            cancelAnimationFrame(
                resizeFrame
            );

        }


        resizeFrame =
            requestAnimationFrame(
                () => {

                    drawConnections();

                }
            );

    }
);


/* =========================================================
   FONT LOADING
   ========================================================= */

if (
    document.fonts &&
    document.fonts.ready
) {

    document.fonts.ready
        .then(
            () => {

                requestAnimationFrame(
                    () => {

                        drawConnections();

                    }
                );

            }
        )
        .catch(
            () => {

                /* Ignore font loading errors */

            }
        );

}


/* =========================================================
   FORMAT FIELD NAME
   ========================================================= */

function formatFieldName(
    key
) {

    return String(
        key
    )
        .replace(
            /([A-Z])/g,
            " $1"
        )
        .replace(
            /[_-]/g,
            " "
        )
        .replace(
            /^./,
            character =>
                character.toUpperCase()
        );

}


/* =========================================================
   FORMAT VALUE
   ========================================================= */

function formatValue(
    value
) {

    if (
        value ===
            null ||
        value ===
            undefined ||
        value ===
            ""
    ) {

        return "—";

    }


    /* =====================================================
       FIRESTORE TIMESTAMP
       ===================================================== */

    if (
        value &&
        typeof value.toDate ===
            "function"
    ) {

        try {

            const date =
                value.toDate();


            if (
                !Number.isNaN(
                    date.getTime()
                )
            ) {

                return date.toLocaleString(
                    "en-IN",
                    {
                        day:
                            "2-digit",

                        month:
                            "long",

                        year:
                            "numeric",

                        hour:
                            "2-digit",

                        minute:
                            "2-digit",

                        hour12:
                            true
                    }
                );

            }

        } catch {

            /* Continue */

        }

    }


    /* =====================================================
       FIRESTORE SERIALIZED TIMESTAMP
       ===================================================== */

    if (
        typeof value ===
            "object" &&
        value.seconds !==
            undefined
    ) {

        try {

            const seconds =
                Number(
                    value.seconds
                );


            const nanoseconds =
                Number(
                    value.nanoseconds ||
                    0
                );


            const milliseconds =
                (
                    seconds *
                    1000
                ) +
                Math.floor(
                    nanoseconds /
                    1000000
                );


            const date =
                new Date(
                    milliseconds
                );


            if (
                !Number.isNaN(
                    date.getTime()
                )
            ) {

                return date.toLocaleString(
                    "en-IN",
                    {
                        day:
                            "2-digit",

                        month:
                            "long",

                        year:
                            "numeric",

                        hour:
                            "2-digit",

                        minute:
                            "2-digit",

                        hour12:
                            true
                    }
                );

            }

        } catch {

            /* Continue */

        }

    }


    /* =====================================================
       ARRAY
       ===================================================== */

    if (
        Array.isArray(
            value
        )
    ) {

        return value
            .map(
                item =>
                    formatValue(
                        item
                    )
            )
            .join(
                ", "
            );

    }


    /* =====================================================
       OBJECT
       ===================================================== */

    if (
        typeof value ===
            "object"
    ) {

        try {

            return JSON.stringify(
                value
            );

        } catch {

            return String(
                value
            );

        }

    }


    return String(
        value
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   START
   ========================================================= */

loadFamilyTree();
loadFamilyPhoto();