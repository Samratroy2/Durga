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

   Stores the person whose card was clicked.

   Example:

   11111433221

   Then Show Fathers follows:

   1111143322
   111114332
   11111433
   ...
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


        snapshot.forEach(doc => {

            members[doc.id] = {

                id: doc.id,

                ...doc.data()

            };

        });


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
            Object.keys(members).length;


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


    Object.keys(members).forEach(
        childId => {

            const child =
                String(childId);


            /*
               Generation 1 has no father.
            */

            if (
                child.length <= 1
            ) {

                return;

            }


            /*
               Example:

               111 → 11
               112 → 11
               121 → 12
            */

            const parentId =
                child.slice(
                    0,
                    -1
                );


            /*
               Only connect if parent exists.
            */

            if (
                !members[parentId]
            ) {

                return;

            }


            /*
               Parent → children
            */

            if (
                !childrenOf[parentId]
            ) {

                childrenOf[parentId] =
                    new Set();

            }


            childrenOf[parentId].add(
                childId
            );


            /*
               Child → parent
            */

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


    Object.values(members).forEach(
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

function sortGeneration(people) {

    return [...people].sort(
        (a, b) => {

            const idA =
                String(a.id);

            const idB =
                String(b.id);


            const numA =
                Number(idA);

            const numB =
                Number(idB);


            if (
                Number.isFinite(numA) &&
                Number.isFinite(numB)
            ) {

                return numA - numB;

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

    familyTree.innerHTML = "";

    treeLines.innerHTML = "";


    const generationNumbers =
        Object.keys(generations)
            .map(Number)
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


    /*
       Reset zoom after fresh render.
    */

    applyZoom(false);


    /*
       Wait for browser layout.
    */

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

function createPersonCard(person) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "person-card";


    card.dataset.personId =
        person.id;


    card.tabIndex =
        0;


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(
        "aria-label",
        `View details for ${
            person.name || "Unknown"
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
        .join(" – ");


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
       CLICK
       ===================================================== */

    card.addEventListener(
        "click",
        () => {

            /*
               Remember which person was clicked.
            */

            selectedPersonId =
                String(person.id);


            console.log(
                "Selected person:",
                selectedPersonId
            );


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
                    String(person.id);


                console.log(
                    "Selected person:",
                    selectedPersonId
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
   FIND CARD
   ========================================================= */

function findCard(personId) {

    return document.querySelector(
        `[data-person-id="${cssEscape(
            personId
        )}"]`
    );

}


/* =========================================================
   DRAW CONNECTIONS
   ========================================================= */

function drawConnections() {

    treeLines.innerHTML = "";


    const stageRect =
        treeStage.getBoundingClientRect();


    /*
       SVG must use actual stage dimensions.
    */

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


    /*
       Draw every parent connection.
    */

    Object.keys(parentsOf)
        .forEach(
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
            parentsOf[childId] || []
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


    /*
       Don't connect upward.
    */

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
   CREATE CURVED SVG LINE
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

function showPerson(person) {

    /*
       Make sure selected person is updated.
    */

    selectedPersonId =
        String(person.id);


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


    personModalClose.focus();

}


/* =========================================================
   GET FATHER
   ========================================================= */

function getFather(personId) {

    const id =
        String(personId);


    if (
        id.length <= 1
    ) {

        return null;

    }


    /*
       Father = remove last digit.

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
        members[fatherId] ||
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
        childrenOf[parentId] ||
        []
    )
        .map(
            childId =>
                members[childId]
        )
        .filter(Boolean);

}


/* =========================================================
   SHOW FATHER LINEAGE
   ========================================================= */

function showAllFathers() {

    /*
       No person selected.
    */

    if (!selectedPersonId) {

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


        fathersModalClose.focus();


        return;

    }


    /*
       Start from selected person.
    */

    let currentId =
        String(selectedPersonId);


    const lineage = [];


    /*
       Keep going upward.

       Example:

       11111433221
       ↓
       1111143322
       ↓
       111114332
       ↓
       11111433
       ↓
       1111143
       ↓
       111114
    */

    while (
        currentId.length > 1
    ) {

        const fatherId =
            currentId.slice(
                0,
                -1
            );


        /*
           Stop when the calculated
           father doesn't exist.
        */

        if (
            !members[fatherId]
        ) {

            break;

        }


        const father =
            members[fatherId];


        lineage.push(
            father
        );


        /*
           Continue from father.
        */

        currentId =
            fatherId;

    }


    /*
       No father records.
    */

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
                        members[selectedPersonId]?.name ||
                        selectedPersonId
                    )}

                </strong>

            </p>

        `;


        fathersModal.classList.add(
            "open"
        );


        fathersModalClose.focus();


        return;

    }


    const selectedPerson =
        members[selectedPersonId];


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
       DISPLAY LINEAGE
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


            /*
               Show all fields of this father.
            */

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


    fathersModalClose.focus();

}


/* =========================================================
   SEARCH
   ========================================================= */

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            const query =
                searchInput.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(
                    ".person-card"
                )
                .forEach(
                    card =>
                        card.classList.remove(
                            "is-match"
                        )
                );


            if (!query) {

                return;

            }


            let firstCard =
                null;


            Object.values(
                members
            ).forEach(
                person => {

                    const name =
                        String(
                            person.name ||
                            ""
                        )
                            .toLowerCase();


                    if (
                        !name.includes(
                            query
                        )
                    ) {

                        return;

                    }


                    const card =
                        findCard(
                            person.id
                        );


                    if (!card) {

                        return;

                    }


                    card.classList.add(
                        "is-match"
                    );


                    if (!firstCard) {

                        firstCard =
                            card;

                    }

                }
            );


            if (firstCard) {

                firstCard.scrollIntoView({

                    behavior:
                        "smooth",

                    block:
                        "center",

                    inline:
                        "center"

                });

            }

        }
    );

}


/* =========================================================
   APPLY ZOOM
   ========================================================= */

function applyZoom(
    redraw = true
) {

    treeStage.style.transform =
        `scale(${zoom})`;


    treeStage.style.transformOrigin =
        "top left";


    resetZoom.textContent =
        `${Math.round(
            zoom * 100
        )}%`;


    if (redraw) {

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

if (zoomIn) {

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

if (zoomOut) {

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

if (resetZoom) {

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

if (personModalClose) {

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

if (fathersModalClose) {

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

if (personModal) {

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

if (fathersModal) {

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
            event.key !== "Escape"
        ) {

            return;

        }


        if (personModal) {

            personModal.classList.remove(
                "open"
            );

        }


        if (fathersModal) {

            fathersModal.classList.remove(
                "open"
            );

        }

    }
);


/* =========================================================
   SHOW FATHERS
   ========================================================= */

if (showFathers) {

    showFathers.addEventListener(
        "click",
        showAllFathers
    );

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

if (treeWrapper) {

    treeWrapper.addEventListener(
        "mousedown",
        event => {

            /*
               Don't start panning on cards,
               buttons or inputs.
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

        if (!isPanning) {

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


        if (treeWrapper) {

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


if (treeWrapper) {

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

        if (resizeFrame) {

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

if (treeWrapper) {

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

function formatFieldName(key) {

    return String(key)

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

function formatValue(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "—";

    }


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


    return String(
        value
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value)

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

function cssEscape(value) {

    if (
        window.CSS &&
        typeof CSS.escape ===
        "function"
    ) {

        return CSS.escape(
            String(value)
        );

    }


    return String(value)
        .replace(
            /["\\]/g,
            "\\$&"
        );

}


/* =========================================================
   START
   ========================================================= */

loadFamilyTree();