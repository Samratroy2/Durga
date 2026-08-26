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

    db

} from "../firebase.js";



/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let form = null;

let statusBox = null;

let saveButton = null;

let contactDocumentId = null;



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


        console.log(
            "Contact document ID:",
            contactDocumentId
        );


        console.log(
            "Contact Firestore data:",
            data
        );


        /* =================================================
           LOAD ADDRESS
           ================================================= */

        setValue(
            "address",
            data.address
        );


        /* =================================================
           LOAD EMAIL
           ================================================= */

        setValue(
            "email",
            data.email
        );


        /* =================================================
           LOAD PHONE 1
           ================================================= */

        setValue(
            "phone1",
            data.phone1
        );


        /* =================================================
           LOAD PHONE 2
           ================================================= */

        setValue(
            "phone2",
            data.phone2
        );


        /* =================================================
           LOAD FACEBOOK
           ================================================= */

        setValue(
            "facebook",
            data.facebook
        );


        /* =================================================
           LOAD INSTAGRAM
           ================================================= */

        setValue(
            "instagram",
            data.instagram
        );


        /* =================================================
           LOAD WHATSAPP
           ================================================= */

        setValue(
            "whatsapp",
            data.whatsapp
        );


        /* =================================================
           LOAD YOUTUBE
           ================================================= */

        setValue(
            "youtube",
            data.youtube
        );


        /* =================================================
           DEBUG
           ================================================= */

        console.log(
            "Address:",
            data.address
        );

        console.log(
            "Email:",
            data.email
        );

        console.log(
            "Phone 1:",
            data.phone1
        );

        console.log(
            "Phone 2:",
            data.phone2
        );

        console.log(
            "Facebook:",
            data.facebook
        );

        console.log(
            "Instagram:",
            data.instagram
        );

        console.log(
            "WhatsApp:",
            data.whatsapp
        );

        console.log(
            "YouTube:",
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

   IMPORTANT:

   This uses:

       element.value

   NOT:

       element.placeholder

   Therefore Firestore data appears as
   actual editable field content.
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
            ),

        updatedAt:
            serverTimestamp()

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
           UPDATE EXISTING
           ================================================= */

        if (
            contactDocumentId
        ) {

            console.log(
                "Updating document:",
                contactDocumentId
            );


            await updateDoc(

                doc(
                    db,
                    "contact",
                    contactDocumentId
                ),

                data

            );


            showStatus(
                "Contact information updated successfully.",
                "success"
            );


            console.log(
                "Contact information updated."
            );

        }


        /* =================================================
           CREATE NEW
           ================================================= */

        else {

            console.log(
                "Creating new contact document..."
            );


            data.createdAt =
                serverTimestamp();


            const reference =
                await addDoc(
                    collection(
                        db,
                        "contact"
                    ),
                    data
                );


            contactDocumentId =
                reference.id;


            showStatus(
                "Contact information saved successfully.",
                "success"
            );


            console.log(
                "New contact document:",
                reference.id
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