/* =========================================================
   ROY BARI — MEMORIES ADMIN
   FIRESTORE: memories
   ACTIVITY: activityLogs
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


/*
   IMPORTANT:

   This input is the "Memory" field in HTML.

   It is stored in Firestore as:

       quote

   Old documents using:

       description

   are also supported.
*/

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

        /*
           User must be logged in.
        */

        if (!user) {

            window.location.replace(
                "./index.html"
            );

            return;

        }


        /*
           Store current admin.
        */

        currentAdmin =
            user;


        /*
           Display email.
        */

        if (adminEmail) {

            adminEmail.textContent =
                user.email ||
                "Admin";

        }


        /*
           Store admin information.
        */

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


        /*
           Load memories after authentication.
        */

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
        text;


    message.className =
        type
            ? `message ${type}`
            : "message";

}


/* =========================================================
   GET MEMORY TEXT
   =========================================================

   Firestore uses:

       quote

   Older documents may use:

       description

   Therefore both are supported.

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

    return (
        memory?.quote ??
        memory?.description ??
        ""
    );

}


/* =========================================================
   BUILD NEW FORM DATA
   =========================================================

   IMPORTANT:

   Memory field is stored as:

       quote

   NOT:

       description

   Empty fields are not stored.

   ========================================================= */

function getNewFormData() {

    const data = {};


    /*
       TITLE
    */

    const title =
        titleInput?.value.trim() ||
        "";


    if (title) {

        data.title =
            title;

    }


    /*
       YEAR
    */

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


    /*
       PERSON
    */

    const person =
        personInput?.value.trim() ||
        "";


    if (person) {

        data.person =
            person;

    }


    /*
       CATEGORY
    */

    const category =
        categoryInput?.value.trim() ||
        "";


    if (category) {

        data.category =
            category;

    }


    /*
       MEMORY / QUOTE

       HTML field:

           description

       Firestore field:

           quote
    */

    const quote =
        descriptionInput?.value.trim() ||
        "";


    if (quote) {

        data.quote =
            quote;

    }


    /*
       IMAGE URL
    */

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
   =========================================================

   Empty fields are removed from Firestore.

   ========================================================= */

function getUpdateData() {

    const data = {};


    /*
       TITLE
    */

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


    /*
       YEAR
    */

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


    /*
       PERSON
    */

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


    /*
       CATEGORY
    */

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


    /*
       MEMORY / QUOTE

       Store in Firestore as:

           quote
    */

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


    /*
       IMPORTANT:

       Remove old "description" field if
       an old document still contains it.

       This keeps all memories consistent.
    */

    data.description =
        deleteField();


    /*
       IMAGE URL
    */

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


    /*
       UPDATED TIME
    */

    data.updatedAt =
        serverTimestamp();


    return data;

}


/* =========================================================
   ACTIVITY LOGGER
   ========================================================= */

async function logActivity({
    action,
    documentId,
    itemName
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


        await addDoc(
            collection(
                db,
                "activityLogs"
            ),
            {

                action:
                    action,

                collection:
                    "memories",

                documentId:
                    documentId || "",

                itemName:
                    itemName ||
                    "Untitled Memory",

                performedBy:
                    user.email ||
                    "Unknown Admin",

                performedByUid:
                    user.uid ||
                    "",

                createdAt:
                    serverTimestamp()

            }
        );


        console.log(
            "Memory activity logged:",
            action
        );

    }
    catch (error) {

        /*
           Activity logging failure should
           NOT break the main operation.
        */

        console.error(
            "Activity logging error:",
            error
        );

    }

}


/* =========================================================
   LOAD MEMORIES
   ========================================================= */

async function loadMemories() {

    try {

        if (list) {

            list.innerHTML = `
                <div class="empty-list">
                    Loading memories...
                </div>
            `;

        }


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "memories"
                )
            );


        memories = [];


        snapshot.forEach(
            memoryDoc => {

                memories.push({

                    id:
                        memoryDoc.id,

                    ...memoryDoc.data()

                });

            }
        );


        /*
           Sort newest year first.
        */

        memories.sort(
            (a, b) => {

                const yearA =
                    Number(a.year);


                const yearB =
                    Number(b.year);


                if (
                    Number.isFinite(yearA) &&
                    Number.isFinite(yearB)
                ) {

                    return (
                        yearB -
                        yearA
                    );

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
                    Unable to load memories.
                </div>
            `;

        }

    }

}


/* =========================================================
   RENDER MEMORIES
   ========================================================= */

function renderMemories() {

    /*
       COUNT
    */

    if (count) {

        count.textContent =
            memories.length === 1
                ? "1 memory"
                : `${memories.length} memories`;

    }


    /*
       EMPTY
    */

    if (!memories.length) {

        if (list) {

            list.innerHTML = `
                <div class="empty-list">
                    No memories found.
                </div>
            `;

        }

        return;

    }


    /*
       CLEAR
    */

    list.innerHTML =
        "";


    /*
       RENDER EACH MEMORY
    */

    memories.forEach(
        memory => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "memory-item";


            let tags =
                "";


            /*
               YEAR
            */

            if (memory.year) {

                tags += `
                    <span class="memory-tag">
                        ${escapeHTML(
                            memory.year
                        )}
                    </span>
                `;

            }


            /*
               PERSON
            */

            if (memory.person) {

                tags += `
                    <span class="memory-tag">
                        ${escapeHTML(
                            memory.person
                        )}
                    </span>
                `;

            }


            /*
               CATEGORY
            */

            if (memory.category) {

                tags += `
                    <span class="memory-tag">
                        ${escapeHTML(
                            memory.category
                        )}
                    </span>
                `;

            }


            /*
               MEMORY TEXT

               IMPORTANT:

               Reads:

                   quote

               and falls back to:

                   description
            */

            const memoryText =
                getMemoryText(
                    memory
                );


            /*
               IMAGE
            */

            const imageHTML =
                memory.imageUrl
                    ? `
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
                            onerror="this.style.display='none';"
                        >
                      `
                    : "";


            /*
               CARD
            */

            item.innerHTML = `

                <div class="memory-meta">

                    ${tags}

                </div>


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
                        Edit
                    </button>


                    <button
                        type="button"
                        class="delete-button"
                    >
                        Delete
                    </button>

                </div>

            `;


            /*
               EDIT
            */

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


            /*
               DELETE
            */

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


            /*
               Validate title.
            */

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


            /*
               Validate Memory / Quote.
            */

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


            /*
               Disable button.
            */

            if (saveButton) {

                saveButton.disabled =
                    true;


                saveButton.textContent =
                    editingId
                        ? "Updating..."
                        : "Saving...";

            }


            try {

                /* =================================================
                   UPDATE EXISTING
                   ================================================= */

                if (editingId) {

                    /*
                       Find old memory.
                    */

                    const oldMemory =
                        memories.find(
                            item =>
                                item.id ===
                                editingId
                        );


                    const itemName =
                        title ||
                        oldMemory?.title ||
                        "Untitled Memory";


                    /*
                       Update Firestore.
                    */

                    const data =
                        getUpdateData();


                    await updateDoc(

                        doc(
                            db,
                            "memories",
                            editingId
                        ),

                        data

                    );


                    /*
                       Activity log.
                    */

                    await logActivity({

                        action:
                            "UPDATE",

                        documentId:
                            editingId,

                        itemName:
                            itemName

                    });


                    showMessage(
                        "Memory updated successfully.",
                        "success"
                    );

                }


                /* =================================================
                   ADD NEW
                   ================================================= */

                else {

                    const data =
                        getNewFormData();


                    /*
                       Created time.
                    */

                    data.createdAt =
                        serverTimestamp();


                    /*
                       Updated time.
                    */

                    data.updatedAt =
                        serverTimestamp();


                    /*
                       Add document.
                    */

                    const newDocument =
                        await addDoc(

                            collection(
                                db,
                                "memories"
                            ),

                            data

                        );


                    /*
                       Activity log.
                    */

                    await logActivity({

                        action:
                            "CREATE",

                        documentId:
                            newDocument.id,

                        itemName:
                            data.title ||
                            "Untitled Memory"

                    });


                    showMessage(
                        "Memory added successfully.",
                        "success"
                    );

                }


                /*
                   Reset form.
                */

                clearForm();


                /*
                   Reload.
                */

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


                    saveButton.textContent =
                        "Save Memory";

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

        return;

    }


    /*
       Store editing ID.
    */

    editingId =
        id;


    /*
       TITLE
    */

    if (titleInput) {

        titleInput.value =
            memory.title ||
            "";

    }


    /*
       YEAR
    */

    if (yearInput) {

        yearInput.value =
            memory.year ??
            "";

    }


    /*
       PERSON
    */

    if (personInput) {

        personInput.value =
            memory.person ||
            "";

    }


    /*
       CATEGORY
    */

    if (categoryInput) {

        categoryInput.value =
            memory.category ||
            "";

    }


    /*
       MEMORY / QUOTE

       IMPORTANT FIX:

       Firestore:

           quote

       Old documents:

           description
    */

    if (descriptionInput) {

        descriptionInput.value =
            getMemoryText(
                memory
            );

    }


    /*
       IMAGE URL
    */

    if (imageInput) {

        imageInput.value =
            memory.imageUrl ||
            "";

    }


    /*
       Change UI.
    */

    if (formTitle) {

        formTitle.textContent =
            "Edit Memory";

    }


    if (saveButton) {

        saveButton.textContent =
            "Update Memory";

    }


    /*
       Scroll to form.
    */

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

        /*
           Delete memory.
        */

        await deleteDoc(

            doc(
                db,
                "memories",
                id
            )

        );


        /*
           Activity log.
        */

        await logActivity({

            action:
                "DELETE",

            documentId:
                id,

            itemName:
                memory.title ||
                "Untitled Memory"

        });


        showMessage(
            "Memory deleted.",
            "success"
        );


        /*
           Reload.
        */

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


    if (formTitle) {

        formTitle.textContent =
            "Add Memory";

    }


    if (saveButton) {

        saveButton.textContent =
            "Save Memory";

    }

}


/* =========================================================
   CANCEL
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


            /*
               Remove local admin information.
            */

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
   START
   ========================================================= */

console.log(
    "Roy Bari Memories Admin loaded successfully."
);