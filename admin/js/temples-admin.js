/* =========================================================
   ROY BARI — ADMIN RELATED TEMPLES
   Firebase / Firestore CRUD
   ========================================================= */

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { db } from "../firebase.js";


/* =========================================================
   ELEMENTS
   ========================================================= */

const form = document.getElementById("templeForm");

const formTitle = document.getElementById("formTitle");

const nameInput = document.getElementById("templeName");

const descriptionInput =
    document.getElementById("templeDescription");

const imageUrlInput =
    document.getElementById("templeImageUrl");

const mapUrlInput =
    document.getElementById("templeMapUrl");

const orderInput =
    document.getElementById("templeOrder");

const activeInput =
    document.getElementById("templeActive");

const message =
    document.getElementById("templeMessage");

const list =
    document.getElementById("templeList");

const count =
    document.getElementById("templeCount");

const saveButton =
    document.getElementById("saveTempleButton");

const cancelButton =
    document.getElementById("cancelEditButton");

const imagePreview =
    document.getElementById("imagePreview");

const adminEmail =
    document.getElementById("adminEmail");

const logoutButton =
    document.getElementById("logoutButton");


/* =========================================================
   STATE
   ========================================================= */

/*
 * null = Add mode
 *
 * Firestore document ID = Edit mode
 */

let editingTempleId = null;

let temples = [];


/* =========================================================
   GOOGLE DRIVE IMAGE URL
   ========================================================= */

function getDriveImageUrl(url) {

    if (!url) {
        return "";
    }

    url = String(url).trim();


    /*
     * Google Drive sharing URL
     *
     * https://drive.google.com/file/d/FILE_ID/view
     */

    const fileMatch =
        url.match(
            /drive\.google\.com\/file\/d\/([^/]+)/
        );


    if (fileMatch && fileMatch[1]) {

        const fileId =
            fileMatch[1];

        return (
            "https://drive.google.com/thumbnail" +
            "?id=" +
            encodeURIComponent(fileId) +
            "&sz=w1200"
        );
    }


    /*
     * Google Drive open URL
     *
     * https://drive.google.com/open?id=FILE_ID
     */

    const openMatch =
        url.match(
            /[?&]id=([^&]+)/
        );


    if (
        url.includes("drive.google.com") &&
        openMatch &&
        openMatch[1]
    ) {

        const fileId =
            openMatch[1];

        return (
            "https://drive.google.com/thumbnail" +
            "?id=" +
            encodeURIComponent(fileId) +
            "&sz=w1200"
        );
    }


    /*
     * Already a Google Drive thumbnail URL
     */

    if (
        url.includes(
            "drive.google.com/thumbnail"
        )
    ) {

        return url;
    }


    /*
     * Normal image URL
     */

    return url;
}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    text,
    type = "info"
) {

    if (!message) {
        return;
    }

    message.textContent =
        text;

    message.className =
        `message-${type}`;
}


/* =========================================================
   LOAD TEMPLES
   ========================================================= */

async function loadTemples() {

    try {

        list.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="temple-loading"
                >
                    Loading temples...
                </td>
            </tr>
        `;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "temples"
                )
            );


        temples = [];


        snapshot.forEach(
            (documentSnapshot) => {

                temples.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        /*
         * Sort by display order
         */

        temples.sort(
            (a, b) => {

                const orderA =
                    Number(
                        a.order || 999999
                    );

                const orderB =
                    Number(
                        b.order || 999999
                    );

                return orderA - orderB;

            }
        );


        renderTempleList();


        console.log(
            "Admin temple documents:",
            temples.length
        );


        showMessage(
            "Temples loaded successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "LOAD TEMPLES ERROR:",
            error
        );


        list.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="temple-loading"
                >
                    Failed to load temples.
                </td>
            </tr>
        `;


        showMessage(
            "Failed to load temples. Check Firebase permissions.",
            "error"
        );

    }

}


/* =========================================================
   RENDER TEMPLE LIST
   ========================================================= */
function renderTempleList() {

    if (!temples || temples.length === 0) {

        list.innerHTML = `
            <tr>
                <td colspan="6" class="temple-empty">
                    No temples added yet.
                </td>
            </tr>
        `;

        count.textContent = "0 temples";

        return;
    }


    count.textContent =
        `${temples.length} ${
            temples.length === 1
                ? "temple"
                : "temples"
        }`;

    list.innerHTML = "";


    temples.forEach((temple) => {

        const row = document.createElement("tr");


        /* =====================================================
           IMAGE
           ===================================================== */

        const imageCell = document.createElement("td");

        const imageWrapper =
            document.createElement("div");

        imageWrapper.className =
            "temple-table-image";


        if (
            temple.imageUrl &&
            String(temple.imageUrl).trim() !== ""
        ) {

            const image =
                document.createElement("img");

            image.src =
                getDriveImageUrl(
                    temple.imageUrl
                );

            image.alt =
                temple.name || "Temple";

            image.onerror = () => {

                image.remove();

                imageWrapper.innerHTML = `
                    <span class="temple-table-symbol">
                        ॐ
                    </span>
                `;
            };

            imageWrapper.appendChild(image);

        } else {

            imageWrapper.innerHTML = `
                <span class="temple-table-symbol">
                    ॐ
                </span>
            `;
        }


        imageCell.appendChild(imageWrapper);


        /* =====================================================
           NAME
           ===================================================== */

        const nameCell =
            document.createElement("td");

        nameCell.textContent =
            temple.name || "Untitled Temple";


        /* =====================================================
           DESCRIPTION
           ===================================================== */

        const descriptionCell =
            document.createElement("td");

        let description =
            temple.description || "";

        if (description.length > 90) {

            description =
                description.substring(0, 90) + "...";
        }

        descriptionCell.textContent =
            description;


        /* =====================================================
           ORDER
           ===================================================== */

        const orderCell =
            document.createElement("td");

        orderCell.textContent =
            temple.order || "—";


        /* =====================================================
           STATUS
           ===================================================== */

        const statusCell =
            document.createElement("td");

        const status =
            document.createElement("span");

        const isActive =
            temple.active === true ||
            temple.active === undefined;

        status.className =
            isActive
                ? "temple-status active"
                : "temple-status inactive";

        status.textContent =
            isActive
                ? "Active"
                : "Hidden";

        statusCell.appendChild(status);


        /* =====================================================
           ACTIONS
           ===================================================== */

        const actionsCell =
            document.createElement("td");

        const actions =
            document.createElement("div");

        actions.className =
            "temple-actions";


        /* -----------------------------------------------------
           EDIT BUTTON
           ----------------------------------------------------- */

        const editButton =
            document.createElement("button");

        editButton.type = "button";

        editButton.className =
            "temple-small-button temple-edit-button";

        editButton.innerHTML =
            '<i class="fa-solid fa-pen"></i> Edit';


        editButton.addEventListener(
            "click",
            function () {

                console.log(
                    "EDIT CLICKED:",
                    temple.id,
                    temple.name
                );

                editTemple(
                    temple.id
                );

            }
        );


        /* -----------------------------------------------------
           DELETE BUTTON
           ----------------------------------------------------- */

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.className =
            "temple-small-button temple-delete-button";

        deleteButton.innerHTML =
            '<i class="fa-solid fa-trash"></i> Delete';


        deleteButton.addEventListener(
            "click",
            function () {

                deleteTemple(
                    temple.id
                );

            }
        );


        /* -----------------------------------------------------
           ADD BUTTONS TO ACTIONS
           ----------------------------------------------------- */

        actions.appendChild(
            editButton
        );

        actions.appendChild(
            deleteButton
        );


        /* -----------------------------------------------------
           ADD ACTIONS TO CELL
           ----------------------------------------------------- */

        actionsCell.appendChild(
            actions
        );


        /* =====================================================
           ADD CELLS TO ROW
           ===================================================== */

        row.appendChild(imageCell);

        row.appendChild(nameCell);

        row.appendChild(descriptionCell);

        row.appendChild(orderCell);

        row.appendChild(statusCell);

        row.appendChild(actionsCell);


        /* =====================================================
           ADD ROW TO TABLE
           ===================================================== */

        list.appendChild(row);

    });


    console.log(
        "Temple action buttons created:",
        list.querySelectorAll(
            ".temple-edit-button"
        ).length
    );
}


/* =========================================================
   EDIT EXISTING TEMPLE
   ========================================================= */

function editTemple(
    templeId
) {

    console.log(
        "Editing temple:",
        templeId
    );


    /*
     * Find the existing temple
     * from the Firestore data we loaded.
     */

    const temple =
        temples.find(
            (item) =>
                item.id === templeId
        );


    if (!temple) {

        console.error(
            "Temple not found:",
            templeId
        );

        showMessage(
            "Could not find this temple.",
            "error"
        );

        return;
    }


    /*
     * IMPORTANT:
     * Store the Firestore document ID.
     *
     * This tells the submit handler
     * to UPDATE instead of ADD.
     */

    editingTempleId =
        templeId;


    /* =================================================
       CHANGE FORM TO EDIT MODE
       ================================================= */

    formTitle.textContent =
        "Edit Temple";


    saveButton.innerHTML =
        `
            <i class="fa-solid fa-pen"></i>
            Update Temple
        `;


    cancelButton.hidden =
        false;


    /* =================================================
       LOAD EXISTING VALUES
       ================================================= */

    nameInput.value =
        temple.name || "";


    descriptionInput.value =
        temple.description || "";


    imageUrlInput.value =
        temple.imageUrl || "";


    mapUrlInput.value =
        temple.mapUrl || "";


    orderInput.value =
        temple.order || 1;


    /*
     * If active is missing, treat it as active.
     */

    activeInput.checked =
        temple.active !== false;


    /* =================================================
       IMAGE PREVIEW
       ================================================= */

    updateImagePreview();


    /* =================================================
       SCROLL TO FORM
       ================================================= */

    const formCard =
        document.querySelector(
            ".temple-form-card"
        );


    if (formCard) {

        formCard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    showMessage(
        `Editing "${temple.name || "Temple"}".`,
        "info"
    );

}


/* =========================================================
   FORM SUBMIT
   ========================================================= */

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        /* =================================================
           GET FORM DATA
           ================================================= */

        const name =
            nameInput.value.trim();


        const description =
            descriptionInput.value.trim();


        const imageUrl =
            imageUrlInput.value.trim();


        const mapUrl =
            mapUrlInput.value.trim();


        const order =
            Number(
                orderInput.value
            ) || 1;


        const active =
            activeInput.checked;


        /* =================================================
           VALIDATION
           ================================================= */

        if (!name) {

            showMessage(
                "Please enter the temple name.",
                "error"
            );

            nameInput.focus();

            return;
        }


        if (!description) {

            showMessage(
                "Please enter a description.",
                "error"
            );

            descriptionInput.focus();

            return;
        }


        if (
            imageUrl &&
            !isValidUrl(imageUrl)
        ) {

            showMessage(
                "Please enter a valid image URL.",
                "error"
            );

            imageUrlInput.focus();

            return;
        }


        if (
            mapUrl &&
            !isValidUrl(mapUrl)
        ) {

            showMessage(
                "Please enter a valid Google Maps URL.",
                "error"
            );

            mapUrlInput.focus();

            return;
        }


        try {

            saveButton.disabled =
                true;


            /* =================================================
               EDIT MODE → UPDATE EXISTING DOCUMENT
               ================================================= */

            if (editingTempleId) {

                showMessage(
                    "Updating temple...",
                    "info"
                );


                const templeRef =
                    doc(
                        db,
                        "temples",
                        editingTempleId
                    );


                await updateDoc(
                    templeRef,
                    {

                        name:
                            name,

                        description:
                            description,

                        imageUrl:
                            imageUrl,

                        mapUrl:
                            mapUrl,

                        order:
                            order,

                        active:
                            active

                    }
                );


                console.log(
                    "Temple updated:",
                    editingTempleId
                );


                showMessage(
                    "Temple updated successfully.",
                    "success"
                );

            }


            /* =================================================
               ADD MODE → CREATE NEW DOCUMENT
               ================================================= */

            else {

                showMessage(
                    "Adding temple...",
                    "info"
                );


                const newTemple =
                    await addDoc(
                        collection(
                            db,
                            "temples"
                        ),
                        {

                            name:
                                name,

                            description:
                                description,

                            imageUrl:
                                imageUrl,

                            mapUrl:
                                mapUrl,

                            order:
                                order,

                            active:
                                active

                        }
                    );


                console.log(
                    "Temple created:",
                    newTemple.id
                );


                showMessage(
                    "Temple added successfully.",
                    "success"
                );

            }


            /* =================================================
               RESET FORM
               ================================================= */

            resetForm();


            /* =================================================
               RELOAD LIST
               ================================================= */

            await loadTemples();

        }

        catch (error) {

            console.error(
                "SAVE / UPDATE TEMPLE ERROR:",
                error
            );


            showMessage(
                "Could not save the temple. Check Firebase permissions.",
                "error"
            );

        }

        finally {

            saveButton.disabled =
                false;

        }

    }
);


/* =========================================================
   DELETE TEMPLE
   ========================================================= */

async function deleteTemple(
    templeId
) {

    const temple =
        temples.find(
            (item) =>
                item.id === templeId
        );


    if (!temple) {

        showMessage(
            "Temple not found.",
            "error"
        );

        return;
    }


    const templeName =
        temple.name ||
        "this temple";


    const confirmed =
        window.confirm(
            `Delete "${templeName}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {
        return;
    }


    try {

        showMessage(
            `Deleting "${templeName}"...`,
            "info"
        );


        await deleteDoc(
            doc(
                db,
                "temples",
                templeId
            )
        );


        console.log(
            "Temple deleted:",
            templeId
        );


        /*
         * If we were editing this temple,
         * return to Add mode.
         */

        if (
            editingTempleId === templeId
        ) {

            resetForm();

        }


        showMessage(
            "Temple deleted successfully.",
            "success"
        );


        await loadTemples();

    }

    catch (error) {

        console.error(
            "DELETE TEMPLE ERROR:",
            error
        );


        showMessage(
            "Could not delete temple. Check Firebase permissions.",
            "error"
        );

    }

}


/* =========================================================
   RESET FORM
   ========================================================= */

function resetForm() {

    /*
     * VERY IMPORTANT:
     * null means Add mode again.
     */

    editingTempleId =
        null;


    form.reset();


    formTitle.textContent =
        "Add Temple";


    saveButton.innerHTML =
        `
            <i class="fa-solid fa-floppy-disk"></i>
            Save Temple
        `;


    cancelButton.hidden =
        true;


    orderInput.value =
        1;


    activeInput.checked =
        true;


    resetImagePreview();

}


/* =========================================================
   CANCEL EDIT
   ========================================================= */

cancelButton.addEventListener(
    "click",
    () => {

        resetForm();


        showMessage(
            "Edit cancelled.",
            "info"
        );

    }
);


/* =========================================================
   IMAGE PREVIEW
   ========================================================= */

imageUrlInput.addEventListener(
    "input",
    updateImagePreview
);


function updateImagePreview() {

    const url =
        imageUrlInput.value.trim();


    if (!url) {

        resetImagePreview();

        return;
    }


    const convertedUrl =
        getDriveImageUrl(
            url
        );


    imagePreview.innerHTML = "";


    const image =
        document.createElement("img");


    image.src =
        convertedUrl;


    image.alt =
        "Temple image preview";


    image.loading =
        "lazy";


    image.onload = () => {

        imagePreview.innerHTML =
            "";

        imagePreview.appendChild(
            image
        );

    };


    image.onerror = () => {

        imagePreview.innerHTML = `
            <span
                class="temple-image-preview-placeholder"
                title="Image could not be loaded"
            >
                ⚠️
            </span>
        `;

    };

}


function resetImagePreview() {

    if (!imagePreview) {
        return;
    }


    imagePreview.innerHTML = `
        <span class="temple-image-preview-placeholder">
            ॐ
        </span>
    `;

}


/* =========================================================
   URL VALIDATION
   ========================================================= */

function isValidUrl(
    value
) {

    try {

        new URL(
            value
        );

        return true;

    }

    catch {

        return false;

    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "login.html";

        }
    );

}


/* =========================================================
   START
   ========================================================= */

loadTemples();