/* =========================================================
   ROY BARI — FAMILY TREE
   FIREBASE FIRESTORE
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
   ZOOM ELEMENTS
   ========================================================= */

const zoomIn =
    document.getElementById("zoomIn");

const zoomOut =
    document.getElementById("zoomOut");

const resetZoom =
    document.getElementById("resetZoom");


/* =========================================================
   SEARCH
   ========================================================= */

const searchInput =
    document.getElementById("personSearch");

let searchResults = null;


/* =========================================================
   PERSON MODAL
   ========================================================= */

const personModal =
    document.getElementById("personModal");

const personModalBody =
    document.getElementById("personModalBody");

const personModalClose =
    document.getElementById("personModalClose");


/* =========================================================
   FATHERS MODAL
   ========================================================= */

const showFathers =
    document.getElementById("showFathers");

const fathersModal =
    document.getElementById("fathersModal");

const fathersModalBody =
    document.getElementById("fathersModalBody");

const fathersModalClose =
    document.getElementById("fathersModalClose");


/* =========================================================
   DATA
   ========================================================= */

let members = {};

let generations = {};

let childrenOf = {};

let parentsOf = {};


/*
   IMPORTANT

   This always stores the EXACT UNIQUE ID
   of the currently selected person.

   Names are NEVER used as identifiers.

   Example:

   ID 1111145125
   MONALISHA ROY
   Father: MANIK ROY

   ID 1111143111
   MONALISHA ROY
   Father: RAJAT KUMAR ROY

   These are two different people.
*/

let selectedPersonId = null;


/* =========================================================
   ZOOM
   ========================================================= */

let zoom = 1;

const MIN_ZOOM = 0.5;

const MAX_ZOOM = 2;

const ZOOM_STEP = 0.1;


/* =========================================================
   LOAD FAMILY TREE
   ========================================================= */

async function loadFamilyTree() {

    try {

        status.textContent =
            "Loading family tree…";


        /* =================================================
           GET FAMILY MEMBERS
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
            docSnapshot => {

                members[docSnapshot.id] = {

                    id:
                        docSnapshot.id,

                    ...docSnapshot.data()

                };

            }
        );


        console.log(
            "Family members:",
            members
        );


        /* =================================================
           BUILD RELATIONSHIPS
           ================================================= */

        buildRelationshipMaps();


        /* =================================================
           GROUP GENERATIONS
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


        status.textContent =
            count === 1
                ? "1 family member"
                : `${count} family members`;


    } catch (error) {

        console.error(
            "Family tree error:",
            error
        );


        status.textContent =
            "Unable to load family tree.";

    }

}


/* =========================================================
   BUILD RELATIONSHIP MAP
   ========================================================= */

function buildRelationshipMaps() {

    childrenOf = {};

    parentsOf = {};


    Object.keys(
        members
    ).forEach(
        childId => {

            const child =
                String(
                    childId
                );


            /*
               Generation 1 has no father.
            */

            if (
                child.length <= 1
            ) {

                return;

            }


            /*
               Family hierarchy:

               11  → father of 111
               11  → father of 112
               12  → father of 121

               Therefore:

               child ID minus last digit
               = father ID
            */

            const parentId =
                child.slice(
                    0,
                    -1
                );


            /*
               Only create connection
               when father exists.
            */

            if (
                !members[parentId]
            ) {

                return;

            }


            /* =================================================
               PARENT → CHILDREN
               ================================================= */

            if (
                !childrenOf[parentId]
            ) {

                childrenOf[parentId] =
                    new Set();

            }


            childrenOf[parentId].add(
                childId
            );


            /* =================================================
               CHILD → PARENT
               ================================================= */

            if (
                !parentsOf[childId]
            ) {

                parentsOf[childId] =
                    new Set();

            }


            parentsOf[childId].add(
                parentId
            );

        }
    );


    console.log(
        "Children:",
        childrenOf
    );


    console.log(
        "Parents:",
        parentsOf
    );

}


/* =========================================================
   GROUP MEMBERS BY GENERATION
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
                !generations[generation]
            ) {

                generations[generation] =
                    [];

            }


            generations[generation].push(
                person
            );

        }
    );


    console.log(
        "Generations:",
        generations
    );

}


/* =========================================================
   SORT GENERATION
   ========================================================= */

function sortGeneration(
    people
) {

    return [
        ...people
    ].sort(
        (a, b) => {

            const idA =
                String(
                    a.id
                );

            const idB =
                String(
                    b.id
                );


            const numA =
                Number(
                    idA
                );

            const numB =
                Number(
                    idB
                );


            if (
                Number.isFinite(
                    numA
                ) &&
                Number.isFinite(
                    numB
                )
            ) {

                return (
                    numA -
                    numB
                );

            }


            return String(
                a.name || ""
            ).localeCompare(
                String(
                    b.name || ""
                )
            );

        }
    );

}


/* =========================================================
   RENDER TREE
   ========================================================= */

function renderTree() {

    familyTree.innerHTML =
        "";

    treeLines.innerHTML =
        "";


    const generationNumbers =
        Object.keys(
            generations
        )
            .map(
                Number
            )
            .sort(
                (a, b) =>
                    a - b
            );


    if (
        generationNumbers.length === 0
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
                sortGeneration(
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


    /* =====================================================
       RESET ZOOM
       ===================================================== */

    applyZoom(
        false
    );


    /* =====================================================
       DRAW CONNECTIONS
       ===================================================== */

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
        generation;


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

            const card =
                createPersonCard(
                    person
                );


            peopleContainer.appendChild(
                card
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
       VERY IMPORTANT

       Store exact unique Family ID.

       Search navigation uses this.
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
                value !== undefined &&
                value !== null &&
                value !== ""
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

        ${
            years
                ? `
                    <div class="person-meta">

                        <span class="person-years">

                            ${escapeHTML(
                                years
                            )}

                        </span>

                    </div>
                `
                : ""
        }

    `;


    /* =====================================================
       NORMAL CARD CLICK
       ===================================================== */

    card.addEventListener(
        "click",
        () => {

            selectedPersonId =
                String(
                    person.id
                );


            console.log(
                "TREE CARD CLICK:",
                selectedPersonId
            );


            /*
               Direct card click opens
               details modal.
            */

            showPerson(
                person
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
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();


                selectedPersonId =
                    String(
                        person.id
                    );


                showPerson(
                    person
                );

            }

        }
    );


    return card;

}


/* =========================================================
   FIND EXACT CARD
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
   DRAW CONNECTIONS
   ========================================================= */

function drawConnections() {

    if (
        !treeLines ||
        !treeStage
    ) {

        return;

    }


    treeLines.innerHTML =
        "";


    const stageRect =
        treeStage.getBoundingClientRect();


    const width =
        Math.max(
            treeStage.scrollWidth,
            treeStage.offsetWidth,
            familyTree.scrollWidth
        );


    const height =
        Math.max(
            treeStage.scrollHeight,
            treeStage.offsetHeight,
            familyTree.scrollHeight
        );


    treeLines.setAttribute(
        "width",
        width
    );


    treeLines.setAttribute(
        "height",
        height
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
                stageRect
            );

        }
    );

}


/* =========================================================
   DRAW PARENT → CHILD
   ========================================================= */

function drawParentToChild(
    childId,
    stageRect
) {

    const parentIds =
        Array.from(
            parentsOf[
                childId
            ] || []
        );


    if (
        parentIds.length === 0
    ) {

        return;

    }


    const childCard =
        findCard(
            childId
        );


    if (!childCard) {

        return;

    }


    let parentX = 0;

    let parentY = 0;

    let parentCount = 0;


    parentIds.forEach(
        parentId => {

            const parentCard =
                findCard(
                    parentId
                );


            if (!parentCard) {

                return;

            }


            const rect =
                parentCard.getBoundingClientRect();


            parentX +=
                rect.left +
                rect.width / 2 -
                stageRect.left;


            parentY =
                Math.max(
                    parentY,
                    rect.bottom -
                    stageRect.top
                );


            parentCount++;

        }
    );


    if (
        parentCount === 0
    ) {

        return;

    }


    parentX /=
        parentCount;


    const childRect =
        childCard.getBoundingClientRect();


    const childX =
        childRect.left +
        childRect.width / 2 -
        stageRect.left;


    const childY =
        childRect.top -
        stageRect.top;


    if (
        childY <= parentY
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
   CREATE CURVED LINE
   ========================================================= */

function createCurve(
    x1,
    y1,
    x2,
    y2
) {

    const distance =
        y2 - y1;


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
   SHOW PERSON
   ========================================================= */

function showPerson(
    person
) {

    selectedPersonId =
        String(
            person.id
        );


    const father =
        getFather(
            person.id
        );


    let html = `

        <p class="modal-eyebrow">

            Generation
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
       FAMILY INFORMATION
       ===================================================== */

    html += `

        <div class="modal-section">

            <p class="modal-section-label">

                Family Information

            </p>

            <div class="person-data">

    `;


    Object.entries(
        person
    ).forEach(
        ([key, value]) => {

            if (
                key === "id"
            ) {

                return;

            }


            html += `

                <div class="data-row">

                    <span class="data-label">

                        ${escapeHTML(
                            formatFieldName(
                                key
                            )
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
    );


    html += `

            </div>

        </div>

    `;


    /* =====================================================
       FATHER
       ===================================================== */

    if (father) {

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

    const children =
        getChildren(
            person.id
        );


    if (
        children.length > 0
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
   GET FATHER
   ========================================================= */

function getFather(
    personId
) {

    const id =
        String(
            personId
        );


    if (
        id.length <= 1
    ) {

        return null;

    }


    /*
       Example:

       11111433221
              ↓
       1111143322
    */

    const fatherId =
        id.slice(
            0,
            -1
        );


    return (
        members[
            fatherId
        ] ||
        null
    );

}


/* =========================================================
   GET CHILDREN
   ========================================================= */

function getChildren(
    parentId
) {

    return Array.from(
        childrenOf[
            parentId
        ] || []
    )
        .map(
            childId =>
                members[
                    childId
                ]
        )
        .filter(
            Boolean
        );

}


/* =========================================================
   SEARCH RESULTS CONTAINER
   ========================================================= */

function createSearchResultsContainer() {

    if (
        !searchInput
    ) {

        return null;

    }


    const existing =
        document.getElementById(
            "familySearchResults"
        );


    if (existing) {

        return existing;

    }


    const container =
        document.createElement(
            "div"
        );


    container.id =
        "familySearchResults";


    container.className =
        "family-search-results";


    const searchField =
        searchInput.closest(
            ".search-field"
        );


    if (searchField) {

        searchField.appendChild(
            container
        );

    } else if (
        searchInput.parentElement
    ) {

        searchInput.parentElement.appendChild(
            container
        );

    }


    return container;

}


searchResults =
    createSearchResultsContainer();


/* =========================================================
   CREATE SEARCH RESULT
   =========================================================

   USER SEES ONLY:

   NAME
   FATHER NAME

   FAMILY ID IS NOT SHOWN.
   GENERATION IS NOT SHOWN.

   ID IS ONLY STORED INTERNALLY.
   ========================================================= */

function createSearchResult(
    person
) {

    const result =
        document.createElement(
            "button"
        );


    result.type =
        "button";


    result.className =
        "family-search-result";


    /*
       Store exact unique ID internally.
    */

    result.dataset.personId =
        String(
            person.id
        );


    const name =
        person.name ||
        "Unknown";


    const father =
        getFather(
            person.id
        );


    const fatherName =
        father?.name ||
        "Father information unavailable";


    result.innerHTML = `

        <span class="family-search-result-name">

            ${escapeHTML(
                name
            )}

        </span>

        <span class="family-search-result-father">

            Father:

            <strong>

                ${escapeHTML(
                    fatherName
                )}

            </strong>

        </span>

    `;


    /* =====================================================
       SEARCH RESULT CLICK
       ===================================================== */

    result.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            console.log(
                "================================"
            );


            console.log(
                "SEARCH RESULT CLICKED"
            );


            console.log(
                "Name:",
                person.name
            );


            console.log(
                "Father:",
                fatherName
            );


            console.log(
                "EXACT PERSON ID:",
                person.id
            );


            console.log(
                "Generation:",
                person.generation
            );


            console.log(
                "================================"
            );


            /*
               IMPORTANT:

               DO NOT use:

               showPerson(person)

               here.

               We only navigate to
               the exact tree card.
            */

            goToPerson(
                person
            );

        }
    );


    return result;

}


/* =========================================================
   SHOW SEARCH RESULTS
   ========================================================= */

function showSearchResults(
    results
) {

    if (
        !searchResults
    ) {

        return;

    }


    searchResults.innerHTML =
        "";


    /* =====================================================
       NO RESULT
       ===================================================== */

    if (
        results.length === 0
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
       ALL RESULTS
       ===================================================== */

    results.forEach(
        person => {

            const result =
                createSearchResult(
                    person
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
   CLEAR SEARCH RESULTS
   ========================================================= */

function clearSearchResults() {

    document
        .querySelectorAll(
            ".person-card"
        )
        .forEach(
            card => {

                card.classList.remove(
                    "is-match"
                );

                card.classList.remove(
                    "search-selected"
                );

            }
        );


    if (
        searchResults
    ) {

        searchResults.innerHTML =
            "";

        searchResults.style.display =
            "none";

    }

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

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();


            /* =================================================
               CLEAR OLD HIGHLIGHTS
               ================================================= */

            document
                .querySelectorAll(
                    ".person-card"
                )
                .forEach(
                    card => {

                        card.classList.remove(
                            "is-match"
                        );

                        card.classList.remove(
                            "search-selected"
                        );

                    }
                );


            /* =================================================
               CLEAR OLD RESULTS
               ================================================= */

            if (
                searchResults
            ) {

                searchResults.innerHTML =
                    "";

                searchResults.style.display =
                    "none";

            }


            /* =================================================
               EMPTY
               ================================================= */

            if (
                !query
            ) {

                return;

            }


            /* =================================================
               FIND ALL MATCHES
               ================================================= */

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
                               Search by:

                               Name
                               OR
                               Family ID

                               Family ID remains hidden
                               from the results.
                            */

                            return (
                                name.includes(
                                    query
                                ) ||
                                id.includes(
                                    query
                                )
                            );

                        }
                    )
                    .sort(
                        (a, b) => {

                            const nameA =
                                String(
                                    a.name ||
                                    ""
                                );


                            const nameB =
                                String(
                                    b.name ||
                                    ""
                                );


                            const nameCompare =
                                nameA.localeCompare(
                                    nameB
                                );


                            if (
                                nameCompare !== 0
                            ) {

                                return nameCompare;

                            }


                            /*
                               If same name,
                               sort internally by ID.

                               Both remain separate.
                            */

                            return String(
                                a.id
                            ).localeCompare(
                                String(
                                    b.id
                                ),
                                undefined,
                                {
                                    numeric:
                                        true
                                }
                            );

                        }
                    );


            /* =================================================
               HIGHLIGHT ALL MATCHING CARDS
               ================================================= */

            results.forEach(
                person => {

                    const card =
                        findCard(
                            person.id
                        );


                    if (
                        card
                    ) {

                        card.classList.add(
                            "is-match"
                        );

                    }

                }
            );


            /* =================================================
               SHOW ALL RESULTS

               IMPORTANT:

               Even if there is only one result,
               we still show the result.

               User decides which person to open.
            */

            showSearchResults(
                results
            );

        }
    );


    /* =====================================================
       FOCUS

       If search already contains text,
       rebuild the results.
    ===================================================== */

    searchInput.addEventListener(
        "focus",
        () => {

            const query =
                searchInput.value
                    .trim();


            if (
                !query
            ) {

                return;

            }


            searchInput.dispatchEvent(
                new Event(
                    "input"
                )
            );

        }
    );


    /* =====================================================
       ESCAPE SEARCH
       ===================================================== */

    searchInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                clearSearchResults();

                searchInput.blur();

            }

        }
    );

}


/* =========================================================
   GO TO EXACT PERSON
   =========================================================

   THIS IS THE IMPORTANT FIX.

   We do NOT use:

       scrollIntoView()

   because the tree has:

       treeWrapper
       treeStage
       transform: scale()

   We calculate the exact visual difference and
   compensate for zoom.
   ========================================================= */

function goToPerson(
    person
) {

    if (
        !person
    ) {

        return;

    }


    /* =====================================================
       EXACT UNIQUE ID
       ===================================================== */

    const personId =
        String(
            person.id
        );


    selectedPersonId =
        personId;


    console.log(
        "GO TO PERSON:",
        {
            id:
                personId,

            name:
                person.name,

            father:
                getFather(
                    personId
                )?.name,

            generation:
                person.generation
        }
    );


    /* =====================================================
       FIND EXACT CARD
       ===================================================== */

    const card =
        findCard(
            personId
        );


    if (
        !card
    ) {

        console.error(
            "Exact person card not found:",
            personId
        );

        return;

    }


    /* =====================================================
       REMOVE OLD SEARCH HIGHLIGHT
       ===================================================== */

    document
        .querySelectorAll(
            ".person-card"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "search-selected"
                );

            }
        );


    /* =====================================================
       HIGHLIGHT EXACT CARD
       ===================================================== */

    card.classList.add(
        "search-selected"
    );


    /* =====================================================
       WAIT FOR LAYOUT
       ===================================================== */

    requestAnimationFrame(
        () => {

            requestAnimationFrame(
                () => {

                    scrollToExactPerson(
                        card
                    );

                }
            );

        }
    );


    /* =====================================================
       KEEP SEARCH TEXT

       Example:

       MONA

       stays in input.
    */


    /* =====================================================
       HIDE DROPDOWN AFTER CLICK
       ===================================================== */

    if (
        searchResults
    ) {

        searchResults.style.display =
            "none";

    }


    /* =====================================================
       KEEP HIGHLIGHT FOR 4 SECONDS
       ===================================================== */

    setTimeout(
        () => {

            card.classList.remove(
                "search-selected"
            );

        },
        4000
    );

}


/* =========================================================
   SCROLL TO EXACT PERSON
   ========================================================= */

function scrollToExactPerson(
    card
) {

    if (
        !card ||
        !treeWrapper
    ) {

        return;

    }


    /* =====================================================
       GET CURRENT POSITIONS
       ===================================================== */

    const cardRect =
        card.getBoundingClientRect();


    const wrapperRect =
        treeWrapper.getBoundingClientRect();


    /* =====================================================
       CARD CENTER
       ===================================================== */

    const cardCenterX =
        cardRect.left +
        (
            cardRect.width /
            2
        );


    const cardCenterY =
        cardRect.top +
        (
            cardRect.height /
            2
        );


    /* =====================================================
       WRAPPER CENTER
       ===================================================== */

    const wrapperCenterX =
        wrapperRect.left +
        (
            treeWrapper.clientWidth /
            2
        );


    const wrapperCenterY =
        wrapperRect.top +
        (
            treeWrapper.clientHeight /
            2
        );


    /* =====================================================
       VISUAL DISTANCE
       ===================================================== */

    const visualDifferenceX =
        cardCenterX -
        wrapperCenterX;


    const visualDifferenceY =
        cardCenterY -
        wrapperCenterY;


    /*
       IMPORTANT:

       The treeStage uses:

           transform: scale(zoom)

       Therefore the visual distance is larger/smaller
       than the actual scroll distance.

       Divide by zoom.
    */

    const scrollDifferenceX =
        visualDifferenceX /
        zoom;


    const scrollDifferenceY =
        visualDifferenceY /
        zoom;


    /* =====================================================
       TARGET SCROLL
       ===================================================== */

    let targetLeft =
        treeWrapper.scrollLeft +
        scrollDifferenceX;


    let targetTop =
        treeWrapper.scrollTop +
        scrollDifferenceY;


    /* =====================================================
       SCROLL LIMITS
       ===================================================== */

    const maxLeft =
        Math.max(
            0,
            treeWrapper.scrollWidth -
            treeWrapper.clientWidth
        );


    const maxTop =
        Math.max(
            0,
            treeWrapper.scrollHeight -
            treeWrapper.clientHeight
        );


    /* =====================================================
       KEEP TARGET INSIDE RANGE
       ===================================================== */

    targetLeft =
        Math.max(
            0,
            Math.min(
                targetLeft,
                maxLeft
            )
        );


    targetTop =
        Math.max(
            0,
            Math.min(
                targetTop,
                maxTop
            )
        );


    console.log(
        "TREE NAVIGATION:",
        {
            card:
                card.dataset.personId,

            zoom,

            currentLeft:
                treeWrapper.scrollLeft,

            currentTop:
                treeWrapper.scrollTop,

            targetLeft,

            targetTop
        }
    );


    /* =====================================================
       SCROLL
       ===================================================== */

    treeWrapper.scrollTo({

        left:
            targetLeft,

        top:
            targetTop,

        behavior:
            "smooth"

    });


    /* =====================================================
       SECOND CORRECTION

       After smooth scrolling, check the exact card again.
    ===================================================== */

    setTimeout(
        () => {

            correctPersonPosition(
                card
            );

        },
        700
    );

}


/* =========================================================
   CORRECT PERSON POSITION
   ========================================================= */

function correctPersonPosition(
    card
) {

    if (
        !card ||
        !treeWrapper
    ) {

        return;

    }


    const cardRect =
        card.getBoundingClientRect();


    const wrapperRect =
        treeWrapper.getBoundingClientRect();


    const cardCenterX =
        cardRect.left +
        (
            cardRect.width /
            2
        );


    const cardCenterY =
        cardRect.top +
        (
            cardRect.height /
            2
        );


    const wrapperCenterX =
        wrapperRect.left +
        (
            treeWrapper.clientWidth /
            2
        );


    const wrapperCenterY =
        wrapperRect.top +
        (
            treeWrapper.clientHeight /
            2
        );


    const differenceX =
        cardCenterX -
        wrapperCenterX;


    const differenceY =
        cardCenterY -
        wrapperCenterY;


    /*
       If the card is already close enough,
       don't move anything.
    */

    if (
        Math.abs(
            differenceX
        ) < 8 &&
        Math.abs(
            differenceY
        ) < 8
    ) {

        return;

    }


    const correctionX =
        differenceX /
        zoom;


    const correctionY =
        differenceY /
        zoom;


    let targetLeft =
        treeWrapper.scrollLeft +
        correctionX;


    let targetTop =
        treeWrapper.scrollTop +
        correctionY;


    const maxLeft =
        Math.max(
            0,
            treeWrapper.scrollWidth -
            treeWrapper.clientWidth
        );


    const maxTop =
        Math.max(
            0,
            treeWrapper.scrollHeight -
            treeWrapper.clientHeight
        );


    targetLeft =
        Math.max(
            0,
            Math.min(
                targetLeft,
                maxLeft
            )
        );


    targetTop =
        Math.max(
            0,
            Math.min(
                targetTop,
                maxTop
            )
        );


    treeWrapper.scrollTo({

        left:
            targetLeft,

        top:
            targetTop,

        behavior:
            "smooth"

    });

}


/* =========================================================
   CLOSE SEARCH WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        if (
            !searchInput
        ) {

            return;

        }


        if (
            event.target.closest(
                ".search-field"
            )
        ) {

            return;

        }


        if (
            searchResults
        ) {

            searchResults.innerHTML =
                "";

            searchResults.style.display =
                "none";

        }

    }
);


/* =========================================================
   APPLY ZOOM
   ========================================================= */

function applyZoom(
    redraw = true
) {

    if (
        !treeStage
    ) {

        return;

    }


    treeStage.style.transform =
        `scale(${zoom})`;


    treeStage.style.transformOrigin =
        "top left";


    if (
        resetZoom
    ) {

        resetZoom.textContent =
            `${Math.round(
                zoom * 100
            )}%`;

    }


    if (
        redraw
    ) {

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
                Math.min(
                    MAX_ZOOM,
                    Number(
                        (
                            zoom +
                            ZOOM_STEP
                        ).toFixed(2)
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
                Math.max(
                    MIN_ZOOM,
                    Number(
                        (
                            zoom -
                            ZOOM_STEP
                        ).toFixed(2)
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

            zoom = 1;

            applyZoom();

        }
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


        clearSearchResults();

    }
);


/* =========================================================
   SHOW FATHERS
   ========================================================= */

if (
    showFathers
) {

    showFathers.addEventListener(
        "click",
        showAllFathers
    );

}


/* =========================================================
   SHOW FATHER LINEAGE
   ========================================================= */

function showAllFathers() {

    /* =====================================================
       NO SELECTED PERSON
       ===================================================== */

    if (
        !selectedPersonId
    ) {

        fathersModalBody.innerHTML = `

            <p class="modal-eyebrow">

                ROY BARI

            </p>

            <h2 id="fathersModalTitle">

                Father Lineage

            </h2>

            <p>

                Click a family member first.

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
       START FROM EXACT PERSON
       ===================================================== */

    let currentId =
        String(
            selectedPersonId
        );


    const lineage = [];


    /* =====================================================
       FOLLOW FATHER CHAIN
       ===================================================== */

    while (
        currentId.length > 1
    ) {

        const fatherId =
            currentId.slice(
                0,
                -1
            );


        if (
            !members[
                fatherId
            ]
        ) {

            break;

        }


        const father =
            members[
                fatherId
            ];


        lineage.push(
            father
        );


        currentId =
            fatherId;

    }


    /* =====================================================
       NO FATHERS
       ===================================================== */

    if (
        lineage.length === 0
    ) {

        fathersModalBody.innerHTML = `

            <p class="modal-eyebrow">

                ROY BARI

            </p>

            <h2 id="fathersModalTitle">

                Father Lineage

            </h2>

            <p>

                No father information found for

                <strong>

                    ${escapeHTML(
                        members[
                            selectedPersonId
                        ]?.name ||
                        selectedPersonId
                    )}

                </strong>

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


    const selectedPerson =
        members[
            selectedPersonId
        ];


    /* =====================================================
       HEADER
       ===================================================== */

    let html = `

        <p class="modal-eyebrow">

            ROY BARI

        </p>

        <h2 id="fathersModalTitle">

            Father Lineage

        </h2>

        <p class="modal-description">

            Ancestors of

            <strong>

                ${escapeHTML(
                    selectedPerson?.name ||
                    selectedPersonId
                )}

            </strong>

        </p>

    `;


    /* =====================================================
       LINEAGE
       ===================================================== */

    lineage.forEach(
        (father, index) => {

            let relationship;


            if (
                index === 0
            ) {

                relationship =
                    "Father";

            } else if (
                index === 1
            ) {

                relationship =
                    "Grandfather";

            } else {

                relationship =
                    "Great-".repeat(
                        index - 1
                    ) +
                    "Grandfather";

            }


            html += `

                <div class="father-record">

                    <div class="father-number">

                        ${index + 1}

                    </div>

                    <div class="father-information">

                        <p class="modal-section-label">

                            ${escapeHTML(
                                relationship
                            )}

                        </p>

            `;


            Object.entries(
                father
            ).forEach(
                ([key, value]) => {

                    if (
                        key === "id"
                    ) {

                        return;

                    }


                    html += `

                        <div class="data-row">

                            <span class="data-label">

                                ${escapeHTML(
                                    formatFieldName(
                                        key
                                    )
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
            );


            html += `

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
   DRAG / PAN
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

            /*
               Don't pan when clicking:

               person card
               button
               input
            */

            if (
                event.target.closest(
                    ".person-card"
                ) ||
                event.target.closest(
                    "button"
                ) ||
                event.target.closest(
                    "input"
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
            !isPanning
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
                ) ||
                event.target.closest(
                    "button"
                ) ||
                event.target.closest(
                    "input"
                )
            ) {

                return;

            }


            const touch =
                event.touches[0];


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
            passive: true
        }
    );


    treeWrapper.addEventListener(
        "touchmove",
        event => {

            if (
                event.target.closest(
                    ".person-card"
                ) ||
                event.target.closest(
                    "button"
                ) ||
                event.target.closest(
                    "input"
                )
            ) {

                return;

            }


            const touch =
                event.touches[0];


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
            passive: true
        }
    );

}


/* =========================================================
   REDRAW AFTER RESIZE
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
   REDRAW AFTER SCROLL
   ========================================================= */

if (
    treeWrapper
) {

    treeWrapper.addEventListener(
        "scroll",
        () => {

            drawConnections();

        },
        {
            passive: true
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
            /[\_-]/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        .replace(
            /^./,
            char =>
                char.toUpperCase()
        );

}


/* =========================================================
   FORMAT VALUE
   ========================================================= */

function formatValue(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "";

    }


    /* =====================================================
       FIRESTORE TIMESTAMP
       ===================================================== */

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        try {

            return value
                .toDate()
                .toLocaleString(
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

        } catch (
            error
        ) {

            console.warn(
                "Timestamp conversion failed:",
                error
            );

        }

    }


    /* =====================================================
       SERIALIZED FIRESTORE TIMESTAMP
       ===================================================== */

    if (
        typeof value === "object" &&
        value.seconds !== undefined
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

        } catch (
            error
        ) {

            console.warn(
                "Serialized timestamp conversion failed:",
                error
            );

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

        return value.join(
            ", "
        );

    }


    /* =====================================================
       OBJECT
       ===================================================== */

    if (
        typeof value === "object"
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


    /* =====================================================
       NORMAL
       ===================================================== */

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
        value ?? ""
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
   CSS ESCAPE
   ========================================================= */

function cssEscape(
    value
) {

    if (
        window.CSS &&
        typeof CSS.escape ===
        "function"
    ) {

        return CSS.escape(
            String(
                value
            )
        );

    }


    return String(
        value
    )
        .replace(
            /["\\]/g,
            "\\$&"
        );

}


/* =========================================================
   START
   ========================================================= */

loadFamilyTree();