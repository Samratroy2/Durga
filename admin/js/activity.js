/* =========================================================
   ROY BARI — ACTIVITY HISTORY
   FIREBASE FIRESTORE
   ========================================================= */


import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


import {
    db
} from "../firebase.js";



/* =========================================================
   ELEMENTS
   ========================================================= */

const activityList =
    document.getElementById(
        "activityList"
    );


const activityCount =
    document.getElementById(
        "activityCount"
    );


const activitySearch =
    document.getElementById(
        "activitySearch"
    );


const actionFilter =
    document.getElementById(
        "actionFilter"
    );


const collectionFilter =
    document.getElementById(
        "collectionFilter"
    );


const activityMessage =
    document.getElementById(
        "activityMessage"
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

let activities = [];



/* =========================================================
   LOAD ACTIVITY
   ========================================================= */

async function loadActivities() {

    try {

        activityList.innerHTML =
            "Loading activity history...";


        const activityQuery =
            query(
                collection(
                    db,
                    "activityLogs"
                ),
                orderBy(
                    "performedAt",
                    "desc"
                )
            );


        const snapshot =
            await getDocs(
                activityQuery
            );


        activities = [];


        snapshot.forEach(
            documentSnapshot => {

                activities.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        updateCount(
            activities.length
        );


        renderActivities(
            activities
        );


    } catch (error) {

        console.error(
            "Activity loading error:",
            error
        );


        /*
           Support older activity records
           or records without performedAt.
        */

        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "activityLogs"
                    )
                );


            activities = [];


            snapshot.forEach(
                documentSnapshot => {

                    activities.push({

                        id:
                            documentSnapshot.id,

                        ...documentSnapshot.data()

                    });

                }
            );


            activities.sort(
                (a, b) => {

                    return getTime(
                        b.performedAt ||
                        b.createdAt
                    ) -
                    getTime(
                        a.performedAt ||
                        a.createdAt
                    );

                }
            );


            updateCount(
                activities.length
            );


            renderActivities(
                activities
            );


        } catch (fallbackError) {

            console.error(
                fallbackError
            );


            activityList.innerHTML = `
                <div class="empty-state">
                    Unable to load activity history.
                </div>
            `;

        }

    }

}



/* =========================================================
   COUNT
   ========================================================= */

function updateCount(
    count
) {

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

    if (
        !list ||
        list.length === 0
    ) {

        activityList.innerHTML = `
            <div class="empty-state">
                No activity history found.
            </div>
        `;

        return;

    }


    activityList.innerHTML = "";


    list.forEach(
        activity => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "manager-item";


            const action =
                String(
                    activity.action ||
                    "unknown"
                ).toLowerCase();


            const collectionName =
                activity.collection ||
                "Unknown";


            const title =
                activity.title ||
                activity.name ||
                "Untitled";


            const performedBy =
                activity.performedBy ||
                activity.email ||
                "Unknown admin";


            const details =
                activity.details ||
                activity.description ||
                "";


            const documentId =
                activity.documentId ||
                "";


            const date =
                formatDate(
                    activity.performedAt ||
                    activity.createdAt
                );


            item.innerHTML = `

                <div class="manager-item-main">


                    <div class="manager-item-title">

                        ${getActionIcon(
                            action
                        )}

                        ${escapeHTML(
                            formatAction(
                                action
                            )
                        )}

                        —

                        ${escapeHTML(
                            formatCollection(
                                collectionName
                            )
                        )}

                    </div>


                    <div class="manager-item-meta">

                        <span>

                            ${escapeHTML(
                                title
                            )}

                        </span>

                    </div>


                    ${
                        details
                            ? `
                                <div class="manager-item-description">

                                    ${escapeHTML(
                                        details
                                    )}

                                </div>
                            `
                            : ""
                    }


                    <div class="manager-item-meta">

                        <span>

                            By:
                            <strong>
                                ${escapeHTML(
                                    performedBy
                                )}
                            </strong>

                        </span>


                        <span>

                            ${escapeHTML(
                                date
                            )}

                        </span>

                    </div>


                    ${
                        documentId
                            ? `
                                <div class="manager-item-meta">

                                    <span>

                                        Document ID:
                                        ${escapeHTML(
                                            documentId
                                        )}

                                    </span>

                                </div>
                            `
                            : ""
                    }

                </div>

            `;


            activityList.appendChild(
                item
            );

        }
    );

}



/* =========================================================
   FILTER
   ========================================================= */

function applyFilters() {

    const search =
        activitySearch
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const action =
        actionFilter
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const collectionName =
        collectionFilter
            ?.value
            .trim()
            .toLowerCase() ||
        "";


    const filtered =
        activities.filter(
            activity => {


                /* SEARCH */

                const searchable = [

                    activity.action,

                    activity.collection,

                    activity.title,

                    activity.name,

                    activity.details,

                    activity.description,

                    activity.performedBy,

                    activity.email,

                    activity.documentId

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


                /* ACTION */

                if (
                    action &&
                    String(
                        activity.action ||
                        ""
                    ).toLowerCase() !==
                    action
                ) {

                    return false;

                }


                /* COLLECTION */

                if (
                    collectionName &&
                    String(
                        activity.collection ||
                        ""
                    ).toLowerCase() !==
                    collectionName
                ) {

                    return false;

                }


                return true;

            }
        );


    updateCount(
        filtered.length
    );


    renderActivities(
        filtered
    );

}



/* =========================================================
   SEARCH
   ========================================================= */

if (activitySearch) {

    activitySearch.addEventListener(
        "input",
        applyFilters
    );

}



/* =========================================================
   ACTION FILTER
   ========================================================= */

if (actionFilter) {

    actionFilter.addEventListener(
        "change",
        applyFilters
    );

}



/* =========================================================
   COLLECTION FILTER
   ========================================================= */

if (collectionFilter) {

    collectionFilter.addEventListener(
        "change",
        applyFilters
    );

}



/* =========================================================
   ACTION NAME
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

        default:
            return action
                .charAt(0)
                .toUpperCase() +
                action.slice(1);

    }

}



/* =========================================================
   ACTION ICON
   ========================================================= */

function getActionIcon(
    action
) {

    switch (action) {

        case "created":
            return "＋";

        case "updated":
            return "✎";

        case "deleted":
            return "×";

        default:
            return "•";

    }

}



/* =========================================================
   COLLECTION NAME
   ========================================================= */

function formatCollection(
    value
) {

    const names = {

        familyMembers:
            "Family Tree",

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
            "Enquiries"

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
            /([A-Z])/g,
            " $1"
        )

        .replace(
            /[_-]/g,
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


        if (
            value?.toDate
        ) {

            date =
                value.toDate();

        } else if (
            value?.seconds
        ) {

            date =
                new Date(
                    Number(
                        value.seconds
                    ) * 1000
                );

        } else {

            date =
                new Date(value);

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
                dateStyle: "medium",
                timeStyle: "short"
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


    return Number.isNaN(time)
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
        () => {

            window.location.href =
                "./index.html";

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

loadActivities();