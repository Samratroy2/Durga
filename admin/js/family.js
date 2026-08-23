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

   FATHER SEARCH:
   - Search by Family ID
   - Search by Name
   - Select member from suggestions

   IMPORTANT:

   Only fields containing data are stored.

   Empty fields are NOT stored.

   Editing an existing empty field removes
   that field from Firestore.

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
   AUTOMATIC FIELDS
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
   LIST
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

   old document:
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


        /*
           Numeric hierarchical sorting.

           1
           2
           11
           12
           111
           112
           121
        */

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
   =========================================================

   Search works with:

   11
   Haridas
   Roy
   Haridas Roy

   ========================================================= */

function searchFatherMembers() {

    if (!fatherSearch || !fatherSuggestions) {

        return;

    }


    const query =
        fatherSearch.value
            .trim()
            .toLowerCase();


    fatherSuggestions.innerHTML = "";


    if (!query) {

        fatherSuggestions.style.display =
            "none";

        return;

    }


    /*
       Search by:

       1. Family ID
       2. Name
       3. Full combined text
    */

    const results =
        members.filter(
            member => {

                /*
                   Do not allow the member
                   to select himself as father
                   while editing.
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
                        member.id || ""
                    ).toLowerCase();


                const name =
                    String(
                        member.name || ""
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


    /*
       No result
    */

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


    /*
       Display results
    */

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
                            undefined
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
       Store the actual ID
       in hidden input.
    */

    fatherIdInput.value =
        member.id;


    /*
       Display name + ID
       to administrator.
    */

    fatherSearch.value =
        `${member.name || "Unnamed"} (${member.id})`;


    /*
       Hide suggestions.
    */

    if (fatherSuggestions) {

        fatherSuggestions.innerHTML =
            "";

        fatherSuggestions.style.display =
            "none";

    }


    /*
       Do not automatically change
       Family ID while editing.
    */

    if (originalId) {

        return;

    }


    /*
       Generate child ID.
    */

    const nextId =
        generateNextChildId(
            member.id
        );


    memberIdInput.value =
        nextId;


    /*
       Calculate generation.

       Father generation 1
       Child generation 2
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

        /*
           If father has no generation,
           assume child is generation 2
           only when appropriate.
        */

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
               If user changes the search text
               after selecting a father, clear
               the actual father ID.

               This prevents accidentally saving
               an old father ID.
            */

            fatherIdInput.value =
                "";

            /*
               For a new member, typing a new
               father search should clear the
               automatically generated ID.
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
        String(fatherId);


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


    /*
       NAME
    */

    const name =
        nameInput.value.trim();


    if (name) {

        data.name =
            name;

    }


    /*
       RELATION
    */

    const relation =
        relationInput.value.trim();


    if (relation) {

        data.relation =
            relation;

    }


    /*
       FATHER
    */

    const selectedFatherId =
        fatherIdInput
            ? fatherIdInput.value.trim()
            : "";


    if (selectedFatherId) {

        data.fatherId =
            selectedFatherId;

    }


    /*
       MOTHER
    */

    if (
        motherSelect &&
        motherSelect.value
    ) {

        data.motherId =
            motherSelect.value;

    }


    /*
       SPOUSE
    */

    if (
        spouseSelect &&
        spouseSelect.value
    ) {

        data.spouseId =
            spouseSelect.value;

    }


    /*
       GENERATION
    */

    if (
        generationInput.value.trim()
    ) {

        data.generation =
            Number(
                generationInput.value
            );

    }


    /*
       BIRTH YEAR
    */

    if (
        birthYearInput.value.trim()
    ) {

        data.birthYear =
            Number(
                birthYearInput.value
            );

    }


    /*
       DEATH YEAR
    */

    if (
        deathYearInput.value.trim()
    ) {

        data.deathYear =
            Number(
                deathYearInput.value
            );

    }


    /*
       IMAGE
    */

    const image =
        imageInput.value.trim();


    if (image) {

        data.image =
            image;

    }


    /*
       BIOGRAPHY
    */

    const biography =
        biographyInput.value.trim();


    if (biography) {

        data.biography =
            biography;

    }


    /*
       CREATED ONLY ONCE
    */

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


    /*
       NAME
    */

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


    /*
       RELATION
    */

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


    /*
       FATHER
    */

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


    /*
       MOTHER
    */

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


    /*
       SPOUSE
    */

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


    /*
       GENERATION
    */

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


    /*
       BIRTH YEAR
    */

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


    /*
       DEATH YEAR
    */

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


    /*
       IMAGE
    */

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


    /*
       BIOGRAPHY
    */

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
       CREATED AT IS NOT TOUCHED.
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


            /*
               Validate ID.
            */

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


            /*
               Validate name.
            */

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

               If the administrator typed
               something but did not select
               a real father, prevent saving.
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


            /*
               Duplicate ID check.
            */

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


                    /*
                       ACTIVITY LOG
                    */

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
                           Calculate changes BEFORE
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


                        /*
                           ACTIVITY LOG
                        */

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

                        /*
                           Make sure new ID doesn't exist.
                        */

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


                        /*
                           Build clean new document.
                        */

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
                           Update references first.
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


                        /*
                           ACTIVITY LOG
                        */

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


    if (data.fatherId) {

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


    if (data.generation) {

        details.push(
            `Generation: ${data.generation}`
        );

    }


    if (data.relation) {

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

   Example:

   Before:

   11
   ├── 111
   └── 112

   If 11 becomes 13:

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
   RENDER MEMBERS
   ========================================================= */

function renderMembers() {

    if (!familyList) {

        return;

    }


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
            String(member.id) ===
            String(id)
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


    /*
       FATHER

       Store actual ID in hidden input.

       Display:
       Name (ID)
    */

    if (fatherIdInput) {

        fatherIdInput.value =
            member.fatherId ||
            "";

    }


    if (fatherSearch) {

        if (member.fatherId) {

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


    /*
       MOTHER
    */

    if (motherSelect) {

        motherSelect.value =
            member.motherId ||
            "";

    }


    /*
       SPOUSE
    */

    if (spouseSelect) {

        spouseSelect.value =
            member.spouseId ||
            "";

    }


    /*
       GENERATION
    */

    generationInput.value =
        member.generation ??
        "";


    /*
       BIRTH YEAR
    */

    birthYearInput.value =
        member.birthYear ??
        "";


    /*
       DEATH YEAR
    */

    deathYearInput.value =
        member.deathYear ??
        "";


    /*
       IMAGE
    */

    imageInput.value =
        member.image ||
        "";


    /*
       BIOGRAPHY
    */

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
       Prevent deleting a father
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

        /*
           Delete member.
        */

        await deleteDoc(
            doc(
                db,
                "familyMembers",
                id
            )
        );


        /*
           ACTIVITY LOG
        */

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


    /*
       Clear hidden Father ID.
    */

    if (fatherIdInput) {

        fatherIdInput.value =
            "";

    }


    /*
       Clear Father search.
    */

    if (fatherSearch) {

        fatherSearch.value =
            "";

    }


    /*
       Hide suggestions.
    */

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