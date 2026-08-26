/* =========================================================
   ROY BARI ADMIN — CONTACT

   ADMIN FIRESTORE COLLECTION:

   contact

   FIELDS:

   address
   email
   facebook
   instagram
   phone1
   phone2
   whatsapp
   youtube

   ACTIVITY LOG COLLECTION:

   activityLogs

   LOG FORMAT:

   action
   section
   collection
   activity
   details
   performedBy
   email
   adminEmail
   documentId
   performedAt

   IMPORTANT:

   Admin structure:

   admin/
   ├── firebase.js
   ├── contact.html
   └── js/
       └── contact.js

   Therefore:

       ../firebase.js

   ========================================================= */

import {

    collection,
    getDocs,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp

} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import {

    getAuth

} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {

    db

} from "../firebase.js";



/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let form = null;

let statusBox = null;

let saveButton = null;

let contactDocumentId = null;


/*
   Keep the original Firestore data.

   This allows us to compare:

       OLD VALUE → NEW VALUE

   and put that information inside activityLogs.
*/

let originalContactData = {};



/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeContact
);



/* =========================================================
   INITIALIZE CONTACT PAGE
   ========================================================= */

function initializeContact() {

    console.log(
        "================================="
    );

    console.log(
        "ROY BARI ADMIN — CONTACT"
    );

    console.log(
        "Firebase database:",
        db
    );

    console.log(
        "================================="
    );



    /* =====================================================
       ELEMENTS
       ===================================================== */

    form =
        document.getElementById(
            "contact-form"
        );



    statusBox =
        document.getElementById(
            "contact-status"
        );



    saveButton =
        document.getElementById(
            "save-contact"
        );



    /* =====================================================
       CHECK ELEMENTS
       ===================================================== */

    if (!form) {

        console.error(
            "ERROR: #contact-form was not found."
        );

        return;

    }



    if (!statusBox) {

        console.warn(
            "WARNING: #contact-status was not found."
        );

    }



    if (!saveButton) {

        console.warn(
            "WARNING: #save-contact was not found."
        );

    }



    /* =====================================================
       FORM SUBMIT
       ===================================================== */

    form.addEventListener(
        "submit",
        handleSubmit
    );



    /* =====================================================
       LOAD FIRESTORE
       ===================================================== */

    loadContact();

}



/* =========================================================
   LOAD CONTACT
   ========================================================= */

async function loadContact() {

    showStatus(
        "Loading contact information...",
        "loading"
    );



    try {

        console.log(
            "Reading Firestore collection: contact"
        );



        const contactCollection =
            collection(
                db,
                "contact"
            );



        const snapshot =
            await getDocs(
                contactCollection
            );



        console.log(
            "Contact documents found:",
            snapshot.size
        );



        /* =================================================
           NO DOCUMENT
           ================================================= */

        if (
            snapshot.empty
        ) {

            console.log(
                "No contact document found."
            );



            contactDocumentId =
                null;



            originalContactData =
                {};



            clearForm();



            showStatus(
                "No contact information exists yet. Enter the details and save them.",
                "info"
            );



            return;

        }



        /* =================================================
           USE FIRST DOCUMENT
           ================================================= */

        const contactDocument =
            snapshot.docs[0];



        contactDocumentId =
            contactDocument.id;



        const data =
            contactDocument.data();



        /*
           Save original data.

           We use this later to calculate:

               old value → new value
        */

        originalContactData = {

            address:
                normalizeValue(
                    data.address
                ),

            email:
                normalizeValue(
                    data.email
                ),

            phone1:
                normalizeValue(
                    data.phone1
                ),

            phone2:
                normalizeValue(
                    data.phone2
                ),

            facebook:
                normalizeValue(
                    data.facebook
                ),

            instagram:
                normalizeValue(
                    data.instagram
                ),

            whatsapp:
                normalizeValue(
                    data.whatsapp
                ),

            youtube:
                normalizeValue(
                    data.youtube
                )

        };



        console.log(
            "Contact document ID:",
            contactDocumentId
        );



        console.log(
            "Original contact data:",
            originalContactData
        );



        /* =================================================
           LOAD FORM
           ================================================= */

        setValue(
            "address",
            data.address
        );



        setValue(
            "email",
            data.email
        );



        setValue(
            "phone1",
            data.phone1
        );



        setValue(
            "phone2",
            data.phone2
        );



        setValue(
            "facebook",
            data.facebook
        );



        setValue(
            "instagram",
            data.instagram
        );



        setValue(
            "whatsapp",
            data.whatsapp
        );



        setValue(
            "youtube",
            data.youtube
        );



        /* =================================================
           SUCCESS
           ================================================= */

        showStatus(
            "Contact information loaded successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "CONTACT LOAD ERROR:",
            error
        );



        showStatus(
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );

    }

}



/* =========================================================
   SET VALUE
   ========================================================= */

function setValue(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );



    if (!element) {

        console.warn(
            "Input not found:",
            id
        );

        return;

    }



    if (
        value === null ||
        value === undefined
    ) {

        element.value =
            "";

    }
    else {

        element.value =
            String(
                value
            );

    }



    console.log(
        `Field #${id} loaded:`,
        element.value
    );

}



/* =========================================================
   GET VALUE
   ========================================================= */

function getValue(
    id
) {

    const element =
        document.getElementById(
            id
        );



    if (!element) {

        console.warn(
            "Input not found:",
            id
        );

        return "";

    }



    return String(
        element.value || ""
    ).trim();

}



/* =========================================================
   NORMALIZE VALUE

   Used for comparing Firestore data with
   the values currently inside the form.
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



    return String(
        value
    ).trim();

}



/* =========================================================
   CLEAR FORM
   ========================================================= */

function clearForm() {

    const fields = [

        "address",

        "email",

        "phone1",

        "phone2",

        "facebook",

        "instagram",

        "whatsapp",

        "youtube"

    ];



    fields.forEach(
        function (id) {

            const element =
                document.getElementById(
                    id
                );



            if (element) {

                element.value =
                    "";

            }

        }
    );

}



/* =========================================================
   FORM SUBMIT
   ========================================================= */

async function handleSubmit(
    event
) {

    event.preventDefault();



    /* =====================================================
       GET DATA
       ===================================================== */

    const data = {

        address:
            getValue(
                "address"
            ),

        email:
            getValue(
                "email"
            ),

        phone1:
            getValue(
                "phone1"
            ),

        phone2:
            getValue(
                "phone2"
            ),

        facebook:
            getValue(
                "facebook"
            ),

        instagram:
            getValue(
                "instagram"
            ),

        whatsapp:
            getValue(
                "whatsapp"
            ),

        youtube:
            getValue(
                "youtube"
            )

    };



    console.log(
        "Data being saved:",
        data
    );



    /* =====================================================
       VALIDATION
       ===================================================== */

    if (
        !data.address
    ) {

        showStatus(
            "Please enter the address.",
            "error"
        );

        return;

    }



    if (
        data.email &&
        !isValidEmail(
            data.email
        )
    ) {

        showStatus(
            "Please enter a valid email address.",
            "error"
        );

        return;

    }



    /* =====================================================
       DISABLE BUTTON
       ===================================================== */

    setSaving(
        true
    );



    showStatus(
        "Saving contact information...",
        "loading"
    );



    try {

        /* =================================================
           UPDATE EXISTING DOCUMENT
           ================================================= */

        if (
            contactDocumentId
        ) {

            console.log(
                "Updating document:",
                contactDocumentId
            );



            /*
               Find exactly what changed BEFORE
               updating Firestore.
            */

            const changes =
                getChangedFields(
                    originalContactData,
                    data
                );



            console.log(
                "Detected changes:",
                changes
            );



            /*
               If nothing changed, do not create
               a useless activity log.
            */

            if (
                changes.length === 0
            ) {

                showStatus(
                    "No changes were made.",
                    "info"
                );



                setSaving(
                    false
                );



                return;

            }



            /* =============================================
               UPDATE FIRESTORE
               ============================================= */

            await updateDoc(

                doc(
                    db,
                    "contact",
                    contactDocumentId
                ),

                {

                    ...data,

                    updatedAt:
                        serverTimestamp()

                }

            );



            console.log(
                "Contact document updated successfully."
            );



            /* =============================================
               CREATE ACTIVITY LOG
               ============================================= */

            await createActivityLog({

                action:
                    "edit",

                section:
                    "Contact",

                collection:
                    "contact",

                activity:
                    "Contact Information",

                details:
                    formatChanges(
                        changes
                    ),

                documentId:
                    contactDocumentId

            });



            /*
               Update our local copy so that the next
               save compares against the new values.
            */

            originalContactData = {

                ...data

            };



            showStatus(
                "Contact information updated successfully.",
                "success"
            );



            console.log(
                "Contact update activity log created."
            );

        }



        /* =================================================
           CREATE NEW DOCUMENT
           ================================================= */

        else {

            console.log(
                "Creating new contact document..."
            );



            const contactData = {

                ...data,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };



            /* =============================================
               CREATE CONTACT
               ============================================= */

            const reference =
                await addDoc(

                    collection(
                        db,
                        "contact"
                    ),

                    contactData

                );



            contactDocumentId =
                reference.id;



            console.log(
                "New contact document:",
                reference.id
            );



            /* =============================================
               CREATE ACTIVITY LOG
               ============================================= */

            await createActivityLog({

                action:
                    "create",

                section:
                    "Contact",

                collection:
                    "contact",

                activity:
                    "Contact Information",

                details:
                    "Created contact information.",

                documentId:
                    contactDocumentId

            });



            /*
               Save current values as original values.
            */

            originalContactData = {

                ...data

            };



            showStatus(
                "Contact information saved successfully.",
                "success"
            );



            console.log(
                "Contact creation activity log created."
            );

        }

    }
    catch (error) {

        console.error(
            "CONTACT SAVE ERROR:",
            error
        );



        showStatus(
            getFirebaseErrorMessage(
                error
            ),
            "error"
        );

    }
    finally {

        setSaving(
            false
        );

    }

}



/* =========================================================
   FIND CHANGED FIELDS
   ========================================================= */

function getChangedFields(
    oldData,
    newData
) {

    const fields = [

        {
            key: "address",
            label: "Address"
        },

        {
            key: "email",
            label: "Email"
        },

        {
            key: "phone1",
            label: "Phone 1"
        },

        {
            key: "phone2",
            label: "Phone 2"
        },

        {
            key: "facebook",
            label: "Facebook"
        },

        {
            key: "instagram",
            label: "Instagram"
        },

        {
            key: "whatsapp",
            label: "WhatsApp"
        },

        {
            key: "youtube",
            label: "YouTube"
        }

    ];



    const changes = [];



    fields.forEach(
        function (field) {

            const oldValue =
                normalizeValue(
                    oldData?.[field.key]
                );



            const newValue =
                normalizeValue(
                    newData?.[field.key]
                );



            if (
                oldValue !== newValue
            ) {

                changes.push({

                    field:
                        field.label,

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

   Example:

   Phone 1: "1234567890" → "9876543210"
   Email: "old@email.com" → "new@email.com"
   ========================================================= */

function formatChanges(
    changes
) {

    if (
        !changes ||
        changes.length === 0
    ) {

        return "No changes.";

    }



    return changes
        .map(
            function (change) {

                return (
                    `${change.field}: "${displayLogValue(change.oldValue)}" → "${displayLogValue(change.newValue)}"`
                );

            }
        )
        .join(
            " | "
        );

}



/* =========================================================
   DISPLAY LOG VALUE
   ========================================================= */

function displayLogValue(
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "(empty)";

    }



    return String(
        value
    );

}



/* =========================================================
   CREATE ACTIVITY LOG

   FIRESTORE:

       activityLogs

   This is what the Activity History page
   reads.
   ========================================================= */

async function createActivityLog(
    logData
) {

    try {

        /*
           Get currently signed-in admin.
        */

        const auth =
            getAuth();



        const currentUser =
            auth.currentUser;



        const adminEmail =
            currentUser?.email ||
            "Administrator";



        const activityLog = {

            /* =============================================
               ACTION

               create
               edit
               ============================================= */

            action:
                logData.action,



            /* =============================================
               SECTION
               ============================================= */

            section:
                logData.section,



            /* =============================================
               COLLECTION
               ============================================= */

            collection:
                logData.collection,



            collectionName:
                logData.collection,



            /* =============================================
               ACTIVITY
               ============================================= */

            activity:
                logData.activity,



            /* =============================================
               DETAILS
               ============================================= */

            details:
                logData.details,



            description:
                logData.details,



            /* =============================================
               ADMIN
               ============================================= */

            performedBy:
                adminEmail,



            email:
                adminEmail,



            adminEmail:
                adminEmail,



            userEmail:
                adminEmail,



            /* =============================================
               DOCUMENT ID
               ============================================= */

            documentId:
                logData.documentId,



            docId:
                logData.documentId,



            /* =============================================
               TIMESTAMP
               ============================================= */

            performedAt:
                serverTimestamp(),

            createdAt:
                serverTimestamp()

        };



        console.log(
            "Creating activity log:",
            activityLog
        );



        const activityReference =
            await addDoc(

                collection(
                    db,
                    "activityLogs"
                ),

                activityLog

            );



        console.log(
            "Activity log created:",
            activityReference.id
        );



        return activityReference.id;

    }
    catch (error) {

        /*
           IMPORTANT:

           We don't throw this error back to the
           contact save operation.

           Therefore, even if the activity log
           fails, the contact information has
           already been successfully saved.
        */

        console.error(
            "ACTIVITY LOG ERROR:",
            error
        );



        return null;

    }

}



/* =========================================================
   SAVE BUTTON
   ========================================================= */

function setSaving(
    saving
) {

    if (!saveButton) {

        return;

    }



    saveButton.disabled =
        saving;



    saveButton.textContent =
        saving

            ? "Saving..."

            : "Save Contact Information";

}



/* =========================================================
   STATUS
   ========================================================= */

function showStatus(
    message,
    type
) {

    if (!statusBox) {

        console.log(
            `[${type}] ${message}`
        );

        return;

    }



    statusBox.hidden =
        false;



    statusBox.textContent =
        message;



    statusBox.className =
        "admin-status " +
        type;

}



/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
            email
        );

}



/* =========================================================
   FIREBASE ERROR
   ========================================================= */

function getFirebaseErrorMessage(
    error
) {

    console.error(
        "Firebase error code:",
        error?.code
    );



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
        "unavailable"
    ) {

        return (
            "Firebase is temporarily unavailable. Please try again."
        );

    }



    if (
        error?.code ===
        "failed-precondition"
    ) {

        return (
            "Firebase configuration error. Please check admin/firebase.js."
        );

    }



    if (
        error?.code ===
        "not-found"
    ) {

        return (
            "The contact document could not be found."
        );

    }



    return (
        "Unable to load or save contact information. Please try again."
    );

}