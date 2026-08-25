/* =========================================================
   ROY BARI — NEWSPAPER ARTICLES ADMIN
   Firestore collection: newspaperArticles

   Firestore fields:

   title       → String
   newspaper   → String
   headline    → String
   date        → Firestore Timestamp
   page        → String
   image       → String
   ========================================================= */


import {

    collection,

    getDocs,

    addDoc,

    updateDoc,

    deleteDoc,

    doc,

    Timestamp

} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import { db } from "../firebase.js";


/* =========================================================
   CONFIGURATION
   ========================================================= */

const COLLECTION = "newspaperArticles";

const DISPLAY_FIELD = "title";


/* =========================================================
   FIRESTORE FIELDS
   =========================================================

   These exactly match the fields shown in your
   Firebase Console screenshot.
   ========================================================= */

const FIELDS = [

    {
        name: "title",
        label: "Title",
        type: "text",
        required: true,
        placeholder: "Roy Bari Durga Puja"
    },

    {
        name: "newspaper",
        label: "Newspaper",
        type: "text",
        required: false,
        placeholder: "Ananda Bazar Patrika"
    },

    {
        name: "headline",
        label: "Headline",
        type: "text",
        required: false,
        placeholder: "Newspaper headline"
    },

    {
        name: "date",
        label: "Date",
        type: "datetime-local",
        required: false
    },

    {
        name: "page",
        label: "Page",
        type: "text",
        required: false,
        placeholder: "Page 5"
    },

    {
        name: "image",
        label: "Image URL",
        type: "url",
        required: false,
        placeholder: "Google Drive image URL"
    }

];


/* =========================================================
   STATE
   ========================================================= */

let records = [];

let selectedId = null;

let editing = false;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const list =
    document.getElementById(
        "documentList"
    );


const count =
    document.getElementById(
        "documentCount"
    );


const form =
    document.getElementById(
        "editorForm"
    );


const fieldsBox =
    document.getElementById(
        "fields"
    );


const formTitle =
    document.getElementById(
        "formTitle"
    );


const documentId =
    document.getElementById(
        "documentId"
    );


const message =
    document.getElementById(
        "message"
    );


const saveButton =
    document.getElementById(
        "saveButton"
    );


const deleteButton =
    document.getElementById(
        "deleteButton"
    );


const newButton =
    document.getElementById(
        "newButton"
    );


const cancelButton =
    document.getElementById(
        "cancelButton"
    );


/* =========================================================
   INITIALIZE
   ========================================================= */

initialize();


async function initialize() {

    newButton.addEventListener(
        "click",
        newRecord
    );


    cancelButton.addEventListener(
        "click",
        cancelEdit
    );


    deleteButton.addEventListener(
        "click",
        deleteRecord
    );


    form.addEventListener(
        "submit",
        saveRecord
    );


    deleteButton.disabled = true;


    await loadRecords();

}


/* =========================================================
   LOAD RECORDS
   ========================================================= */

async function loadRecords() {

    setMessage(
        "Loading...",
        "message-info"
    );


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    COLLECTION
                )
            );


        records =
            snapshot.docs.map(
                item => ({

                    id: item.id,

                    data: item.data()

                })
            );


        /*
           Sort newest date first.
        */

        records.sort(
            (a, b) => {

                const dateA =
                    getTimestampMillis(
                        a.data.date
                    );


                const dateB =
                    getTimestampMillis(
                        b.data.date
                    );


                if (
                    dateA !== dateB
                ) {

                    return dateB - dateA;

                }


                const titleA =
                    String(
                        a.data.title || ""
                    ).toLowerCase();


                const titleB =
                    String(
                        b.data.title || ""
                    ).toLowerCase();


                return titleA.localeCompare(
                    titleB
                );

            }
        );


        renderList();


        count.textContent =
            `${records.length} document${records.length === 1 ? "" : "s"}`;


        if (records.length > 0) {

            selectRecord(
                records[0].id
            );

        } else {

            newRecord();

        }


        setMessage(
            "",
            ""
        );


    } catch (error) {

        console.error(
            `ROY BARI: ${COLLECTION} load error`,
            error
        );


        setMessage(
            errorMessage(error),
            "message-error"
        );


        list.innerHTML = `
            <div class="empty-list">
                Unable to load newspaper articles.
            </div>
        `;

    }

}


/* =========================================================
   RENDER LIST
   ========================================================= */

function renderList() {

    list.innerHTML = "";


    if (
        records.length === 0
    ) {

        list.innerHTML = `
            <div class="empty-list">
                No newspaper articles found.
            </div>
        `;

        return;

    }


    records.forEach(
        record => {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";


            button.className =
                "manager-list-item";


            button.dataset.id =
                record.id;


            const title =
                record.data.title ||
                "Untitled Article";


            const newspaper =
                record.data.newspaper ||
                "";


            const date =
                formatDate(
                    record.data.date
                );


            let secondaryText =
                record.id;


            if (
                newspaper &&
                date
            ) {

                secondaryText =
                    `${newspaper} • ${date}`;

            } else if (
                newspaper
            ) {

                secondaryText =
                    newspaper;

            } else if (
                date
            ) {

                secondaryText =
                    date;

            }


            button.innerHTML = `

                <strong>
                    ${escapeHTML(title)}
                </strong>

                <small>
                    ${escapeHTML(secondaryText)}
                </small>

            `;


            button.addEventListener(
                "click",
                () => {

                    selectRecord(
                        record.id
                    );

                }
            );


            list.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   SELECT RECORD
   ========================================================= */

function selectRecord(id) {

    const record =
        records.find(
            item =>
                item.id === id
        );


    if (!record) {

        return;

    }


    selectedId = id;

    editing = true;


    renderForm(
        record.data
    );


    formTitle.textContent =
        "Edit Article";


    documentId.textContent =
        `Document ID: ${id}`;


    deleteButton.disabled =
        false;


    document
        .querySelectorAll(
            ".manager-list-item"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.id === id
                );

            }
        );


    setMessage(
        "",
        ""
    );

}


/* =========================================================
   NEW RECORD
   ========================================================= */

function newRecord() {

    selectedId = null;

    editing = false;


    renderForm({});


    formTitle.textContent =
        "New Article";


    documentId.textContent =
        "A new document will be created";


    deleteButton.disabled =
        true;


    document
        .querySelectorAll(
            ".manager-list-item"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    setMessage(
        "Enter the article information and click Save.",
        "message-info"
    );

}


/* =========================================================
   CANCEL
   ========================================================= */

function cancelEdit() {

    if (selectedId) {

        selectRecord(
            selectedId
        );

        return;

    }


    if (records.length > 0) {

        selectRecord(
            records[0].id
        );

        return;

    }


    newRecord();

}


/* =========================================================
   RENDER FORM
   ========================================================= */

function renderForm(data) {

    fieldsBox.innerHTML = "";


    FIELDS.forEach(
        field => {

            const group =
                document.createElement(
                    "div"
                );


            group.className =
                "form-group";


            const label =
                document.createElement(
                    "label"
                );


            label.htmlFor =
                `field-${field.name}`;


            label.textContent =
                field.label;


            group.appendChild(
                label
            );


            let input;


            /* =================================================
               TEXTAREA
               ================================================= */

            if (
                field.type === "textarea"
            ) {

                input =
                    document.createElement(
                        "textarea"
                    );


                input.value =
                    data[field.name] ?? "";

            }


            /* =================================================
               NORMAL INPUT
               ================================================= */

            else {

                input =
                    document.createElement(
                        "input"
                    );


                input.type =
                    field.type;


                /*
                   Firestore Timestamp →
                   datetime-local value.
                */

                if (
                    field.type ===
                    "datetime-local"
                ) {

                    input.value =
                        toLocalDateTime(
                            data[field.name]
                        );

                } else {

                    input.value =
                        data[field.name] ?? "";

                }

            }


            input.id =
                `field-${field.name}`;


            input.name =
                field.name;


            input.required =
                !!field.required;


            if (
                field.placeholder
            ) {

                input.placeholder =
                    field.placeholder;

            }


            group.appendChild(
                input
            );


            /* =================================================
               DATE HELP
               ================================================= */

            if (
                field.name === "date"
            ) {

                const help =
                    document.createElement(
                        "small"
                    );


                help.className =
                    "field-help";


                help.textContent =
                    "Stored in Firestore as a Timestamp.";

                
                group.appendChild(
                    help
                );

            }


            /* =================================================
               IMAGE FIELD
               ================================================= */

            if (
                field.name === "image"
            ) {

                const help =
                    document.createElement(
                        "small"
                    );


                help.className =
                    "field-help";


                help.textContent =
                    "Paste a Google Drive file URL or a direct image URL.";

                
                group.appendChild(
                    help
                );


                const previewWrapper =
                    document.createElement(
                        "div"
                    );


                previewWrapper.className =
                    "image-preview-wrapper";


                const preview =
                    document.createElement(
                        "img"
                    );


                preview.className =
                    "preview";


                preview.alt =
                    "Newspaper article image preview";


                preview.loading =
                    "lazy";


                const previewError =
                    document.createElement(
                        "small"
                    );


                previewError.className =
                    "preview-error";


                previewError.textContent =
                    "Image could not be loaded. Check the URL or Google Drive sharing permissions.";


                if (
                    data.image
                ) {

                    preview.src =
                        convertGoogleDriveUrl(
                            data.image
                        );

                } else {

                    preview.classList.add(
                        "hidden"
                    );

                }


                previewWrapper.appendChild(
                    preview
                );


                previewWrapper.appendChild(
                    previewError
                );


                group.appendChild(
                    previewWrapper
                );


                input.addEventListener(
                    "input",
                    () => {

                        const url =
                            input.value.trim();


                        previewError.style.display =
                            "none";


                        if (!url) {

                            preview.classList.add(
                                "hidden"
                            );


                            preview.removeAttribute(
                                "src"
                            );


                            return;

                        }


                        preview.classList.remove(
                            "hidden"
                        );


                        preview.src =
                            convertGoogleDriveUrl(
                                url
                            );

                    }
                );


                preview.addEventListener(
                    "load",
                    () => {

                        previewError.style.display =
                            "none";

                    }
                );


                preview.addEventListener(
                    "error",
                    () => {

                        previewError.style.display =
                            "block";

                    }
                );

            }


            fieldsBox.appendChild(
                group
            );

        }
    );

}


/* =========================================================
   SAVE RECORD
   ========================================================= */

async function saveRecord(event) {

    event.preventDefault();


    const data = {};


    for (
        const field of FIELDS
    ) {

        const input =
            document.getElementById(
                `field-${field.name}`
            );


        if (!input) {

            continue;

        }


        /* =================================================
           DATE → FIRESTORE TIMESTAMP
           ================================================= */

        if (
            field.type ===
            "datetime-local"
        ) {

            if (
                input.value
            ) {

                const date =
                    new Date(
                        input.value
                    );


                if (
                    Number.isNaN(
                        date.getTime()
                    )
                ) {

                    setMessage(
                        "Please enter a valid date and time.",
                        "message-error"
                    );


                    input.focus();


                    return;

                }


                data[field.name] =
                    Timestamp.fromDate(
                        date
                    );

            } else {

                data[field.name] =
                    null;

            }

        }


        /* =================================================
           NORMAL TEXT / URL
           ================================================= */

        else {

            data[field.name] =
                input.value.trim();

        }


        /* =================================================
           REQUIRED VALIDATION
           ================================================= */

        if (
            field.required
        ) {

            const value =
                data[field.name];


            if (
                value === "" ||
                value === null ||
                value === undefined
            ) {

                setMessage(
                    `${field.label} is required.`,
                    "message-error"
                );


                input.focus();


                return;

            }

        }

    }


    /* =====================================================
       IMAGE URL VALIDATION
       ===================================================== */

    if (
        data.image &&
        !isValidUrl(
            data.image
        )
    ) {

        setMessage(
            "Please enter a valid image URL.",
            "message-error"
        );


        document
            .getElementById(
                "field-image"
            )
            ?.focus();


        return;

    }


    saveButton.disabled =
        true;


    deleteButton.disabled =
        true;


    newButton.disabled =
        true;


    setMessage(
        "Saving...",
        "message-info"
    );


    try {

        /* =================================================
           UPDATE
           ================================================= */

        if (
            editing &&
            selectedId
        ) {

            await updateDoc(

                doc(
                    db,
                    COLLECTION,
                    selectedId
                ),

                data

            );


            setMessage(
                "Changes saved successfully.",
                "message-success"
            );

        }


        /* =================================================
           CREATE
           ================================================= */

        else {

            const created =
                await addDoc(

                    collection(
                        db,
                        COLLECTION
                    ),

                    data

                );


            selectedId =
                created.id;


            editing = true;


            setMessage(
                "Article created successfully.",
                "message-success"
            );

        }


        /* =================================================
           RELOAD FIRESTORE
           ================================================= */

        await loadRecords();


        /*
           Keep newly created/edited document selected.
        */

        if (
            selectedId
        ) {

            const exists =
                records.some(
                    record =>
                        record.id ===
                        selectedId
                );


            if (exists) {

                selectRecord(
                    selectedId
                );

            }

        }

    } catch (error) {

        console.error(
            `ROY BARI: ${COLLECTION} save error`,
            error
        );


        setMessage(
            errorMessage(error),
            "message-error"
        );

    } finally {

        saveButton.disabled =
            false;


        newButton.disabled =
            false;


        deleteButton.disabled =
            !editing;

    }

}


/* =========================================================
   DELETE RECORD
   ========================================================= */

async function deleteRecord() {

    if (
        !editing ||
        !selectedId
    ) {

        return;

    }


    const record =
        records.find(
            item =>
                item.id === selectedId
        );


    const title =
        record?.data?.title ||
        "this article";


    const confirmed =
        confirm(
            `Delete "${title}"?\n\nThis cannot be undone.`
        );


    if (!confirmed) {

        return;

    }


    saveButton.disabled =
        true;


    deleteButton.disabled =
        true;


    newButton.disabled =
        true;


    setMessage(
        "Deleting...",
        "message-info"
    );


    try {

        await deleteDoc(

            doc(
                db,
                COLLECTION,
                selectedId
            )

        );


        selectedId =
            null;


        editing =
            false;


        setMessage(
            "Article deleted successfully.",
            "message-success"
        );


        await loadRecords();

    } catch (error) {

        console.error(
            `ROY BARI: ${COLLECTION} delete error`,
            error
        );


        setMessage(
            errorMessage(error),
            "message-error"
        );


        saveButton.disabled =
            false;


        deleteButton.disabled =
            false;


        newButton.disabled =
            false;

    }

}


/* =========================================================
   FIRESTORE TIMESTAMP → LOCAL DATETIME
   ========================================================= */

function toLocalDateTime(value) {

    if (!value) {

        return "";

    }


    let date;


    /*
       Firebase Timestamp
    */

    if (
        typeof value.toDate ===
        "function"
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
       Firestore serialized timestamp
    */

    else if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        date =
            new Date(
                Number(
                    value.seconds
                ) * 1000
            );

    }


    /*
       String
    */

    else {

        date =
            new Date(
                value
            );

    }


    if (
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


    const hours =
        String(
            date.getHours()
        ).padStart(
            2,
            "0"
        );


    const minutes =
        String(
            date.getMinutes()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}T${hours}:${minutes}`
    );

}


/* =========================================================
   FORMAT FIRESTORE DATE FOR LIST
   ========================================================= */

function formatDate(value) {

    if (!value) {

        return "";

    }


    let date;


    if (
        typeof value.toDate ===
        "function"
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
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        date =
            new Date(
                Number(
                    value.seconds
                ) * 1000
            );

    }

    else {

        date =
            new Date(
                value
            );

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   TIMESTAMP → MILLISECONDS
   ========================================================= */

function getTimestampMillis(value) {

    if (!value) {

        return 0;

    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate().getTime();

    }


    if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {

        return (
            Number(
                value.seconds
            ) * 1000
        );

    }


    const date =
        new Date(value);


    return Number.isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();

}


/* =========================================================
   GOOGLE DRIVE URL CONVERSION
   ========================================================= */

function convertGoogleDriveUrl(url) {

    if (!url) {

        return "";

    }


    const value =
        String(url).trim();


    /*
       Not Google Drive:
       return original URL.
    */

    if (
        !value.includes(
            "drive.google.com"
        )
    ) {

        return value;

    }


    /*
       Standard Google Drive URL:

       /file/d/FILE_ID/view
    */

    const fileMatch =
        value.match(
            /\/file\/d\/([^/]+)/
        );


    if (fileMatch) {

        return (
            "https://drive.google.com/uc?export=view&id=" +
            fileMatch[1]
        );

    }


    /*
       Google Drive:

       /open?id=FILE_ID
    */

    const idMatch =
        value.match(
            /[?&]id=([^&]+)/
        );


    if (idMatch) {

        return (
            "https://drive.google.com/uc?export=view&id=" +
            idMatch[1]
        );

    }


    return value;

}


/* =========================================================
   URL VALIDATION
   ========================================================= */

function isValidUrl(value) {

    try {

        const url =
            new URL(value);


        return (
            url.protocol === "http:" ||
            url.protocol === "https:"
        );

    } catch {

        return false;

    }

}


/* =========================================================
   ERROR MESSAGE
   ========================================================= */

function errorMessage(error) {

    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "Permission denied. Check your Firestore security rules."
        );

    }


    if (
        error?.code ===
        "unauthenticated"
    ) {

        return (
            "You are not authenticated. Please log in again."
        );

    }


    if (
        error?.code ===
        "not-found"
    ) {

        return (
            "The newspaper article no longer exists."
        );

    }


    return (
        error?.message ||
        "Something went wrong."
    );

}


/* =========================================================
   MESSAGE
   ========================================================= */

function setMessage(
    text,
    type
) {

    message.textContent =
        text;


    message.className =
        "message";


    if (type) {

        message.classList.add(
            type
        );

    }

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   BEFORE UNLOAD
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        /*
           No realtime Firestore listener is being used.
           getDocs() performs one-time reads only.
        */

    }
);