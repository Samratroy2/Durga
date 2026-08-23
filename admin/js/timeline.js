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
    document.getElementById("timelineForm");

const formTitle =
    document.getElementById("formTitle");

const yearInput =
    document.getElementById("year");

const eraInput =
    document.getElementById("era");

const titleInput =
    document.getElementById("title");

const typeInput =
    document.getElementById("type");

const descriptionInput =
    document.getElementById("description");

const saveButton =
    document.getElementById("saveTimelineButton");

const cancelButton =
    document.getElementById("cancelTimelineButton");

const timelineList =
    document.getElementById("timelineList");

const timelineCount =
    document.getElementById("timelineCount");

const message =
    document.getElementById("timelineMessage");

const logoutButton =
    document.getElementById("logoutButton");

const adminEmail =
    document.getElementById("adminEmail");


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


        if (adminEmail) {

            adminEmail.textContent =
                user.email ||
                "Admin";

        }


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
   ========================================================= */

function getNewFormData() {

    const data = {};


    const year =
        yearInput?.value.trim() || "";

    const era =
        eraInput?.value.trim() || "";

    const title =
        titleInput?.value.trim() || "";

    const type =
        typeInput?.value.trim() || "";

    const description =
        descriptionInput?.value.trim() || "";


    /* YEAR */

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


    /* ERA */

    if (era !== "") {

        data.era =
            era;

    }


    /* TITLE */

    if (title !== "") {

        data.title =
            title;

    }


    /* TYPE */

    if (type !== "") {

        data.type =
            type;

    }


    /* DESCRIPTION */

    if (description !== "") {

        data.description =
            description;

    }


    return data;

}


/* =========================================================
   GET UPDATE DATA
   ========================================================= */

function getUpdateData() {

    const data = {};


    /* =====================================================
       YEAR
       ===================================================== */

    const year =
        yearInput?.value.trim() || "";


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


    /* =====================================================
       ERA
       ===================================================== */

    const era =
        eraInput?.value.trim() || "";


    if (era !== "") {

        data.era =
            era;

    }
    else {

        data.era =
            deleteField();

    }


    /* =====================================================
       TITLE
       ===================================================== */

    const title =
        titleInput?.value.trim() || "";


    if (title !== "") {

        data.title =
            title;

    }
    else {

        data.title =
            deleteField();

    }


    /* =====================================================
       TYPE
       ===================================================== */

    const type =
        typeInput?.value.trim() || "";


    if (type !== "") {

        data.type =
            type;

    }
    else {

        data.type =
            deleteField();

    }


    /* =====================================================
       DESCRIPTION
       ===================================================== */

    const description =
        descriptionInput?.value.trim() || "";


    if (description !== "") {

        data.description =
            description;

    }
    else {

        data.description =
            deleteField();

    }


    /* =====================================================
       UPDATED TIME
       ===================================================== */

    data.updatedAt =
        serverTimestamp();


    return data;

}


/* =========================================================
   ACTIVITY SNAPSHOT

   Only the actual editable fields are included.

   This is used to compare OLD vs NEW.
   ========================================================= */

function getActivitySnapshot(
    entry
) {

    return {

        year:
            entry?.year ?? "",

        era:
            entry?.era ?? "",

        title:
            entry?.title ?? "",

        type:
            entry?.type ?? "",

        description:
            entry?.description ?? ""

    };

}


/* =========================================================
   GET CURRENT FORM SNAPSHOT
   ========================================================= */

function getFormActivitySnapshot() {

    let year = "";

    const yearText =
        yearInput?.value.trim() || "";


    if (yearText !== "") {

        const numericYear =
            Number(yearText);


        if (
            Number.isFinite(
                numericYear
            )
        ) {

            year =
                numericYear;

        }
        else {

            year =
                yearText;

        }

    }


    return {

        year:
            year,

        era:
            eraInput?.value.trim() || "",

        title:
            titleInput?.value.trim() || "",

        type:
            typeInput?.value.trim() || "",

        description:
            descriptionInput?.value.trim() || ""

    };

}


/* =========================================================
   GET CHANGED FIELDS
   ========================================================= */

function getChangedFields(
    oldData,
    newData
) {

    const changedFields = [];


    const fields = [

        {
            key: "year",
            label: "Year"
        },

        {
            key: "era",
            label: "Era"
        },

        {
            key: "title",
            label: "Title"
        },

        {
            key: "type",
            label: "Type"
        },

        {
            key: "description",
            label: "Description"
        }

    ];


    fields.forEach(
        field => {

            const oldValue =
                normalizeActivityValue(
                    oldData?.[
                        field.key
                    ]
                );


            const newValue =
                normalizeActivityValue(
                    newData?.[
                        field.key
                    ]
                );


            if (
                oldValue !==
                newValue
            ) {

                changedFields.push(
                    field.label
                );

            }

        }
    );


    return changedFields;

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


        /* =================================================
           CREATE
           ================================================= */

        if (
            currentAction === "CREATE"
        ) {

            details =
                "Timeline event added.";

        }


        /* =================================================
           DELETE
           ================================================= */

        else if (
            currentAction === "DELETE"
        ) {

            details =
                "Timeline event deleted.";

        }


        /* =================================================
           UPDATE
           ================================================= */

        else if (
            currentAction === "UPDATE"
        ) {

            const changedFields =
                getChangedFields(
                    oldData,
                    newData
                );


            if (
                changedFields.length
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
                    "Timeline event updated.";

            }

        }


        /* =================================================
           SAVE ACTIVITY
           ================================================= */

        await addDoc(
            collection(
                db,
                "activityLogs"
            ),
            {

                action:
                    currentAction,

                collection:
                    "timeline",

                documentId:
                    documentId || "",

                itemName:
                    itemName ||
                    "Untitled Timeline Event",

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
            "Timeline activity logged:",
            details
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
   NORMALIZE VALUE
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


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime()
            .toString();

    }


    if (
        value instanceof Date
    ) {

        return value
            .getTime()
            .toString();

    }


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


    showMessage("");

}


/* =========================================================
   LOAD TIMELINE
   ========================================================= */

async function loadTimeline() {

    try {

        if (timelineList) {

            timelineList.innerHTML = `
                <div class="empty-list">
                    Loading...
                </div>
            `;

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


        /* =================================================
           SORT BY YEAR
           ================================================= */

        timelineEntries.sort(
            (a, b) => {

                const yearA =
                    Number(
                        a.year
                    );

                const yearB =
                    Number(
                        b.year
                    );


                if (
                    Number.isFinite(
                        yearA
                    ) &&
                    Number.isFinite(
                        yearB
                    )
                ) {

                    return (
                        yearA -
                        yearB
                    );

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


    if (timelineCount) {

        timelineCount.textContent =
            timelineEntries.length === 1
                ? "1 entry"
                : `${timelineEntries.length} entries`;

    }


    timelineList.innerHTML =
        "";


    timelineEntries.forEach(
        entry => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "timeline-item";


            /* =================================================
               YEAR
               ================================================= */

            const year =
                document.createElement(
                    "div"
                );


            year.className =
                "timeline-year";


            year.textContent =
                entry.year ||
                "—";


            /* =================================================
               CONTENT
               ================================================= */

            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "timeline-content";


            let metaHTML =
                "";


            if (entry.era) {

                metaHTML += `
                    <span class="timeline-tag">
                        ${escapeHTML(
                            entry.era
                        )}
                    </span>
                `;

            }


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


            /* =================================================
               ACTIONS
               ================================================= */

            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "timeline-actions";


            /* EDIT */

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


            /* DELETE */

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
                   UPDATE
                   ================================================= */

                if (editingId) {

                    const oldEntry =
                        timelineEntries.find(
                            item =>
                                item.id ===
                                editingId
                        );


                    if (!oldEntry) {

                        throw new Error(
                            "Timeline entry not found."
                        );

                    }


                    /*
                       IMPORTANT:

                       Take OLD data before
                       updating Firestore.
                    */

                    const oldActivityData =
                        getActivitySnapshot(
                            oldEntry
                        );


                    /*
                       Take NEW data directly
                       from the form.
                    */

                    const newActivityData =
                        getFormActivitySnapshot();


                    /*
                       Find exactly what changed.
                    */

                    const changedFields =
                        getChangedFields(
                            oldActivityData,
                            newActivityData
                        );


                    console.log(
                        "Timeline changed fields:",
                        changedFields
                    );


                    /*
                       Update Firestore.
                    */

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
                       Store activity.
                    */

                    await logActivity({

                        action:
                            "UPDATE",

                        documentId:
                            editingId,

                        itemName:
                            title ||
                            oldEntry.title ||
                            "Untitled Timeline Event",

                        oldData:
                            oldActivityData,

                        newData:
                            newActivityData

                    });


                    /*
                       Show exactly what changed.
                    */

                    if (
                        changedFields.length
                    ) {

                        showMessage(
                            `${changedFields.join(", ")} changed.`,
                            "success"
                        );

                    }
                    else {

                        showMessage(
                            "Timeline entry updated.",
                            "success"
                        );

                    }

                }


                /* =================================================
                   CREATE
                   ================================================= */

                else {

                    const data =
                        getNewFormData();


                    data.createdAt =
                        serverTimestamp();


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


                clearForm();


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

                if (saveButton) {

                    saveButton.disabled =
                        false;


                    saveButton.textContent =
                        "Save Timeline Event";

                }

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


    if (yearInput) {

        yearInput.value =
            entry.year ??
            "";

    }


    if (eraInput) {

        eraInput.value =
            entry.era ??
            "";

    }


    if (titleInput) {

        titleInput.value =
            entry.title ??
            "";

    }


    if (typeInput) {

        typeInput.value =
            entry.type ??
            "";

    }


    if (descriptionInput) {

        descriptionInput.value =
            entry.description ??
            "";

    }


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
            `Delete "${
                entry.title ||
                "this timeline entry"
            }"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(

            doc(
                db,
                "timeline",
                id
            )

        );


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


        if (
            editingId ===
            id
        ) {

            clearForm();

        }


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