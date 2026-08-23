/* =========================================================
   ROY BARI — MEMORIES ADMIN
   FIRESTORE: memories
   ACTIVITY: activityLogs
   ========================================================= */

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


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


import {
    auth,
    db
} from "../firebase.js";


/* =========================================================
   ELEMENTS
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
           Store for other admin pages.
        */

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


        /*
           Load memories only
           after authentication.
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
   BUILD NEW DATA
   =========================================================

   IMPORTANT:

   Empty fields are NOT stored.

   Example:

   title = Durga Puja
   year = 1985
   person = empty

   Firestore:

   {
       title: "Durga Puja",
       year: 1985
   }

   ========================================================= */

function getNewFormData() {

    const data = {};


    const title =
        titleInput.value.trim();


    const year =
        yearInput.value.trim();


    const person =
        personInput.value.trim();


    const category =
        categoryInput.value.trim();


    const description =
        descriptionInput.value.trim();


    const imageUrl =
        imageInput.value.trim();


    /*
       TITLE
    */

    if (title) {

        data.title =
            title;

    }


    /*
       YEAR
    */

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

    if (person) {

        data.person =
            person;

    }


    /*
       CATEGORY
    */

    if (category) {

        data.category =
            category;

    }


    /*
       DESCRIPTION
    */

    if (description) {

        data.description =
            description;

    }


    /*
       IMAGE
    */

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
        titleInput.value.trim();


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
        yearInput.value.trim();


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
        personInput.value.trim();


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
        categoryInput.value.trim();


    if (category) {

        data.category =
            category;

    }
    else {

        data.category =
            deleteField();

    }


    /*
       DESCRIPTION
    */

    const description =
        descriptionInput.value.trim();


    if (description) {

        data.description =
            description;

    }
    else {

        data.description =
            deleteField();

    }


    /*
       IMAGE
    */

    const imageUrl =
        imageInput.value.trim();


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
   =========================================================

   Every ADD / UPDATE / DELETE creates
   a separate document inside:

   activityLogs

   Example:

   {
       action: "UPDATE",
       collection: "memories",
       documentId: "...",
       itemName: "Old Puja Memory",
       performedBy: "admin@email.com",
       performedByUid: "...",
       createdAt: Timestamp
   }

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
                    itemName || "Untitled Memory",

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
           Activity failure should not
           make the main memory operation fail.
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

            list.innerHTML =
                "Loading...";

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
   RENDER
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

        list.innerHTML = `

            <div class="empty-list">

                No memories found.

            </div>

        `;

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


                <div class="memory-description">

                    ${escapeHTML(
                        memory.description ||
                        ""
                    )}

                </div>


                ${
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
                            >

                          `
                        : ""
                }


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

            item
                .querySelector(
                    ".edit-button"
                )
                .addEventListener(
                    "click",
                    () => {

                        editMemory(
                            memory.id
                        );

                    }
                );


            /*
               DELETE
            */

            item
                .querySelector(
                    ".delete-button"
                )
                .addEventListener(
                    "click",
                    () => {

                        deleteMemory(
                            memory.id
                        );

                    }
                );


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
                titleInput.value.trim();


            if (!title) {

                showMessage(
                    "Please enter a title.",
                    "error"
                );

                titleInput.focus();

                return;

            }


            /*
               Description is required
               in your original system.
            */

            const description =
                descriptionInput.value.trim();


            if (!description) {

                showMessage(
                    "Please enter the memory.",
                    "error"
                );

                descriptionInput.focus();

                return;

            }


            /*
               Disable button.
            */

            saveButton.disabled =
                true;


            saveButton.textContent =
                editingId
                    ? "Updating..."
                    : "Saving...";


            try {

                /* =================================================
                   UPDATE EXISTING
                   ================================================= */

                if (editingId) {

                    /*
                       Save current name before update.
                       This is useful for activity history.
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
                       ACTIVITY
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


                    const newDocument =
                        await addDoc(

                            collection(
                                db,
                                "memories"
                            ),

                            data

                        );


                    /*
                       ACTIVITY
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

                saveButton.disabled =
                    false;


                saveButton.textContent =
                    "Save Memory";

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


    editingId =
        id;


    /*
       Fill form.
    */

    titleInput.value =
        memory.title ||
        "";


    yearInput.value =
        memory.year ??
        "";


    personInput.value =
        memory.person ||
        "";


    categoryInput.value =
        memory.category ||
        "";


    descriptionInput.value =
        memory.description ||
        "";


    imageInput.value =
        memory.imageUrl ||
        "";


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
       Scroll.
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
            `Delete "${memory.title || "this memory"}"?`
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
               Remove locally stored
               admin information.
            */

            localStorage.removeItem(
                "adminEmail"
            );


            localStorage.removeItem(
                "adminUid"
            );


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