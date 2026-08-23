/* =========================================================
   ROY BARI — ARCHIVE ADMIN
   FIRESTORE: archive
   ACTIVITY LOG: activityLogs
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
   ELEMENTS
   ========================================================= */

const form =
    document.getElementById("archiveForm");


const archiveId =
    document.getElementById("archiveId");


const titleInput =
    document.getElementById("title");


const yearInput =
    document.getElementById("year");


const eraInput =
    document.getElementById("era");


const typeInput =
    document.getElementById("type");


const descriptionInput =
    document.getElementById("description");


const archiveList =
    document.getElementById("archiveList");


const archiveCount =
    document.getElementById("archiveCount");


const formTitle =
    document.getElementById("formTitle");


const saveButton =
    document.getElementById("saveButton");


const cancelButton =
    document.getElementById("cancelButton");


const message =
    document.getElementById("archiveMessage");


const logoutButton =
    document.getElementById("logoutButton");


const adminEmail =
    document.getElementById("adminEmail");


/* =========================================================
   DATA
   ========================================================= */

let archives = [];


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
                user.email || "Admin";

        }


        await loadArchive();

    }
);


/* =========================================================
   LOAD ARCHIVE
   ========================================================= */

async function loadArchive() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "archive"
                )
            );


        archives = [];


        snapshot.forEach(
            item => {

                archives.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


        /* =================================================
           SORT
           ================================================= */

        archives.sort(
            (a, b) =>
                Number(
                    b.year || 0
                ) -
                Number(
                    a.year || 0
                )
        );


        /* =================================================
           COUNT
           ================================================= */

        archiveCount.textContent =
            `${archives.length} entr${
                archives.length === 1
                    ? "y"
                    : "ies"
            }`;


        /* =================================================
           RENDER
           ================================================= */

        renderArchive();


    } catch (error) {

        console.error(
            "Archive loading error:",
            error
        );


        archiveList.innerHTML =
            `
            <p class="message error">
                Unable to load archive.
            </p>
            `;

    }

}


/* =========================================================
   RENDER ARCHIVE
   ========================================================= */

function renderArchive() {

    if (!archives.length) {

        archiveList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📜
                </div>

                <h3>
                    No archive entries yet
                </h3>

                <p>
                    Add the first historical record.
                </p>

            </div>
        `;

        return;
    }


    archiveList.innerHTML = "";


    archives.forEach(
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
                        📜
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
                                item.era || ""
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
                        class="edit-button"
                        data-id="${escapeHtml(
                            item.id
                        )}"
                    >
                        Edit
                    </button>

                    <button
                        class="delete-button"
                        data-id="${escapeHtml(
                            item.id
                        )}"
                    >
                        Delete
                    </button>

                </div>

            `;


            archiveList.appendChild(
                card
            );

        }
    );


    /* =====================================================
       EDIT BUTTONS
       ===================================================== */

    document
        .querySelectorAll(
            ".edit-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editArchive(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    /* =====================================================
       DELETE BUTTONS
       ===================================================== */

    document
        .querySelectorAll(
            ".delete-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteArchive(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   SAVE ARCHIVE
   ========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        /* =================================================
           VALIDATION
           ================================================= */

        const title =
            titleInput.value.trim();


        if (!title) {

            showMessage(
                "Archive title is required.",
                "error"
            );

            titleInput.focus();

            return;

        }


        /* =================================================
           DISABLE BUTTON
           ================================================= */

        saveButton.disabled =
            true;


        saveButton.textContent =
            archiveId.value
                ? "Updating..."
                : "Saving...";


        try {

            /* =============================================
               ARCHIVE DATA
               ============================================= */

            const data = {

                title:
                    title,

                description:
                    descriptionInput.value.trim(),

                era:
                    eraInput.value.trim(),

                type:
                    typeInput.value.trim(),

                year:
                    yearInput.value
                        ? Number(
                            yearInput.value
                        )
                        : null,

                updatedAt:
                    serverTimestamp()

            };


            /* =================================================
               UPDATE EXISTING ARCHIVE
               ================================================= */

            if (archiveId.value) {

                const currentId =
                    archiveId.value;


                await updateDoc(
                    doc(
                        db,
                        "archive",
                        currentId
                    ),
                    data
                );


                /* =============================================
                   ACTIVITY LOG — UPDATE
                   ============================================= */

                await logActivity({

                    action:
                        "updated",

                    collectionName:
                        "archive",

                    documentId:
                        currentId,

                    title:
                        title,

                    details:
                        `Archive entry "${title}" was updated.`

                });


                showMessage(
                    "Archive updated successfully.",
                    "success"
                );

            }


            /* =================================================
               CREATE NEW ARCHIVE
               ================================================= */

            else {

                data.createdAt =
                    serverTimestamp();


                const archiveReference =
                    await addDoc(
                        collection(
                            db,
                            "archive"
                        ),
                        data
                    );


                /* =============================================
                   ACTIVITY LOG — CREATE
                   ============================================= */

                await logActivity({

                    action:
                        "created",

                    collectionName:
                        "archive",

                    documentId:
                        archiveReference.id,

                    title:
                        title,

                    details:
                        `Archive entry "${title}" was created.`

                });


                showMessage(
                    "Archive added successfully.",
                    "success"
                );

            }


            /* =================================================
               RESET
               ================================================= */

            resetForm();


            /* =================================================
               RELOAD
               ================================================= */

            await loadArchive();


        } catch (error) {

            console.error(
                "Archive save error:",
                error
            );


            showMessage(
                "Unable to save archive.",
                "error"
            );

        }


        /* =================================================
           RESTORE BUTTON
           ================================================= */

        saveButton.disabled =
            false;


        saveButton.textContent =
            "Save Archive";

    }
);


/* =========================================================
   EDIT ARCHIVE
   ========================================================= */

function editArchive(id) {

    const item =
        archives.find(
            value =>
                value.id === id
        );


    if (!item) {

        console.error(
            "Archive not found:",
            id
        );

        return;

    }


    archiveId.value =
        item.id;


    titleInput.value =
        item.title || "";


    yearInput.value =
        item.year ?? "";


    eraInput.value =
        item.era || "";


    typeInput.value =
        item.type || "";


    descriptionInput.value =
        item.description || "";


    formTitle.textContent =
        "Edit Archive";


    saveButton.textContent =
        "Update Archive";


    window.scrollTo({

        top:
            0,

        behavior:
            "smooth"

    });

}


/* =========================================================
   DELETE ARCHIVE
   ========================================================= */

async function deleteArchive(id) {

    const item =
        archives.find(
            value =>
                value.id === id
        );


    if (!item) {

        return;

    }


    const title =
        item.title ||
        "this archive";


    if (
        !confirm(
            `Delete "${title}"?`
        )
    ) {

        return;

    }


    try {

        /* =================================================
           DELETE FROM ARCHIVE
           ================================================= */

        await deleteDoc(
            doc(
                db,
                "archive",
                id
            )
        );


        /* =================================================
           ACTIVITY LOG — DELETE
           ================================================= */

        await logActivity({

            action:
                "deleted",

            collectionName:
                "archive",

            documentId:
                id,

            title:
                title,

            details:
                `Archive entry "${title}" was deleted.`

        });


        showMessage(
            "Archive deleted.",
            "success"
        );


        /* =================================================
           RELOAD
           ================================================= */

        await loadArchive();


    } catch (error) {

        console.error(
            "Archive delete error:",
            error
        );


        showMessage(
            "Unable to delete archive.",
            "error"
        );

    }

}


/* =========================================================
   RESET FORM
   ========================================================= */

cancelButton.addEventListener(
    "click",
    resetForm
);


function resetForm() {

    form.reset();


    archiveId.value =
        "";


    formTitle.textContent =
        "Add Archive";


    saveButton.textContent =
        "Save Archive";

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    text,
    type
) {

    message.textContent =
        text;


    message.className =
        `message ${type}`;


    /* =====================================================
       AUTOMATICALLY CLEAR MESSAGE
       ===================================================== */

    setTimeout(
        () => {

            message.textContent =
                "";

            message.className =
                "message";

        },
        4000
    );

}


/* =========================================================
   LOGOUT
   ========================================================= */

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(
                auth
            );


            window.location.replace(
                "./index.html"
            );

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

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