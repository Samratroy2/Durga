/* =========================================================
   ROY BARI — RITUALS ADMIN
   FIRESTORE: rituals
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
    document.getElementById("ritualForm");


const formTitle =
    document.getElementById("formTitle");


const nameInput =
    document.getElementById("name");


const dayInput =
    document.getElementById("day");


const timeInput =
    document.getElementById("time");


const typeInput =
    document.getElementById("type");


const descriptionInput =
    document.getElementById("description");


const saveButton =
    document.getElementById("saveButton");


const cancelButton =
    document.getElementById("cancelButton");


const list =
    document.getElementById("ritualList");


const count =
    document.getElementById("ritualCount");


const message =
    document.getElementById("ritualMessage");


const logoutButton =
    document.getElementById("logoutButton");


const adminEmail =
    document.getElementById("adminEmail");


/* =========================================================
   DATA
   ========================================================= */

let rituals = [];

let editingId = null;

let currentAdmin = null;


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


        currentAdmin =
            user;


        if (adminEmail) {

            adminEmail.textContent =
                user.email ||
                "Admin";

        }


        /*
           Store admin information locally
           for the other admin pages.
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


        await loadRituals();

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
   BUILD NEW RITUAL DATA
   =========================================================

   Empty fields are NOT stored.

   Example:

   name = Sandhi Puja
   day = Ashtami
   time = empty

   Firestore stores only:

   name
   day

   ========================================================= */

function getNewFormData() {

    const data = {};


    const name =
        nameInput.value.trim();


    const day =
        dayInput.value.trim();


    const time =
        timeInput.value.trim();


    const type =
        typeInput.value.trim();


    const description =
        descriptionInput.value.trim();


    /*
       NAME
    */

    if (name) {

        data.name =
            name;

    }


    /*
       DAY
    */

    if (day) {

        data.day =
            day;

    }


    /*
       TIME
    */

    if (time) {

        data.time =
            time;

    }


    /*
       TYPE
    */

    if (type) {

        data.type =
            type;

    }


    /*
       DESCRIPTION
    */

    if (description) {

        data.description =
            description;

    }


    return data;

}


/* =========================================================
   BUILD UPDATE DATA
   =========================================================

   If an existing field is cleared,
   deleteField() removes it from Firestore.

   ========================================================= */

function getUpdateData() {

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
       DAY
    */

    const day =
        dayInput.value.trim();


    if (day) {

        data.day =
            day;

    }
    else {

        data.day =
            deleteField();

    }


    /*
       TIME
    */

    const time =
        timeInput.value.trim();


    if (time) {

        data.time =
            time;

    }
    else {

        data.time =
            deleteField();

    }


    /*
       TYPE
    */

    const type =
        typeInput.value.trim();


    if (type) {

        data.type =
            type;

    }
    else {

        data.type =
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
       UPDATED AT
    */

    data.updatedAt =
        serverTimestamp();


    return data;

}


/* =========================================================
   ACTIVITY LOGGER
   =========================================================

   Every:

   CREATE
   UPDATE
   DELETE

   creates a new document in:

   activityLogs

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
                    "rituals",

                documentId:
                    documentId || "",

                itemName:
                    itemName ||
                    "Untitled Ritual",

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
            "Ritual activity logged:",
            action
        );

    }
    catch (error) {

        /*
           Do not stop the main
           ritual operation if logging fails.
        */

        console.error(
            "Activity logging error:",
            error
        );

    }

}


/* =========================================================
   LOAD RITUALS
   ========================================================= */

async function loadRituals() {

    try {

        if (list) {

            list.innerHTML =
                "Loading...";

        }


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "rituals"
                )
            );


        rituals = [];


        snapshot.forEach(
            ritualDoc => {

                rituals.push({

                    id:
                        ritualDoc.id,

                    ...ritualDoc.data()

                });

            }
        );


        /*
           Sort alphabetically.
        */

        rituals.sort(
            (a, b) =>
                String(
                    a.name ||
                    ""
                ).localeCompare(
                    String(
                        b.name ||
                        ""
                    )
                )
        );


        renderRituals();

    }
    catch (error) {

        console.error(
            "Ritual loading error:",
            error
        );


        if (list) {

            list.innerHTML = `

                <div class="empty-list">

                    Unable to load rituals.

                </div>

            `;

        }

    }

}


/* =========================================================
   RENDER RITUALS
   ========================================================= */

function renderRituals() {

    /*
       COUNT
    */

    if (count) {

        count.textContent =
            rituals.length === 1
                ? "1 ritual"
                : `${rituals.length} rituals`;

    }


    /*
       EMPTY
    */

    if (!rituals.length) {

        list.innerHTML = `

            <div class="empty-list">

                No rituals found.

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
       RENDER
    */

    rituals.forEach(
        ritual => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "ritual-item";


            let tags =
                "";


            /*
               DAY
            */

            if (ritual.day) {

                tags += `

                    <span class="ritual-tag">

                        ${escapeHTML(
                            ritual.day
                        )}

                    </span>

                `;

            }


            /*
               TIME
            */

            if (ritual.time) {

                tags += `

                    <span class="ritual-tag">

                        ${escapeHTML(
                            ritual.time
                        )}

                    </span>

                `;

            }


            /*
               TYPE
            */

            if (ritual.type) {

                tags += `

                    <span class="ritual-tag">

                        ${escapeHTML(
                            ritual.type
                        )}

                    </span>

                `;

            }


            item.innerHTML = `

                ${
                    tags
                        ? `

                            <div class="ritual-meta">

                                ${tags}

                            </div>

                          `
                        : ""
                }


                <h3>

                    ${escapeHTML(
                        ritual.name ||
                        "Untitled"
                    )}

                </h3>


                ${
                    ritual.description
                        ? `

                            <div
                                class="ritual-description"
                            >

                                ${escapeHTML(
                                    ritual.description
                                )}

                            </div>

                          `
                        : ""
                }


                <div class="item-actions">

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

                        editRitual(
                            ritual.id
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

                        deleteRitual(
                            ritual.id
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
   SAVE
   ========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /*
               Name is required.
            */

            const name =
                nameInput.value.trim();


            if (!name) {

                showMessage(
                    "Please enter the ritual name.",
                    "error"
                );

                nameInput.focus();

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

                    const oldRitual =
                        rituals.find(
                            item =>
                                item.id ===
                                editingId
                        );


                    const data =
                        getUpdateData();


                    await updateDoc(

                        doc(
                            db,
                            "rituals",
                            editingId
                        ),

                        data

                    );


                    /*
                       Activity history.
                    */

                    await logActivity({

                        action:
                            "UPDATE",

                        documentId:
                            editingId,

                        itemName:
                            name ||
                            oldRitual?.name ||
                            "Untitled Ritual"

                    });


                    showMessage(
                        "Ritual updated successfully.",
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
                                "rituals"
                            ),

                            data

                        );


                    /*
                       Activity history.
                    */

                    await logActivity({

                        action:
                            "CREATE",

                        documentId:
                            newDocument.id,

                        itemName:
                            data.name ||
                            "Untitled Ritual"

                    });


                    showMessage(
                        "Ritual added successfully.",
                        "success"
                    );

                }


                /*
                   Reset.
                */

                clearForm();


                /*
                   Reload.
                */

                await loadRituals();

            }
            catch (error) {

                console.error(
                    "Ritual save error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to save ritual.",
                    "error"
                );

            }
            finally {

                saveButton.disabled =
                    false;


                saveButton.textContent =
                    "Save Ritual";

            }

        }
    );

}


/* =========================================================
   EDIT
   ========================================================= */

function editRitual(
    id
) {

    const ritual =
        rituals.find(
            item =>
                item.id ===
                id
        );


    if (!ritual) {

        return;

    }


    editingId =
        id;


    nameInput.value =
        ritual.name ||
        "";


    dayInput.value =
        ritual.day ||
        "";


    timeInput.value =
        ritual.time ||
        "";


    typeInput.value =
        ritual.type ||
        "";


    descriptionInput.value =
        ritual.description ||
        "";


    /*
       Change heading.
    */

    if (formTitle) {

        formTitle.textContent =
            "Edit Ritual";

    }


    if (saveButton) {

        saveButton.textContent =
            "Update Ritual";

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
   DELETE
   ========================================================= */

async function deleteRitual(
    id
) {

    const ritual =
        rituals.find(
            item =>
                item.id ===
                id
        );


    if (!ritual) {

        return;

    }


    const confirmed =
        window.confirm(
            `Delete "${ritual.name || "this ritual"}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        /*
           Delete Firestore document.
        */

        await deleteDoc(

            doc(
                db,
                "rituals",
                id
            )

        );


        /*
           Activity history.
        */

        await logActivity({

            action:
                "DELETE",

            documentId:
                id,

            itemName:
                ritual.name ||
                "Untitled Ritual"

        });


        showMessage(
            "Ritual deleted.",
            "success"
        );


        /*
           Reload.
        */

        await loadRituals();

    }
    catch (error) {

        console.error(
            "Ritual delete error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to delete ritual.",
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
            "Add Ritual";

    }


    if (saveButton) {

        saveButton.textContent =
            "Save Ritual";

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
    "Roy Bari Rituals Admin loaded successfully."
);