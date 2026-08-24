/* =========================================================
   ROY BARI — FAMILY ADMIN
   FIRESTORE: familyMembers
   ACTIVITY HISTORY: activityLogs

   HIERARCHICAL FAMILY IDs

   1
   ├── 11
   ├── 12
   └── 13

   11
   ├── 111
   ├── 112
   └── 113

   12
   ├── 121
   └── 122

   FEATURES:
   - Father search by ID or name
   - Automatic child Family ID
   - Automatic generation
   - Mother selection
   - Spouse selection
   - Add member
   - Edit member
   - Delete member
   - ID change with reference updates
   - Activity logging
   - Firestore Family Members search
   - Search by ID, name, father, mother, spouse,
     relation, generation and years

   ========================================================= */


/* =========================================================
   FIREBASE AUTH
   ========================================================= */

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


/* =========================================================
   FIRESTORE
   ========================================================= */

import {
    collection,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    deleteField
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

import {
    auth,
    db
} from "../firebase.js";


/* =========================================================
   ACTIVITY LOGGER
   ========================================================= */

import {
    logActivity
} from "./activityLogger.js";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const form =
    document.getElementById(
        "familyForm"
    );


const memberIdInput =
    document.getElementById(
        "memberId"
    );


const nameInput =
    document.getElementById(
        "name"
    );


const relationInput =
    document.getElementById(
        "relation"
    );


/* =========================================================
   FATHER SEARCH
   ========================================================= */

const fatherSearch =
    document.getElementById(
        "fatherSearch"
    );


const fatherIdInput =
    document.getElementById(
        "fatherId"
    );


const fatherSuggestions =
    document.getElementById(
        "fatherSuggestions"
    );


/* =========================================================
   OTHER RELATIONSHIPS
   ========================================================= */

const motherSelect =
    document.getElementById(
        "motherId"
    );


const spouseSelect =
    document.getElementById(
        "spouseId"
    );


/* =========================================================
   AUTOMATIC / OTHER FIELDS
   ========================================================= */

const generationInput =
    document.getElementById(
        "generation"
    );


const birthYearInput =
    document.getElementById(
        "birthYear"
    );


const deathYearInput =
    document.getElementById(
        "deathYear"
    );


const imageInput =
    document.getElementById(
        "image"
    );


const biographyInput =
    document.getElementById(
        "biography"
    );


/* =========================================================
   FAMILY LIST
   ========================================================= */

const familyList =
    document.getElementById(
        "familyList"
    );


const memberCount =
    document.getElementById(
        "memberCount"
    );


/* =========================================================
   FIRESTORE FAMILY MEMBERS SEARCH
   ========================================================= */

const familySearch =
    document.getElementById(
        "familySearch"
    );


const clearFamilySearch =
    document.getElementById(
        "clearFamilySearch"
    );


const familySearchInfo =
    document.getElementById(
        "familySearchInfo"
    );


/* =========================================================
   FORM CONTROLS
   ========================================================= */

const formTitle =
    document.getElementById(
        "formTitle"
    );


const saveButton =
    document.getElementById(
        "saveButton"
    );


const cancelButton =
    document.getElementById(
        "cancelButton"
    );


const message =
    document.getElementById(
        "familyMessage"
    );


/* =========================================================
   ADMIN
   ========================================================= */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const adminEmail =
    document.getElementById(
        "adminEmail"
    );


/* =========================================================
   GLOBAL DATA
   ========================================================= */

let members = [];


/*
   When editing:

   originalId = original Firestore document ID.

   Example:

   originalId = "11"

   If changed to "13":

   familyMembers/11

   becomes:

   familyMembers/13
*/

let originalId = "";


/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "./index.html"
            );

            return;
        }


        if (adminEmail) {

            adminEmail.textContent =
                user.email ||
                "Admin";

        }


        await loadMembers();

    }
);


/* =========================================================
   LOAD MEMBERS
   ========================================================= */

async function loadMembers() {

    try {

        if (familyList) {

            familyList.innerHTML =
                "Loading family members...";

        }


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "familyMembers"
                )
            );


        members = [];


        snapshot.forEach(
            item => {

                members.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


        /* -----------------------------------------------------
           HIERARCHICAL NUMERIC SORTING

           1
           2
           11
           12
           111
           112
           121
           ----------------------------------------------------- */

        members.sort(
            (a, b) => {

                const aNumber =
                    Number(a.id);

                const bNumber =
                    Number(b.id);


                return (
                    aNumber -
                    bNumber
                );

            }
        );


        if (memberCount) {

            memberCount.textContent =
                `${members.length} member${
                    members.length === 1
                        ? ""
                        : "s"
                }`;

        }


        populateRelationshipSelects();

        renderMembers();

    }
    catch (error) {

        console.error(
            "Error loading family members:",
            error
        );


        if (familyList) {

            familyList.innerHTML = `

                <p class="message error">

                    Unable to load family members.

                </p>

            `;

        }

    }

}


/* =========================================================
   POPULATE MOTHER / SPOUSE SELECTS
   ========================================================= */

function populateRelationshipSelects() {

    const selects = [

        motherSelect,
        spouseSelect

    ];


    selects.forEach(
        select => {

            if (!select) {

                return;

            }


            select.innerHTML = `

                <option value="">
                    None
                </option>

            `;


            members.forEach(
                member => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        member.id;


                    option.textContent =
                        `${member.id} — ${
                            member.name ||
                            "Unnamed"
                        }`;


                    select.appendChild(
                        option
                    );

                }
            );

        }
    );

}


/* =========================================================
   FATHER SEARCH
   ========================================================= */

function searchFatherMembers() {

    if (
        !fatherSearch ||
        !fatherSuggestions
    ) {

        return;

    }


    const query =
        fatherSearch.value
            .trim()
            .toLowerCase();


    fatherSuggestions.innerHTML =
        "";


    if (!query) {

        fatherSuggestions.style.display =
            "none";

        return;

    }


    const results =
        members.filter(
            member => {

                /*
                   Do not allow a member
                   to select himself as father.
                */

                if (
                    originalId &&
                    member.id ===
                        originalId
                ) {

                    return false;

                }


                const id =
                    String(
                        member.id ||
                        ""
                    ).toLowerCase();


                const name =
                    String(
                        member.name ||
                        ""
                    ).toLowerCase();


                return (
                    id.includes(query) ||
                    name.includes(query) ||
                    `${id} ${name}`.includes(
                        query
                    )
                );

            }
        );


    if (
        results.length === 0
    ) {

        fatherSuggestions.innerHTML = `

            <div class="father-no-result">

                No family member found.

            </div>

        `;


        fatherSuggestions.style.display =
            "block";

        return;

    }


    results.forEach(
        member => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "father-suggestion";


            item.innerHTML = `

                <strong>

                    ${escapeHtml(
                        member.name ||
                        "Unnamed"
                    )}

                </strong>

                <small>

                    Family ID:
                    ${escapeHtml(
                        String(
                            member.id
                        )
                    )}

                    ${
                        member.generation !==
                            undefined &&
                        member.generation !==
                            null
                            ? ` • Generation ${
                                escapeHtml(
                                    String(
                                        member.generation
                                    )
                                )
                            }`
                            : ""
                    }

                </small>

            `;


            item.addEventListener(
                "click",
                () => {

                    selectFather(
                        member
                    );

                }
            );


            fatherSuggestions.appendChild(
                item
            );

        }
    );


    fatherSuggestions.style.display =
        "block";

}


/* =========================================================
   SELECT FATHER
   ========================================================= */

function selectFather(
    member
) {

    if (
        !member ||
        !fatherIdInput ||
        !fatherSearch
    ) {

        return;

    }


    /*
       Store actual Father ID.
    */

    fatherIdInput.value =
        member.id;


    /*
       Display:
       Name (ID)
    */

    fatherSearch.value =
        `${member.name || "Unnamed"} (${member.id})`;


    if (fatherSuggestions) {

        fatherSuggestions.innerHTML =
            "";

        fatherSuggestions.style.display =
            "none";

    }


    /*
       When editing, don't automatically
       change the Family ID.
    */

    if (originalId) {

        return;

    }


    /*
       Generate next child ID.
    */

    const nextId =
        generateNextChildId(
            member.id
        );


    memberIdInput.value =
        nextId;


    /*
       Father generation + 1.
    */

    if (
        member.generation !==
            undefined &&
        member.generation !==
            null
    ) {

        generationInput.value =
            Number(
                member.generation
            ) + 1;

    }
    else {

        generationInput.value =
            "";

    }

}


/* =========================================================
   FATHER SEARCH EVENTS
   ========================================================= */

if (fatherSearch) {

    fatherSearch.addEventListener(
        "input",
        () => {

            /*
               If search text changes,
               remove previously selected father.
            */

            fatherIdInput.value =
                "";


            /*
               For a new member, clear
               generated ID and generation.
            */

            if (!originalId) {

                memberIdInput.value =
                    "";

                generationInput.value =
                    "";

            }


            searchFatherMembers();

        }
    );


    fatherSearch.addEventListener(
        "focus",
        () => {

            if (
                fatherSearch.value.trim()
            ) {

                searchFatherMembers();

            }

        }
    );


    fatherSearch.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                if (fatherSuggestions) {

                    fatherSuggestions.style.display =
                        "none";

                }

            }

        }
    );

}


/* =========================================================
   CLOSE FATHER SEARCH WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        if (
            !event.target.closest(
                ".father-search-wrapper"
            )
        ) {

            if (fatherSuggestions) {

                fatherSuggestions.style.display =
                    "none";

            }

        }

    }
);


/* =========================================================
   GENERATE NEXT CHILD ID
   =========================================================

   Father 1:

   11
   12

   next = 13


   Father 11:

   111
   112

   next = 113

   ========================================================= */

function generateNextChildId(
    fatherId
) {

    if (!fatherId) {

        return "";

    }


    const parentId =
        String(
            fatherId
        );


    const childIds =
        members
            .map(
                member =>
                    String(
                        member.id
                    )
            )
            .filter(
                id =>

                    id.startsWith(
                        parentId
                    ) &&

                    id.length ===
                        parentId.length + 1
            );


    let highest =
        0;


    childIds.forEach(
        id => {

            const lastDigit =
                Number(
                    id.charAt(
                        id.length - 1
                    )
                );


            if (
                lastDigit >
                highest
            ) {

                highest =
                    lastDigit;

            }

        }
    );


    const nextNumber =
        highest + 1;


    if (
        nextNumber > 9
    ) {

        alert(
            "This ID system currently supports a maximum of 9 direct children for one parent."
        );

        return "";

    }


    return (
        parentId +
        nextNumber
    );

}


/* =========================================================
   BUILD CLEAN DATA FOR NEW MEMBER
   ========================================================= */

function buildNewMemberData() {

    const data = {};


    /* NAME */

    const name =
        nameInput.value.trim();


    if (name) {

        data.name =
            name;

    }


    /* RELATION */

    const relation =
        relationInput.value.trim();


    if (relation) {

        data.relation =
            relation;

    }


    /* FATHER */

    const selectedFatherId =
        fatherIdInput
            ? fatherIdInput.value.trim()
            : "";


    if (selectedFatherId) {

        data.fatherId =
            selectedFatherId;

    }


    /* MOTHER */

    if (
        motherSelect &&
        motherSelect.value
    ) {

        data.motherId =
            motherSelect.value;

    }


    /* SPOUSE */

    if (
        spouseSelect &&
        spouseSelect.value
    ) {

        data.spouseId =
            spouseSelect.value;

    }


    /* GENERATION */

    if (
        generationInput.value.trim()
    ) {

        data.generation =
            Number(
                generationInput.value
            );

    }


    /* BIRTH YEAR */

    if (
        birthYearInput.value.trim()
    ) {

        data.birthYear =
            Number(
                birthYearInput.value
            );

    }


    /* DEATH YEAR */

    if (
        deathYearInput.value.trim()
    ) {

        data.deathYear =
            Number(
                deathYearInput.value
            );

    }


    /* IMAGE */

    const image =
        imageInput.value.trim();


    if (image) {

        data.image =
            image;

    }


    /* BIOGRAPHY */

    const biography =
        biographyInput.value.trim();


    if (biography) {

        data.biography =
            biography;

    }


    /* TIMESTAMPS */

    data.createdAt =
        serverTimestamp();


    data.updatedAt =
        serverTimestamp();


    return data;

}


/* =========================================================
   BUILD UPDATE DATA
   ========================================================= */

function buildUpdateData() {

    const data = {};


    /* NAME */

    const name =
        nameInput.value.trim();


    if (name) {

        data.name =
            name;

    }
    else {

        data.name =
            deleteField();

    }


    /* RELATION */

    const relation =
        relationInput.value.trim();


    if (relation) {

        data.relation =
            relation;

    }
    else {

        data.relation =
            deleteField();

    }


    /* FATHER */

    const selectedFatherId =
        fatherIdInput
            ? fatherIdInput.value.trim()
            : "";


    if (selectedFatherId) {

        data.fatherId =
            selectedFatherId;

    }
    else {

        data.fatherId =
            deleteField();

    }


    /* MOTHER */

    if (
        motherSelect &&
        motherSelect.value
    ) {

        data.motherId =
            motherSelect.value;

    }
    else {

        data.motherId =
            deleteField();

    }


    /* SPOUSE */

    if (
        spouseSelect &&
        spouseSelect.value
    ) {

        data.spouseId =
            spouseSelect.value;

    }
    else {

        data.spouseId =
            deleteField();

    }


    /* GENERATION */

    if (
        generationInput.value.trim()
    ) {

        data.generation =
            Number(
                generationInput.value
            );

    }
    else {

        data.generation =
            deleteField();

    }


    /* BIRTH YEAR */

    if (
        birthYearInput.value.trim()
    ) {

        data.birthYear =
            Number(
                birthYearInput.value
            );

    }
    else {

        data.birthYear =
            deleteField();

    }


    /* DEATH YEAR */

    if (
        deathYearInput.value.trim()
    ) {

        data.deathYear =
            Number(
                deathYearInput.value
            );

    }
    else {

        data.deathYear =
            deleteField();

    }


    /* IMAGE */

    const image =
        imageInput.value.trim();


    if (image) {

        data.image =
            image;

    }
    else {

        data.image =
            deleteField();

    }


    /* BIOGRAPHY */

    const biography =
        biographyInput.value.trim();


    if (biography) {

        data.biography =
            biography;

    }
    else {

        data.biography =
            deleteField();

    }


    /*
       createdAt is never changed.
    */

    data.updatedAt =
        serverTimestamp();


    return data;

}


/* =========================================================
   SAVE FORM
   ========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const newId =
                memberIdInput.value.trim();


            /* VALIDATE ID */

            if (
                !/^[0-9]+$/.test(
                    newId
                )
            ) {

                showMessage(
                    "Family ID must contain numbers only.",
                    "error"
                );

                return;

            }


            /* VALIDATE NAME */

            if (
                !nameInput.value.trim()
            ) {

                showMessage(
                    "Please enter the member name.",
                    "error"
                );

                return;

            }


            /*
               Validate Father selection.

               If something is typed but
               no actual father was selected,
               prevent saving.
            */

            if (
                fatherSearch &&
                fatherSearch.value.trim() &&
                fatherIdInput &&
                !fatherIdInput.value
            ) {

                showMessage(
                    "Please select a father from the search results.",
                    "error"
                );

                return;

            }


            /* DUPLICATE ID */

            const duplicate =
                members.find(
                    member =>
                        member.id ===
                        newId
                );


            if (
                duplicate &&
                duplicate.id !==
                    originalId
            ) {

                showMessage(
                    `ID ${newId} already exists.`,
                    "error"
                );

                return;

            }


            saveButton.disabled =
                true;


            saveButton.textContent =
                originalId
                    ? "Updating..."
                    : "Saving...";


            try {

                /* =================================================
                   ADD NEW MEMBER
                   ================================================= */

                if (!originalId) {

                    const data =
                        buildNewMemberData();


                    await setDoc(
                        doc(
                            db,
                            "familyMembers",
                            newId
                        ),
                        data
                    );


                    await logActivity({

                        action:
                            "created",

                        collectionName:
                            "familyMembers",

                        documentId:
                            newId,

                        title:
                            data.name ||
                            "Unnamed Family Member",

                        details:
                            buildCreatedMemberDetails(
                                newId,
                                data
                            )

                    });


                    showMessage(
                        `Member added successfully with ID ${newId}.`,
                        "success"
                    );

                }


                /* =================================================
                   UPDATE EXISTING MEMBER
                   ================================================= */

                else {

                    const existingMember =
                        members.find(
                            member =>
                                member.id ===
                                originalId
                        );


                    if (!existingMember) {

                        throw new Error(
                            "Original family member was not found."
                        );

                    }


                    /* =================================================
                       ID HAS NOT CHANGED
                       ================================================= */

                    if (
                        originalId ===
                        newId
                    ) {

                        const updateData =
                            buildUpdateData();


                        /*
                           Calculate changes before
                           updating Firestore.
                        */

                        const changes =
                            getChangedFields(
                                existingMember
                            );


                        await updateDoc(
                            doc(
                                db,
                                "familyMembers",
                                originalId
                            ),
                            updateData
                        );


                        await logActivity({

                            action:
                                "updated",

                            collectionName:
                                "familyMembers",

                            documentId:
                                originalId,

                            title:
                                nameInput.value.trim(),

                            details:
                                changes.length
                                    ? formatChanges(
                                        changes
                                    )
                                    : "Family member information saved without changing the main fields."

                        });


                        showMessage(
                            "Member updated successfully.",
                            "success"
                        );

                    }


                    /* =================================================
                       ID HAS CHANGED
                       ================================================= */

                    else {

                        const alreadyExists =
                            members.some(
                                member =>
                                    member.id ===
                                    newId
                            );


                        if (
                            alreadyExists
                        ) {

                            throw new Error(
                                `ID ${newId} already exists.`
                            );

                        }


                        const newData =
                            buildNewMemberData();


                        /*
                           Preserve original createdAt.
                        */

                        if (
                            existingMember.createdAt
                        ) {

                            newData.createdAt =
                                existingMember.createdAt;

                        }


                        /*
                           Create new document.
                        */

                        await setDoc(
                            doc(
                                db,
                                "familyMembers",
                                newId
                            ),
                            newData
                        );


                        /*
                           Update all references.
                        */

                        await updateReferences(
                            originalId,
                            newId
                        );


                        /*
                           Delete old document.
                        */

                        await deleteDoc(
                            doc(
                                db,
                                "familyMembers",
                                originalId
                            )
                        );


                        await logActivity({

                            action:
                                "updated",

                            collectionName:
                                "familyMembers",

                            documentId:
                                newId,

                            title:
                                newData.name ||
                                existingMember.name ||
                                "Unnamed Family Member",

                            details:
                                `Family ID changed from "${originalId}" to "${newId}". ${
                                    buildChangedDetailsForIdChange(
                                        existingMember,
                                        newData
                                    )
                                }`

                        });


                        showMessage(
                            `Member ID changed from ${originalId} to ${newId}.`,
                            "success"
                        );

                    }

                }


                resetForm();

                await loadMembers();

            }
            catch (error) {

                console.error(
                    "Save family member error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to save family member.",
                    "error"
                );

            }


            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Member";

        }
    );

}


/* =========================================================
   GET CHANGED FIELDS
   ========================================================= */

function getChangedFields(
    oldMember
) {

    const changes = [];


    const fields = [

        "name",
        "relation",
        "fatherId",
        "motherId",
        "spouseId",
        "generation",
        "birthYear",
        "deathYear",
        "image",
        "biography"

    ];


    fields.forEach(
        field => {

            const oldValue =
                oldMember[field] ??
                "";


            const newValue =
                getCurrentFieldValue(
                    field
                );


            if (
                String(oldValue) !==
                String(newValue)
            ) {

                changes.push({

                    field:
                        field,

                    oldValue:
                        oldValue,

                    newValue:
                        newValue

                });

            }

        }
    );


    return changes;

}


/* =========================================================
   GET CURRENT FIELD VALUE
   ========================================================= */

function getCurrentFieldValue(
    field
) {

    switch (field) {

        case "name":

            return nameInput.value.trim();


        case "relation":

            return relationInput.value.trim();


        case "fatherId":

            return fatherIdInput
                ? fatherIdInput.value
                : "";


        case "motherId":

            return motherSelect
                ? motherSelect.value
                : "";


        case "spouseId":

            return spouseSelect
                ? spouseSelect.value
                : "";


        case "generation":

            return generationInput.value.trim();


        case "birthYear":

            return birthYearInput.value.trim();


        case "deathYear":

            return deathYearInput.value.trim();


        case "image":

            return imageInput.value.trim();


        case "biography":

            return biographyInput.value.trim();


        default:

            return "";

    }

}


/* =========================================================
   CREATED MEMBER DETAILS
   ========================================================= */

function buildCreatedMemberDetails(
    id,
    data
) {

    const details = [];


    details.push(
        `Created family member with ID ${id}.`
    );


    if (
        data.fatherId
    ) {

        const father =
            getMemberById(
                data.fatherId
            );


        details.push(
            father
                ? `Father: ${father.name} (ID ${data.fatherId})`
                : `Father ID: ${data.fatherId}`
        );

    }


    if (
        data.generation
    ) {

        details.push(
            `Generation: ${data.generation}`
        );

    }


    if (
        data.relation
    ) {

        details.push(
            `Relation: ${data.relation}`
        );

    }


    return details.join(
        " "
    );

}


/* =========================================================
   FORMAT CHANGES
   ========================================================= */

function formatChanges(
    changes
) {

    if (
        !changes ||
        changes.length === 0
    ) {

        return "No main field changes detected.";

    }


    return changes
        .map(
            change => {

                const field =
                    formatFieldName(
                        change.field
                    );


                const oldValue =
                    change.oldValue === ""
                        ? "(empty)"
                        : String(
                            change.oldValue
                        );


                const newValue =
                    change.newValue === ""
                        ? "(empty)"
                        : String(
                            change.newValue
                        );


                return `${field}: "${oldValue}" → "${newValue}"`;

            }
        )
        .join(
            " | "
        );

}


/* =========================================================
   ID CHANGE DETAILS
   ========================================================= */

function buildChangedDetailsForIdChange(
    oldMember,
    newData
) {

    const changes = [];


    const fields = [

        "name",
        "relation",
        "fatherId",
        "motherId",
        "spouseId",
        "generation",
        "birthYear",
        "deathYear",
        "image",
        "biography"

    ];


    fields.forEach(
        field => {

            const oldValue =
                oldMember[field] ??
                "";


            const newValue =
                newData[field] ??
                "";


            if (
                String(oldValue) !==
                String(newValue)
            ) {

                changes.push({

                    field:
                        field,

                    oldValue:
                        oldValue,

                    newValue:
                        newValue

                });

            }

        }
    );


    if (
        changes.length === 0
    ) {

        return "No other family information changed.";

    }


    return formatChanges(
        changes
    );

}


/* =========================================================
   UPDATE ALL REFERENCES
   =========================================================

   If:

   11
   ├── 111
   └── 112

   changes to 13:

   111 fatherId = 13
   112 fatherId = 13

   ========================================================= */

async function updateReferences(
    oldId,
    newId
) {

    const snapshot =
        await getDocs(
            collection(
                db,
                "familyMembers"
            )
        );


    const updatePromises = [];


    snapshot.forEach(
        item => {

            const data =
                item.data();


            const changes = {};


            if (
                data.fatherId ===
                oldId
            ) {

                changes.fatherId =
                    newId;

            }


            if (
                data.motherId ===
                oldId
            ) {

                changes.motherId =
                    newId;

            }


            if (
                data.spouseId ===
                oldId
            ) {

                changes.spouseId =
                    newId;

            }


            if (
                Object.keys(
                    changes
                ).length > 0
            ) {

                updatePromises.push(

                    updateDoc(
                        doc(
                            db,
                            "familyMembers",
                            item.id
                        ),
                        changes
                    )

                );

            }

        }
    );


    await Promise.all(
        updatePromises
    );

}


/* =========================================================
   FIRESTORE FAMILY MEMBERS SEARCH
   ========================================================= */

/*
   Build one searchable text string for every member.

   Search supports:

   - Family ID
   - Name
   - Relation
   - Father ID
   - Father Name
   - Mother ID
   - Mother Name
   - Spouse ID
   - Spouse Name
   - Generation
   - Birth Year
   - Death Year
*/

function getFamilyMemberSearchText(
    member
) {

    const father =
        getMemberById(
            member.fatherId
        );


    const mother =
        getMemberById(
            member.motherId
        );


    const spouse =
        getMemberById(
            member.spouseId
        );


    return [

        member.id,

        member.name,

        member.relation,

        member.fatherId,

        member.motherId,

        member.spouseId,

        member.generation,

        member.birthYear,

        member.deathYear,

        father?.name,

        mother?.name,

        spouse?.name

    ]
        .filter(
            value =>
                value !==
                    undefined &&
                value !==
                    null
        )
        .join(" ")
        .toLowerCase();

}


/* =========================================================
   UPDATE SEARCH INFORMATION
   ========================================================= */

function updateFamilySearchInfo(
    visibleCount,
    totalCount,
    query
) {

    if (!familySearchInfo) {

        return;

    }


    if (!query) {

        familySearchInfo.textContent =
            `Showing all ${totalCount} family member${
                totalCount === 1
                    ? ""
                    : "s"
            }`;

        return;

    }


    familySearchInfo.textContent =
        `Showing ${visibleCount} of ${totalCount} members`;

}


/* =========================================================
   FILTER FIRESTORE FAMILY MEMBERS
   ========================================================= */

function filterFamilyMembers() {

    if (!familyList) {

        return;

    }


    const query =
        familySearch
            ? familySearch.value
                .trim()
                .toLowerCase()
            : "";


    const cards =
        familyList.querySelectorAll(
            ".manager-item"
        );


    let visibleCount =
        0;


    cards.forEach(
        card => {

            const searchText =
                card.dataset.searchText ||
                "";


            const matches =
                !query ||
                searchText.includes(
                    query
                );


            if (matches) {

                card.style.display =
                    "";

                visibleCount++;

            }
            else {

                card.style.display =
                    "none";

            }

        }
    );


    updateFamilySearchInfo(
        visibleCount,
        members.length,
        query
    );


    /*
       Remove / create no-result message.
    */

    let noResult =
        familyList.querySelector(
            ".family-search-no-result"
        );


    if (
        query &&
        visibleCount === 0 &&
        cards.length > 0
    ) {

        if (!noResult) {

            noResult =
                document.createElement(
                    "div"
                );


            noResult.className =
                "family-search-no-result";


            noResult.innerHTML = `

                <i class="fa-solid fa-user-slash"></i>

                <strong>
                    No family member found
                </strong>

                <div>
                    Try searching by name,
                    Family ID, father,
                    mother or relation.
                </div>

            `;


            familyList.appendChild(
                noResult
            );

        }


        noResult.style.display =
            "block";

    }
    else if (noResult) {

        noResult.style.display =
            "none";

    }


    /*
       Show / hide clear button.
    */

    if (clearFamilySearch) {

        clearFamilySearch.style.display =
            query
                ? "flex"
                : "none";

    }

}


/* =========================================================
   SEARCH INPUT EVENT
   ========================================================= */

if (familySearch) {

    familySearch.addEventListener(
        "input",
        filterFamilyMembers
    );


    /*
       ESC = clear search.
    */

    familySearch.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                familySearch.value =
                    "";

                filterFamilyMembers();

                familySearch.focus();

            }

        }
    );

}


/* =========================================================
   CLEAR SEARCH BUTTON
   ========================================================= */

if (clearFamilySearch) {

    clearFamilySearch.addEventListener(
        "click",
        () => {

            if (familySearch) {

                familySearch.value =
                    "";

            }


            filterFamilyMembers();


            if (familySearch) {

                familySearch.focus();

            }

        }
    );

}


/* =========================================================
   RENDER MEMBERS
   ========================================================= */

function renderMembers() {

    if (!familyList) {

        return;

    }


    /*
       Empty family.
    */

    if (
        members.length === 0
    ) {

        familyList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    👨‍👩‍👧
                </div>

                <h3>
                    No family members yet
                </h3>

                <p>
                    Add the first member.
                </p>

            </div>

        `;


        updateFamilySearchInfo(
            0,
            0,
            ""
        );


        return;

    }


    familyList.innerHTML =
        "";


    members.forEach(
        member => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "manager-item";


            /*
               Store searchable text.

               This allows the search to work
               without making another Firestore
               request.
            */

            card.dataset.searchText =
                getFamilyMemberSearchText(
                    member
                );


            /* =================================================
               AVATAR
               ================================================= */

            let avatar =
                "👤";


            if (
                member.image
            ) {

                avatar = `

                    <img
                        src="${escapeHtml(
                            member.image
                        )}"
                        alt="${escapeHtml(
                            member.name ||
                            "Family Member"
                        )}"
                    >

                `;

            }


            /* =================================================
               RELATIONSHIPS
               ================================================= */

            const father =
                getMemberById(
                    member.fatherId
                );


            const mother =
                getMemberById(
                    member.motherId
                );


            const spouse =
                getMemberById(
                    member.spouseId
                );


            /* =================================================
               CARD
               ================================================= */

            card.innerHTML = `

                <div
                    class="manager-item-main"
                >

                    <div
                        class="manager-avatar"
                    >

                        ${avatar}

                    </div>


                    <div>

                        <div
                            class="family-id-badge"
                        >

                            ID:
                            ${escapeHtml(
                                member.id
                            )}

                        </div>


                        <h3>

                            ${escapeHtml(
                                member.name ||
                                "Unnamed"
                            )}

                        </h3>


                        <span>

                            ${escapeHtml(
                                member.relation ||
                                "Family Member"
                            )}

                        </span>


                        <small>

                            ${
                                father
                                    ? `Father: ${escapeHtml(
                                        father.name
                                    )} (${escapeHtml(
                                        father.id
                                    )})`
                                    : ""
                            }

                            ${
                                mother
                                    ? ` · Mother: ${escapeHtml(
                                        mother.name
                                    )} (${escapeHtml(
                                        mother.id
                                    )})`
                                    : ""
                            }

                            ${
                                spouse
                                    ? ` · Spouse: ${escapeHtml(
                                        spouse.name
                                    )} (${escapeHtml(
                                        spouse.id
                                    )})`
                                    : ""
                            }

                        </small>

                    </div>

                </div>


                <div
                    class="manager-actions"
                >

                    <button
                        type="button"
                        class="edit-button"
                        data-id="${escapeHtml(
                            member.id
                        )}"
                    >

                        Edit

                    </button>


                    <button
                        type="button"
                        class="delete-button"
                        data-id="${escapeHtml(
                            member.id
                        )}"
                    >

                        Delete

                    </button>

                </div>

            `;


            familyList.appendChild(
                card
            );

        }
    );


    attachMemberButtons();


    /*
       Re-apply search after rendering.

       This is important after:
       - Add
       - Edit
       - Delete
       - Firestore reload
    */

    filterFamilyMembers();

}


/* =========================================================
   GET MEMBER BY ID
   ========================================================= */

function getMemberById(
    id
) {

    if (!id) {

        return null;

    }


    return members.find(
        member =>
            String(
                member.id
            ) ===
            String(
                id
            )
    ) || null;

}


/* =========================================================
   MEMBER BUTTONS
   ========================================================= */

function attachMemberButtons() {

    document
        .querySelectorAll(
            ".edit-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editMember(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".delete-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteMember(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   EDIT MEMBER
   ========================================================= */

function editMember(
    id
) {

    const member =
        members.find(
            item =>
                item.id ===
                id
        );


    if (!member) {

        return;

    }


    originalId =
        member.id;


    memberIdInput.value =
        member.id;


    nameInput.value =
        member.name ||
        "";


    relationInput.value =
        member.relation ||
        "";


    /* =================================================
       FATHER
       ================================================= */

    if (fatherIdInput) {

        fatherIdInput.value =
            member.fatherId ||
            "";

    }


    if (fatherSearch) {

        if (
            member.fatherId
        ) {

            const father =
                getMemberById(
                    member.fatherId
                );


            if (father) {

                fatherSearch.value =
                    `${father.name || "Unnamed"} (${father.id})`;

            }
            else {

                fatherSearch.value =
                    `Unknown Member (${member.fatherId})`;

            }

        }
        else {

            fatherSearch.value =
                "";

        }

    }


    if (fatherSuggestions) {

        fatherSuggestions.innerHTML =
            "";

        fatherSuggestions.style.display =
            "none";

    }


    /* =================================================
       MOTHER
       ================================================= */

    if (motherSelect) {

        motherSelect.value =
            member.motherId ||
            "";

    }


    /* =================================================
       SPOUSE
       ================================================= */

    if (spouseSelect) {

        spouseSelect.value =
            member.spouseId ||
            "";

    }


    /* =================================================
       GENERATION
       ================================================= */

    generationInput.value =
        member.generation ??
        "";


    /* =================================================
       BIRTH YEAR
       ================================================= */

    birthYearInput.value =
        member.birthYear ??
        "";


    /* =================================================
       DEATH YEAR
       ================================================= */

    deathYearInput.value =
        member.deathYear ??
        "";


    /* =================================================
       IMAGE
       ================================================= */

    imageInput.value =
        member.image ||
        "";


    /* =================================================
       BIOGRAPHY
       ================================================= */

    biographyInput.value =
        member.biography ||
        "";


    if (formTitle) {

        formTitle.textContent =
            "Edit Member";

    }


    if (saveButton) {

        saveButton.textContent =
            "Update Member";

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   DELETE MEMBER
   ========================================================= */

async function deleteMember(
    id
) {

    const member =
        members.find(
            item =>
                item.id ===
                id
        );


    if (!member) {

        return;

    }


    /*
       Find direct children.
    */

    const children =
        members.filter(
            item =>
                item.fatherId ===
                id
        );


    /*
       Do not delete a father
       who still has children.
    */

    if (
        children.length > 0
    ) {

        const childList =
            children
                .map(
                    child =>
                        `${child.id} — ${
                            child.name ||
                            "Unnamed"
                        }`
                )
                .join(
                    "\n"
                );


        alert(

            `Cannot delete this member.\n\n` +

            `${member.name || id} has ` +

            `${children.length} child member(s):\n\n` +

            childList

        );


        return;

    }


    const confirmed =
        window.confirm(

            `Delete "${
                member.name ||
                "this member"
            }" (ID ${id})?\n\n` +

            `This action cannot be undone.`

        );


    if (!confirmed) {

        return;

    }


    try {

        /* DELETE MEMBER */

        await deleteDoc(
            doc(
                db,
                "familyMembers",
                id
            )
        );


        /* ACTIVITY LOG */

        await logActivity({

            action:
                "deleted",

            collectionName:
                "familyMembers",

            documentId:
                id,

            title:
                member.name ||
                "Unnamed Family Member",

            details:
                buildDeletedMemberDetails(
                    member
                )

        });


        showMessage(
            `Member ${id} deleted successfully.`,
            "success"
        );


        await loadMembers();

    }
    catch (error) {

        console.error(
            "Delete family member error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to delete member.",
            "error"
        );

    }

}


/* =========================================================
   DELETED MEMBER DETAILS
   ========================================================= */

function buildDeletedMemberDetails(
    member
) {

    const details = [];


    details.push(
        `Deleted family member ID ${member.id}.`
    );


    if (
        member.fatherId
    ) {

        const father =
            getMemberById(
                member.fatherId
            );


        details.push(
            father
                ? `Father: ${father.name} (ID ${member.fatherId}).`
                : `Father ID: ${member.fatherId}.`
        );

    }


    if (
        member.generation
    ) {

        details.push(
            `Generation: ${member.generation}.`
        );

    }


    if (
        member.relation
    ) {

        details.push(
            `Relation: ${member.relation}.`
        );

    }


    return details.join(
        " "
    );

}


/* =========================================================
   RESET FORM
   ========================================================= */

if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        resetForm
    );

}


function resetForm() {

    if (form) {

        form.reset();

    }


    originalId =
        "";


    memberIdInput.value =
        "";


    /* CLEAR HIDDEN FATHER ID */

    if (fatherIdInput) {

        fatherIdInput.value =
            "";

    }


    /* CLEAR FATHER SEARCH */

    if (fatherSearch) {

        fatherSearch.value =
            "";

    }


    /* HIDE FATHER SUGGESTIONS */

    if (fatherSuggestions) {

        fatherSuggestions.innerHTML =
            "";

        fatherSuggestions.style.display =
            "none";

    }


    if (formTitle) {

        formTitle.textContent =
            "Add Member";

    }


    if (saveButton) {

        saveButton.textContent =
            "Save Member";

    }


    if (message) {

        message.textContent =
            "";

        message.className =
            "message";

    }


    /*
       Clear Firestore member search
       when form is reset.
    */

    if (familySearch) {

        familySearch.value =
            "";

    }


    filterFamilyMembers();

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    text,
    type
) {

    if (!message) {

        return;

    }


    message.textContent =
        text;


    message.className =
        `message ${type}`;

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );

            }
            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            window.location.replace(
                "./index.html"
            );

        }
    );

}


/* =========================================================
   FORMAT FIELD NAME
   ========================================================= */

function formatFieldName(
    field
) {

    return String(field)

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
            character =>
                character.toUpperCase()
        );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
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
   START
   ========================================================= */

console.log(
    "Roy Bari Family Admin loaded successfully."
);