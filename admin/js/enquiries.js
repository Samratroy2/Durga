/* =========================================================
   ROY BARI — ENQUIRIES
   FIREBASE FIRESTORE
   ========================================================= */

import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


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

const enquiryList =
    document.getElementById("enquiryList");


const enquiryCount =
    document.getElementById("enquiryCount");


const enquirySearch =
    document.getElementById("enquirySearch");


const enquiryMessage =
    document.getElementById("enquiryMessage");


const logoutButton =
    document.getElementById("logoutButton");


const adminEmail =
    document.getElementById("adminEmail");


/* =========================================================
   DATA
   ========================================================= */

let enquiries = [];


/* =========================================================
   LOAD ENQUIRIES
   ========================================================= */

async function loadEnquiries() {

    try {

        enquiryList.innerHTML =
            "Loading enquiries...";


        const enquiryQuery =
            query(
                collection(
                    db,
                    "enquiries"
                ),
                orderBy(
                    "createdAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                enquiryQuery
            );


        enquiries = [];


        snapshot.forEach(
            documentSnapshot => {

                enquiries.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        updateCount(
            enquiries.length
        );


        renderEnquiries(
            enquiries
        );


    } catch (error) {

        console.error(
            "Error loading enquiries:",
            error
        );


        /*
           Some old enquiry documents may not
           have createdAt. Try loading without
           orderBy.
        */

        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "enquiries"
                    )
                );


            enquiries = [];


            snapshot.forEach(
                documentSnapshot => {

                    enquiries.push({

                        id:
                            documentSnapshot.id,

                        ...documentSnapshot.data()

                    });

                }
            );


            enquiries.sort(
                (a, b) => {

                    return getTime(
                        b.createdAt
                    ) -
                    getTime(
                        a.createdAt
                    );

                }
            );


            updateCount(
                enquiries.length
            );


            renderEnquiries(
                enquiries
            );


        } catch (fallbackError) {

            console.error(
                "Fallback enquiry error:",
                fallbackError
            );


            enquiryList.innerHTML = `
                <div class="empty-state">
                    Unable to load enquiries.
                </div>
            `;

        }

    }

}


/* =========================================================
   UPDATE COUNT
   ========================================================= */

function updateCount(
    count
) {

    enquiryCount.textContent =
        count === 1
            ? "1 enquiry"
            : `${count} enquiries`;

}


/* =========================================================
   RENDER ENQUIRIES
   ========================================================= */

function renderEnquiries(
    list
) {

    if (
        !list ||
        list.length === 0
    ) {

        enquiryList.innerHTML = `
            <div class="empty-state">
                No enquiries found.
            </div>
        `;

        return;

    }


    enquiryList.innerHTML = "";


    list.forEach(
        enquiry => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "manager-item";


            const name =
                enquiry.name ||
                "Unknown";


            const email =
                enquiry.email ||
                "No email";


            const reason =
                enquiry.reason ||
                "No reason";


            const message =
                enquiry.message ||
                "No message";


            const date =
                formatDate(
                    enquiry.createdAt
                );


            item.innerHTML = `

                <div class="manager-item-main">

                    <div class="manager-item-title">

                        ${escapeHTML(
                            name
                        )}

                    </div>


                    <div class="manager-item-meta">

                        <span>
                            ${escapeHTML(
                                email
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                reason
                            )}
                        </span>

                    </div>


                    <div class="manager-item-description">

                        ${escapeHTML(
                            message
                        )}

                    </div>


                    <div class="manager-item-meta">

                        <span>
                            ${escapeHTML(
                                date
                            )}
                        </span>

                        <span>
                            ID:
                            ${escapeHTML(
                                enquiry.id
                            )}
                        </span>

                    </div>

                </div>


                <div class="manager-item-actions">

                    <button
                        type="button"
                        class="secondary-button delete-enquiry"
                        data-id="${escapeHTML(
                            enquiry.id
                        )}"
                    >
                        Delete
                    </button>

                </div>

            `;


            enquiryList.appendChild(
                item
            );

        }
    );


    attachDeleteButtons();

}


/* =========================================================
   DELETE BUTTONS
   ========================================================= */

function attachDeleteButtons() {

    document
        .querySelectorAll(
            ".delete-enquiry"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.id;


                        const enquiry =
                            enquiries.find(
                                item =>
                                    item.id === id
                            );


                        const confirmed =
                            window.confirm(
                                `Delete enquiry from ${
                                    enquiry?.name ||
                                    "this person"
                                }?`
                            );


                        if (!confirmed) {

                            return;

                        }


                        await deleteEnquiry(
                            id,
                            button
                        );

                    }
                );

            }
        );

}


/* =========================================================
   DELETE ENQUIRY
   ========================================================= */

async function deleteEnquiry(
    id,
    button
) {

    const enquiry =
        enquiries.find(
            item =>
                item.id === id
        );


    if (!enquiry) {

        showMessage(
            "Enquiry not found.",
            true
        );

        return;

    }


    try {

        button.disabled =
            true;


        button.textContent =
            "Deleting...";


        /* =================================================
           SAVE INFORMATION BEFORE DELETE
           ================================================= */

        const enquiryName =
            enquiry.name ||
            "Unknown";


        const enquiryEmail =
            enquiry.email ||
            "No email";


        const enquiryReason =
            enquiry.reason ||
            "No reason";


        const enquiryMessageText =
            enquiry.message ||
            "No message";


        /* =================================================
           DELETE FROM FIRESTORE
           ================================================= */

        await deleteDoc(
            doc(
                db,
                "enquiries",
                id
            )
        );


        /* =================================================
           ACTIVITY LOG
           ================================================= */

        await logActivity({

            action:
                "deleted",

            collectionName:
                "enquiries",

            documentId:
                id,

            title:
                `Enquiry from ${enquiryName}`,

            details:
                `Deleted enquiry from ${enquiryName}. Email: ${enquiryEmail}. Reason: ${enquiryReason}. Message: ${enquiryMessageText}`

        });


        /* =================================================
           REMOVE FROM LOCAL ARRAY
           ================================================= */

        enquiries =
            enquiries.filter(
                item =>
                    item.id !== id
            );


        /* =================================================
           UPDATE UI
           ================================================= */

        updateCount(
            enquiries.length
        );


        renderEnquiries(
            enquiries
        );


        showMessage(
            "Enquiry deleted successfully."
        );


    } catch (error) {

        console.error(
            "Delete enquiry error:",
            error
        );


        showMessage(
            "Unable to delete enquiry.",
            true
        );


        button.disabled =
            false;


        button.textContent =
            "Delete";

    }

}


/* =========================================================
   SEARCH
   ========================================================= */

if (enquirySearch) {

    enquirySearch.addEventListener(
        "input",
        () => {

            const searchValue =
                enquirySearch.value
                    .trim()
                    .toLowerCase();


            if (!searchValue) {

                renderEnquiries(
                    enquiries
                );

                return;

            }


            const filtered =
                enquiries.filter(
                    enquiry => {

                        return [

                            enquiry.name,

                            enquiry.email,

                            enquiry.reason,

                            enquiry.message,

                            enquiry.id

                        ]
                            .filter(Boolean)
                            .some(
                                value =>
                                    String(
                                        value
                                    )
                                        .toLowerCase()
                                        .includes(
                                            searchValue
                                        )
                            );

                    }
                );


            renderEnquiries(
                filtered
            );

        }
    );

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    text,
    isError = false
) {

    if (!enquiryMessage) {

        return;

    }


    enquiryMessage.textContent =
        text;


    enquiryMessage.classList.toggle(
        "error",
        isError
    );


    setTimeout(
        () => {

            enquiryMessage.textContent =
                "";

            enquiryMessage.classList.remove(
                "error"
            );

        },
        4000
    );

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "Date unavailable";

    }


    try {

        let date;


        if (
            value?.toDate
        ) {

            date =
                value.toDate();

        }

        else if (
            value?.seconds
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

            return "Date unavailable";

        }


        return date.toLocaleString(
            "en-IN",
            {
                dateStyle:
                    "medium",

                timeStyle:
                    "short"
            }
        );


    } catch {

        return "Date unavailable";

    }

}


/* =========================================================
   GET TIME
   ========================================================= */

function getTime(
    value
) {

    if (!value) {

        return 0;

    }


    if (
        value?.toDate
    ) {

        return value
            .toDate()
            .getTime();

    }


    if (
        value?.seconds
    ) {

        return Number(
            value.seconds
        ) * 1000;

    }


    const time =
        new Date(
            value
        ).getTime();


    return Number.isNaN(
        time
    )
        ? 0
        : time;

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
   LOAD ADMIN EMAIL
   ========================================================= */

const savedEmail =
    localStorage.getItem(
        "adminEmail"
    );


if (
    savedEmail &&
    adminEmail
) {

    adminEmail.textContent =
        savedEmail;

}


/* =========================================================
   START
   ========================================================= */

loadEnquiries();