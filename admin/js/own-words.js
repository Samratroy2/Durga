/* =========================================================
   ROY BARI — OWN-WORDS / MEMORIES ADMIN
   =========================================================

   FIRESTORE COLLECTIONS:

       memories
       activityLogs

   MEMORY FIELDS:

       title
       year
       person
       category
       quote
       imageUrl
       createdAt
       updatedAt

   OLD FIELD SUPPORTED:

       description

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
    addDoc,
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
   DOM ELEMENTS
   ========================================================= */

const form =
    document.getElementById("memoryForm");

const formTitle =
    document.getElementById("formTitle");

const titleInput =
    document.getElementById("title");

const yearInput =
    document.getElementById("year");

const personInput =
    document.getElementById("person");

const categoryInput =
    document.getElementById("category");

const descriptionInput =
    document.getElementById("description");

const imageInput =
    document.getElementById("imageUrl");

const saveButton =
    document.getElementById("saveButton");

const cancelButton =
    document.getElementById("cancelButton");

const list =
    document.getElementById("memoryList");

const count =
    document.getElementById("memoryCount");

const message =
    document.getElementById("memoryMessage");

const logoutButton =
    document.getElementById("logoutButton");

const adminEmail =
    document.getElementById("adminEmail");

const userAvatar =
    document.getElementById("userAvatar");


/* =========================================================
   DATA
   ========================================================= */

let memories = [];

let editingId = null;

let currentAdmin = null;


/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        /* -------------------------------------------------
           USER NOT LOGGED IN
           ------------------------------------------------- */

        if (!user) {

            currentAdmin = null;

            window.location.replace(
                "./index.html"
            );

            return;

        }


        /* -------------------------------------------------
           STORE CURRENT ADMIN
           ------------------------------------------------- */

        currentAdmin = user;


        /* -------------------------------------------------
           DISPLAY ADMIN EMAIL
           ------------------------------------------------- */

        if (adminEmail) {

            adminEmail.textContent =
                user.email ||
                "Admin";

        }


        /* -------------------------------------------------
           DISPLAY AVATAR
           ------------------------------------------------- */

        if (userAvatar) {

            const email =
                user.email ||
                "A";

            userAvatar.textContent =
                email
                    .charAt(0)
                    .toUpperCase();

        }


        /* -------------------------------------------------
           STORE ADMIN INFORMATION
           ------------------------------------------------- */

        try {

            if (user.email) {

                localStorage.setItem(
                    "adminEmail",
                    user.email
                );

            }

            if (user.uid) {

                localStorage.setItem(
                    "adminUid",
                    user.uid
                );

            }

        }

        catch (error) {

            console.warn(
                "Unable to store admin information.",
                error
            );

        }


        /* -------------------------------------------------
           LOAD MEMORIES
           ------------------------------------------------- */

        await loadMemories();

    }
);


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    text,
    type = ""
) {

    if (!message) {

        return;

    }


    message.textContent =
        text || "";


    if (type) {

        message.className =
            `message ${type}`;

    }

    else {

        message.className =
            "message";

    }

}


/* =========================================================
   GET MEMORY TEXT
   =========================================================

   New documents:

       quote

   Older documents:

       description

   Priority:

       quote
       ↓
       description
       ↓
       empty

   ========================================================= */

function getMemoryText(
    memory
) {

    if (
        memory &&
        memory.quote !== undefined &&
        memory.quote !== null
    ) {

        return String(
            memory.quote
        );

    }


    if (
        memory &&
        memory.description !== undefined &&
        memory.description !== null
    ) {

        return String(
            memory.description
        );

    }


    return "";

}


/* =========================================================
   BUILD NEW FORM DATA
   ========================================================= */

function getNewFormData() {

    const data = {};


    /* -----------------------------------------------------
       TITLE
       ----------------------------------------------------- */

    const title =
        titleInput?.value.trim() ||
        "";

    if (title) {

        data.title =
            title;

    }


    /* -----------------------------------------------------
       YEAR
       ----------------------------------------------------- */

    const year =
        yearInput?.value.trim() ||
        "";

    if (year) {

        const numericYear =
            Number(year);

        if (
            Number.isFinite(
                numericYear
            )
        ) {

            data.year =
                numericYear;

        }

    }


    /* -----------------------------------------------------
       PERSON
       ----------------------------------------------------- */

    const person =
        personInput?.value.trim() ||
        "";

    if (person) {

        data.person =
            person;

    }


    /* -----------------------------------------------------
       CATEGORY
       ----------------------------------------------------- */

    const category =
        categoryInput?.value.trim() ||
        "";

    if (category) {

        data.category =
            category;

    }


    /* -----------------------------------------------------
       MEMORY / QUOTE
       ----------------------------------------------------- */

    const quote =
        descriptionInput?.value.trim() ||
        "";

    if (quote) {

        data.quote =
            quote;

    }


    /* -----------------------------------------------------
       IMAGE URL
       ----------------------------------------------------- */

    const imageUrl =
        imageInput?.value.trim() ||
        "";

    if (imageUrl) {

        data.imageUrl =
            imageUrl;

    }


    return data;

}


/* =========================================================
   BUILD UPDATE DATA
   ========================================================= */

function getUpdateData() {

    const data = {};


    /* -----------------------------------------------------
       TITLE
       ----------------------------------------------------- */

    const title =
        titleInput?.value.trim() ||
        "";

    if (title) {

        data.title =
            title;

    }

    else {

        data.title =
            deleteField();

    }


    /* -----------------------------------------------------
       YEAR
       ----------------------------------------------------- */

    const year =
        yearInput?.value.trim() ||
        "";

    if (year) {

        const numericYear =
            Number(year);

        if (
            Number.isFinite(
                numericYear
            )
        ) {

            data.year =
                numericYear;

        }

        else {

            data.year =
                deleteField();

        }

    }

    else {

        data.year =
            deleteField();

    }


    /* -----------------------------------------------------
       PERSON
       ----------------------------------------------------- */

    const person =
        personInput?.value.trim() ||
        "";

    if (person) {

        data.person =
            person;

    }

    else {

        data.person =
            deleteField();

    }


    /* -----------------------------------------------------
       CATEGORY
       ----------------------------------------------------- */

    const category =
        categoryInput?.value.trim() ||
        "";

    if (category) {

        data.category =
            category;

    }

    else {

        data.category =
            deleteField();

    }


    /* -----------------------------------------------------
       MEMORY / QUOTE
       ----------------------------------------------------- */

    const quote =
        descriptionInput?.value.trim() ||
        "";

    if (quote) {

        data.quote =
            quote;

    }

    else {

        data.quote =
            deleteField();

    }


    /* -----------------------------------------------------
       REMOVE OLD DESCRIPTION FIELD
       -----------------------------------------------------

       All edited documents are converted to:

           quote

       instead of:

           description

       ----------------------------------------------------- */

    data.description =
        deleteField();


    /* -----------------------------------------------------
       IMAGE URL
       ----------------------------------------------------- */

    const imageUrl =
        imageInput?.value.trim() ||
        "";

    if (imageUrl) {

        data.imageUrl =
            imageUrl;

    }

    else {

        data.imageUrl =
            deleteField();

    }


    /* -----------------------------------------------------
       UPDATED TIME
       ----------------------------------------------------- */

    data.updatedAt =
        serverTimestamp();


    return data;

}


/* =========================================================
   ACTIVITY SNAPSHOT
   ========================================================= */

function getActivitySnapshot(
    memory
) {

    return {

        title:
            memory?.title ?? "",

        year:
            memory?.year ?? "",

        person:
            memory?.person ?? "",

        category:
            memory?.category ?? "",

        quote:
            getMemoryText(
                memory
            ),

        imageUrl:
            memory?.imageUrl ?? ""

    };

}


/* =========================================================
   NEW ACTIVITY SNAPSHOT
   ========================================================= */

function getNewActivitySnapshot() {

    return {

        title:
            titleInput?.value.trim() ||
            "",

        year:
            yearInput?.value.trim() ||
            "",

        person:
            personInput?.value.trim() ||
            "",

        category:
            categoryInput?.value.trim() ||
            "",

        quote:
            descriptionInput?.value.trim() ||
            "",

        imageUrl:
            imageInput?.value.trim() ||
            ""

    };

}


/* =========================================================
   ACTIVITY LOGGER
   ========================================================= */

async function logActivity({
    action,
    documentId,
    itemName,
    oldData = null,
    newData = null
}) {

    try {

        const user =
            auth.currentUser ||
            currentAdmin;


        if (!user) {

            console.warn(
                "Activity not logged: no authenticated user."
            );

            return;

        }


        const currentAction =
            String(
                action || ""
            ).toUpperCase();


        let details =
            "Activity performed.";


        /* -------------------------------------------------
           CREATE
           ------------------------------------------------- */

        if (
            currentAction === "CREATE"
        ) {

            details =
                "Memory added.";

        }


        /* -------------------------------------------------
           DELETE
           ------------------------------------------------- */

        else if (
            currentAction === "DELETE"
        ) {

            details =
                "Memory deleted.";

        }


        /* -------------------------------------------------
           UPDATE
           ------------------------------------------------- */

        else if (
            currentAction === "UPDATE"
        ) {

            const changedFields =
                getChangedFields(
                    oldData,
                    newData
                );


            if (
                changedFields.length > 0
            ) {

                details =
                    changedFields
                        .map(
                            field =>
                                `${field} changed`
                        )
                        .join(", ");

            }

            else {

                details =
                    "Memory updated.";

            }

        }


        /* -------------------------------------------------
           SAVE ACTIVITY
           ------------------------------------------------- */

        await addDoc(
            collection(
                db,
                "activityLogs"
            ),
            {

                action:
                    currentAction,

                collection:
                    "memories",

                documentId:
                    documentId || "",

                itemName:
                    itemName ||
                    "Untitled Memory",

                details:
                    details,

                performedBy:
                    user.email ||
                    "Unknown Admin",

                performedByUid:
                    user.uid ||
                    "",

                createdAt:
                    serverTimestamp(),

                performedAt:
                    serverTimestamp()

            }
        );


        console.log(
            "Activity logged:",
            {
                action:
                    currentAction,

                collection:
                    "memories",

                itemName:
                    itemName,

                details:
                    details
            }
        );

    }

    catch (error) {

        console.error(
            "Activity logging error:",
            error
        );

    }

}


/* =========================================================
   FIND CHANGED FIELDS
   ========================================================= */

function getChangedFields(
    oldData,
    newData
) {

    const changed = [];


    if (
        !oldData ||
        !newData
    ) {

        return changed;

    }


    const fields = [

        {
            key: "title",
            label: "Title"
        },

        {
            key: "year",
            label: "Year"
        },

        {
            key: "person",
            label: "Person"
        },

        {
            key: "category",
            label: "Category"
        },

        {
            key: "quote",
            label: "Memory"
        },

        {
            key: "imageUrl",
            label: "Image"
        }

    ];


    fields.forEach(
        field => {

            const oldValue =
                normalizeActivityValue(
                    oldData[
                        field.key
                    ]
                );


            const newValue =
                normalizeActivityValue(
                    newData[
                        field.key
                    ]
                );


            if (
                oldValue !==
                newValue
            ) {

                changed.push(
                    field.label
                );

            }

        }
    );


    return changed;

}


/* =========================================================
   NORMALIZE ACTIVITY VALUE
   ========================================================= */

function normalizeActivityValue(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    /* -----------------------------------------------------
       FIRESTORE TIMESTAMP
       ----------------------------------------------------- */

    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime()
            .toString();

    }


    /* -----------------------------------------------------
       ARRAY
       ----------------------------------------------------- */

    if (
        Array.isArray(
            value
        )
    ) {

        return JSON.stringify(
            value
        );

    }


    /* -----------------------------------------------------
       OBJECT
       ----------------------------------------------------- */

    if (
        typeof value ===
        "object"
    ) {

        try {

            return JSON.stringify(
                value
            );

        }

        catch {

            return String(
                value
            );

        }

    }


    return String(
        value
    ).trim();

}


/* =========================================================
   LOAD MEMORIES
   ========================================================= */

async function loadMemories() {

    try {

        /* -------------------------------------------------
           LOADING STATE
           ------------------------------------------------- */

        if (list) {

            list.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Loading own-words...
                </div>
            `;

        }


        /* -------------------------------------------------
           GET FIRESTORE DOCUMENTS
           ------------------------------------------------- */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "memories"
                )
            );


        memories = [];


        /* -------------------------------------------------
           BUILD ARRAY
           ------------------------------------------------- */

        snapshot.forEach(
            memoryDoc => {

                memories.push({

                    id:
                        memoryDoc.id,

                    ...memoryDoc.data()

                });

            }
        );


        /* -------------------------------------------------
           SORT
           -------------------------------------------------

           Memories with a year are sorted newest first.

           Memories without a valid year are sorted
           alphabetically by title.
           ------------------------------------------------- */

        memories.sort(
            (a, b) => {

                const yearA =
                    Number(
                        a.year
                    );

                const yearB =
                    Number(
                        b.year
                    );


                const validA =
                    Number.isFinite(
                        yearA
                    ) &&
                    yearA > 0;


                const validB =
                    Number.isFinite(
                        yearB
                    ) &&
                    yearB > 0;


                if (
                    validA &&
                    validB
                ) {

                    return (
                        yearB -
                        yearA
                    );

                }


                if (
                    validA &&
                    !validB
                ) {

                    return -1;

                }


                if (
                    !validA &&
                    validB
                ) {

                    return 1;

                }


                return String(
                    a.title ||
                    ""
                ).localeCompare(
                    String(
                        b.title ||
                        ""
                    )
                );

            }
        );


        /* -------------------------------------------------
           RENDER
           ------------------------------------------------- */

        renderMemories();

    }

    catch (error) {

        console.error(
            "Memory loading error:",
            error
        );


        if (list) {

            list.innerHTML = `
                <div class="empty-list">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <strong>
                        Unable to load memories
                    </strong>

                    <span>
                        ${escapeHTML(
                            error.message ||
                            "Please try again."
                        )}
                    </span>

                </div>
            `;

        }


        showMessage(
            "Unable to load memories.",
            "error"
        );

    }

}


/* =========================================================
   RENDER MEMORIES
   ========================================================= */

function renderMemories() {

    /* -----------------------------------------------------
       COUNT
       ----------------------------------------------------- */

    if (count) {

        count.textContent =
            memories.length === 1
                ? "1 memory"
                : `${memories.length} memories`;

    }


    /* -----------------------------------------------------
       EMPTY
       ----------------------------------------------------- */

    if (!memories.length) {

        if (list) {

            list.innerHTML = `
                <div class="empty-list">

                    <i class="fa-solid fa-heart"></i>

                    <strong>
                        No own-words found
                    </strong>

                    <span>
                        Add the first family memory using the form.
                    </span>

                </div>
            `;

        }

        return;

    }


    /* -----------------------------------------------------
       CLEAR LIST
       ----------------------------------------------------- */

    list.innerHTML =
        "";


    /* -----------------------------------------------------
       RENDER EACH MEMORY
       ----------------------------------------------------- */

    memories.forEach(
        memory => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "memory-item";


            /* -------------------------------------------------
               TAGS
               ------------------------------------------------- */

            let tags =
                "";


            /* YEAR */

            if (
                memory.year !==
                undefined &&
                memory.year !==
                null &&
                String(
                    memory.year
                ).trim()
            ) {

                tags += `
                    <span class="memory-tag">
                        ${escapeHTML(
                            memory.year
                        )}
                    </span>
                `;

            }


            /* PERSON */

            if (
                memory.person
            ) {

                tags += `
                    <span class="memory-tag">
                        ${escapeHTML(
                            memory.person
                        )}
                    </span>
                `;

            }


            /* CATEGORY */

            if (
                memory.category
            ) {

                tags += `
                    <span class="memory-tag">
                        ${escapeHTML(
                            memory.category
                        )}
                    </span>
                `;

            }


            /* -------------------------------------------------
               MEMORY TEXT
               ------------------------------------------------- */

            const memoryText =
                getMemoryText(
                    memory
                );


            /* -------------------------------------------------
               IMAGE
               ------------------------------------------------- */

            let imageHTML =
                "";


            if (
                memory.imageUrl
            ) {

                imageHTML = `
                    <img
                        src="${escapeHTML(
                            memory.imageUrl
                        )}"
                        class="memory-image"
                        alt="${escapeHTML(
                            memory.title ||
                            "Memory"
                        )}"
                        loading="lazy"
                    >
                `;

            }


            /* -------------------------------------------------
               CARD HTML
               ------------------------------------------------- */

            item.innerHTML = `

                ${
                    tags
                        ? `
                            <div class="memory-meta">
                                ${tags}
                            </div>
                          `
                        : ""
                }


                <h3>
                    ${escapeHTML(
                        memory.title ||
                        "Untitled"
                    )}
                </h3>


                ${
                    memoryText
                        ? `
                            <div class="memory-description">
                                ${escapeHTML(
                                    memoryText
                                )}
                            </div>
                          `
                        : ""
                }


                ${imageHTML}


                <div class="memory-actions">

                    <button
                        type="button"
                        class="edit-button"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Edit
                    </button>


                    <button
                        type="button"
                        class="delete-button"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Delete
                    </button>

                </div>

            `;


            /* -------------------------------------------------
               IMAGE ERROR HANDLING
               ------------------------------------------------- */

            const image =
                item.querySelector(
                    ".memory-image"
                );


            if (image) {

                image.addEventListener(
                    "error",
                    () => {

                        const errorBox =
                            document.createElement(
                                "div"
                            );


                        errorBox.className =
                            "memory-image-error";


                        errorBox.innerHTML = `
                            <i class="fa-solid fa-image"></i>
                            <br>
                            Image could not be loaded.
                        `;


                        image.replaceWith(
                            errorBox
                        );

                    }
                );

            }


            /* -------------------------------------------------
               EDIT BUTTON
               ------------------------------------------------- */

            const editButton =
                item.querySelector(
                    ".edit-button"
                );


            if (editButton) {

                editButton.addEventListener(
                    "click",
                    () => {

                        editMemory(
                            memory.id
                        );

                    }
                );

            }


            /* -------------------------------------------------
               DELETE BUTTON
               ------------------------------------------------- */

            const deleteButton =
                item.querySelector(
                    ".delete-button"
                );


            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    () => {

                        deleteMemory(
                            memory.id
                        );

                    }
                );

            }


            /* -------------------------------------------------
               APPEND
               ------------------------------------------------- */

            list.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   SAVE MEMORY
   ========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /* -------------------------------------------------
               CLEAR OLD MESSAGE
               ------------------------------------------------- */

            showMessage(
                ""
            );


            /* -------------------------------------------------
               VALIDATE TITLE
               ------------------------------------------------- */

            const title =
                titleInput?.value.trim() ||
                "";


            if (!title) {

                showMessage(
                    "Please enter a title.",
                    "error"
                );


                titleInput?.focus();

                return;

            }


            /* -------------------------------------------------
               VALIDATE MEMORY
               ------------------------------------------------- */

            const quote =
                descriptionInput?.value.trim() ||
                "";


            if (!quote) {

                showMessage(
                    "Please enter the memory.",
                    "error"
                );


                descriptionInput?.focus();

                return;

            }


            /* -------------------------------------------------
               DISABLE SAVE BUTTON
               ------------------------------------------------- */

            if (saveButton) {

                saveButton.disabled =
                    true;


                saveButton.innerHTML =
                    editingId
                        ? `
                            <i class="fa-solid fa-spinner fa-spin"></i>
                            Updating...
                          `
                        : `
                            <i class="fa-solid fa-spinner fa-spin"></i>
                            Saving...
                          `;

            }


            try {

                /* =================================================
                   UPDATE EXISTING MEMORY
                   ================================================= */

                if (editingId) {

                    /* -------------------------------------------------
                       FIND OLD MEMORY
                       ------------------------------------------------- */

                    const oldMemory =
                        memories.find(
                            item =>
                                item.id ===
                                editingId
                        );


                    if (!oldMemory) {

                        throw new Error(
                            "Memory not found."
                        );

                    }


                    /* -------------------------------------------------
                       ITEM NAME
                       ------------------------------------------------- */

                    const itemName =
                        title ||
                        oldMemory.title ||
                        "Untitled Memory";


                    /* -------------------------------------------------
                       OLD ACTIVITY SNAPSHOT
                       ------------------------------------------------- */

                    const oldActivityData =
                        getActivitySnapshot(
                            oldMemory
                        );


                    /* -------------------------------------------------
                       NEW ACTIVITY SNAPSHOT
                       ------------------------------------------------- */

                    const newActivityData =
                        getNewActivitySnapshot();


                    /* -------------------------------------------------
                       FIND CHANGES
                       ------------------------------------------------- */

                    const changedFields =
                        getChangedFields(
                            oldActivityData,
                            newActivityData
                        );


                    console.log(
                        "Memory changed fields:",
                        changedFields
                    );


                    /* -------------------------------------------------
                       UPDATE FIRESTORE
                       ------------------------------------------------- */

                    const updateData =
                        getUpdateData();


                    await updateDoc(

                        doc(
                            db,
                            "memories",
                            editingId
                        ),

                        updateData

                    );


                    /* -------------------------------------------------
                       LOG ACTIVITY
                       ------------------------------------------------- */

                    await logActivity({

                        action:
                            "UPDATE",

                        documentId:
                            editingId,

                        itemName:
                            itemName,

                        oldData:
                            oldActivityData,

                        newData:
                            newActivityData

                    });


                    /* -------------------------------------------------
                       SUCCESS MESSAGE
                       ------------------------------------------------- */

                    if (
                        changedFields.length
                    ) {

                        showMessage(
                            `${changedFields.join(
                                ", "
                            )} changed.`,
                            "success"
                        );

                    }

                    else {

                        showMessage(
                            "Memory updated successfully.",
                            "success"
                        );

                    }

                }


                /* =================================================
                   ADD NEW MEMORY
                   ================================================= */

                else {

                    /* -------------------------------------------------
                       BUILD DATA
                       ------------------------------------------------- */

                    const data =
                        getNewFormData();


                    /* -------------------------------------------------
                       CREATED TIME
                       ------------------------------------------------- */

                    data.createdAt =
                        serverTimestamp();


                    /* -------------------------------------------------
                       UPDATED TIME
                       ------------------------------------------------- */

                    data.updatedAt =
                        serverTimestamp();


                    /* -------------------------------------------------
                       ADD DOCUMENT
                       ------------------------------------------------- */

                    const newDocument =
                        await addDoc(

                            collection(
                                db,
                                "memories"
                            ),

                            data

                        );


                    /* -------------------------------------------------
                       LOG ACTIVITY
                       ------------------------------------------------- */

                    await logActivity({

                        action:
                            "CREATE",

                        documentId:
                            newDocument.id,

                        itemName:
                            data.title ||
                            "Untitled Memory"

                    });


                    /* -------------------------------------------------
                       SUCCESS
                       ------------------------------------------------- */

                    showMessage(
                        "Memory added successfully.",
                        "success"
                    );

                }


                /* -------------------------------------------------
                   RESET FORM
                   ------------------------------------------------- */

                clearForm();


                /* -------------------------------------------------
                   RELOAD MEMORIES
                   ------------------------------------------------- */

                await loadMemories();

            }

            catch (error) {

                console.error(
                    "Memory save error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to save memory.",
                    "error"
                );

            }

            finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;


                    saveButton.innerHTML =
                        editingId
                            ? `
                                <i class="fa-solid fa-floppy-disk"></i>
                                Update Memory
                              `
                            : `
                                <i class="fa-solid fa-floppy-disk"></i>
                                Save Memory
                              `;

                }

            }

        }
    );

}


/* =========================================================
   EDIT MEMORY
   ========================================================= */

function editMemory(
    id
) {

    const memory =
        memories.find(
            item =>
                item.id ===
                id
        );


    if (!memory) {

        showMessage(
            "Memory not found.",
            "error"
        );

        return;

    }


    /* -----------------------------------------------------
       STORE EDITING ID
       ----------------------------------------------------- */

    editingId =
        id;


    /* -----------------------------------------------------
       TITLE
       ----------------------------------------------------- */

    if (titleInput) {

        titleInput.value =
            memory.title ||
            "";

    }


    /* -----------------------------------------------------
       YEAR
       ----------------------------------------------------- */

    if (yearInput) {

        yearInput.value =
            memory.year ??
            "";

    }


    /* -----------------------------------------------------
       PERSON
       ----------------------------------------------------- */

    if (personInput) {

        personInput.value =
            memory.person ||
            "";

    }


    /* -----------------------------------------------------
       CATEGORY
       ----------------------------------------------------- */

    if (categoryInput) {

        categoryInput.value =
            memory.category ||
            "";

    }


    /* -----------------------------------------------------
       MEMORY
       ----------------------------------------------------- */

    if (descriptionInput) {

        descriptionInput.value =
            getMemoryText(
                memory
            );

    }


    /* -----------------------------------------------------
       IMAGE URL
       ----------------------------------------------------- */

    if (imageInput) {

        imageInput.value =
            memory.imageUrl ||
            "";

    }


    /* -----------------------------------------------------
       UPDATE FORM TITLE
       ----------------------------------------------------- */

    if (formTitle) {

        formTitle.textContent =
            "Edit Memory";

    }


    /* -----------------------------------------------------
       UPDATE SAVE BUTTON
       ----------------------------------------------------- */

    if (saveButton) {

        saveButton.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Update Memory
        `;

    }


    /* -----------------------------------------------------
       CLEAR MESSAGE
       ----------------------------------------------------- */

    showMessage(
        ""
    );


    /* -----------------------------------------------------
       SCROLL TO FORM
       ----------------------------------------------------- */

    if (form) {

        form.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

    }

}


/* =========================================================
   DELETE MEMORY
   ========================================================= */

async function deleteMemory(
    id
) {

    const memory =
        memories.find(
            item =>
                item.id ===
                id
        );


    if (!memory) {

        return;

    }


    /* -----------------------------------------------------
       CONFIRMATION
       ----------------------------------------------------- */

    const confirmed =
        window.confirm(
            `Delete "${
                memory.title ||
                "this memory"
            }"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        /* -------------------------------------------------
           DELETE FIRESTORE DOCUMENT
           ------------------------------------------------- */

        await deleteDoc(

            doc(
                db,
                "memories",
                id
            )

        );


        /* -------------------------------------------------
           LOG ACTIVITY
           ------------------------------------------------- */

        await logActivity({

            action:
                "DELETE",

            documentId:
                id,

            itemName:
                memory.title ||
                "Untitled Memory"

        });


        /* -------------------------------------------------
           SUCCESS
           ------------------------------------------------- */

        showMessage(
            "Memory deleted successfully.",
            "success"
        );


        /* -------------------------------------------------
           IF DELETING CURRENT EDIT
           ------------------------------------------------- */

        if (
            editingId ===
            id
        ) {

            clearForm();

        }


        /* -------------------------------------------------
           RELOAD
           ------------------------------------------------- */

        await loadMemories();

    }

    catch (error) {

        console.error(
            "Memory delete error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to delete memory.",
            "error"
        );

    }

}


/* =========================================================
   CLEAR FORM
   ========================================================= */

function clearForm() {

    if (form) {

        form.reset();

    }


    editingId =
        null;


    /* -----------------------------------------------------
       FORM TITLE
       ----------------------------------------------------- */

    if (formTitle) {

        formTitle.textContent =
            "Add Memory";

    }


    /* -----------------------------------------------------
       SAVE BUTTON
       ----------------------------------------------------- */

    if (saveButton) {

        saveButton.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Save Memory
        `;

    }

}


/* =========================================================
   CANCEL EDIT
   ========================================================= */

if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        () => {

            clearForm();

            showMessage(
                ""
            );

        }
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                logoutButton.disabled =
                    true;


                logoutButton.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    Logout
                `;


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


            /* -------------------------------------------------
               REMOVE LOCAL ADMIN INFORMATION
               ------------------------------------------------- */

            try {

                localStorage.removeItem(
                    "adminEmail"
                );


                localStorage.removeItem(
                    "adminUid"
                );

            }

            catch (error) {

                console.warn(
                    "Unable to clear local admin information.",
                    error
                );

            }


            /* -------------------------------------------------
               REDIRECT
               ------------------------------------------------- */

            window.location.replace(
                "./index.html"
            );

        }
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
   STARTUP
   ========================================================= */

console.log(
    "Roy Bari own-words Admin loaded successfully."
);