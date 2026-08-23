/* =========================================================
   ROY BARI — ACTIVITY HISTORY
   FIREBASE FIRESTORE
   ========================================================= */


/* =========================================================
   FIREBASE
   ========================================================= */

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    db,
    auth
} from "../firebase.js";


/* =========================================================
   ELEMENTS
   ========================================================= */

const activityList =
    document.getElementById("activityList");

const activityCount =
    document.getElementById("activityCount");

const activitySearch =
    document.getElementById("activitySearch");

const actionFilter =
    document.getElementById("actionFilter");

const collectionFilter =
    document.getElementById("collectionFilter");

const activityMessage =
    document.getElementById("activityMessage");

const logoutButton =
    document.getElementById("logoutButton");

const adminEmail =
    document.getElementById("adminEmail");


/* =========================================================
   DATA
   ========================================================= */

let activities = [];


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    text,
    type = "info"
) {

    if (!activityMessage) {
        return;
    }

    activityMessage.textContent = text;

    activityMessage.className =
        `message-${type}`;
}


/* =========================================================
   LOAD ALL ACTIVITIES
   ========================================================= */

async function loadActivities() {

    if (!activityList) {

        console.error(
            "activityList element not found."
        );

        return;
    }


    /* =====================================================
       LOADING
       ===================================================== */

    activityList.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="activity-loading"
            >
                Loading activity history...
            </td>

        </tr>

    `;


    try {

        console.log(
            "Loading activityLogs..."
        );


        /* =================================================
           GET ENTIRE COLLECTION
           
           IMPORTANT:
           No orderBy() is used.
           
           This makes sure documents without
           performedAt are also loaded.
           ================================================= */

        const activityRef =
            collection(
                db,
                "activityLogs"
            );


        const snapshot =
            await getDocs(
                activityRef
            );


        console.log(
            "Total activity documents:",
            snapshot.size
        );


        /* =================================================
           RESET ARRAY
           ================================================= */

        activities = [];


        /* =================================================
           READ EVERY DOCUMENT
           ================================================= */

        snapshot.forEach(
            documentSnapshot => {

                const data =
                    documentSnapshot.data();


                console.log(
                    "Activity document:",
                    documentSnapshot.id,
                    data
                );


                activities.push({

                    id:
                        documentSnapshot.id,

                    ...data

                });

            }
        );


        /* =================================================
           SORT NEWEST FIRST
           ================================================= */

        activities.sort(
            (a, b) => {

                const timeA =
                    getTime(
                        a.performedAt ||
                        a.createdAt ||
                        a.updatedAt ||
                        a.timestamp
                    );


                const timeB =
                    getTime(
                        b.performedAt ||
                        b.createdAt ||
                        b.updatedAt ||
                        b.timestamp
                    );


                return timeB - timeA;

            }
        );


        /* =================================================
           RENDER ALL
           ================================================= */

        renderActivities(
            activities
        );


        /* =================================================
           MESSAGE
           ================================================= */

        if (
            activities.length === 0
        ) {

            showMessage(
                "No activity logs found in Firestore.",
                "info"
            );

        }

        else {

            showMessage(
                `${activities.length} activity logs loaded.`,
                "success"
            );

        }


        console.log(
            "Activities loaded:",
            activities.length
        );

    }

    catch (error) {

        console.error(
            "Activity loading error:",
            error
        );


        activityList.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="activity-empty"
                >
                    Unable to load activity history.
                </td>

            </tr>

        `;


        updateCount(0);


        showMessage(
            error.message ||
            "Unable to load activity history.",
            "error"
        );

    }

}


/* =========================================================
   UPDATE COUNT
   ========================================================= */

function updateCount(
    count
) {

    if (!activityCount) {
        return;
    }


    activityCount.textContent =
        count === 1
            ? "1 activity"
            : `${count} activities`;

}


/* =========================================================
   RENDER ACTIVITIES
   ========================================================= */

function renderActivities(
    list
) {

    if (!activityList) {
        return;
    }


    /* =====================================================
       EMPTY
       ===================================================== */

    if (
        !list ||
        list.length === 0
    ) {

        activityList.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="activity-empty"
                >
                    No activity history found.
                </td>

            </tr>

        `;


        updateCount(0);

        return;
    }


    /* =====================================================
       COUNT
       ===================================================== */

    updateCount(
        list.length
    );


    /* =====================================================
       CLEAR TABLE
       ===================================================== */

    activityList.innerHTML = "";


    /* =====================================================
       CREATE EVERY ROW
       ===================================================== */

    list.forEach(
        activity => {

            const row =
                document.createElement(
                    "tr"
                );


            row.className =
                "activity-row";


            /* =================================================
               ACTION
               ================================================= */

            const action =
                String(
                    activity.action ||
                    "unknown"
                )
                    .toLowerCase();


            /* =================================================
               COLLECTION
               ================================================= */

            const collectionName =
                activity.collection ||
                activity.collectionName ||
                activity.section ||
                "Unknown";


            /* =================================================
               TITLE
               ================================================= */

            const title =
                activity.title ||
                activity.name ||
                activity.activity ||
                "Untitled";


            /* =================================================
               DETAILS
               ================================================= */

            const details =
                activity.details ||
                activity.description ||
                activity.message ||
                "—";


            /* =================================================
               ADMIN
               ================================================= */

            const performedBy =
                activity.performedBy ||
                activity.email ||
                activity.adminEmail ||
                activity.userEmail ||
                "Unknown admin";


            /* =================================================
               DOCUMENT ID
               ================================================= */

            const documentId =
                activity.documentId ||
                activity.docId ||
                activity.recordId ||
                activity.id ||
                "—";


            /* =================================================
               DATE
               ================================================= */

            const date =
                formatDate(
                    activity.performedAt ||
                    activity.createdAt ||
                    activity.updatedAt ||
                    activity.timestamp
                );


            /* =================================================
               ACTION CELL
               ================================================= */

            const actionCell =
                document.createElement(
                    "td"
                );


            actionCell.className =
                "activity-action-cell";


            const actionIcon =
                document.createElement(
                    "span"
                );


            actionIcon.className =
                `activity-history-icon ${getActionClass(action)}`;


            actionIcon.textContent =
                getActionIcon(action);


            actionIcon.title =
                formatAction(action);


            actionCell.appendChild(
                actionIcon
            );


            /* =================================================
               SECTION CELL
               ================================================= */

            const sectionCell =
                document.createElement(
                    "td"
                );


            sectionCell.className =
                "activity-section-cell";


            const sectionWrapper =
                document.createElement(
                    "div"
                );


            sectionWrapper.className =
                "activity-section-wrapper";


            const sectionIcon =
                document.createElement(
                    "span"
                );


            sectionIcon.className =
                "activity-section-icon";


            sectionIcon.textContent =
                getSectionIcon(
                    collectionName
                );


            sectionIcon.title =
                formatCollection(
                    collectionName
                );


            const sectionLabel =
                document.createElement(
                    "span"
                );


            sectionLabel.className =
                "activity-section-label";


            sectionLabel.textContent =
                formatCollection(
                    collectionName
                );


            sectionWrapper.appendChild(
                sectionIcon
            );


            sectionWrapper.appendChild(
                sectionLabel
            );


            sectionCell.appendChild(
                sectionWrapper
            );


            /* =================================================
               ACTIVITY CELL
               ================================================= */

            const activityCell =
                document.createElement(
                    "td"
                );


            activityCell.className =
                "activity-title-cell";


            activityCell.textContent =
                title;


            /* =================================================
               DETAILS CELL
               ================================================= */

            const detailsCell =
                document.createElement(
                    "td"
                );


            detailsCell.className =
                "activity-details-cell";


            detailsCell.textContent =
                details;


            /* =================================================
               ADMIN CELL
               ================================================= */

            const adminCell =
                document.createElement(
                    "td"
                );


            adminCell.className =
                "activity-admin-cell";


            adminCell.textContent =
                performedBy;


            /* =================================================
               DATE CELL
               ================================================= */

            const dateCell =
                document.createElement(
                    "td"
                );


            dateCell.className =
                "activity-date-cell";


            dateCell.textContent =
                date;


            /* =================================================
               DOCUMENT ID CELL
               ================================================= */

            const documentCell =
                document.createElement(
                    "td"
                );


            documentCell.className =
                "activity-document-cell";


            documentCell.textContent =
                documentId;


            /* =================================================
               APPEND CELLS
               ================================================= */

            row.appendChild(
                actionCell
            );


            row.appendChild(
                sectionCell
            );


            row.appendChild(
                activityCell
            );


            row.appendChild(
                detailsCell
            );


            row.appendChild(
                adminCell
            );


            row.appendChild(
                dateCell
            );


            row.appendChild(
                documentCell
            );


            /* =================================================
               APPEND ROW
               ================================================= */

            activityList.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   APPLY FILTERS
   ========================================================= */

function applyFilters() {

    const search =
        activitySearch?.value
            .trim()
            .toLowerCase() ||
        "";


    const action =
        actionFilter?.value
            .trim()
            .toLowerCase() ||
        "";


    const selectedCollection =
        collectionFilter?.value
            .trim()
            .toLowerCase() ||
        "";


    const filtered =
        activities.filter(
            activity => {


                /* =========================================
                   SEARCH
                   ========================================= */

                const searchable = [

                    activity.action,

                    activity.collection,

                    activity.collectionName,

                    activity.section,

                    activity.title,

                    activity.name,

                    activity.activity,

                    activity.details,

                    activity.description,

                    activity.message,

                    activity.performedBy,

                    activity.email,

                    activity.adminEmail,

                    activity.userEmail,

                    activity.documentId,

                    activity.docId,

                    activity.recordId

                ]

                    .filter(
                        value =>
                            value !== undefined &&
                            value !== null
                    )

                    .join(" ")

                    .toLowerCase();


                if (
                    search &&
                    !searchable.includes(
                        search
                    )
                ) {

                    return false;

                }


                /* =========================================
                   ACTION FILTER
                   ========================================= */

                if (action) {

                    const currentAction =
                        String(
                            activity.action ||
                            ""
                        )
                            .toLowerCase();


                    if (
                        currentAction !==
                        action
                    ) {

                        return false;

                    }

                }


                /* =========================================
                   COLLECTION FILTER
                   ========================================= */

                if (
                    selectedCollection
                ) {

                    const currentCollection =
                        String(
                            activity.collection ||
                            activity.collectionName ||
                            activity.section ||
                            ""
                        )
                            .toLowerCase();


                    if (
                        currentCollection !==
                        selectedCollection
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderActivities(
        filtered
    );

}


/* =========================================================
   SEARCH
   ========================================================= */

activitySearch?.addEventListener(
    "input",
    applyFilters
);


/* =========================================================
   ACTION FILTER
   ========================================================= */

actionFilter?.addEventListener(
    "change",
    applyFilters
);


/* =========================================================
   COLLECTION FILTER
   ========================================================= */

collectionFilter?.addEventListener(
    "change",
    applyFilters
);


/* =========================================================
   FORMAT ACTION
   ========================================================= */

function formatAction(
    action
) {

    switch (action) {

        case "created":
            return "Added";

        case "updated":
            return "Updated";

        case "deleted":
            return "Deleted";

        case "login":
            return "Login";

        default:

            return (
                action
                    .charAt(0)
                    .toUpperCase() +
                action.slice(1)
            );

    }

}


/* =========================================================
   ACTION ICON
   ========================================================= */

function getActionIcon(
    action
) {

    const value =
        String(
            action || ""
        )
            .toLowerCase();


    if (
        value.includes("create") ||
        value.includes("add")
    ) {

        return "➕";

    }


    if (
        value.includes("update") ||
        value.includes("edit")
    ) {

        return "✏️";

    }


    if (
        value.includes("delete") ||
        value.includes("remove")
    ) {

        return "🗑️";

    }


    if (
        value.includes("login")
    ) {

        return "🔐";

    }


    return "📝";

}


/* =========================================================
   ACTION CLASS
   ========================================================= */

function getActionClass(
    action
) {

    const value =
        String(
            action || ""
        )
            .toLowerCase();


    if (
        value.includes("create") ||
        value.includes("add")
    ) {

        return "created";

    }


    if (
        value.includes("update") ||
        value.includes("edit")
    ) {

        return "updated";

    }


    if (
        value.includes("delete") ||
        value.includes("remove")
    ) {

        return "deleted";

    }


    return "other";

}


/* =========================================================
   SECTION ICON
   ========================================================= */

function getSectionIcon(
    collectionName
) {

    const value =
        String(
            collectionName || ""
        )
            .toLowerCase();


    if (
        value.includes("family")
    ) {

        return "👨‍👩‍👧";

    }


    if (
        value.includes("event")
    ) {

        return "🪔";

    }


    if (
        value.includes("bhog")
    ) {

        return "🍚";

    }


    if (
        value.includes("archive")
    ) {

        return "📜";

    }


    if (
        value.includes("gallery")
    ) {

        return "📷";

    }


    if (
        value.includes("memory")
    ) {

        return "♡";

    }


    if (
        value.includes("ritual")
    ) {

        return "ॐ";

    }


    if (
        value.includes("timeline")
    ) {

        return "📅";

    }


    if (
        value.includes("enquir")
    ) {

        return "✉️";

    }


    if (
        value.includes("activity")
    ) {

        return "🕘";

    }


    return "📝";

}


/* =========================================================
   FORMAT COLLECTION
   ========================================================= */

function formatCollection(
    value
) {

    const names = {

        familyMembers:
            "Family Tree",

        familyRelationships:
            "Family Relationship",

        events:
            "Puja Events",

        bhog:
            "Bhog",

        archive:
            "Archive",

        gallery:
            "Gallery",

        memories:
            "Memories",

        rituals:
            "Rituals",

        timeline:
            "Timeline",

        enquiries:
            "Enquiries",

        activityLogs:
            "Activity History"

    };


    return (
        names[value] ||
        formatFieldName(value)
    );

}


/* =========================================================
   FORMAT FIELD NAME
   ========================================================= */

function formatFieldName(
    value
) {

    return String(
        value || ""
    )

        .replace(
            /([a-z])([A-Z])/g,
            "$1 $2"
        )

        .replace(
            /[\\_-]/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim()

        .replace(
            /^./,
            char =>
                char.toUpperCase()
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


        /* =================================================
           FIRESTORE TIMESTAMP
           ================================================= */

        if (
            typeof value.toDate ===
            "function"
        ) {

            date =
                value.toDate();

        }


        /* =================================================
           TIMESTAMP-LIKE OBJECT
           ================================================= */

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


        /* =================================================
           NORMAL DATE / STRING
           ================================================= */

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

    catch (error) {

        console.error(
            "Date formatting error:",
            error
        );


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

        /* =================================================
           FIRESTORE TIMESTAMP
           ================================================= */

        if (
            typeof value.toDate ===
            "function"
        ) {

            return value
                .toDate()
                .getTime();

        }


        /* =================================================
           TIMESTAMP-LIKE OBJECT
           ================================================= */

        if (
            value.seconds !==
            undefined
        ) {

            return Number(
                value.seconds
            ) * 1000;

        }


        /* =================================================
           NORMAL DATE
           ================================================= */

        const time =
            new Date(
                value
            ).getTime();


        return Number.isNaN(time)
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

            await signOut(
                auth
            );


            localStorage.removeItem(
                "adminEmail"
            );


            window.location.href =
                "./index.html";

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );


            showMessage(
                "Unable to logout.",
                "error"
            );

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

loadActivities();