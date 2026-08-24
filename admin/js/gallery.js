/* =========================================================
   ROY BARI — GALLERY + VIDEOS ADMIN
   FIRESTORE:
   gallery
   videos

   ACTIVITY:
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

const categoryGroup =
    document.getElementById("categoryGroup");

const galleryList =
    document.getElementById("galleryList");

const galleryCount =
    document.getElementById("galleryCount");

const formTitle =
    document.getElementById("formTitle");

const formEyebrow =
    document.getElementById("formEyebrow");

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

const userAvatar =
    document.getElementById("userAvatar");

const galleryTab =
    document.getElementById("galleryTab");

const videosTab =
    document.getElementById("videosTab");

const pageTitle =
    document.getElementById("pageTitle");

const pageDescription =
    document.getElementById("pageDescription");

const listTitle =
    document.getElementById("listTitle");

const linkLabel =
    document.getElementById("linkLabel");

const linkHelp =
    document.getElementById("linkHelp");


/* =========================================================
   DATA
   ========================================================= */

let items = [];


/*
   Current Firestore collection.

   Default:
   gallery
*/

let currentCollection =
    "gallery";


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


        if (adminEmail) {

            adminEmail.textContent =
                user.email ||
                "Admin";

        }


        if (userAvatar) {

            userAvatar.textContent =
                (
                    user.email ||
                    "A"
                )
                    .charAt(0)
                    .toUpperCase();

        }


        await loadItems();

    }
);


/* =========================================================
   SWITCH COLLECTION — GALLERY
   ========================================================= */

if (galleryTab) {

    galleryTab.addEventListener(
        "click",
        async () => {

            if (
                currentCollection ===
                "gallery"
            ) {

                return;

            }


            currentCollection =
                "gallery";


            updatePageMode();


            resetForm();


            await loadItems();

        }
    );

}


/* =========================================================
   SWITCH COLLECTION — VIDEOS
   ========================================================= */

if (videosTab) {

    videosTab.addEventListener(
        "click",
        async () => {

            if (
                currentCollection ===
                "videos"
            ) {

                return;

            }


            currentCollection =
                "videos";


            updatePageMode();


            resetForm();


            await loadItems();

        }
    );

}


/* =========================================================
   UPDATE PAGE MODE
   ========================================================= */

function updatePageMode() {

    const isGallery =
        currentCollection ===
        "gallery";


    /* =====================================================
       TABS
       ===================================================== */

    if (galleryTab) {

        galleryTab.classList.toggle(
            "active",
            isGallery
        );

    }


    if (videosTab) {

        videosTab.classList.toggle(
            "active",
            !isGallery
        );

    }


    /* =====================================================
       PAGE TITLE
       ===================================================== */

    if (pageTitle) {

        pageTitle.textContent =
            isGallery
                ? "Gallery"
                : "Videos";

    }


    if (pageDescription) {

        pageDescription.textContent =
            isGallery
                ? "Manage photographs and visual memories."
                : "Manage family videos and visual memories.";

    }


    /* =====================================================
       FORM
       ===================================================== */

    if (formEyebrow) {

        formEyebrow.textContent =
            isGallery
                ? "PHOTO"
                : "VIDEO";

    }


    if (formTitle) {

        formTitle.textContent =
            isGallery
                ? "Add Photograph"
                : "Add Video";

    }


    if (linkLabel) {

        linkLabel.textContent =
            isGallery
                ? "Image URL *"
                : "Video URL *";

    }


    if (imageInput) {

        imageInput.placeholder =
            isGallery
                ? "https://drive.google.com/..."
                : "https://drive.google.com/...";

    }


    if (linkHelp) {

        linkHelp.textContent =
            isGallery
                ? "Google Drive image links are supported."
                : "Google Drive video links are supported.";

    }


    /* =====================================================
       CATEGORY
       ===================================================== */

    if (categoryGroup) {

        categoryGroup.style.display =
            isGallery
                ? "flex"
                : "none";

    }


    /* =====================================================
       LIST TITLE
       ===================================================== */

    if (listTitle) {

        listTitle.textContent =
            isGallery
                ? "Gallery"
                : "Videos";

    }


    updateCount();

}


/* =========================================================
   LOAD CURRENT COLLECTION
   ========================================================= */

async function loadItems() {

    if (galleryList) {

        galleryList.innerHTML = `

            <div class="gallery-loading">
                Loading ${currentCollection === "gallery"
                    ? "gallery"
                    : "videos"}...
            </div>

        `;

    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    currentCollection
                )
            );


        items = [];


        snapshot.forEach(
            item => {

                items.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


        updateCount();


        renderItems();

    }
    catch (error) {

        console.error(
            "Collection loading error:",
            error
        );


        if (galleryList) {

            galleryList.innerHTML = `

                <p class="message error">
                    Unable to load ${
                        currentCollection === "gallery"
                            ? "gallery"
                            : "videos"
                    }.
                </p>

            `;

        }

    }

}


/* =========================================================
   UPDATE COUNT
   ========================================================= */

function updateCount() {

    if (!galleryCount) {

        return;

    }


    const count =
        items.length;


    const label =
        currentCollection ===
        "gallery"
            ? "photo"
            : "video";


    galleryCount.textContent =
        `${count} ${label}${count === 1 ? "" : "s"}`;

}


/* =========================================================
   GOOGLE DRIVE URL CONVERTER
   ========================================================= */

function convertGoogleDriveUrl(
    url
) {

    if (!url) {

        return "";

    }


    const value =
        String(url).trim();


    /*
       Google Drive file URL

       Example:

       https://drive.google.com/file/d/FILE_ID/view
    */

    const fileMatch =
        value.match(
            /drive\.google\.com\/file\/d\/([^/]+)/
        );


    if (
        fileMatch &&
        fileMatch[1]
    ) {

        const fileId =
            fileMatch[1];


        return (
            "https://drive.google.com/thumbnail" +
            `?id=${fileId}&sz=w800`
        );

    }


    /*
       Google Drive open URL

       Example:

       https://drive.google.com/open?id=FILE_ID
    */

    try {

        const parsed =
            new URL(value);


        const id =
            parsed.searchParams.get(
                "id"
            );


        if (
            id &&
            value.includes(
                "drive.google.com"
            )
        ) {

            return (
                "https://drive.google.com/thumbnail" +
                `?id=${id}&sz=w800`
            );

        }

    }
    catch (error) {

        console.warn(
            "Invalid URL:",
            value
        );

    }


    /*
       Normal URL
    */

    return value;

}


/* =========================================================
   RENDER ITEMS
   ========================================================= */

function renderItems() {

    if (!galleryList) {

        return;

    }


    if (!items.length) {

        const isGallery =
            currentCollection ===
            "gallery";


        galleryList.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">

                    ${
                        isGallery
                            ? "📷"
                            : "🎬"
                    }

                </div>

                <h3>

                    ${
                        isGallery
                            ? "No photographs yet"
                            : "No videos yet"
                    }

                </h3>

                <p>

                    ${
                        isGallery
                            ? "Add the first photograph."
                            : "Add the first video."
                    }

                </p>

            </div>

        `;

        return;

    }


    galleryList.innerHTML =
        "";


    items.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "manager-item";


            const originalUrl =
                item.link ||
                item.image ||
                "";


            /*
               GALLERY
            */

            let mediaHTML = "";


            if (
                currentCollection ===
                "gallery"
            ) {

                const imageUrl =
                    convertGoogleDriveUrl(
                        originalUrl
                    );


                if (imageUrl) {

                    mediaHTML = `

                        <div
                            class="manager-avatar gallery-thumbnail"
                            title="Gallery photograph"
                        >

                            <img
                                src="${escapeHtml(
                                    imageUrl
                                )}"
                                alt="${escapeHtml(
                                    item.title ||
                                    "Photograph"
                                )}"
                                loading="lazy"
                                onerror="
                                    this.onerror=null;
                                    this.style.display='none';
                                    this.parentElement.innerHTML='<span>📷</span>';
                                "
                            >

                        </div>

                    `;

                }
                else {

                    mediaHTML = `

                        <div
                            class="manager-avatar gallery-thumbnail"
                            title="Gallery photograph"
                        >

                            <span>
                                📷
                            </span>

                        </div>

                    `;

                }

            }


            /*
            VIDEOS
            Show Google Drive video thumbnail
            */

            else {

                const videoThumbnail =
                    convertGoogleDriveUrl(
                        originalUrl
                    );


                if (videoThumbnail) {

                    mediaHTML = `

                        <div
                            class="manager-avatar gallery-thumbnail video-thumbnail"
                            title="Video thumbnail"
                        >

                            <img
                                src="${escapeHtml(
                                    videoThumbnail
                                )}"
                                alt="${escapeHtml(
                                    item.title ||
                                    "Video"
                                )}"
                                loading="lazy"
                                onerror="
                                    this.onerror=null;
                                    this.style.display='none';
                                    this.parentElement.innerHTML='<span><i class=&quot;fa-solid fa-video&quot;></i></span>';
                                "
                            >

                        </div>

                    `;

                }

                else {

                    mediaHTML = `

                        <div
                            class="manager-avatar gallery-thumbnail video-thumbnail"
                            title="Video"
                        >

                            <span>
                                <i class="fa-solid fa-video"></i>
                            </span>

                        </div>

                    `;

                }

            }


            /*
               CATEGORY / YEAR
            */

            let metaText = "";


            if (
                currentCollection ===
                "gallery"
            ) {

                if (item.category) {

                    metaText =
                        escapeHtml(
                            item.category
                        );

                }


                if (item.year) {

                    metaText +=
                        metaText
                            ? " · " +
                              escapeHtml(
                                  item.year
                              )
                            : escapeHtml(
                                item.year
                            );

                }

            }
            else {

                if (item.year) {

                    metaText =
                        escapeHtml(
                            item.year
                        );

                }

            }


            card.innerHTML = `

                <div class="manager-item-main">


                    ${mediaHTML}


                    <div>

                        <h3>

                            ${escapeHtml(
                                item.title ||
                                (
                                    currentCollection ===
                                    "gallery"
                                        ? "Untitled Photograph"
                                        : "Untitled Video"
                                )
                            )}

                        </h3>


                        <span>

                            ${metaText}

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


    attachButtons();

}


/* =========================================================
   BUTTON EVENTS
   ========================================================= */

function attachButtons() {


    document
        .querySelectorAll(
            ".edit-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editItem(
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

                        deleteItem(
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


            const isGallery =
                currentCollection ===
                "gallery";


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    galleryId.value
                        ? (
                            isGallery
                                ? "Updating..."
                                : "Updating..."
                          )
                        : (
                            isGallery
                                ? "Saving..."
                                : "Saving..."
                          );

            }


            try {

                /*
                   ADD
                */

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

                        link:
                            imageInput.value.trim(),

                        description:
                            descriptionInput.value.trim(),

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    };


                    /*
                       Gallery has image + category.

                       Videos only use link.
                    */

                    if (isGallery) {

                        data.image =
                            imageInput.value.trim();

                        data.category =
                            categoryInput.value.trim();

                    }


                    const newDocument =
                        await addDoc(
                            collection(
                                db,
                                currentCollection
                            ),
                            data
                        );


                    await logActivity({

                        action:
                            "created",

                        collectionName:
                            currentCollection,

                        documentId:
                            newDocument.id,

                        title:
                            data.title ||
                            (
                                isGallery
                                    ? "Untitled Photograph"
                                    : "Untitled Video"
                            ),

                        details:
                            buildCreatedDetails(
                                newDocument.id,
                                data
                            )

                    });


                    showMessage(
                        isGallery
                            ? "Photograph added successfully."
                            : "Video added successfully.",
                        "success"
                    );

                }


                /*
                   UPDATE
                */

                else {

                    const oldItem =
                        items.find(
                            item =>
                                item.id ===
                                galleryId.value
                        );


                    if (!oldItem) {

                        throw new Error(
                            isGallery
                                ? "Photograph not found."
                                : "Video not found."
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

                        link:
                            imageInput.value.trim(),

                        description:
                            descriptionInput.value.trim(),

                        updatedAt:
                            serverTimestamp()

                    };


                    if (isGallery) {

                        newData.image =
                            imageInput.value.trim();

                        newData.category =
                            categoryInput.value.trim();

                    }


                    const changes =
                        getChangedFields(
                            oldItem,
                            newData
                        );


                    await updateDoc(
                        doc(
                            db,
                            currentCollection,
                            galleryId.value
                        ),
                        newData
                    );


                    await logActivity({

                        action:
                            "updated",

                        collectionName:
                            currentCollection,

                        documentId:
                            galleryId.value,

                        title:
                            newData.title ||
                            (
                                isGallery
                                    ? "Untitled Photograph"
                                    : "Untitled Video"
                            ),

                        details:
                            changes.length
                                ? formatChanges(
                                    changes
                                  )
                                : (
                                    isGallery
                                        ? "Photograph saved without changing the main fields."
                                        : "Video saved without changing the main fields."
                                  )

                    });


                    showMessage(
                        isGallery
                            ? "Photograph updated successfully."
                            : "Video updated successfully.",
                        "success"
                    );

                }


                resetForm();


                await loadItems();

            }
            catch (error) {

                console.error(
                    "Save error:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to save item.",
                    "error"
                );

            }


            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    currentCollection ===
                    "gallery"
                        ? "Save Photograph"
                        : "Save Video";

            }

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


    const fields =
        currentCollection ===
        "gallery"

            ? [
                "title",
                "year",
                "link",
                "image",
                "description",
                "category"
            ]

            : [
                "title",
                "year",
                "link",
                "description"
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
   CREATED DETAILS
   ========================================================= */

function buildCreatedDetails(
    id,
    data
) {

    const details = [];


    details.push(
        `Created ${
            currentCollection === "gallery"
                ? "photograph"
                : "video"
        } with ID ${id}.`
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
   EDIT ITEM
   ========================================================= */

function editItem(
    id
) {

    const item =
        items.find(
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


    /*
       Gallery:
       link first, image second.

       Videos:
       link.
    */

    imageInput.value =
        item.link ||
        item.image ||
        "";


    descriptionInput.value =
        item.description ||
        "";


    categoryInput.value =
        item.category ||
        "";


    const isGallery =
        currentCollection ===
        "gallery";


    if (formTitle) {

        formTitle.textContent =
            isGallery
                ? "Edit Photograph"
                : "Edit Video";

    }


    if (saveButton) {

        saveButton.textContent =
            isGallery
                ? "Update Photograph"
                : "Update Video";

    }


    if (categoryGroup) {

        categoryGroup.style.display =
            isGallery
                ? "flex"
                : "none";

    }


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   DELETE ITEM
   ========================================================= */

async function deleteItem(
    id
) {

    const item =
        items.find(
            value =>
                value.id ===
                id
        );


    if (!item) {

        return;

    }


    const isGallery =
        currentCollection ===
        "gallery";


    const itemName =
        item.title ||
        (
            isGallery
                ? "this photograph"
                : "this video"
        );


    const confirmed =
        window.confirm(
            `Delete "${itemName}"?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                currentCollection,
                id
            )
        );


        await logActivity({

            action:
                "deleted",

            collectionName:
                currentCollection,

            documentId:
                id,

            title:
                item.title ||
                (
                    isGallery
                        ? "Untitled Photograph"
                        : "Untitled Video"
                ),

            details:
                buildDeletedDetails(
                    item
                )

        });


        showMessage(
            isGallery
                ? "Photograph deleted."
                : "Video deleted.",
            "success"
        );


        await loadItems();

    }
    catch (error) {

        console.error(
            "Delete error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to delete item.",
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
        `Deleted ${
            currentCollection ===
            "gallery"
                ? "photograph"
                : "video"
        } ID ${item.id}.`
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
   RESET FORM
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


    if (galleryId) {

        galleryId.value =
            "";

    }


    const isGallery =
        currentCollection ===
        "gallery";


    if (formTitle) {

        formTitle.textContent =
            isGallery
                ? "Add Photograph"
                : "Add Video";

    }


    if (formEyebrow) {

        formEyebrow.textContent =
            isGallery
                ? "PHOTO"
                : "VIDEO";

    }


    if (saveButton) {

        saveButton.textContent =
            isGallery
                ? "Save Photograph"
                : "Save Video";

    }


    if (categoryGroup) {

        categoryGroup.style.display =
            isGallery
                ? "flex"
                : "none";

    }


    if (message) {

        message.textContent =
            "";

        message.className =
            "message";

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
            /[\\_-]/g,
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

updatePageMode();


console.log(
    "Roy Bari Gallery + Videos Admin loaded successfully."
);