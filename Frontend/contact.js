/* =========================================================
   ROY BARI — CONTACT
   Firebase / Firestore

   Firestore structure:

   visit
   ├── contact
   │    ├── address
   │    ├── email
   │    ├── facebook
   │    ├── instagram
   │    ├── phone
   │    ├── whatsapp
   │    └── youtube
   │
   └── main

   enquiries
   └── automatically created by contact form
   ========================================================= */


import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import {
    db
} from "./firebase.js";



/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "================================="
        );

        console.log(
            "ROY BARI — CONTACT JS"
        );

        console.log(
            "Firestore:",
            db
        );

        console.log(
            "================================="
        );


        loadContactInformation();

        initContactForm();

    }
);



/* =========================================================
   LOAD CONTACT INFORMATION
   ========================================================= */

async function loadContactInformation() {

    console.log(
        "Loading contact information..."
    );


    try {

        /*
         * Firestore structure:
         *
         * visit/contact
         *
         * visit = collection
         * contact = document
         */

        const contactReference =
            doc(
                db,
                "visit",
                "contact"
            );


        const contactSnapshot =
            await getDoc(
                contactReference
            );


        console.log(
            "Contact document exists:",
            contactSnapshot.exists()
        );


        if (!contactSnapshot.exists()) {

            console.warn(
                "visit/contact document does not exist."
            );

            showContactFallback();

            return;

        }


        const data =
            contactSnapshot.data();


        console.log(
            "Contact information:",
            data
        );


        /* =================================================
           ADDRESS
           ================================================= */

        setText(
            "contact-address",
            data.address
        );


        /* =================================================
           EMAIL
           ================================================= */

        setText(
            "contact-email",
            data.email
        );


        /*
         * Make email clickable.
         */

        setMailLink(
            "contact-email",
            data.email
        );


        /* =================================================
           PHONE
           ================================================= */

        setText(
            "contact-phone",
            data.phone
        );


        /*
         * Make phone number clickable.
         */

        setPhoneLink(
            "contact-phone",
            data.phone
        );


        /* =================================================
           WHATSAPP
           ================================================= */

        /*
         * If whatsapp exists:
         *
         * whatsapp: "https://wa.me/919083640748"
         *
         * use it.
         *
         * Otherwise:
         *
         * use phone number.
         */

        const whatsappValue =
            data.whatsapp ||
            data.phone ||
            "";


        setLink(
            "contact-whatsapp",
            getWhatsAppUrl(
                whatsappValue
            )
        );


        /* =================================================
           YOUTUBE
           ================================================= */

        setLink(
            "contact-youtube",
            data.youtube
        );


        /* =================================================
           FACEBOOK
           ================================================= */

        setLink(
            "contact-facebook",
            data.facebook
        );


        /* =================================================
           INSTAGRAM
           ================================================= */

        setLink(
            "contact-instagram",
            data.instagram
        );


        /*
         * Alternative IDs supported.
         */

        setText(
            "address",
            data.address
        );


        setText(
            "email",
            data.email
        );


        setText(
            "phone",
            data.phone
        );


        console.log(
            "Contact information loaded successfully."
        );

    }


    catch (error) {

        console.error(
            "CONTACT FIREBASE ERROR:",
            error
        );


        showContactFallback();

    }

}



/* =========================================================
   SET TEXT
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        element.textContent =
            "Not available";

        return;

    }


    element.textContent =
        value;

}



/* =========================================================
   SET NORMAL LINK
   ========================================================= */

function setLink(
    id,
    url
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    if (
        !url ||
        !isValidUrl(url)
    ) {

        /*
         * Hide the button if the
         * Firestore field is empty.
         */

        element.style.display =
            "none";

        return;

    }


    element.href =
        url;


    element.target =
        "_blank";


    element.rel =
        "noopener noreferrer";


    element.style.display =
        "";

}



/* =========================================================
   SET EMAIL LINK
   ========================================================= */

function setMailLink(
    id,
    email
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    if (!email) {

        element.textContent =
            "Not available";

        return;

    }


    element.textContent =
        email;


    element.href =
        "mailto:" + email;


    element.style.display =
        "";

}



/* =========================================================
   SET PHONE LINK
   ========================================================= */

function setPhoneLink(
    id,
    phone
) {

    const element =
        document.getElementById(id);


    if (!element) {
        return;
    }


    if (!phone) {

        element.textContent =
            "Not available";

        return;

    }


    element.textContent =
        phone;


    const cleanPhone =
        String(phone)
            .replace(
                /[^\d+]/g,
                ""
            );


    element.href =
        "tel:" + cleanPhone;


    element.style.display =
        "";

}



/* =========================================================
   WHATSAPP URL
   ========================================================= */

function getWhatsAppUrl(
    value
) {

    if (!value) {
        return "";
    }


    /*
     * If Firestore contains:
     *
     * https://wa.me/919083640748
     *
     * use it directly.
     */

    if (
        String(value)
            .startsWith("http")
    ) {

        return value;

    }


    /*
     * If Firestore contains:
     *
     * +91 9083640748
     *
     * convert it into:
     *
     * https://wa.me/919083640748
     */

    const phone =
        String(value)
            .replace(
                /\D/g,
                ""
            );


    if (!phone) {
        return "";
    }


    return (
        "https://wa.me/" +
        phone
    );

}



/* =========================================================
   URL VALIDATION
   ========================================================= */

function isValidUrl(
    value
) {

    if (!value) {
        return false;
    }


    try {

        const url =
            new URL(value);


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

        console.log(
            "No enquiry form found."
        );

        return;

    }


    console.log(
        "Contact form initialized."
    );


    /* =====================================================
       SUBMIT
       ===================================================== */

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /* =============================================
               GET FORM VALUES
               ============================================= */

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


            /* =============================================
               VALIDATION
               ============================================= */

            if (!name) {

                showMessage(
                    "Please enter your name.",
                    "error"
                );

                return;

            }


            if (!email) {

                showMessage(
                    "Please enter your email.",
                    "error"
                );

                return;

            }


            if (!isValidEmail(email)) {

                showMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                return;

            }


            if (!message) {

                showMessage(
                    "Please enter your message.",
                    "error"
                );

                return;

            }


            /* =============================================
               DISABLE BUTTON
               ============================================= */

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


            /* =============================================
               SAVE TO FIRESTORE
               ============================================= */

            try {

                console.log(
                    "Saving enquiry to Firestore..."
                );


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


                console.log(
                    "Enquiry created successfully."
                );


                console.log(
                    "Document ID:",
                    enquiryReference.id
                );


                /* =========================================
                   SUCCESS
                   ========================================= */

                showMessage(
                    "Your message has been sent successfully. Thank you for contacting Roy Bari.",
                    "success"
                );


                form.reset();

            }


            catch (error) {

                console.error(
                    "FIRESTORE ENQUIRY ERROR:",
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
   SHOW FORM MESSAGE
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

        console.log(
            `[${type}] ${message}`
        );

        return;

    }


    note.textContent =
        message;


    note.className =
        "form-note " + type;

}



/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}



/* =========================================================
   FALLBACK CONTACT INFORMATION
   ========================================================= */

function showContactFallback() {

    setText(
        "contact-address",
        "Nohari Roy Bari, Chhota Nohari, West Bengal 721121"
    );


    setText(
        "contact-email",
        "Contact information unavailable"
    );


    setText(
        "contact-phone",
        "Contact information unavailable"
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
            "Your message could not be saved because Firestore permissions are blocking the request."
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