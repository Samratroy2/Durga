/* =========================================================
   ROY BARI — PRIESTS ADMIN
   =========================================================

   FIRESTORE COLLECTION:
   priests

   FIELDS:
   - name
   - role
   - description
   - location
   - image
   - current
   - displayOrder
   - createdAt
   - updatedAt

   ACTIVITY HISTORY:
   activityLogs

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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

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
    document.getElementById("priestForm");


const priestId =
    document.getElementById("priestId");


const nameInput =
    document.getElementById("name");


const roleInput =
    document.getElementById("role");


const descriptionInput =
    document.getElementById("description");


const locationInput =
    document.getElementById("location");


const imageInput =
    document.getElementById("image");


const currentInput =
    document.getElementById("current");


const displayOrderInput =
    document.getElementById("displayOrder");


const imagePreview =
    document.getElementById("imagePreview");


const priestList =
    document.getElementById("priestList");


const priestCount =
    document.getElementById("priestCount");


const formTitle =
    document.getElementById("formTitle");


const saveButton =
    document.getElementById("saveButton");


const cancelButton =
    document.getElementById("cancelButton");


const message =
    document.getElementById("priestMessage");


const logoutButton =
    document.getElementById("logoutButton");


const adminEmail =
    document.getElementById("adminEmail");


const userAvatar =
    document.getElementById("userAvatar");


/* =========================================================
   DATA
   ========================================================= */

let priests = [];


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


        updateAdminUser(user);


        await loadPriests();

    }
);


/* =========================================================
   UPDATE ADMIN USER
   ========================================================= */

function updateAdminUser(user) {

    const email =
        user.email || "Admin";


    if (adminEmail) {

        adminEmail.textContent =
            email;

    }


    if (userAvatar) {

        userAvatar.textContent =
            email
                .charAt(0)
                .toUpperCase() || "A";

    }

}


/* =========================================================
   LOAD PRIESTS
   ========================================================= */

async function loadPriests() {

    if (!priestList) {
        return;
    }


    priestList.innerHTML = `
        <div class="loading-state">
            Loading priests...
        </div>
    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "priests"
                )
            );


        priests = [];


        snapshot.forEach(
            documentSnapshot => {

                priests.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        priests.sort(
            (a, b) => {

                const orderA =
                    Number(
                        a.displayOrder ?? 0
                    );

                const orderB =
                    Number(
                        b.displayOrder ?? 0
                    );


                if (orderA !== orderB) {

                    return orderA - orderB;

                }


                return String(
                    a.name || ""
                ).localeCompare(
                    String(
                        b.name || ""
                    )
                );

            }
        );


        updatePriestCount();

        renderPriests();


    } catch (error) {

        console.error(
            "Unable to load priests:",
            error
        );


        priestList.innerHTML = `
            <p class="message error">
                Unable to load priests.
            </p>
        `;


        if (priestCount) {

            priestCount.textContent =
                "0 priests";

        }

    }

}


/* =========================================================
   PRIEST COUNT
   ========================================================= */

function updatePriestCount() {

    if (!priestCount) {
        return;
    }


    const count =
        priests.length;


    priestCount.textContent =
        `${count} priest${count === 1 ? "" : "s"}`;

}


/* =========================================================
   RENDER PRIESTS
   ========================================================= */

function renderPriests() {

    if (!priestList) {
        return;
    }


    if (!priests.length) {

        priestList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    🪔
                </div>

                <h3>
                    No priests yet
                </h3>

                <p>
                    Add the first priest or purohit.
                </p>

            </div>
        `;

        return;

    }


    priestList.innerHTML = "";


    priests.forEach(
        priest => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "manager-item";


            const imageURL = priest.image
    ? convertGoogleDriveImage(priest.image)
    : "";

        const imageHTML = imageURL
            ? `
                <img
                    src="${escapeHtml(imageURL)}"
                    alt="${escapeHtml(
                        priest.name || "Priest"
                    )}"
                    loading="lazy"
                    class="priest-list-image"
                >
            `
            : `
                <div class="priest-no-image">
                    <i class="fa-solid fa-user-tie"></i>
                </div>
            `;


            const currentHTML =
                priest.current === true
                    ? `
                        <span class="current-tag">
                            <i class="fa-solid fa-circle-check"></i>
                            Current Priest
                        </span>
                    `
                    : `
                        <span class="inactive-tag">
                            Previous / Additional Priest
                        </span>
                    `;


            item.innerHTML = `

                <div class="manager-item-main">

                    <div class="manager-avatar">
                        ${imageHTML}
                    </div>


                    <div class="manager-item-content">

                        <h3>
                            ${escapeHtml(
                                priest.name ||
                                "Unnamed Priest"
                            )}
                        </h3>


                        ${
                            priest.role
                                ? `
                                    <span class="priest-role">
                                        ${escapeHtml(
                                            priest.role
                                        )}
                                    </span>
                                `
                                : ""
                        }


                        ${
                            priest.location
                                ? `
                                    <span class="priest-location">
                                        <i class="fa-solid fa-location-dot"></i>
                                        ${escapeHtml(
                                            priest.location
                                        )}
                                    </span>
                                `
                                : ""
                        }


                        ${
                            priest.description
                                ? `
                                    <span class="priest-description">
                                        ${escapeHtml(
                                            priest.description
                                        )}
                                    </span>
                                `
                                : ""
                        }


                        ${currentHTML}

                    </div>

                </div>


                <div class="manager-actions">

                    <button
                        type="button"
                        class="edit-button"
                        data-id="${escapeHtml(
                            priest.id
                        )}"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Edit
                    </button>


                    <button
                        type="button"
                        class="delete-button"
                        data-id="${escapeHtml(
                            priest.id
                        )}"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Delete
                    </button>

                </div>

            `;


            priestList.appendChild(
                item
            );

        }
    );


    attachPriestButtons();

}


/* =========================================================
   ATTACH BUTTONS
   ========================================================= */

function attachPriestButtons() {

    document
        .querySelectorAll(
            ".edit-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editPriest(
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

                        deletePriest(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   EDIT PRIEST
   ========================================================= */

function editPriest(id) {

    const priest =
        priests.find(
            item =>
                item.id === id
        );


    if (!priest) {

        showMessage(
            "Priest not found.",
            "error"
        );

        return;

    }


    priestId.value =
        priest.id || "";


    nameInput.value =
        priest.name || "";


    roleInput.value =
        priest.role || "";


    descriptionInput.value =
        priest.description ||
        priest.bio ||
        priest.story ||
        "";


    locationInput.value =
        priest.location || "";


    imageInput.value =
        priest.image ||
        priest.imageUrl ||
        priest.photo ||
        "";


    currentInput.checked =
        priest.current === true ||
        priest.isCurrent === true ||
        priest.status === "current";


    displayOrderInput.value =
        Number(
            priest.displayOrder ?? 0
        );


    formTitle.textContent =
        "Edit Priest";


    saveButton.textContent =
        "Update Priest";


    updateImagePreview();


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   SAVE PRIEST
   ========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    priestId.value
                        ? "Updating..."
                        : "Saving...";

            }


            try {

                /* =================================================
                   FORM VALUES
                   ================================================= */

                const name =
                    nameInput
                        ? nameInput.value.trim()
                        : "";


                const role =
                    roleInput
                        ? roleInput.value.trim()
                        : "";


                const description =
                    descriptionInput
                        ? descriptionInput.value.trim()
                        : "";


                const location =
                    locationInput
                        ? locationInput.value.trim()
                        : "";


                const image =
                    imageInput
                        ? imageInput.value.trim()
                        : "";


                const current =
                    currentInput
                        ? currentInput.checked
                        : false;


                const displayOrder =
                    displayOrderInput
                        ? Number(
                            displayOrderInput.value || 0
                        )
                        : 0;


                /* =================================================
                   VALIDATION
                   ================================================= */

                if (!name) {

                    showMessage(
                        "Please enter the priest's name.",
                        "error"
                    );

                    return;

                }


                if (!description) {

                    showMessage(
                        "Please enter a description or biography.",
                        "error"
                    );

                    return;

                }


                if (
                    image &&
                    !isValidImageUrl(image)
                ) {

                    showMessage(
                        "Please enter a valid image URL.",
                        "error"
                    );

                    return;

                }


                /* =================================================
                   UPDATE EXISTING PRIEST
                   ================================================= */

                if (
                    priestId &&
                    priestId.value
                ) {

                    const id =
                        priestId.value;


                    const existingPriest =
                        priests.find(
                            item =>
                                item.id === id
                        );


                    if (!existingPriest) {

                        throw new Error(
                            "Priest not found."
                        );

                    }


                    /*
                     * If this priest becomes current,
                     * remove current status from all other priests.
                     */

                    if (current) {

                        await unsetOtherCurrentPriests(
                            id
                        );

                    }


                    const newData = {

                        name,

                        role,

                        description,

                        location,

                        image,

                        current,

                        displayOrder,

                        updatedAt:
                            serverTimestamp()

                    };


                    const changes =
                        getChangedFields(
                            existingPriest,
                            {
                                name,
                                role,
                                description,
                                location,
                                image,
                                current,
                                displayOrder
                            }
                        );


                    await updateDoc(
                        doc(
                            db,
                            "priests",
                            id
                        ),
                        newData
                    );


                    await safeLogActivity({

                        action:
                            "updated",

                        collectionName:
                            "priests",

                        documentId:
                            id,

                        title:
                            name,

                        details:
                            formatChanges(
                                changes
                            )

                    });


                    showMessage(
                        "Priest updated successfully.",
                        "success"
                    );

                }


                /* =================================================
                   ADD NEW PRIEST
                   ================================================= */

                else {

                    /*
                     * If new priest is current,
                     * remove current from everyone else.
                     */

                    if (current) {

                        await unsetOtherCurrentPriests();

                    }


                    const data = {

                        name,

                        role,

                        description,

                        location,

                        image,

                        current,

                        displayOrder,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    };


                    const newPriest =
                        await addDoc(
                            collection(
                                db,
                                "priests"
                            ),
                            data
                        );


                    await safeLogActivity({

                        action:
                            "created",

                        collectionName:
                            "priests",

                        documentId:
                            newPriest.id,

                        title:
                            name,

                        details:
                            buildPriestDetails(
                                {
                                    name,
                                    role,
                                    description,
                                    location,
                                    image,
                                    current,
                                    displayOrder
                                }
                            )

                    });


                    showMessage(
                        "Priest added successfully.",
                        "success"
                    );

                }


                resetForm();


                await loadPriests();


            } catch (error) {

                console.error(
                    "Save priest error:",
                    error
                );


                showMessage(
                    getFirestoreErrorMessage(
                        error
                    ),
                    "error"
                );


            } finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "Save Priest";

                }

            }

        }
    );

}


/* =========================================================
   UNSET OTHER CURRENT PRIESTS
   ========================================================= */

async function unsetOtherCurrentPriests(
    exceptId = null
) {

    const snapshot =
        await getDocs(
            collection(
                db,
                "priests"
            )
        );


    const updates = [];


    snapshot.forEach(
        documentSnapshot => {

            const data =
                documentSnapshot.data();


            if (
                data.current === true &&
                documentSnapshot.id !== exceptId
            ) {

                updates.push(
                    updateDoc(
                        doc(
                            db,
                            "priests",
                            documentSnapshot.id
                        ),
                        {
                            current: false,
                            updatedAt:
                                serverTimestamp()
                        }
                    )
                );

            }

        }
    );


    if (updates.length) {

        await Promise.all(
            updates
        );

    }

}


/* =========================================================
   DELETE PRIEST
   ========================================================= */

async function deletePriest(id) {

    const priest =
        priests.find(
            item =>
                item.id === id
        );


    if (!priest) {

        showMessage(
            "Priest not found.",
            "error"
        );

        return;

    }


    const priestName =
        priest.name ||
        "this priest";


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${priestName}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "priests",
                id
            )
        );


        await safeLogActivity({

            action:
                "deleted",

            collectionName:
                "priests",

            documentId:
                id,

            title:
                priestName,

            details:
                `Deleted priest "${priestName}".`

        });


        showMessage(
            "Priest deleted successfully.",
            "success"
        );


        if (
            priestId &&
            priestId.value === id
        ) {

            resetForm();

        }


        await loadPriests();


    } catch (error) {

        console.error(
            "Delete priest error:",
            error
        );


        showMessage(
            getFirestoreErrorMessage(
                error
            ),
            "error"
        );

    }

}


/* =========================================================
   RESET FORM
   ========================================================= */

function resetForm() {

    if (form) {

        form.reset();

    }


    if (priestId) {

        priestId.value =
            "";

    }


    if (displayOrderInput) {

        displayOrderInput.value =
            "0";

    }


    if (formTitle) {

        formTitle.textContent =
            "Add Priest";

    }


    if (saveButton) {

        saveButton.textContent =
            "Save Priest";

    }


    if (imagePreview) {

        imagePreview.src =
            "";

        imagePreview.classList.remove(
            "visible"
        );

    }

}


/* =========================================================
   CANCEL BUTTON
   ========================================================= */

if (cancelButton) {

    cancelButton.addEventListener(
        "click",
        () => {

            resetForm();

            showMessage(
                "",
                ""
            );

        }
    );

}


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

if (imageInput) {

    imageInput.addEventListener(
        "input",
        updateImagePreview
    );

}


function updateImagePreview() {

    if (
        !imagePreview ||
        !imageInput
    ) {

        return;

    }


    const url =
        imageInput.value.trim();


    if (!url) {

        imagePreview.src =
            "";

        imagePreview.classList.remove(
            "visible"
        );

        return;

    }


    const converted =
        convertGoogleDriveImage(
            url
        );


    imagePreview.src =
        converted;


    imagePreview.classList.add(
        "visible"
    );


    imagePreview.onerror =
        () => {

            imagePreview.classList.remove(
                "visible"
            );

        };

}


/* =========================================================
   GOOGLE DRIVE IMAGE CONVERTER
   ========================================================= */
function convertGoogleDriveImage(url) {

    if (!url) {
        return "";
    }

    url = url.trim();

    /*
     * Google Drive:
     * /file/d/FILE_ID/view
     */
    const fileMatch = url.match(
        /drive\.google\.com\/file\/d\/([^/]+)/
    );

    if (fileMatch) {

        const fileId = fileMatch[1];

        return (
            "https://drive.google.com/thumbnail?id=" +
            fileId +
            "&sz=w1000"
        );
    }

    /*
     * Google Drive:
     * open?id=FILE_ID
     */

    try {

        const parsedURL = new URL(url);

        if (
            parsedURL.hostname.includes(
                "drive.google.com"
            )
        ) {

            const fileId =
                parsedURL.searchParams.get("id");

            if (fileId) {

                return (
                    "https://drive.google.com/thumbnail?id=" +
                    fileId +
                    "&sz=w1000"
                );

            }

        }

    } catch (error) {

        console.warn(
            "Invalid image URL:",
            url
        );

    }

    /*
     * Normal image URL
     */

    return url;
}

/* =========================================================
   IMAGE URL VALIDATION
   ========================================================= */

function isValidImageUrl(
    value
) {

    try {

        const url =
            new URL(
                convertGoogleDriveImage(
                    value
                )
            );


        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );

    } catch {

        return false;

    }

}


/* =========================================================
   GET CHANGED FIELDS
   ========================================================= */

function getChangedFields(
    oldData,
    newData
) {

    const changes = [];


    compareField(
        changes,
        "name",
        oldData.name || "",
        newData.name || ""
    );


    compareField(
        changes,
        "role",
        oldData.role || "",
        newData.role || ""
    );


    compareField(
        changes,
        "description",
        oldData.description ||
            oldData.bio ||
            oldData.story ||
            "",
        newData.description || ""
    );


    compareField(
        changes,
        "location",
        oldData.location || "",
        newData.location || ""
    );


    compareField(
        changes,
        "image",
        oldData.image ||
            oldData.imageUrl ||
            oldData.photo ||
            "",
        newData.image || ""
    );


    compareField(
        changes,
        "current",
        oldData.current === true,
        newData.current === true
    );


    compareField(
        changes,
        "displayOrder",
        Number(
            oldData.displayOrder ?? 0
        ),
        Number(
            newData.displayOrder ?? 0
        )
    );


    return changes;

}


/* =========================================================
   COMPARE FIELD
   ========================================================= */

function compareField(
    changes,
    field,
    oldValue,
    newValue
) {

    if (
        String(oldValue) !==
        String(newValue)
    ) {

        changes.push({

            field,

            oldValue,

            newValue

        });

    }

}


/* =========================================================
   FORMAT CHANGES
   ========================================================= */

function formatChanges(
    changes
) {

    if (
        !changes ||
        !changes.length
    ) {

        return "Priest information updated.";

    }


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


                return (
                    `${field}: "${oldValue}" → "${newValue}"`
                );

            }
        )
        .join(
            " | "
        );

}


/* =========================================================
   BUILD PRIEST DETAILS
   ========================================================= */

function buildPriestDetails(
    data
) {

    const details = [];


    if (data.role) {

        details.push(
            `Role: ${data.role}`
        );

    }


    if (data.location) {

        details.push(
            `Location: ${data.location}`
        );

    }


    if (data.current) {

        details.push(
            "Marked as current priest"
        );

    }


    if (
        Number(
            data.displayOrder
        ) > 0
    ) {

        details.push(
            `Display order: ${data.displayOrder}`
        );

    }


    return (
        details.length
            ? details.join(" | ")
            : "Priest profile created."
    );

}


/* =========================================================
   SAFE ACTIVITY LOGGER
   ========================================================= */

async function safeLogActivity(
    data
) {

    try {

        await logActivity(
            data
        );

    } catch (error) {

        /*
         * Activity logging should never
         * prevent the actual CRUD operation.
         */

        console.warn(
            "Activity logging failed:",
            error
        );

    }

}


/* =========================================================
   FORMAT FIELD NAME
   ========================================================= */

function formatFieldName(
    field
) {

    return String(
        field
    )

        .replace(
            /([A-Z])/g,
            " $1"
        )

        .replace(
            /[\_-]/g,
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
   FIRESTORE ERROR MESSAGE
   ========================================================= */

function getFirestoreErrorMessage(
    error
) {

    if (!error) {

        return "Something went wrong.";

    }


    switch (
        error.code
    ) {

        case "permission-denied":

            return (
                "Permission denied. Check your Firebase security rules."
            );


        case "unauthenticated":

            return (
                "Your admin session has expired. Please login again."
            );


        case "network-request-failed":

            return (
                "Network error. Please check your internet connection."
            );


        default:

            return (
                error.message ||
                "Unable to complete the operation."
            );

    }

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
        type
            ? `message ${type}`
            : "message";


    if (!text) {
        return;
    }


    window.setTimeout(
        () => {

            if (
                message.textContent ===
                text
            ) {

                message.textContent =
                    "";

                message.className =
                    "message";

            }

        },
        5000
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
   DEBUG HELPERS
   ========================================================= */

window.reloadRoyBariPriests =
    loadPriests;


window.resetRoyBariPriestForm =
    resetForm;