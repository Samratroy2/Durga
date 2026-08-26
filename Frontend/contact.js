/* =========================================================
   ROY BARI — CONTACT PAGE
   FIREBASE / FIRESTORE
   =========================================================

   FIRESTORE COLLECTION:

   contact

   DOCUMENT:

   Any document inside "contact"

   FIELDS:

   address
   email
   facebook
   instagram
   phone1
   phone2
   whatsapp
   youtube


   ENQUIRIES:

   enquiries

   ========================================================= */


import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import {
    db
} from "./firebase.js";


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadContactInformation();

        initContactForm();

    }
);


/* =========================================================
   LOAD CONTACT INFORMATION
   ========================================================= */

async function loadContactInformation() {


    try {

        /*
         * IMPORTANT
         *
         * We ONLY read:
         *
         * contact
         *
         * We do NOT read:
         *
         * visit
         * main
         * settings
         * homepage
         * etc.
         */

        const contactCollection =
            collection(
                db,
                "contact"
            );


        const snapshot =
            await getDocs(
                contactCollection
            );


        /* =================================================
           CHECK COLLECTION
           ================================================= */

        if (
            snapshot.empty
        ) {

            console.error(
                "CONTACT COLLECTION IS EMPTY."
            );


            showContactUnavailable();

            return;

        }


        /* =================================================
           USE FIRST DOCUMENT
           ================================================= */

        const contactDocument =
            snapshot.docs[0];


        const data =
            contactDocument.data();


        /* =================================================
           ADDRESS
           ================================================= */

        displayText(
            "contact-address",
            data.address,
            "Address not available"
        );


        /* =================================================
           EMAIL
           ================================================= */

        displayEmail(
            "contact-email",
            data.email
        );


        /* =================================================
           PHONE 1
           ================================================= */

        displayPhone(
            "contact-phone1",
            data.phone1
        );


        /* =================================================
           PHONE 2
           ================================================= */

        displayPhone(
            "contact-phone2",
            data.phone2
        );


        /* =================================================
           WHATSAPP
           ================================================= */

        displaySocialLink(
            "contact-whatsapp",
            data.whatsapp
        );


        /* =================================================
           FACEBOOK
           ================================================= */

        displaySocialLink(
            "contact-facebook",
            data.facebook
        );


        /* =================================================
           INSTAGRAM
           ================================================= */

        displaySocialLink(
            "contact-instagram",
            data.instagram
        );


        /* =================================================
           YOUTUBE
           ================================================= */

        displaySocialLink(
            "contact-youtube",
            data.youtube
        );

    }
    catch (error) {

        console.error(
            "========================================"
        );

        console.error(
            "CONTACT FIRESTORE ERROR"
        );

        console.error(
            error
        );

        console.error(
            "========================================"
        );


        showContactUnavailable();

    }

}


/* =========================================================
   DISPLAY NORMAL TEXT
   ========================================================= */

function displayText(
    id,
    value,
    fallback = "Not available"
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        console.warn(
            "Element not found:",
            id
        );

        return;

    }


    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {

        element.textContent =
            fallback;

        return;

    }


    element.textContent =
        String(value).trim();

}


/* =========================================================
   DISPLAY EMAIL
   ========================================================= */

function displayEmail(
    id,
    email
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        console.warn(
            "Email element not found:",
            id
        );

        return;

    }


    if (
        email === undefined ||
        email === null ||
        String(email).trim() === ""
    ) {

        element.textContent =
            "Email not available";

        element.removeAttribute(
            "href"
        );

        return;

    }


    const cleanEmail =
        String(email).trim();


    element.textContent =
        cleanEmail;


    element.href =
        "mailto:" +
        cleanEmail;


    element.style.display =
        "inline";

}


/* =========================================================
   DISPLAY PHONE
   ========================================================= */

function displayPhone(
    id,
    phone
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        console.error(
            "PHONE HTML ELEMENT NOT FOUND:",
            id
        );

        return;

    }


    /* -----------------------------------------------------
       EMPTY PHONE
       ----------------------------------------------------- */

    if (
        phone === undefined ||
        phone === null ||
        String(phone).trim() === ""
    ) {

        element.textContent =
            "Phone number not available";


        element.removeAttribute(
            "href"
        );


        element.style.display =
            "block";


        return;

    }


    /* -----------------------------------------------------
       DISPLAY EXACT FIRESTORE VALUE
       ----------------------------------------------------- */

    const displayValue =
        String(phone).trim();


    element.textContent =
        displayValue;


    /* -----------------------------------------------------
       CREATE CALL LINK
       ----------------------------------------------------- */

    /*
     * Example Firestore value:
     *
     * +91 9083640748 (For data update only)
     *
     * becomes:
     *
     * +919083640748
     */

    const telephoneNumber =
        displayValue
            .replace(
                /[^\d+]/g,
                ""
            );


    if (
        telephoneNumber
    ) {

        element.href =
            "tel:" +
            telephoneNumber;

    }


    element.style.display =
        "block";

    element.style.visibility =
        "visible";


    element.style.opacity =
        "1";

}


/* =========================================================
   DISPLAY SOCIAL LINK
   ========================================================= */

function displaySocialLink(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        console.warn(
            "Social element not found:",
            id
        );

        return;

    }


    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {

        element.hidden =
            true;

        element.style.display =
            "none";

        element.removeAttribute(
            "href"
        );

        return;

    }


    const url =
        String(value).trim();


    /* -----------------------------------------------------
       WHATSAPP PHONE NUMBER
       ----------------------------------------------------- */

    if (
        id === "contact-whatsapp" &&
        !isHttpUrl(url)
    ) {

        const phone =
            url.replace(
                /\D/g,
                ""
            );


        if (!phone) {

            element.hidden =
                true;

            element.style.display =
                "none";

            return;

        }


        element.href =
            "https://wa.me/" +
            phone;

    }

    /* -----------------------------------------------------
       NORMAL URL
       ----------------------------------------------------- */

    else {

        if (
            !isHttpUrl(url)
        ) {

            element.hidden =
                true;

            element.style.display =
                "none";

            return;

        }


        element.href =
            url;

    }


    element.target =
        "_blank";


    element.rel =
        "noopener noreferrer";


    element.hidden =
        false;


    element.style.display =
        "inline-flex";

}


/* =========================================================
   URL VALIDATION
   ========================================================= */

function isHttpUrl(
    value
) {

    if (!value) {

        return false;

    }


    try {

        const url =
            new URL(
                String(value).trim()
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
   CONTACT FORM
   ========================================================= */

function initContactForm() {

    const form =
        document.getElementById(
            "enquiry-form"
        );


    const submitButton =
        document.getElementById(
            "submit-button"
        );


    if (!form) {

        return;

    }



    form.addEventListener(
        "submit",
        async (
            event
        ) => {

            event.preventDefault();


            /* =================================================
               GET INPUTS
               ================================================= */

            const nameInput =
                document.getElementById(
                    "name"
                );


            const emailInput =
                document.getElementById(
                    "email"
                );


            const reasonInput =
                document.getElementById(
                    "reason"
                );


            const messageInput =
                document.getElementById(
                    "message"
                );


            /* =================================================
               GET VALUES
               ================================================= */

            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "";


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";


            const reason =
                reasonInput
                    ? reasonInput.value.trim()
                    : "";


            const message =
                messageInput
                    ? messageInput.value.trim()
                    : "";


            /* =================================================
               VALIDATION
               ================================================= */

            if (!name) {

                showMessage(
                    "Please enter your name.",
                    "error"
                );


                if (nameInput) {

                    nameInput.focus();

                }


                return;

            }


            if (!email) {

                showMessage(
                    "Please enter your email address.",
                    "error"
                );


                if (emailInput) {

                    emailInput.focus();

                }


                return;

            }


            if (
                !isValidEmail(
                    email
                )
            ) {

                showMessage(
                    "Please enter a valid email address.",
                    "error"
                );


                if (emailInput) {

                    emailInput.focus();

                }


                return;

            }


            if (!message) {

                showMessage(
                    "Please enter your message.",
                    "error"
                );


                if (messageInput) {

                    messageInput.focus();

                }


                return;

            }


            /* =================================================
               DISABLE BUTTON
               ================================================= */

            if (submitButton) {

                submitButton.disabled =
                    true;


                submitButton.textContent =
                    "Sending...";

            }


            showMessage(
                "Sending your message...",
                "loading"
            );


            /* =================================================
               SAVE ENQUIRY
               ================================================= */

            try {

                const enquiryData = {

                    name:
                        name,

                    email:
                        email,

                    reason:
                        reason ||
                        "General enquiry",

                    message:
                        message,

                    createdAt:
                        serverTimestamp()

                };


                const enquiryReference =
                    await addDoc(
                        collection(
                            db,
                            "enquiries"
                        ),
                        enquiryData
                    );


                /* =================================================
                   SUCCESS
                   ================================================= */

                showMessage(
                    "Your message has been sent successfully. Thank you for contacting Roy Bari.",
                    "success"
                );


                form.reset();

            }
            catch (error) {

                console.error(
                    "ENQUIRY FIRESTORE ERROR:",
                    error
                );


                showMessage(
                    getFirebaseErrorMessage(
                        error
                    ),
                    "error"
                );

            }
            finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;


                    submitButton.textContent =
                        "Send Message";

                }

            }

        }
    );

}


/* =========================================================
   FORM MESSAGE
   ========================================================= */

function showMessage(
    message,
    type
) {

    const note =
        document.getElementById(
            "form-note"
        );


    if (!note) {

        return;

    }


    note.textContent =
        message;


    note.className =
        "form-note " +
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
   CONTACT ERROR
   ========================================================= */

function showContactUnavailable() {

    displayText(
        "contact-address",
        "",
        "Contact information unavailable"
    );


    displayText(
        "contact-email",
        "",
        "Contact information unavailable"
    );


    displayText(
        "contact-phone1",
        "",
        "Phone number unavailable"
    );


    displayText(
        "contact-phone2",
        "",
        "Phone number unavailable"
    );


    hideSocial(
        "contact-whatsapp"
    );


    hideSocial(
        "contact-facebook"
    );


    hideSocial(
        "contact-instagram"
    );


    hideSocial(
        "contact-youtube"
    );

}


/* =========================================================
   HIDE SOCIAL
   ========================================================= */

function hideSocial(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.hidden =
        true;


    element.style.display =
        "none";


    element.removeAttribute(
        "href"
    );

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
            "Your message could not be sent because Firestore permissions are blocking the request."
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
            "Firebase is not configured correctly."
        );

    }


    if (
        error?.code ===
        "network-request-failed"
    ) {

        return (
            "Network error. Please check your internet connection."
        );

    }


    return (
        "Unable to send your message. Please try again."
    );

}