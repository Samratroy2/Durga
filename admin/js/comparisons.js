/* =========================================================
   ROY BARI — COMPARISONS ADMIN
   Firestore collection: comparisons
   Activity collection: activityLogs
   ========================================================= */


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
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

import {
    db,
    auth
} from "../firebase.js";


/* =========================================================
   COLLECTION
   ========================================================= */

const COLLECTION = "comparisons";

const ACTIVITY_COLLECTION = "activityLogs";


/* =========================================================
   FIELDS
   ========================================================= */

const FIELDS = [
    {
        name: "title",
        label: "Title",
        type: "text",
        required: true,
        placeholder: "Courtyard — Then & Now"
    },

    {
        name: "oldImage",
        label: "Old Image URL",
        type: "url",
        required: true,
        placeholder: "Google Drive or image URL"
    },

    {
        name: "newImage",
        label: "New Image URL",
        type: "url",
        required: true,
        placeholder: "Google Drive or image URL"
    }
];


const DISPLAY_FIELD = "title";


/* =========================================================
   STATE
   ========================================================= */

let records = [];

let selectedId = null;

let editing = false;


/*
 * Keep the original document data while editing.
 *
 * This allows us to detect exactly what changed.
 */

let originalRecordData = null;


/* =========================================================
   DOM
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

    if (newButton) {

        newButton.addEventListener(
            "click",
            newRecord
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            cancelEdit
        );

    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            deleteRecord
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            saveRecord
        );

    }


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

                    id:
                        item.id,

                    data:
                        item.data()

                })
            );


        renderList();


        if (count) {

            count.textContent =
                `${records.length} document${
                    records.length === 1
                        ? ""
                        : "s"
                }`;

        }


        if (records.length) {

            /*
             * If we already have a selected record,
             * keep it selected.
             */

            const currentStillExists =
                selectedId &&
                records.some(
                    item =>
                        item.id === selectedId
                );


            if (currentStillExists) {

                selectRecord(
                    selectedId
                );

            }
            else {

                selectRecord(
                    records[0].id
                );

            }

        }
        else {

            newRecord();

        }


        setMessage(
            "",
            ""
        );

    }


    catch (error) {

        console.error(
            `ROY BARI: ${COLLECTION} load error`,
            error
        );


        setMessage(
            errorMessage(error),
            "message-error"
        );


        if (list) {

            list.innerHTML = `
                <div class="empty-list">
                    Unable to load records.
                </div>
            `;

        }

    }

}


/* =========================================================
   RENDER LIST
   ========================================================= */

function renderList() {

    if (!list) {

        return;

    }


    list.innerHTML = "";


    if (!records.length) {

        list.innerHTML = `
            <div class="empty-list">
                No documents found.
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


            button.type =
                "button";


            button.className =
                "manager-list-item";


            button.dataset.id =
                record.id;


            const value =
                record.data[
                    DISPLAY_FIELD
                ] ||
                "Untitled";


            button.innerHTML = `

                <strong>
                    ${escapeHTML(
                        value
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        record.id
                    )}
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


    selectedId =
        id;


    editing =
        true;


    /*
     * Save a copy of the original values.
     *
     * We need these later to determine
     * which fields changed.
     */

    originalRecordData =
        {
            ...record.data
        };


    renderForm(
        record.data
    );


    if (formTitle) {

        formTitle.textContent =
            "Edit Document";

    }


    if (documentId) {

        documentId.textContent =
            `Document ID: ${id}`;

    }


    if (deleteButton) {

        deleteButton.disabled =
            false;

    }


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

    selectedId =
        null;


    editing =
        false;


    originalRecordData =
        null;


    renderForm(
        {}
    );


    if (formTitle) {

        formTitle.textContent =
            "New Document";

    }


    if (documentId) {

        documentId.textContent =
            "A new document will be created";

    }


    if (deleteButton) {

        deleteButton.disabled =
            true;

    }


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
        "Enter the information and click Save.",
        "message-info"
    );

}


/* =========================================================
   CANCEL EDIT
   ========================================================= */

function cancelEdit() {

    if (selectedId) {

        selectRecord(
            selectedId
        );

    }

    else if (records.length) {

        selectRecord(
            records[0].id
        );

    }

    else {

        newRecord();

    }

}


/* =========================================================
   RENDER FORM
   ========================================================= */

function renderForm(
    data
) {

    if (!fieldsBox) {

        return;

    }


    fieldsBox.innerHTML =
        "";


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


            /* ---------------------------------------------
               TEXTAREA
               --------------------------------------------- */

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


            /* ---------------------------------------------
               CHECKBOX
               --------------------------------------------- */

            else if (
                field.type === "checkbox"
            ) {

                const row =
                    document.createElement(
                        "div"
                    );


                row.className =
                    "checkbox-row";


                input =
                    document.createElement(
                        "input"
                    );


                input.type =
                    "checkbox";


                input.checked =
                    data[field.name] === true;


                row.appendChild(
                    input
                );


                group.appendChild(
                    row
                );

            }


            /* ---------------------------------------------
               NORMAL INPUT
               --------------------------------------------- */

            else {

                input =
                    document.createElement(
                        "input"
                    );


                input.type =
                    field.type;


                if (
                    field.type ===
                    "datetime-local"
                ) {

                    input.value =
                        toLocalDateTime(
                            data[field.name]
                        );

                }

                else {

                    input.value =
                        data[field.name] ?? "";

                }

            }


            input.id =
                `field-${field.name}`;


            input.name =
                field.name;


            if (
                field.type !== "checkbox"
            ) {

                input.placeholder =
                    field.placeholder || "";


                input.required =
                    !!field.required;

            }


            if (
                field.type !== "checkbox"
            ) {

                group.appendChild(
                    input
                );

            }


            /* ---------------------------------------------
               DATE/TIME HELP
               --------------------------------------------- */

            if (
                field.name ===
                "dateTime"
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


            /* ---------------------------------------------
               IMAGE HELP
               --------------------------------------------- */

            if (
                field.name === "image" ||
                field.name === "oldImage" ||
                field.name === "newImage"
            ) {

                const help =
                    document.createElement(
                        "small"
                    );


                help.className =
                    "field-help";


                help.textContent =
                    "Paste a Google Drive file URL or direct image URL.";


                group.appendChild(
                    help
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

async function saveRecord(
    event
) {

    event.preventDefault();


    const data = {};


    /*
     * -------------------------------------------------
     * COLLECT FORM DATA
     * -------------------------------------------------
     */

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


        if (
            field.type ===
            "checkbox"
        ) {

            data[field.name] =
                input.checked;

        }


        else if (
            field.type ===
            "number"
        ) {

            data[field.name] =
                input.value === ""
                    ? null
                    : Number(
                        input.value
                    );

        }


        else if (
            field.type ===
            "datetime-local"
        ) {

            data[field.name] =
                input.value
                    ? Timestamp.fromDate(
                        new Date(
                            input.value
                        )
                    )
                    : null;

        }


        else {

            data[field.name] =
                input.value.trim();

        }


        /*
         * -------------------------------------------------
         * REQUIRED VALIDATION
         * -------------------------------------------------
         */

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


    /*
     * -------------------------------------------------
     * DISABLE BUTTONS
     * -------------------------------------------------
     */

    if (saveButton) {

        saveButton.disabled =
            true;

    }


    if (deleteButton) {

        deleteButton.disabled =
            true;

    }


    setMessage(
        "Saving...",
        "message-info"
    );


    try {

        /* =================================================
           UPDATE EXISTING RECORD
           ================================================= */

        if (
            editing &&
            selectedId
        ) {

            /*
             * Detect changed fields BEFORE updating.
             */

            const changedFields =
                getChangedFields(
                    originalRecordData || {},
                    data
                );


            /*
             * Update Firestore document.
             */

            await updateDoc(
                doc(
                    db,
                    COLLECTION,
                    selectedId
                ),
                data
            );


            /*
             * Create activity log.
             */

            await createActivityLog({

                action:
                    "updated",

                documentId:
                    selectedId,

                title:
                    data.title ||
                    originalRecordData?.title ||
                    "Untitled",

                details:
                    changedFields.length
                        ? `${changedFields.join(", ")} changed.`
                        : "Comparison updated."

            });


            setMessage(
                changedFields.length
                    ? `Changes saved: ${changedFields.join(", ")}.`
                    : "Changes saved successfully.",
                "message-success"
            );

        }


        /* =================================================
           CREATE NEW RECORD
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


            editing =
                true;


            originalRecordData =
                {
                    ...data
                };


            /*
             * Create activity log.
             */

            await createActivityLog({

                action:
                    "created",

                documentId:
                    created.id,

                title:
                    data.title ||
                    "Untitled",

                details:
                    `Comparison created with ID ${created.id}.`

            });


            setMessage(
                "Document created successfully.",
                "message-success"
            );

        }


        /*
         * Reload records.
         */

        await loadRecords();


        /*
         * Re-select saved record.
         */

        if (selectedId) {

            const exists =
                records.some(
                    item =>
                        item.id === selectedId
                );


            if (exists) {

                selectRecord(
                    selectedId
                );

            }

        }

    }


    catch (error) {

        console.error(
            `ROY BARI: ${COLLECTION} save error`,
            error
        );


        setMessage(
            errorMessage(error),
            "message-error"
        );

    }


    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

        }


        if (deleteButton) {

            deleteButton.disabled =
                !editing;

        }

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


    const name =
        record?.data?.[
            DISPLAY_FIELD
        ] ||
        selectedId;


    if (
        !confirm(
            `Delete "${name}"?\n\nThis cannot be undone.`
        )
    ) {

        return;

    }


    if (saveButton) {

        saveButton.disabled =
            true;

    }


    if (deleteButton) {

        deleteButton.disabled =
            true;

    }


    setMessage(
        "Deleting...",
        "message-info"
    );


    try {

        /*
         * Delete the comparison.
         */

        await deleteDoc(
            doc(
                db,
                COLLECTION,
                selectedId
            )
        );


        /*
         * Create activity log AFTER
         * successful deletion.
         */

        await createActivityLog({

            action:
                "deleted",

            documentId:
                selectedId,

            title:
                name,

            details:
                `Comparison "${name}" deleted.`

        });


        selectedId =
            null;


        editing =
            false;


        originalRecordData =
            null;


        setMessage(
            "Document deleted successfully.",
            "message-success"
        );


        await loadRecords();

    }


    catch (error) {

        console.error(
            `ROY BARI: ${COLLECTION} delete error`,
            error
        );


        setMessage(
            errorMessage(error),
            "message-error"
        );


        if (saveButton) {

            saveButton.disabled =
                false;

        }


        if (deleteButton) {

            deleteButton.disabled =
                false;

        }

    }

}


/* =========================================================
   CREATE ACTIVITY LOG
   ========================================================= */

async function createActivityLog({
    action,
    documentId,
    title,
    details
}) {

    try {

        /*
         * Get currently logged-in admin.
         */

        const user =
            auth.currentUser;


        const performedBy =
            user?.email ||
            "Administrator";


        /*
         * Firestore activity document.
         */

        await addDoc(
            collection(
                db,
                ACTIVITY_COLLECTION
            ),
            {

                action:
                    action,

                collection:
                    COLLECTION,

                details:
                    details,

                documentId:
                    documentId,

                performedAt:
                    Timestamp.now(),

                performedBy:
                    performedBy,

                title:
                    title ||
                    "Untitled"

            }
        );


        console.log(
            `ROY BARI: Activity logged — ${action}`
        );

    }


    catch (error) {

        /*
         * IMPORTANT:
         *
         * Do NOT throw the error here.
         *
         * The comparison operation has already
         * succeeded. A logging failure should not
         * make the user think the comparison failed.
         */

        console.error(
            "ROY BARI: Activity log failed:",
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

    const changedFields = [];


    FIELDS.forEach(
        field => {

            const fieldName =
                field.name;


            const oldValue =
                normalizeValue(
                    oldData?.[
                        fieldName
                    ]
                );


            const newValue =
                normalizeValue(
                    newData?.[
                        fieldName
                    ]
                );


            if (
                oldValue !== newValue
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
   NORMALIZE VALUES
   ========================================================= */

function normalizeValue(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    /*
     * Firestore Timestamp
     */

    if (
        typeof value?.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime()
            .toString();

    }


    /*
     * Timestamp-like object
     */

    if (
        typeof value === "object" &&
        value?.seconds !== undefined
    ) {

        return String(
            Number(
                value.seconds
            )
        );

    }


    return String(
        value
    ).trim();

}


/* =========================================================
   CONVERT FIRESTORE DATE
   ========================================================= */

function toLocalDateTime(
    value
) {

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


    return `${year}-${month}-${day}T${hours}:${minutes}`;

}


/* =========================================================
   MESSAGE
   ========================================================= */

function setMessage(
    text,
    type
) {

    if (!message) {

        return;

    }


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
   ERROR MESSAGE
   ========================================================= */

function errorMessage(
    error
) {

    if (
        error?.code ===
        "permission-denied"
    ) {

        return "Permission denied. Check Firestore security rules.";

    }


    return (
        error?.message ||
        "Something went wrong."
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
         * No listeners to clean up.
         *
         * Firestore reads here use getDocs(),
         * so there are no realtime listeners.
         */

    }
);