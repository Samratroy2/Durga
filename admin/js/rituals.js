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
    deleteField,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    auth,
    db
} from "../firebase.js";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const form =
    document.getElementById("ritualForm");

const formTitle =
    document.getElementById("formTitle");

const nameInput =
    document.getElementById("name");

const dayInput =
    document.getElementById("day");

const dateInput =
    document.getElementById("date");

const timeInput =
    document.getElementById("time");

const categoryInput =
    document.getElementById("category");

const typeInput =
    document.getElementById("type");

const locationInput =
    document.getElementById("location");

const priestInput =
    document.getElementById("priest");

const orderInput =
    document.getElementById("order");

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
   FIRESTORE DATE → INPUT DATE
   ========================================================= */

function firestoreDateToInput(
    value
) {

    if (!value) {

        return "";

    }


    let date = null;


    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        date =
            value.toDate();

    }

    else if (
        value instanceof Date
    ) {

        date =
            value;

    }

    else if (
        typeof value === "string"
    ) {

        date =
            new Date(value);

    }


    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* =========================================================
   INPUT DATE → FIRESTORE TIMESTAMP
   ========================================================= */

function inputDateToTimestamp(
    value
) {

    if (!value) {

        return null;

    }


    const parts =
        value.split("-");


    if (
        parts.length !== 3
    ) {

        return null;

    }


    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);


    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        !Number.isInteger(day)
    ) {

        return null;

    }


    const date =
        new Date(
            year,
            month - 1,
            day,
            12,
            0,
            0
        );


    return Timestamp.fromDate(
        date
    );

}


/* =========================================================
   DISPLAY FIRESTORE DATE
   ========================================================= */

function formatDisplayDate(
    value
) {

    if (!value) {

        return "";

    }


    let date = null;


    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        date =
            value.toDate();

    }

    else if (
        value instanceof Date
    ) {

        date =
            value;

    }

    else {

        date =
            new Date(value);

    }


    if (
        !date ||
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


/* =========================================================
   BUILD NEW RITUAL DATA
   ========================================================= */

function getNewFormData() {

    const data = {};


    const name =
        nameInput?.value.trim() || "";

    const day =
        dayInput?.value.trim() || "";

    const date =
        dateInput?.value || "";

    const time =
        timeInput?.value.trim() || "";

    const category =
        categoryInput?.value.trim() || "";

    const type =
        typeInput?.value.trim() || "";

    const location =
        locationInput?.value.trim() || "";

    const priest =
        priestInput?.value.trim() || "";

    const order =
        orderInput?.value.trim() || "";

    const description =
        descriptionInput?.value.trim() || "";


    if (name) {

        data.name =
            name;

    }


    if (day) {

        data.day =
            day;

    }


    if (date) {

        const timestamp =
            inputDateToTimestamp(
                date
            );


        if (timestamp) {

            data.date =
                timestamp;

        }

    }


    if (time) {

        data.time =
            time;

    }


    if (category) {

        data.category =
            category;

    }


    if (type) {

        data.type =
            type;

    }


    if (location) {

        data.location =
            location;

    }


    if (priest) {

        data.priest =
            priest;

    }


    if (order) {

        data.order =
            order;

    }


    if (description) {

        data.description =
            description;

    }


    return data;

}


/* =========================================================
   BUILD UPDATE DATA
   ========================================================= */

function getUpdateData() {

    const data = {};


    const name =
        nameInput?.value.trim() || "";

    data.name =
        name
            ? name
            : deleteField();


    const day =
        dayInput?.value.trim() || "";

    data.day =
        day
            ? day
            : deleteField();


    const date =
        dateInput?.value || "";


    if (date) {

        const timestamp =
            inputDateToTimestamp(
                date
            );


        data.date =
            timestamp
                ? timestamp
                : deleteField();

    }

    else {

        data.date =
            deleteField();

    }


    const time =
        timeInput?.value.trim() || "";

    data.time =
        time
            ? time
            : deleteField();


    /*
       Remove old uppercase Time field.
    */

    data.Time =
        deleteField();


    const category =
        categoryInput?.value.trim() || "";

    data.category =
        category
            ? category
            : deleteField();


    const type =
        typeInput?.value.trim() || "";

    data.type =
        type
            ? type
            : deleteField();


    const location =
        locationInput?.value.trim() || "";

    data.location =
        location
            ? location
            : deleteField();


    const priest =
        priestInput?.value.trim() || "";

    data.priest =
        priest
            ? priest
            : deleteField();


    const order =
        orderInput?.value.trim() || "";

    data.order =
        order
            ? order
            : deleteField();


    const description =
        descriptionInput?.value.trim() || "";

    data.description =
        description
            ? description
            : deleteField();


    data.updatedAt =
        serverTimestamp();


    return data;

}


/* =========================================================
   ACTIVITY SNAPSHOT
   =========================================================

   Used ONLY to determine which fields changed.

   ========================================================= */

function getActivitySnapshot(
    ritual
) {

    return {

        name:
            ritual?.name ?? "",

        day:
            ritual?.day ?? "",

        date:
            ritual?.date ?? "",

        time:
            ritual?.time ??
            ritual?.Time ??
            "",

        category:
            ritual?.category ?? "",

        type:
            ritual?.type ?? "",

        location:
            ritual?.location ?? "",

        priest:
            ritual?.priest ?? "",

        order:
            ritual?.order ?? "",

        description:
            ritual?.description ?? ""

    };

}


/* =========================================================
   NEW ACTIVITY SNAPSHOT FROM FORM
   ========================================================= */

function getNewActivitySnapshot() {

    return {

        name:
            nameInput?.value.trim() || "",

        day:
            dayInput?.value.trim() || "",

        date:
            dateInput?.value || "",

        time:
            timeInput?.value.trim() || "",

        category:
            categoryInput?.value.trim() || "",

        type:
            typeInput?.value.trim() || "",

        location:
            locationInput?.value.trim() || "",

        priest:
            priestInput?.value.trim() || "",

        order:
            orderInput?.value.trim() || "",

        description:
            descriptionInput?.value.trim() || ""

    };

}


/* =========================================================
   ACTIVITY LOGGER
   =========================================================

   DETAILS EXAMPLES:

       Category changed

       Category changed, Priest changed

       Date changed, Time changed

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
                "Ritual added.";

        }


        /* =================================================
           DELETE
           ================================================= */

        else if (
            currentAction === "DELETE"
        ) {

            details =
                "Ritual deleted.";

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
                    "Ritual updated.";

            }

        }


        /* =================================================
           SAVE ACTIVITY LOG
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
                    "rituals",

                documentId:
                    documentId || "",

                itemName:
                    itemName ||
                    "Untitled Ritual",

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
                    "rituals",

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
   GET CHANGED FIELDS
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
            key: "name",
            label: "Name"
        },

        {
            key: "day",
            label: "Day"
        },

        {
            key: "date",
            label: "Date"
        },

        {
            key: "time",
            label: "Time"
        },

        {
            key: "category",
            label: "Category"
        },

        {
            key: "type",
            label: "Type"
        },

        {
            key: "location",
            label: "Location"
        },

        {
            key: "priest",
            label: "Priest"
        },

        {
            key: "order",
            label: "Order"
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


    /*
       Firestore Timestamp
    */

    if (
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime()
            .toString();

    }


    /*
       Date
    */

    if (
        value instanceof Date
    ) {

        return value
            .getTime()
            .toString();

    }


    /*
       Object
    */

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
   LOAD RITUALS
   ========================================================= */

async function loadRituals() {

    try {

        if (list) {

            list.innerHTML = `
                <div class="empty-list">
                    Loading rituals...
                </div>
            `;

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
           Sort by order.
        */

        rituals.sort(
            (a, b) => {

                const orderA =
                    Number(
                        a.order
                    );

                const orderB =
                    Number(
                        b.order
                    );


                if (
                    Number.isFinite(
                        orderA
                    ) &&
                    Number.isFinite(
                        orderB
                    )
                ) {

                    return (
                        orderA -
                        orderB
                    );

                }


                return String(
                    a.name ||
                    ""
                ).localeCompare(
                    String(
                        b.name ||
                        ""
                    )
                );

            }
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

    if (count) {

        count.textContent =
            rituals.length === 1
                ? "1 ritual"
                : `${rituals.length} rituals`;

    }


    if (!rituals.length) {

        list.innerHTML = `
            <div class="empty-list">

                <div class="empty-icon">
                    ॐ
                </div>

                <h3>
                    No rituals yet
                </h3>

                <p>
                    Add the first Roy Bari ritual.
                </p>

            </div>
        `;

        return;

    }


    list.innerHTML =
        "";


    rituals.forEach(
        ritual => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "ritual-item";


            /* =================================================
               TAGS
               ================================================= */

            let tags =
                "";


            if (ritual.day) {

                tags += `
                    <span class="ritual-tag">
                        ${escapeHTML(
                            ritual.day
                        )}
                    </span>
                `;

            }


            if (ritual.time) {

                tags += `
                    <span class="ritual-tag">
                        ${escapeHTML(
                            ritual.time
                        )}
                    </span>
                `;

            }


            if (ritual.category) {

                tags += `
                    <span class="ritual-tag">
                        ${escapeHTML(
                            ritual.category
                        )}
                    </span>
                `;

            }


            if (ritual.type) {

                tags += `
                    <span class="ritual-tag">
                        ${escapeHTML(
                            ritual.type
                        )}
                    </span>
                `;

            }


            /* =================================================
               DETAILS
               ================================================= */

            let details =
                "";


            const displayDate =
                formatDisplayDate(
                    ritual.date
                );


            if (displayDate) {

                details += `
                    <div class="ritual-detail">

                        <strong>
                            Date
                        </strong>

                        <span>
                            ${escapeHTML(
                                displayDate
                            )}
                        </span>

                    </div>
                `;

            }


            if (ritual.location) {

                details += `
                    <div class="ritual-detail">

                        <strong>
                            Location
                        </strong>

                        <span>
                            ${escapeHTML(
                                ritual.location
                            )}
                        </span>

                    </div>
                `;

            }


            if (ritual.priest) {

                details += `
                    <div class="ritual-detail">

                        <strong>
                            Priest
                        </strong>

                        <span>
                            ${escapeHTML(
                                ritual.priest
                            )}
                        </span>

                    </div>
                `;

            }


            if (
                ritual.order !== undefined &&
                ritual.order !== null &&
                ritual.order !== ""
            ) {

                details += `
                    <div class="ritual-detail">

                        <strong>
                            Order
                        </strong>

                        <span>
                            ${escapeHTML(
                                ritual.order
                            )}
                        </span>

                    </div>
                `;

            }


            /* =================================================
               CARD
               ================================================= */

            item.innerHTML = `

                <div class="ritual-card-top">

                    <div>

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

                    </div>


                    <div class="ritual-actions">

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

                </div>


                ${
                    details
                        ? `
                            <div class="ritual-details">
                                ${details}
                            </div>
                          `
                        : ""
                }


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

            `;


            /* =================================================
               EDIT
               ================================================= */

            const editButton =
                item.querySelector(
                    ".edit-button"
                );


            if (editButton) {

                editButton.addEventListener(
                    "click",
                    () => {

                        editRitual(
                            ritual.id
                        );

                    }
                );

            }


            /* =================================================
               DELETE
               ================================================= */

            const deleteButton =
                item.querySelector(
                    ".delete-button"
                );


            if (deleteButton) {

                deleteButton.addEventListener(
                    "click",
                    () => {

                        deleteRitual(
                            ritual.id
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
   SAVE RITUAL
   ========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                nameInput?.value.trim() ||
                "";


            if (!name) {

                showMessage(
                    "Please enter the ritual name.",
                    "error"
                );


                nameInput?.focus();

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

                    const oldRitual =
                        rituals.find(
                            item =>
                                item.id ===
                                editingId
                        );


                    if (!oldRitual) {

                        throw new Error(
                            "Ritual not found."
                        );

                    }


                    /*
                       Snapshot BEFORE update.
                    */

                    const oldActivityData =
                        getActivitySnapshot(
                            oldRitual
                        );


                    /*
                       Snapshot FROM FORM.
                    */

                    const newActivityData =
                        getNewActivitySnapshot();


                    /*
                       Find changed fields BEFORE
                       Firestore update.
                    */

                    const changedFields =
                        getChangedFields(
                            oldActivityData,
                            newActivityData
                        );


                    console.log(
                        "Ritual changed fields:",
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
                            "rituals",
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
                            name ||
                            oldRitual.name ||
                            "Untitled Ritual",

                        oldData:
                            oldActivityData,

                        newData:
                            newActivityData

                    });


                    showMessage(
                        changedFields.length
                            ? `${changedFields.join(", ")} changed.`
                            : "Ritual updated successfully.",
                        "success"
                    );

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
                                "rituals"
                            ),

                            data

                        );


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


                clearForm();


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

                if (saveButton) {

                    saveButton.disabled =
                        false;


                    saveButton.textContent =
                        "Save Ritual";

                }

            }

        }
    );

}


/* =========================================================
   EDIT RITUAL
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


    if (nameInput) {

        nameInput.value =
            ritual.name ||
            "";

    }


    if (dayInput) {

        dayInput.value =
            ritual.day ||
            "";

    }


    if (dateInput) {

        dateInput.value =
            firestoreDateToInput(
                ritual.date
            );

    }


    if (timeInput) {

        timeInput.value =
            ritual.time ||
            ritual.Time ||
            "";

    }


    if (categoryInput) {

        categoryInput.value =
            ritual.category ||
            "";

    }


    if (typeInput) {

        typeInput.value =
            ritual.type ||
            "";

    }


    if (locationInput) {

        locationInput.value =
            ritual.location ||
            "";

    }


    if (priestInput) {

        priestInput.value =
            ritual.priest ||
            "";

    }


    if (orderInput) {

        orderInput.value =
            ritual.order ??
            "";

    }


    if (descriptionInput) {

        descriptionInput.value =
            ritual.description ||
            "";

    }


    if (formTitle) {

        formTitle.textContent =
            "Edit Ritual";

    }


    if (saveButton) {

        saveButton.textContent =
            "Update Ritual";

    }


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
   DELETE RITUAL
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
            `Delete "${
                ritual.name ||
                "this ritual"
            }"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(

            doc(
                db,
                "rituals",
                id
            )

        );


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

            showMessage("");

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