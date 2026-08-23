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
   FIRESTORE DATE → INPUT DATE
   ========================================================= */

function firestoreDateToInput(
    value
) {

    if (!value) {

        return "";

    }


    let date = null;


    /*
       Firestore Timestamp
    */

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        date =
            value.toDate();

    }


    /*
       JavaScript Date
    */

    else if (
        value instanceof Date
    ) {

        date =
            value;

    }


    /*
       String
    */

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


    /*
       HTML date gives:

       YYYY-MM-DD
    */


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


    /*
       Noon avoids unwanted date
       shifting caused by timezone.
    */

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
        nameInput.value.trim();

    const day =
        dayInput.value.trim();

    const date =
        dateInput.value;

    const time =
        timeInput.value.trim();

    const category =
        categoryInput.value.trim();

    const type =
        typeInput.value.trim();

    const location =
        locationInput.value.trim();

    const priest =
        priestInput.value.trim();

    const order =
        orderInput.value.trim();

    const description =
        descriptionInput.value.trim();


    /* NAME */

    if (name) {

        data.name =
            name;

    }


    /* DAY */

    if (day) {

        data.day =
            day;

    }


    /* DATE */

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


    /* TIME */

    if (time) {

        data.time =
            time;

    }


    /* CATEGORY */

    if (category) {

        data.category =
            category;

    }


    /* TYPE */

    if (type) {

        data.type =
            type;

    }


    /* LOCATION */

    if (location) {

        data.location =
            location;

    }


    /* PRIEST */

    if (priest) {

        data.priest =
            priest;

    }


    /* ORDER */

    if (order) {

        data.order =
            order;

    }


    /* DESCRIPTION */

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


    /* NAME */

    const name =
        nameInput.value.trim();

    data.name =
        name
            ? name
            : deleteField();


    /* DAY */

    const day =
        dayInput.value.trim();

    data.day =
        day
            ? day
            : deleteField();


    /* DATE */

    const date =
        dateInput.value;


    if (date) {

        const timestamp =
            inputDateToTimestamp(
                date
            );


        if (timestamp) {

            data.date =
                timestamp;

        }
        else {

            data.date =
                deleteField();

        }

    }
    else {

        data.date =
            deleteField();

    }


    /* TIME */

    const time =
        timeInput.value.trim();


    data.time =
        time
            ? time
            : deleteField();


    /*
       IMPORTANT:

       Remove old uppercase "Time"
       if an old document contains it.
    */

    data.Time =
        deleteField();


    /* CATEGORY */

    const category =
        categoryInput.value.trim();


    data.category =
        category
            ? category
            : deleteField();


    /* TYPE */

    const type =
        typeInput.value.trim();


    data.type =
        type
            ? type
            : deleteField();


    /* LOCATION */

    const location =
        locationInput.value.trim();


    data.location =
        location
            ? location
            : deleteField();


    /* PRIEST */

    const priest =
        priestInput.value.trim();


    data.priest =
        priest
            ? priest
            : deleteField();


    /* ORDER */

    const order =
        orderInput.value.trim();


    data.order =
        order
            ? order
            : deleteField();


    /* DESCRIPTION */

    const description =
        descriptionInput.value.trim();


    data.description =
        description
            ? description
            : deleteField();


    /* UPDATED */

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


    }
    catch (error) {

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
                    Number(a.order);

                const orderB =
                    Number(b.order);


                if (
                    Number.isFinite(orderA) &&
                    Number.isFinite(orderB)
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
               EDIT BUTTON
               ================================================= */

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


            /* =================================================
               DELETE BUTTON
               ================================================= */

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
   SAVE RITUAL
   ========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


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


            saveButton.disabled =
                true;


            saveButton.textContent =
                editingId
                    ? "Updating..."
                    : "Saving...";


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

                saveButton.disabled =
                    false;


                saveButton.textContent =
                    "Save Ritual";

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


    /* NAME */

    nameInput.value =
        ritual.name ||
        "";


    /* DAY */

    dayInput.value =
        ritual.day ||
        "";


    /* DATE */

    dateInput.value =
        firestoreDateToInput(
            ritual.date
        );


    /*
       TIME

       Your current Firestore document
       uses:

       time: "Evening"

       So this will correctly show:

       Evening
    */

    timeInput.value =
        ritual.time ||
        "";


    /* CATEGORY */

    categoryInput.value =
        ritual.category ||
        "";


    /* TYPE */

    typeInput.value =
        ritual.type ||
        "";


    /* LOCATION */

    locationInput.value =
        ritual.location ||
        "";


    /* PRIEST */

    priestInput.value =
        ritual.priest ||
        "";


    /* ORDER */

    orderInput.value =
        ritual.order ??
        "";


    /* DESCRIPTION */

    descriptionInput.value =
        ritual.description ||
        "";


    /* FORM TITLE */

    if (formTitle) {

        formTitle.textContent =
            "Edit Ritual";

    }


    /* BUTTON */

    if (saveButton) {

        saveButton.textContent =
            "Update Ritual";

    }


    /*
       Scroll to top/form.
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