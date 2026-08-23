/* =========================================================
   ROY BARI — GALLERY ADMIN
   FIRESTORE: gallery
   ACTIVITY HISTORY: activityLogs
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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


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
    document.getElementById("galleryForm");

const galleryId =
    document.getElementById("galleryId");

const titleInput =
    document.getElementById("title");

const yearInput =
    document.getElementById("year");

const imageInput =
    document.getElementById("image");

const descriptionInput =
    document.getElementById("description");

const categoryInput =
    document.getElementById("category");

const galleryList =
    document.getElementById("galleryList");

const galleryCount =
    document.getElementById("galleryCount");

const formTitle =
    document.getElementById("formTitle");

const saveButton =
    document.getElementById("saveButton");

const cancelButton =
    document.getElementById("cancelButton");

const message =
    document.getElementById("galleryMessage");

const logoutButton =
    document.getElementById("logoutButton");

const adminEmail =
    document.getElementById("adminEmail");


/* =========================================================
   DATA
   ========================================================= */

let gallery = [];


/* =========================================================
   AUTH
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


        await loadGallery();

    }
);


/* =========================================================
   LOAD GALLERY
   ========================================================= */

async function loadGallery() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "gallery"
                )
            );


        gallery = [];


        snapshot.forEach(
            item => {

                gallery.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


        galleryCount.textContent =
            `${gallery.length} photo${
                gallery.length === 1
                    ? ""
                    : "s"
            }`;


        renderGallery();

    }
    catch (error) {

        console.error(
            "Gallery loading error:",
            error
        );


        galleryList.innerHTML = `

            <p class="message error">

                Unable to load gallery.

            </p>

        `;

    }

}


/* =========================================================
   RENDER GALLERY
   ========================================================= */

function renderGallery() {

    if (!gallery.length) {

        galleryList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📷
                </div>

                <h3>
                    No photographs yet
                </h3>

                <p>
                    Add the first photograph.
                </p>

            </div>

        `;

        return;

    }


    galleryList.innerHTML =
        "";


    gallery.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "manager-item";


            card.innerHTML = `

                <div class="manager-item-main">

                    <div class="manager-avatar">

                        ${
                            item.image
                                ? `
                                    <img
                                        src="${escapeHtml(
                                            item.image
                                        )}"
                                        alt="${escapeHtml(
                                            item.title ||
                                            "Photo"
                                        )}"
                                    >
                                  `
                                : "📷"
                        }

                    </div>


                    <div>

                        <h3>
                            ${escapeHtml(
                                item.title ||
                                "Untitled"
                            )}
                        </h3>


                        <span>

                            ${escapeHtml(
                                item.category ||
                                ""
                            )}

                            ${
                                item.year
                                    ? " · " +
                                      escapeHtml(
                                          item.year
                                      )
                                    : ""
                            }

                        </span>


                        <small>

                            ${escapeHtml(
                                item.description ||
                                ""
                            )}

                        </small>

                    </div>

                </div>


                <div class="manager-actions">

                    <button
                        type="button"
                        class="edit-button"
                        data-id="${escapeHtml(
                            item.id
                        )}"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="delete-button"
                        data-id="${escapeHtml(
                            item.id
                        )}"
                    >
                        Delete
                    </button>

                </div>

            `;


            galleryList.appendChild(
                card
            );

        }
    );


    attachGalleryButtons();

}


/* =========================================================
   BUTTON EVENTS
   ========================================================= */

function attachGalleryButtons() {

    document
        .querySelectorAll(
            ".edit-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editGallery(
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

                        deleteGallery(
                            button.dataset.id
                        );

                    }
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


            saveButton.disabled =
                true;


            saveButton.textContent =
                galleryId.value
                    ? "Updating..."
                    : "Saving...";


            try {

                /* =================================================
                   ADD
                   ================================================= */

                if (!galleryId.value) {

                    const data = {

                        title:
                            titleInput.value.trim(),

                        year:
                            yearInput.value
                                ? Number(
                                    yearInput.value
                                )
                                : null,

                        image:
                            imageInput.value.trim(),

                        description:
                            descriptionInput.value.trim(),

                        category:
                            categoryInput.value.trim(),

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    };


                    const newDocument =
                        await addDoc(
                            collection(
                                db,
                                "gallery"
                            ),
                            data
                        );


                    /*
                       STORE ACTIVITY
                    */

                    await logActivity({

                        action:
                            "created",

                        collectionName:
                            "gallery",

                        documentId:
                            newDocument.id,

                        title:
                            data.title ||
                            "Untitled Photograph",

                        details:
                            buildCreatedDetails(
                                newDocument.id,
                                data
                            )

                    });


                    showMessage(
                        "Photograph added successfully.",
                        "success"
                    );

                }


                /* =================================================
                   UPDATE
                   ================================================= */

                else {

                    const oldItem =
                        gallery.find(
                            item =>
                                item.id ===
                                galleryId.value
                        );


                    if (!oldItem) {

                        throw new Error(
                            "Photograph not found."
                        );

                    }


                    const newData = {

                        title:
                            titleInput.value.trim(),

                        year:
                            yearInput.value
                                ? Number(
                                    yearInput.value
                                )
                                : null,

                        image:
                            imageInput.value.trim(),

                        description:
                            descriptionInput.value.trim(),

                        category:
                            categoryInput.value.trim(),

                        updatedAt:
                            serverTimestamp()

                    };


                    /*
                       Find exactly what changed
                       before updating Firestore.
                    */

                    const changes =
                        getChangedFields(
                            oldItem,
                            newData
                        );


                    await updateDoc(
                        doc(
                            db,
                            "gallery",
                            galleryId.value
                        ),
                        newData
                    );


                    /*
                       STORE ACTIVITY
                    */

                    await logActivity({

                        action:
                            "updated",

                        collectionName:
                            "gallery",

                        documentId:
                            galleryId.value,

                        title:
                            newData.title ||
                            "Untitled Photograph",

                        details:
                            changes.length
                                ? formatChanges(
                                    changes
                                  )
                                : "Photograph saved without changing the main fields."

                    });


                    showMessage(
                        "Photograph updated successfully.",
                        "success"
                    );

                }


                resetForm();

                await loadGallery();

            }
            catch (error) {

                console.error(
                    "Gallery save error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to save photograph.",
                    "error"
                );

            }


            saveButton.disabled =
                false;


            saveButton.textContent =
                "Save Photograph";

        }
    );

}


/* =========================================================
   GET CHANGED FIELDS
   ========================================================= */

function getChangedFields(
    oldItem,
    newData
) {

    const changes = [];


    const fields = [

        "title",
        "year",
        "image",
        "description",
        "category"

    ];


    fields.forEach(
        field => {

            const oldValue =
                oldItem[field] ??
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


    return changes;

}


/* =========================================================
   FORMAT CHANGES
   ========================================================= */

function formatChanges(
    changes
) {

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
   CREATED DETAILS
   ========================================================= */

function buildCreatedDetails(
    id,
    data
) {

    const details = [];


    details.push(
        `Created photograph with ID ${id}.`
    );


    if (data.category) {

        details.push(
            `Category: ${data.category}.`
        );

    }


    if (data.year) {

        details.push(
            `Year: ${data.year}.`
        );

    }


    return details.join(
        " "
    );

}


/* =========================================================
   EDIT
   ========================================================= */

function editGallery(
    id
) {

    const item =
        gallery.find(
            value =>
                value.id ===
                id
        );


    if (!item) {

        return;

    }


    galleryId.value =
        item.id;


    titleInput.value =
        item.title ||
        "";


    yearInput.value =
        item.year ??
        "";


    imageInput.value =
        item.image ||
        "";


    descriptionInput.value =
        item.description ||
        "";


    categoryInput.value =
        item.category ||
        "";


    formTitle.textContent =
        "Edit Photograph";


    saveButton.textContent =
        "Update Photograph";


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   DELETE
   ========================================================= */

async function deleteGallery(
    id
) {

    const item =
        gallery.find(
            value =>
                value.id ===
                id
        );


    if (!item) {

        return;

    }


    const confirmed =
        window.confirm(
            `Delete "${
                item.title ||
                "this photograph"
            }"?`
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
                "gallery",
                id
            )
        );


        /*
           STORE ACTIVITY
        */

        await logActivity({

            action:
                "deleted",

            collectionName:
                "gallery",

            documentId:
                id,

            title:
                item.title ||
                "Untitled Photograph",

            details:
                buildDeletedDetails(
                    item
                )

        });


        showMessage(
            "Photograph deleted.",
            "success"
        );


        await loadGallery();

    }
    catch (error) {

        console.error(
            "Gallery delete error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to delete photograph.",
            "error"
        );

    }

}


/* =========================================================
   DELETED DETAILS
   ========================================================= */

function buildDeletedDetails(
    item
) {

    const details = [];


    details.push(
        `Deleted photograph ID ${item.id}.`
    );


    if (item.title) {

        details.push(
            `Title: ${item.title}.`
        );

    }


    if (item.category) {

        details.push(
            `Category: ${item.category}.`
        );

    }


    if (item.year) {

        details.push(
            `Year: ${item.year}.`
        );

    }


    return details.join(
        " "
    );

}


/* =========================================================
   RESET
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


    galleryId.value =
        "";


    formTitle.textContent =
        "Add Photograph";


    saveButton.textContent =
        "Save Photograph";

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
            /[_-]/g,
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
    "Roy Bari Gallery Admin loaded successfully."
);