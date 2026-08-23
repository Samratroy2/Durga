/* =========================================================
   ROY BARI — ENQUIRIES
   FIREBASE FIRESTORE
   ========================================================= */


/* =========================================================
   FIRESTORE
   ========================================================= */

import {
    collection,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE AUTH
   ========================================================= */

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

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
   MODAL ELEMENTS
   ========================================================= */

const enquiryModal =
    document.getElementById("enquiryModal");


const closeEnquiryModal =
    document.getElementById(
        "closeEnquiryModal"
    );


const modalCloseButton =
    document.getElementById(
        "modalCloseButton"
    );


const modalStatusButton =
    document.getElementById(
        "modalStatusButton"
    );


const detailName =
    document.getElementById(
        "detailName"
    );


const detailEmail =
    document.getElementById(
        "detailEmail"
    );


const detailReason =
    document.getElementById(
        "detailReason"
    );


const detailDate =
    document.getElementById(
        "detailDate"
    );


const detailMessage =
    document.getElementById(
        "detailMessage"
    );


/* =========================================================
   DATA
   ========================================================= */

let enquiries = [];

let currentEnquiryId = null;


/* =========================================================
   LOAD ENQUIRIES
   ========================================================= */

async function loadEnquiries() {

    if (!enquiryList) {

        console.error(
            "enquiryList element not found."
        );

        return;

    }


    enquiryList.innerHTML = `

        <tr>

            <td
                colspan="6"
                class="enquiry-loading"
            >
                Loading enquiries...
            </td>

        </tr>

    `;


    try {

        let snapshot;


        /* =================================================
           FIRST TRY — SORT BY CREATED AT
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


        /* =========================================================
        SORT ENQUIRIES
        UNREAD / NEW → TOP
        READ → BOTTOM
        WITHIN EACH GROUP → NEWEST FIRST
        ========================================================= */

        enquiries.sort(
            (a, b) => {

                const aRead =
                    a.read === true;

                const bRead =
                    b.read === true;


                /* -------------------------------------------------
                UNREAD ALWAYS COMES BEFORE READ
                ------------------------------------------------- */

                if (
                    aRead !== bRead
                ) {

                    return aRead
                        ? 1
                        : -1;

                }


                /* -------------------------------------------------
                SAME STATUS:
                NEWEST FIRST
                ------------------------------------------------- */

                return (
                    getTime(
                        b.createdAt
                    ) -
                    getTime(
                        a.createdAt
                    )
                );

            }
        );

        /* =================================================
           RENDER
           ================================================= */

        applySearch();


    }


    catch (error) {

        console.error(
            "Error loading enquiries:",
            error
        );


        enquiryList.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="enquiry-empty"
                >
                    Unable to load enquiries.
                </td>

            </tr>

        `;


        showMessage(
            "Unable to load enquiries.",
            true
        );

    }

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

    if (!enquiryList) {
        return;
    }


    if (
        !list ||
        list.length === 0
    ) {

        enquiryList.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    class="enquiry-empty"
                >
                    No enquiries found.
                </td>

            </tr>

        `;


        updateCount(0);

        return;

    }


    updateCount(
        list.length
    );


    enquiryList.innerHTML = "";


    list.forEach(
        enquiry => {

            const row =
                document.createElement(
                    "tr"
                );


            /* =================================================
               READ STATUS
               ================================================= */

            const isRead =
                enquiry.read === true;


            if (!isRead) {

                row.classList.add(
                    "unread-row"
                );

            }


            /* =================================================
               NAME
               ================================================= */

            const nameCell =
                document.createElement(
                    "td"
                );


            nameCell.className =
                "enquiry-name";


            if (!isRead) {

                const indicator =
                    document.createElement(
                        "span"
                    );


                indicator.className =
                    "unread-indicator";


                nameCell.appendChild(
                    indicator
                );

            }


            const nameText =
                document.createTextNode(
                    enquiry.name ||
                    "Unknown"
                );


            nameCell.appendChild(
                nameText
            );


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
                enquiry.email ||
                "No email";


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
                enquiry.reason ||
                "No reason";


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
                formatDate(
                    enquiry.createdAt
                );


            /* =================================================
               STATUS
               ================================================= */

            const statusCell =
                document.createElement(
                    "td"
                );


            statusCell.className =
                "enquiry-status";


            const statusBadge =
                document.createElement(
                    "span"
                );


            statusBadge.className =
                isRead
                    ? "status-badge read"
                    : "status-badge unread";


            statusBadge.textContent =
                isRead
                    ? "✓ Read"
                    : "● Unread";


            statusCell.appendChild(
                statusBadge
            );


            /* =================================================
               ACTIONS
               ================================================= */

            const actionCell =
                document.createElement(
                    "td"
                );


            actionCell.className =
                "enquiry-actions";


            /* VIEW BUTTON */

            const viewButton =
                document.createElement(
                    "button"
                );


            viewButton.type =
                "button";


            viewButton.className =
                "enquiry-action-button";


            viewButton.textContent =
                "View";


            viewButton.addEventListener(
                "click",
                () => {

                    openEnquiry(
                        enquiry.id
                    );

                }
            );


            actionCell.appendChild(
                viewButton
            );


            /* =================================================
               READ / UNREAD BUTTON
               ================================================= */

            const statusButton =
                document.createElement(
                    "button"
                );


            statusButton.type =
                "button";


            statusButton.className =
                isRead
                    ? "enquiry-action-button unread-button"
                    : "enquiry-action-button read-button";


            statusButton.textContent =
                isRead
                    ? "Mark Unread"
                    : "Mark Read";


            statusButton.addEventListener(
                "click",
                async () => {

                    await toggleReadStatus(
                        enquiry.id,
                        !isRead,
                        statusButton
                    );

                }
            );


            actionCell.appendChild(
                statusButton
            );


            /* =================================================
               DELETE BUTTON
               ================================================= */

            const deleteButton =
                document.createElement(
                    "button"
                );


            deleteButton.type =
                "button";


            deleteButton.className =
                "enquiry-action-button delete-button";


            deleteButton.textContent =
                "Delete";


            deleteButton.addEventListener(
                "click",
                async () => {

                    await deleteEnquiry(
                        enquiry.id,
                        deleteButton
                    );

                }
            );


            actionCell.appendChild(
                deleteButton
            );


            /* =================================================
               APPEND ROW
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
                dateCell
            );


            row.appendChild(
                statusCell
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
   SEARCH
   ========================================================= */

function applySearch() {

    const search =
        enquirySearch?.value
            .trim()
            .toLowerCase() ||
        "";


    if (!search) {

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

                    .filter(
                        value =>
                            value !== undefined &&
                            value !== null
                    )

                    .some(
                        value =>
                            String(
                                value
                            )
                                .toLowerCase()
                                .includes(
                                    search
                                )
                    );

            }
        );


    renderEnquiries(
        filtered
    );

}


enquirySearch?.addEventListener(
    "input",
    applySearch
);


/* =========================================================
   OPEN ENQUIRY
   ========================================================= */

async function openEnquiry(
    id
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


    currentEnquiryId =
        id;


    /* =================================================
       FILL MODAL
       ================================================= */

    if (detailName) {

        detailName.textContent =
            enquiry.name ||
            "Unknown";

    }


    if (detailEmail) {

        detailEmail.textContent =
            enquiry.email ||
            "No email";

    }


    if (detailReason) {

        detailReason.textContent =
            enquiry.reason ||
            "No reason";

    }


    if (detailDate) {

        detailDate.textContent =
            formatDate(
                enquiry.createdAt
            );

    }


    if (detailMessage) {

        detailMessage.textContent =
            enquiry.message ||
            "No message";

    }


    updateModalStatusButton(
        enquiry.read === true
    );


    /* =================================================
       OPEN MODAL
       ================================================= */

    enquiryModal?.classList.add(
        "open"
    );


    document.body.style.overflow =
        "hidden";


    /* =================================================
       AUTOMATICALLY MARK READ
       ================================================= */

    if (
        enquiry.read !== true
    ) {

        await toggleReadStatus(
            id,
            true
        );

    }

}


/* =========================================================
   TOGGLE READ STATUS
   ========================================================= */

async function toggleReadStatus(
    id,
    newStatus,
    button = null
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

        if (button) {

            button.disabled =
                true;


            button.textContent =
                "Saving...";

        }


        await updateDoc(
            doc(
                db,
                "enquiries",
                id
            ),
            {
                read:
                    newStatus
            }
        );


        /* =================================================
           UPDATE LOCAL DATA
           ================================================= */

        enquiry.read =
            newStatus;


        /* =================================================
           UPDATE MODAL
           ================================================= */

        if (
            currentEnquiryId === id
        ) {

            updateModalStatusButton(
                newStatus
            );

        }


        /* =================================================
           UPDATE TABLE
           ================================================= */

        applySearch();


        showMessage(
            newStatus
                ? "Enquiry marked as read."
                : "Enquiry marked as unread."
        );

    }


    catch (error) {

        console.error(
            "Read status update error:",
            error
        );


        showMessage(
            "Unable to update enquiry status.",
            true
        );

    }


    finally {

        if (button) {

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   MODAL STATUS BUTTON
   ========================================================= */

function updateModalStatusButton(
    isRead
) {

    if (!modalStatusButton) {
        return;
    }


    modalStatusButton.textContent =
        isRead
            ? "Mark as Unread"
            : "Mark as Read";


    modalStatusButton.className =
        isRead
            ? "enquiry-action-button unread-button"
            : "enquiry-action-button read-button";

}


/* =========================================================
   MODAL STATUS BUTTON CLICK
   ========================================================= */

modalStatusButton?.addEventListener(
    "click",
    async () => {

        if (!currentEnquiryId) {
            return;
        }


        const enquiry =
            enquiries.find(
                item =>
                    item.id ===
                    currentEnquiryId
            );


        if (!enquiry) {
            return;
        }


        await toggleReadStatus(
            currentEnquiryId,
            enquiry.read !== true
        );

    }
);


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeModal() {

    enquiryModal?.classList.remove(
        "open"
    );


    document.body.style.overflow =
        "";


    currentEnquiryId =
        null;

}


closeEnquiryModal?.addEventListener(
    "click",
    closeModal
);


modalCloseButton?.addEventListener(
    "click",
    closeModal
);


/* =========================================================
   CLICK OUTSIDE MODAL
   ========================================================= */

enquiryModal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            enquiryModal
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   ESC KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            enquiryModal?.classList.contains(
                "open"
            )
        ) {

            closeModal();

        }

    }
);


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
           DELETE
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

        }

        catch (logError) {

            console.error(
                "Activity log error:",
                logError
            );

        }


        /* =================================================
           REMOVE LOCAL
           ================================================= */

        enquiries =
            enquiries.filter(
                item =>
                    item.id !== id
            );


        /* =================================================
           CLOSE MODAL IF OPEN
           ================================================= */

        if (
            currentEnquiryId === id
        ) {

            closeModal();

        }


        /* =================================================
           UPDATE UI
           ================================================= */

        applySearch();


        showMessage(
            "Enquiry deleted successfully."
        );

    }


    catch (error) {

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


    enquiryMessage.className =
        isError
            ? "error"
            : "success";


    setTimeout(
        () => {

            if (enquiryMessage) {

                enquiryMessage.textContent =
                    "";

                enquiryMessage.className =
                    "";

            }

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
            typeof value.toDate ===
            "function"
        ) {

            date =
                value.toDate();

        }

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

    }

    catch {

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

    }

    catch {

        return 0;

    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

logoutButton?.addEventListener(
    "click",
    async () => {

        try {

            logoutButton.disabled =
                true;


            logoutButton.textContent =
                "Logging out...";


            await signOut(
                auth
            );


            window.location.replace(
                "./index.html"
            );

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );


            logoutButton.disabled =
                false;


            logoutButton.textContent =
                "Logout";

        }

    }
);


/* =========================================================
   ADMIN EMAIL
   ========================================================= */

try {

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

}

catch (error) {

    console.warn(
        "Could not read admin email."
    );

}


/* =========================================================
   START
   ========================================================= */

loadEnquiries();