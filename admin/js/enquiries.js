/* =========================================================
   ROY BARI — ENQUIRIES
   FIREBASE FIRESTORE
   ========================================================= */


/* =========================================================
   FIREBASE
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
    document.getElementById(
        "enquiryList"
    );


const enquiryCount =
    document.getElementById(
        "enquiryCount"
    );


const enquirySearch =
    document.getElementById(
        "enquirySearch"
    );


const enquiryMessage =
    document.getElementById(
        "enquiryMessage"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const adminEmail =
    document.getElementById(
        "adminEmail"
    );



/* =========================================================
   DATA
   ========================================================= */

let enquiries = [];



/* =========================================================
   LOAD ENQUIRIES
   ========================================================= */

async function loadEnquiries() {

    try {

        showLoading();


        let snapshot;


        /* =================================================
           TRY SORTED QUERY
           ================================================= */

        try {

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


            snapshot =
                await getDocs(
                    enquiryQuery
                );

        }


        /* =================================================
           FALLBACK
           ================================================= */

        catch (error) {

            console.warn(
                "createdAt query failed. Loading all enquiries.",
                error
            );


            snapshot =
                await getDocs(
                    collection(
                        db,
                        "enquiries"
                    )
                );

        }



        /* =================================================
           READ DATA
           ================================================= */

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



        /* =================================================
           SORT
           ================================================= */

        enquiries.sort(
            (a, b) => {

                return (

                    getTime(
                        b.createdAt
                    )

                    -

                    getTime(
                        a.createdAt
                    )

                );

            }
        );



        /* =================================================
           RENDER
           ================================================= */

        renderEnquiries(
            enquiries
        );


    } catch (error) {

        console.error(
            "Error loading enquiries:",
            error
        );


        enquiryList.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="enquiry-empty"
                >
                    Unable to load enquiries.
                </td>

            </tr>

        `;


        updateCount(0);


        showMessage(
            "Unable to load enquiries.",
            true
        );

    }

}



/* =========================================================
   LOADING
   ========================================================= */

function showLoading() {

    enquiryList.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="enquiry-loading"
            >
                Loading enquiries...
            </td>

        </tr>

    `;

}



/* =========================================================
   UPDATE COUNT
   ========================================================= */

function updateCount(
    count
) {

    if (!enquiryCount) {
        return;
    }


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

    updateCount(
        list.length
    );


    /* =====================================================
       EMPTY
       ===================================================== */

    if (
        !list ||
        list.length === 0
    ) {

        enquiryList.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="enquiry-empty"
                >
                    No enquiries found.
                </td>

            </tr>

        `;

        return;

    }



    /* =====================================================
       CLEAR
       ===================================================== */

    enquiryList.innerHTML = "";



    /* =====================================================
       CREATE ROWS
       ===================================================== */

    list.forEach(
        enquiry => {

            const row =
                document.createElement(
                    "tr"
                );


            row.className =
                "enquiry-row";



            /* =================================================
               DATA
               ================================================= */

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


            const id =
                enquiry.id ||
                "—";



            /* =================================================
               NAME
               ================================================= */

            const nameCell =
                document.createElement(
                    "td"
                );


            nameCell.className =
                "enquiry-name";


            nameCell.textContent =
                name;



            /* =================================================
               EMAIL
               ================================================= */

            const emailCell =
                document.createElement(
                    "td"
                );


            emailCell.className =
                "enquiry-email";


            emailCell.textContent =
                email;



            /* =================================================
               REASON
               ================================================= */

            const reasonCell =
                document.createElement(
                    "td"
                );


            reasonCell.className =
                "enquiry-reason";


            reasonCell.textContent =
                reason;



            /* =================================================
               MESSAGE
               ================================================= */

            const messageCell =
                document.createElement(
                    "td"
                );


            messageCell.className =
                "enquiry-message-cell";


            messageCell.textContent =
                message;



            /* =================================================
               DATE
               ================================================= */

            const dateCell =
                document.createElement(
                    "td"
                );


            dateCell.className =
                "enquiry-date";


            dateCell.textContent =
                date;



            /* =================================================
               DOCUMENT ID
               ================================================= */

            const idCell =
                document.createElement(
                    "td"
                );


            idCell.className =
                "enquiry-id";


            idCell.textContent =
                id;



            /* =================================================
               ACTION
               ================================================= */

            const actionCell =
                document.createElement(
                    "td"
                );


            actionCell.className =
                "enquiry-actions";


            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "delete-enquiry";


            deleteButton.dataset.id =
                id;


            deleteButton.textContent =
                "Delete";


            deleteButton.addEventListener(
                "click",
                () => {

                    deleteEnquiry(
                        id,
                        deleteButton
                    );

                }
            );


            actionCell.appendChild(
                deleteButton
            );



            /* =================================================
               APPEND
               ================================================= */

            row.appendChild(
                nameCell
            );

            row.appendChild(
                emailCell
            );

            row.appendChild(
                reasonCell
            );

            row.appendChild(
                messageCell
            );

            row.appendChild(
                dateCell
            );

            row.appendChild(
                idCell
            );

            row.appendChild(
                actionCell
            );


            enquiryList.appendChild(
                row
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



    /* =====================================================
       CONFIRM
       ===================================================== */

    const confirmed =
        window.confirm(
            `Delete enquiry from ${
                enquiry.name ||
                "this person"
            }?`
        );


    if (!confirmed) {

        return;

    }



    try {

        button.disabled =
            true;


        button.textContent =
            "Deleting...";



        /* =================================================
           SAVE DATA BEFORE DELETE
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
           DELETE FIRESTORE DOCUMENT
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

        try {

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

        } catch (activityError) {

            console.warn(
                "Activity logging failed:",
                activityError
            );

        }



        /* =================================================
           REMOVE FROM LOCAL DATA
           ================================================= */

        enquiries =
            enquiries.filter(
                item =>
                    item.id !== id
            );



        /* =================================================
           RE-RENDER
           ================================================= */

        const searchValue =
            enquirySearch?.value
                .trim()
                .toLowerCase() ||
            "";


        if (searchValue) {

            applySearch();

        } else {

            renderEnquiries(
                enquiries
            );

        }



        showMessage(
            "Enquiry deleted successfully."
        );


    } catch (error) {

        console.error(
            "Delete enquiry error:",
            error
        );


        button.disabled =
            false;


        button.textContent =
            "Delete";


        showMessage(
            "Unable to delete enquiry.",
            true
        );

    }

}



/* =========================================================
   SEARCH
   ========================================================= */

if (enquirySearch) {

    enquirySearch.addEventListener(
        "input",
        applySearch
    );

}



/* =========================================================
   APPLY SEARCH
   ========================================================= */

function applySearch() {

    const searchValue =
        enquirySearch?.value
            .trim()
            .toLowerCase() ||
        "";


    if (!searchValue) {

        renderEnquiries(
            enquiries
        );

        return;

    }



    const filtered =
        enquiries.filter(
            enquiry => {

                const searchable = [

                    enquiry.name,

                    enquiry.email,

                    enquiry.reason,

                    enquiry.message,

                    enquiry.id

                ]

                    .filter(
                        value =>
                            value !== undefined &&
                            value !== null
                    )

                    .join(" ")

                    .toLowerCase();


                return searchable.includes(
                    searchValue
                );

            }
        );


    renderEnquiries(
        filtered
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


    clearTimeout(
        showMessage.timeout
    );


    showMessage.timeout =
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


        /* Firestore Timestamp */

        if (
            typeof value.toDate ===
            "function"
        ) {

            date =
                value.toDate();

        }


        /* Timestamp object */

        else if (
            value.seconds !==
            undefined
        ) {

            date =
                new Date(
                    Number(
                        value.seconds
                    ) * 1000
                );

        }


        /* Normal Date/String */

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

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    true

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


    try {

        if (
            typeof value.toDate ===
            "function"
        ) {

            return value
                .toDate()
                .getTime();

        }


        if (
            value.seconds !==
            undefined
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

    } catch {

        return 0;

    }

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


                localStorage.removeItem(
                    "adminEmail"
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
   ADMIN EMAIL
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