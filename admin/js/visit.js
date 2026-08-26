/* =========================================================
   ROY BARI ADMIN — VISIT

   FIRESTORE COLLECTION:

   visit

   FIELDS:

   address
   mapUrl
   parking
   railOne
   railTwo

   ACTIVITY LOG COLLECTION:

   activityLogs

   ADMIN STRUCTURE:

   admin/
   ├── firebase.js
   ├── visit.html
   └── js/
       └── visit.js

   IMPORTANT:

   Because visit.js is inside:

       admin/js/

   Firebase is imported from:

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

let visitDocumentId = null;



/*
   Stores the values loaded from Firestore.

   These values are used to compare:

       OLD VALUE → NEW VALUE
*/

let originalVisitData = {};





/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeVisit
);





/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeVisit() {

    console.log(
        "================================="
    );

    console.log(
        "ROY BARI ADMIN — VISIT"
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
            "visit-form"
        );



    statusBox =
        document.getElementById(
            "visit-status"
        );



    saveButton =
        document.getElementById(
            "save-visit"
        );



    /* =====================================================
       CHECK FORM
       ===================================================== */

    if (!form) {

        console.error(
            "ERROR: #visit-form was not found."
        );

        return;

    }



    if (!statusBox) {

        console.warn(
            "WARNING: #visit-status was not found."
        );

    }



    if (!saveButton) {

        console.warn(
            "WARNING: #save-visit was not found."
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

    loadVisit();

}





/* =========================================================
   LOAD VISIT
   ========================================================= */

async function loadVisit() {

    showStatus(
        "Loading visit information...",
        "loading"
    );



    try {

        console.log(
            "Reading Firestore collection: visit"
        );



        const visitCollection =
            collection(
                db,
                "visit"
            );



        const snapshot =
            await getDocs(
                visitCollection
            );



        console.log(
            "Visit documents found:",
            snapshot.size
        );



        /* =================================================
           NO DOCUMENT
           ================================================= */

        if (
            snapshot.empty
        ) {

            console.log(
                "No visit document found."
            );



            visitDocumentId =
                null;



            originalVisitData =
                {};



            clearForm();



            showStatus(
                "No visit information exists yet. Enter the details and save them.",
                "info"
            );



            return;

        }



        /* =================================================
           PREFER DOCUMENT NAMED "main"
           ================================================= */

        let visitDocument =
            snapshot.docs.find(
                document =>
                    document.id === "main"
            );



        /* =================================================
           OTHERWISE USE FIRST DOCUMENT
           ================================================= */

        if (!visitDocument) {

            visitDocument =
                snapshot.docs[0];

        }



        /* =================================================
           DOCUMENT ID
           ================================================= */

        visitDocumentId =
            visitDocument.id;



        /* =================================================
           DATA
           ================================================= */

        const data =
            visitDocument.data();



        console.log(
            "Visit document ID:",
            visitDocumentId
        );



        console.log(
            "Visit Firestore data:",
            data
        );



        /* =================================================
           STORE ORIGINAL VALUES

           These are used later for activity logging.
           ================================================= */

        originalVisitData = {

            address:
                normalizeValue(
                    data.address
                ),

            mapUrl:
                normalizeValue(
                    data.mapUrl
                ),

            parking:
                normalizeValue(
                    data.parking
                ),

            railOne:
                normalizeValue(
                    firstAvailable(
                        data.railOne,
                        data.raiIOne,
                        data.nearestRailOne
                    )
                ),

            railTwo:
                normalizeValue(
                    firstAvailable(
                        data.railTwo,
                        data.nearestRailTwo
                    )
                )

        };



        console.log(
            "Original visit data:",
            originalVisitData
        );



        /* =================================================
           ADDRESS
           ================================================= */

        setValue(
            "address",
            data.address
        );



        /* =================================================
           MAP URL
           ================================================= */

        setValue(
            "mapUrl",
            data.mapUrl
        );



        /* =================================================
           PARKING
           ================================================= */

        setValue(
            "parking",
            data.parking
        );



        /* =================================================
           RAIL ONE

           New field:

               railOne

           Old possible field:

               raiIOne

           Other possible old field:

               nearestRailOne
           ================================================= */

        setValue(
            "railOne",
            firstAvailable(
                data.railOne,
                data.raiIOne,
                data.nearestRailOne
            )
        );



        /* =================================================
           RAIL TWO
           ================================================= */

        setValue(
            "railTwo",
            firstAvailable(
                data.railTwo,
                data.nearestRailTwo
            )
        );



        /* =================================================
           DEBUG
           ================================================= */

        console.log(
            "Address:",
            getValue("address")
        );



        console.log(
            "Map URL:",
            getValue("mapUrl")
        );



        console.log(
            "Parking:",
            getValue("parking")
        );



        console.log(
            "Rail One:",
            getValue("railOne")
        );



        console.log(
            "Rail Two:",
            getValue("railTwo")
        );



        /* =================================================
           SUCCESS
           ================================================= */

        showStatus(
            "Visit information loaded successfully.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "VISIT LOAD ERROR:",
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
   FIRST AVAILABLE VALUE
   ========================================================= */

function firstAvailable(
    ...values
) {

    for (
        const value of values
    ) {

        if (
            value !== null &&
            value !== undefined &&
            String(value).trim() !== ""
        ) {

            return value;

        }

    }



    return "";

}





/* =========================================================
   FORM SUBMIT
   ========================================================= */

async function handleSubmit(
    event
) {

    event.preventDefault();



    /* =====================================================
       GET FORM VALUES
       ===================================================== */

    const data = {

        address:
            getValue(
                "address"
            ),

        mapUrl:
            getValue(
                "mapUrl"
            ),

        parking:
            getValue(
                "parking"
            ),

        railOne:
            getValue(
                "railOne"
            ),

        railTwo:
            getValue(
                "railTwo"
            )

    };



    console.log(
        "Visit data prepared for saving:",
        data
    );



    /* =====================================================
       VALIDATE ADDRESS
       ===================================================== */

    if (
        !data.address
    ) {

        showStatus(
            "Please enter the Roy Bari address.",
            "error"
        );

        return;

    }



    /* =====================================================
       VALIDATE MAP URL
       ===================================================== */

    if (
        data.mapUrl &&
        !isValidHttpUrl(
            data.mapUrl
        )
    ) {

        showStatus(
            "Please enter a valid Google Maps URL.",
            "error"
        );

        return;

    }



    /* =====================================================
       SAVE BUTTON
       ===================================================== */

    setSaving(
        true
    );



    showStatus(
        "Saving visit information...",
        "loading"
    );



    try {

        /* =================================================
           UPDATE EXISTING DOCUMENT
           ================================================= */

        if (
            visitDocumentId
        ) {

            console.log(
                "Updating visit document:",
                visitDocumentId
            );



            /* =============================================
               FIND CHANGES BEFORE UPDATE
               ============================================= */

            const changes =
                getChangedFields(
                    originalVisitData,
                    data
                );



            console.log(
                "Detected visit changes:",
                changes
            );



            /* =============================================
               NOTHING CHANGED
               ============================================= */

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
                    "visit",
                    visitDocumentId
                ),

                {

                    ...data,

                    updatedAt:
                        serverTimestamp()

                }

            );



            console.log(
                "Visit document updated successfully."
            );



            /* =============================================
               CREATE ACTIVITY LOG
               ============================================= */

            await createActivityLog({

                action:
                    "edit",

                section:
                    "Visit",

                collection:
                    "visit",

                activity:
                    "Visit Information",

                details:
                    formatChanges(
                        changes
                    ),

                documentId:
                    visitDocumentId

            });



            /* =============================================
               UPDATE ORIGINAL DATA

               This is important because if the admin
               saves again, comparison should happen
               against the latest saved values.
               ============================================= */

            originalVisitData = {

                ...data

            };



            /* =============================================
               SUCCESS
               ============================================= */

            showStatus(
                "Visit information updated successfully.",
                "success"
            );



            console.log(
                "Visit activity log created."
            );

        }



        /* =================================================
           CREATE NEW DOCUMENT
           ================================================= */

        else {

            console.log(
                "Creating new visit document..."
            );



            const visitData = {

                ...data,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };



            /* =============================================
               CREATE VISIT DOCUMENT
               ============================================= */

            const reference =
                await addDoc(

                    collection(
                        db,
                        "visit"
                    ),

                    visitData

                );



            visitDocumentId =
                reference.id;



            console.log(
                "Visit document created:",
                reference.id
            );



            /* =============================================
               CREATE ACTIVITY LOG
               ============================================= */

            await createActivityLog({

                action:
                    "create",

                section:
                    "Visit",

                collection:
                    "visit",

                activity:
                    "Visit Information",

                details:
                    "Created visit information.",

                documentId:
                    visitDocumentId

            });



            /* =============================================
               STORE CURRENT DATA
               ============================================= */

            originalVisitData = {

                ...data

            };



            /* =============================================
               SUCCESS
               ============================================= */

            showStatus(
                "Visit information saved successfully.",
                "success"
            );



            console.log(
                "Visit creation activity log created."
            );

        }

    }
    catch (error) {

        console.error(
            "VISIT SAVE ERROR:",
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
            key: "mapUrl",
            label: "Map URL"
        },

        {
            key: "parking",
            label: "Parking"
        },

        {
            key: "railOne",
            label: "Railway 1"
        },

        {
            key: "railTwo",
            label: "Railway 2"
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

   Address: "Old address" → "New address"

   Map URL: "old URL" → "new URL"

   Parking: "Available" → "Not available"
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
   NORMALIZE VALUE
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
   CREATE ACTIVITY LOG

   FIRESTORE COLLECTION:

       activityLogs

   This is the collection used by your
   Activity History page.
   ========================================================= */

async function createActivityLog(
    logData
) {

    try {

        /* =================================================
           GET CURRENT ADMIN
           ================================================= */

        const auth =
            getAuth();



        const currentUser =
            auth.currentUser;



        const adminEmail =
            currentUser?.email ||
            "Administrator";



        /* =================================================
           ACTIVITY LOG DATA
           ================================================= */

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
            "Creating Visit activity log:",
            activityLog
        );



        /* =================================================
           WRITE ACTIVITY LOG
           ================================================= */

        const activityReference =
            await addDoc(

                collection(
                    db,
                    "activityLogs"
                ),

                activityLog

            );



        console.log(
            "Visit activity log created:",
            activityReference.id
        );



        return activityReference.id;

    }
    catch (error) {

        /*
           The Visit document has already been saved.

           Therefore, do not undo the Visit update
           if only the activity log fails.

           The error is shown in the console.
        */

        console.error(
            "VISIT ACTIVITY LOG ERROR:",
            error
        );



        return null;

    }

}





/* =========================================================
   GET VALUE

   Reads the actual value from the input.

   It does NOT use the placeholder.
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
            "Visit field not found:",
            id
        );

        return "";

    }



    return String(
        element.value || ""
    ).trim();

}





/* =========================================================
   SET VALUE

   Firestore data is placed into:

       element.value

   Therefore the stored data is visible
   as editable content in the admin form.
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
            "Visit field not found:",
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
        `Visit field #${id} loaded:`,
        element.value
    );

}





/* =========================================================
   CLEAR FORM
   ========================================================= */

function clearForm() {

    if (!form) {

        return;

    }



    const fields = [

        "address",

        "mapUrl",

        "parking",

        "railOne",

        "railTwo"

    ];



    fields.forEach(
        id => {

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
   SET SAVING STATE
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

            : "Save Visit Information";

}





/* =========================================================
   STATUS MESSAGE
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
   URL VALIDATION
   ========================================================= */

function isValidHttpUrl(
    value
) {

    if (!value) {

        return false;

    }



    try {

        const url =
            new URL(
                value
            );



        return (

            url.protocol === "http:" ||

            url.protocol === "https:"

        );

    }
    catch {

        return false;

    }

}





/* =========================================================
   FIREBASE ERROR MESSAGE
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
            "The visit document could not be found."
        );

    }



    return (
        "Unable to load or save visit information. Please try again."
    );

}