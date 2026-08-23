/* =========================================================
   ROY BARI — TIMELINE ADMIN
   FIRESTORE: timeline
   ACTIVITY: activityLogs
   ========================================================= */


/* =========================================================
   FIREBASE
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

const timelineForm =
    document.getElementById(
        "timelineForm"
    );


const formTitle =
    document.getElementById(
        "formTitle"
    );


const yearInput =
    document.getElementById(
        "year"
    );


const eraInput =
    document.getElementById(
        "era"
    );


const titleInput =
    document.getElementById(
        "title"
    );


const typeInput =
    document.getElementById(
        "type"
    );


const descriptionInput =
    document.getElementById(
        "description"
    );


const saveButton =
    document.getElementById(
        "saveTimelineButton"
    );


const cancelButton =
    document.getElementById(
        "cancelTimelineButton"
    );


const timelineList =
    document.getElementById(
        "timelineList"
    );


const timelineCount =
    document.getElementById(
        "timelineCount"
    );


const message =
    document.getElementById(
        "timelineMessage"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const adminEmail =
    document.getElementById(
        "adminEmail"
    );


/* =========================================================
   DATA
   ========================================================= */

let timelineEntries = [];

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


        /*
           Show logged-in admin.
        */

        if (adminEmail) {

            adminEmail.textContent =
                user.email ||
                "Admin";

        }


        /*
           Save admin information
           for other admin pages.
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


        await loadTimeline();

    }
);


/* =========================================================
   SHOW MESSAGE
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
   GET NEW FORM DATA
   =========================================================

   Only fields containing values are stored.

   ========================================================= */

function getNewFormData() {

    const data = {};


    const year =
        yearInput?.value.trim();


    const era =
        eraInput?.value.trim();


    const title =
        titleInput?.value.trim();


    const type =
        typeInput?.value.trim();


    const description =
        descriptionInput?.value.trim();


    /*
       YEAR
    */

    if (year !== "") {

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
       ERA
    */

    if (era !== "") {

        data.era =
            era;

    }


    /*
       TITLE
    */

    if (title !== "") {

        data.title =
            title;

    }


    /*
       TYPE
    */

    if (type !== "") {

        data.type =
            type;

    }


    /*
       DESCRIPTION
    */

    if (description !== "") {

        data.description =
            description;

    }


    return data;

}


/* =========================================================
   GET UPDATE DATA
   =========================================================

   If a field is cleared during editing,
   deleteField() removes it from Firestore.

   ========================================================= */

function getUpdateData() {

    const data = {};


    /*
       YEAR
    */

    const year =
        yearInput?.value.trim();


    if (year !== "") {

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
       ERA
    */

    const era =
        eraInput?.value.trim();


    if (era !== "") {

        data.era =
            era;

    }
    else {

        data.era =
            deleteField();

    }


    /*
       TITLE
    */

    const title =
        titleInput?.value.trim();


    if (title !== "") {

        data.title =
            title;

    }
    else {

        data.title =
            deleteField();

    }


    /*
       TYPE
    */

    const type =
        typeInput?.value.trim();


    if (type !== "") {

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
        descriptionInput?.value.trim();


    if (description !== "") {

        data.description =
            description;

    }
    else {

        data.description =
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

   Every operation creates a NEW activityLogs document.

   CREATE
   UPDATE
   DELETE

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
                    "timeline",

                documentId:
                    documentId || "",

                itemName:
                    itemName ||
                    "Untitled Timeline Event",

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
            "Timeline activity logged:",
            action
        );

    }
    catch (error) {

        /*
           Activity failure should NOT
           stop the main operation.
        */

        console.error(
            "Activity logging error:",
            error
        );

    }

}


/* =========================================================
   CLEAR FORM
   ========================================================= */

function clearForm() {

    if (timelineForm) {

        timelineForm.reset();

    }


    editingId =
        null;


    if (formTitle) {

        formTitle.textContent =
            "Add Timeline Event";

    }


    if (saveButton) {

        saveButton.textContent =
            "Save Timeline Event";

    }


    showMessage(
        ""
    );

}


/* =========================================================
   LOAD TIMELINE
   ========================================================= */

async function loadTimeline() {

    try {

        if (timelineList) {

            timelineList.innerHTML =
                "Loading...";

        }


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "timeline"
                )
            );


        timelineEntries = [];


        snapshot.forEach(
            timelineDoc => {

                timelineEntries.push({

                    id:
                        timelineDoc.id,

                    ...timelineDoc.data()

                });

            }
        );


        /*
           Sort by year.
        */

        timelineEntries.sort(
            (a, b) => {

                const yearA =
                    Number(a.year);


                const yearB =
                    Number(b.year);


                if (
                    Number.isFinite(
                        yearA
                    ) &&
                    Number.isFinite(
                        yearB
                    )
                ) {

                    return yearA -
                        yearB;

                }


                if (
                    Number.isFinite(
                        yearA
                    )
                ) {

                    return -1;

                }


                if (
                    Number.isFinite(
                        yearB
                    )
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


        renderTimeline();

    }
    catch (error) {

        console.error(
            "Timeline loading error:",
            error
        );


        if (timelineList) {

            timelineList.innerHTML = `

                <div class="empty-list">

                    Unable to load timeline.

                </div>

            `;

        }


        showMessage(
            "Unable to load timeline.",
            "error"
        );

    }

}


/* =========================================================
   RENDER TIMELINE
   ========================================================= */

function renderTimeline() {

    if (!timelineEntries.length) {

        timelineList.innerHTML = `

            <div class="empty-list">

                No timeline entries found.

            </div>

        `;


        if (timelineCount) {

            timelineCount.textContent =
                "0 entries";

        }


        return;

    }


    /*
       COUNT
    */

    if (timelineCount) {

        timelineCount.textContent =
            timelineEntries.length === 1
                ? "1 entry"
                : `${timelineEntries.length} entries`;

    }


    /*
       CLEAR LIST
    */

    timelineList.innerHTML =
        "";


    /*
       RENDER EACH ENTRY
    */

    timelineEntries.forEach(
        entry => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "timeline-item";


            /*
               YEAR
            */

            const year =
                document.createElement(
                    "div"
                );


            year.className =
                "timeline-year";


            year.textContent =
                entry.year ||
                "—";


            /*
               CONTENT
            */

            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "timeline-content";


            let metaHTML =
                "";


            /*
               ERA
            */

            if (entry.era) {

                metaHTML += `

                    <span class="timeline-tag">

                        ${escapeHTML(
                            entry.era
                        )}

                    </span>

                `;

            }


            /*
               TYPE
            */

            if (entry.type) {

                metaHTML += `

                    <span class="timeline-tag">

                        ${escapeHTML(
                            entry.type
                        )}

                    </span>

                `;

            }


            content.innerHTML = `

                ${
                    metaHTML
                        ? `

                            <div class="timeline-meta">

                                ${metaHTML}

                            </div>

                          `
                        : ""
                }


                <h3>

                    ${escapeHTML(
                        entry.title ||
                        "Untitled"
                    )}

                </h3>


                ${
                    entry.description
                        ? `

                            <p>

                                ${escapeHTML(
                                    entry.description
                                )}

                            </p>

                          `
                        : ""
                }

            `;


            /*
               ACTIONS
            */

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "timeline-actions";


            /*
               EDIT BUTTON
            */

            const editButton =
                document.createElement(
                    "button"
                );


            editButton.type =
                "button";


            editButton.className =
                "timeline-edit";


            editButton.textContent =
                "Edit";


            editButton.addEventListener(
                "click",
                () => {

                    editTimeline(
                        entry.id
                    );

                }
            );


            /*
               DELETE BUTTON
            */

            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "timeline-delete";


            deleteButton.textContent =
                "Delete";


            deleteButton.addEventListener(
                "click",
                () => {

                    deleteTimeline(
                        entry.id
                    );

                }
            );


            actions.appendChild(
                editButton
            );


            actions.appendChild(
                deleteButton
            );


            item.appendChild(
                year
            );


            item.appendChild(
                content
            );


            item.appendChild(
                actions
            );


            timelineList.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   ADD / UPDATE
   ========================================================= */

if (timelineForm) {

    timelineForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /*
               TITLE REQUIRED
            */

            const title =
                titleInput?.value.trim();


            if (!title) {

                showMessage(
                    "Please enter a title.",
                    "error"
                );


                titleInput.focus();

                return;

            }


            /*
               DISABLE BUTTON
            */

            saveButton.disabled =
                true;


            saveButton.textContent =
                editingId
                    ? "Updating..."
                    : "Saving...";


            try {

                /* =================================================
                   UPDATE EXISTING ENTRY
                   ================================================= */

                if (editingId) {

                    const oldEntry =
                        timelineEntries.find(
                            item =>
                                item.id ===
                                editingId
                        );


                    const data =
                        getUpdateData();


                    await updateDoc(

                        doc(
                            db,
                            "timeline",
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
                            title ||
                            oldEntry?.title ||
                            "Untitled Timeline Event"

                    });


                    showMessage(
                        "Timeline entry updated successfully.",
                        "success"
                    );

                }


                /* =================================================
                   ADD NEW ENTRY
                   ================================================= */

                else {

                    const data =
                        getNewFormData();


                    /*
                       Created timestamp.
                    */

                    data.createdAt =
                        serverTimestamp();


                    /*
                       Updated timestamp.
                    */

                    data.updatedAt =
                        serverTimestamp();


                    const newDocument =
                        await addDoc(

                            collection(
                                db,
                                "timeline"
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
                            "Untitled Timeline Event"

                    });


                    showMessage(
                        "Timeline entry added successfully.",
                        "success"
                    );

                }


                /*
                   RESET
                */

                clearForm();


                /*
                   RELOAD
                */

                await loadTimeline();

            }
            catch (error) {

                console.error(
                    "Timeline save error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to save timeline entry.",
                    "error"
                );

            }
            finally {

                saveButton.disabled =
                    false;


                saveButton.textContent =
                    "Save Timeline Event";

            }

        }
    );

}


/* =========================================================
   EDIT TIMELINE
   ========================================================= */

function editTimeline(
    id
) {

    const entry =
        timelineEntries.find(
            item =>
                item.id ===
                id
        );


    if (!entry) {

        return;

    }


    editingId =
        id;


    /*
       FILL FORM
    */

    yearInput.value =
        entry.year ??
        "";


    eraInput.value =
        entry.era ??
        "";


    titleInput.value =
        entry.title ??
        "";


    typeInput.value =
        entry.type ??
        "";


    descriptionInput.value =
        entry.description ??
        "";


    /*
       CHANGE UI
    */

    if (formTitle) {

        formTitle.textContent =
            "Edit Timeline Event";

    }


    if (saveButton) {

        saveButton.textContent =
            "Update Timeline Event";

    }


    showMessage(
        "Editing timeline entry.",
        "info"
    );


    /*
       SCROLL TO FORM
    */

    if (timelineForm) {

        timelineForm.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

    }

}


/* =========================================================
   DELETE TIMELINE
   ========================================================= */

async function deleteTimeline(
    id
) {

    const entry =
        timelineEntries.find(
            item =>
                item.id ===
                id
        );


    if (!entry) {

        return;

    }


    const confirmed =
        window.confirm(

            `Delete "${entry.title || "this timeline entry"}"?`

        );


    if (!confirmed) {

        return;

    }


    try {

        /*
           DELETE FIRESTORE DOCUMENT
        */

        await deleteDoc(

            doc(
                db,
                "timeline",
                id
            )

        );


        /*
           STORE ACTIVITY
        */

        await logActivity({

            action:
                "DELETE",

            documentId:
                id,

            itemName:
                entry.title ||
                "Untitled Timeline Event"

        });


        showMessage(
            "Timeline entry deleted.",
            "success"
        );


        /*
           If currently editing,
           reset form.
        */

        if (
            editingId ===
            id
        ) {

            clearForm();

        }


        /*
           Reload.
        */

        await loadTimeline();

    }
    catch (error) {

        console.error(
            "Timeline delete error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to delete timeline entry.",
            "error"
        );

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
   ADMIN EMAIL FALLBACK
   ========================================================= */

try {

    const savedEmail =
        localStorage.getItem(
            "adminEmail"
        );


    if (
        savedEmail &&
        adminEmail
    ) {

        adminEmail.textContent =
            savedEmail;

    }

}
catch (error) {

    console.warn(
        "Could not read admin email."
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
    "Roy Bari Timeline Admin loaded successfully."
);