/* =========================================================
   ROY BARI — ADMIN DASHBOARD
   FIREBASE AUTH + FIRESTORE
   ========================================================= */


/* =========================================================
   FIREBASE AUTH
   ========================================================= */

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


/* =========================================================
   FIRESTORE
   ========================================================= */

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

import {
    auth,
    db
} from "../firebase.js";



/* =========================================================
   DOM — ADMIN
   ========================================================= */

const adminEmail =
    document.getElementById(
        "adminEmail"
    );


const userAvatar =
    document.getElementById(
        "userAvatar"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );



/* =========================================================
   DOM — COUNTS
   ========================================================= */

const familyCount =
    document.getElementById(
        "familyCount"
    );


const eventsCount =
    document.getElementById(
        "eventsCount"
    );


const archiveCount =
    document.getElementById(
        "archiveCount"
    );


const galleryCount =
    document.getElementById(
        "galleryCount"
    );


const timelineCount =
    document.getElementById(
        "timelineCount"
    );


const enquiriesCount =
    document.getElementById(
        "enquiriesCount"
    );


const activityCount =
    document.getElementById(
        "activityCount"
    );



/* =========================================================
   DOM — ACTIVITY
   ========================================================= */

const recentActivityList =
    document.getElementById(
        "recentActivityList"
    );


const activitySummary =
    document.getElementById(
        "activitySummary"
    );



/* =========================================================
   DOM — FIREBASE STATUS
   ========================================================= */

const statusDot =
    document.getElementById(
        "statusDot"
    );


const statusText =
    document.getElementById(
        "statusText"
    );


const statusRight =
    document.getElementById(
        "statusRight"
    );



/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        /* -------------------------------------------------
           USER NOT LOGGED IN
           ------------------------------------------------- */

        if (!user) {

            window.location.replace(
                "./index.html"
            );

            return;

        }


        /* -------------------------------------------------
           ADMIN EMAIL
           ------------------------------------------------- */

        if (adminEmail) {

            adminEmail.textContent =
                user.email ||
                "Administrator";

        }


        /* -------------------------------------------------
           USER AVATAR
           ------------------------------------------------- */

        if (userAvatar) {

            const email =
                user.email ||
                "A";

            userAvatar.textContent =
                email
                    .charAt(0)
                    .toUpperCase();

        }


        /* -------------------------------------------------
           LOAD DASHBOARD
           ------------------------------------------------- */

        await loadDashboard();

    }
);



/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadDashboard() {

    try {

        setFirebaseStatus(
            "online",
            "Connected",
            "Firestore connected"
        );


        await Promise.all([

            loadCollectionCount(
                "familyMembers",
                familyCount
            ),

            loadCollectionCount(
                "events",
                eventsCount
            ),

            loadCollectionCount(
                "archive",
                archiveCount
            ),

            loadCollectionCount(
                "gallery",
                galleryCount
            ),

            loadCollectionCount(
                "timeline",
                timelineCount
            ),

            loadCollectionCount(
                "enquiries",
                enquiriesCount
            ),

            loadCollectionCount(
                "activityLogs",
                activityCount
            ),

            loadRecentActivity()

        ]);

    }
    catch (error) {

        console.error(
            "Dashboard loading error:",
            error
        );


        setFirebaseStatus(
            "offline",
            "Connection problem",
            "Unable to load Firestore"
        );

    }

}



/* =========================================================
   LOAD COLLECTION COUNT
   ========================================================= */

async function loadCollectionCount(
    collectionName,
    element
) {

    if (!element) {
        return;
    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    collectionName
                )
            );


        element.textContent =
            snapshot.size;

    }
    catch (error) {

        console.error(
            `Unable to load ${collectionName}:`,
            error
        );


        element.textContent =
            "—";

    }

}

/* =========================================================
   LOAD RECENT ACTIVITY
   SHOW ONLY LATEST 4
   ========================================================= */

async function loadRecentActivity() {

    if (!recentActivityList) {
        return;
    }


    try {

        recentActivityList.innerHTML = `
            <div class="activity-loading">
                Loading recent activity...
            </div>
        `;


        /*
         * ACTIVITY LOGGER USES performedAt
         *
         * Therefore we first try:
         *
         * performedAt DESC
         *
         * and only show the latest 4 records.
         */

        let snapshot;


        try {

            const activityQuery =
                query(
                    collection(
                        db,
                        "activityLogs"
                    ),
                    orderBy(
                        "performedAt",
                        "desc"
                    ),
                    limit(4)
                );


            snapshot =
                await getDocs(
                    activityQuery
                );

        }


        /*
         * FALLBACK
         *
         * Some older records may use createdAt.
         */

        catch (performedAtError) {

            console.warn(
                "performedAt query failed. Trying createdAt...",
                performedAtError
            );


            const activityQuery =
                query(
                    collection(
                        db,
                        "activityLogs"
                    ),
                    orderBy(
                        "createdAt",
                        "desc"
                    ),
                    limit(4)
                );


            snapshot =
                await getDocs(
                    activityQuery
                );

        }


        const activities = [];


        snapshot.forEach(
            activityDoc => {

                activities.push({

                    id:
                        activityDoc.id,

                    ...activityDoc.data()

                });

            }
        );


        /*
         * SHOW ONLY LATEST 4
         */

        renderRecentActivity(
            activities.slice(
                0,
                4
            )
        );


    }


    catch (error) {

        console.error(
            "Activity loading error:",
            error
        );


        /*
         * FINAL FALLBACK
         *
         * Load all records and sort manually.
         */

        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "activityLogs"
                    )
                );


            const activities = [];


            snapshot.forEach(
                activityDoc => {

                    activities.push({

                        id:
                            activityDoc.id,

                        ...activityDoc.data()

                    });

                }
            );


            /*
             * SORT USING performedAt FIRST
             * THEN createdAt
             */

            activities.sort(
                (a, b) => {

                    return getActivityTime(
                        b
                    ) -
                    getActivityTime(
                        a
                    );

                }
            );


            /*
             * ONLY TOP 4
             */

            renderRecentActivity(
                activities.slice(
                    0,
                    4
                )
            );


        }


        catch (fallbackError) {

            console.error(
                "Final activity fallback error:",
                fallbackError
            );


            recentActivityList.innerHTML = `
                <div class="activity-empty">
                    Unable to load recent activity.
                </div>
            `;


            if (activitySummary) {

                activitySummary.textContent =
                    "Unable to load";

            }

        }

    }

}


/* =========================================================
   RENDER RECENT ACTIVITY
   ========================================================= */

function renderRecentActivity(
    activities
) {

    if (!activities.length) {

        recentActivityList.innerHTML = `
            <div class="activity-empty">
                No activity history yet.
            </div>
        `;


        if (activitySummary) {

            activitySummary.textContent =
                "0 activities";

        }


        return;

    }


    if (activitySummary) {

        activitySummary.textContent =
            activities.length === 1
                ? "1 recent activity"
                : `${activities.length} recent activities`;

    }


    recentActivityList.innerHTML =
        "";


    activities.forEach(
        activity => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "activity-item";


            /* ---------------------------------------------
               ICON
               --------------------------------------------- */

            const icon =
                getActivityIcon(
                    activity.action
                );


            /* ---------------------------------------------
               ACTION
               --------------------------------------------- */

            const action =
                String(
                    activity.action ||
                    "other"
                ).toLowerCase();


            const actionClass =
                getActionClass(
                    action
                );


            const actionLabel =
                getActionLabel(
                    action
                );


            /* ---------------------------------------------
               TITLE
               --------------------------------------------- */

            const title =
                activity.title ||
                activity.itemName ||
                activity.documentName ||
                "Website content";


            /* ---------------------------------------------
               SECTION
               --------------------------------------------- */

            const section =
                activity.section ||
                activity.collection ||
                "Admin";


            /* ---------------------------------------------
               USER
               --------------------------------------------- */

            const user =
                activity.userEmail ||
                activity.email ||
                "Administrator";


            /* ---------------------------------------------
               DATE
               --------------------------------------------- */

            const date =
                formatActivityDate(
                    activity.createdAt ||
                    activity.timestamp
                );


            item.innerHTML = `

                <div class="activity-icon">
                    ${icon}
                </div>


                <div class="activity-main">

                    <div class="activity-title">

                        ${escapeHTML(
                            title
                        )}

                    </div>


                    <div class="activity-meta">

                        <span
                            class="activity-action ${actionClass}"
                        >
                            ${escapeHTML(
                                actionLabel
                            )}
                        </span>


                        <span>
                            ${escapeHTML(
                                section
                            )}
                        </span>


                        <span>
                            ·
                        </span>


                        <span>
                            ${escapeHTML(
                                user
                            )}
                        </span>


                        <span
                            class="activity-time"
                        >
                            ${escapeHTML(
                                date
                            )}
                        </span>

                    </div>

                </div>

            `;


            recentActivityList.appendChild(
                item
            );

        }
    );

}



/* =========================================================
   ACTIVITY ICON
   ========================================================= */

function getActivityIcon(
    action
) {

    const value =
        String(
            action ||
            ""
        ).toLowerCase();


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
   ACTIVITY ACTION CLASS
   ========================================================= */

function getActionClass(
    action
) {

    const value =
        String(
            action ||
            ""
        ).toLowerCase();


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
   ACTIVITY LABEL
   ========================================================= */

function getActionLabel(
    action
) {

    const value =
        String(
            action ||
            "other"
        ).toLowerCase();


    if (
        value.includes("create") ||
        value.includes("add")
    ) {

        return "Created";

    }


    if (
        value.includes("update") ||
        value.includes("edit")
    ) {

        return "Updated";

    }


    if (
        value.includes("delete") ||
        value.includes("remove")
    ) {

        return "Deleted";

    }


    if (
        value.includes("login")
    ) {

        return "Login";

    }


    return "Activity";

}



/* =========================================================
   FORMAT ACTIVITY DATE
   ========================================================= */

function formatActivityDate(
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
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    }
    catch {

        return "Date unavailable";

    }

}



/* =========================================================
   FIREBASE STATUS
   ========================================================= */

function setFirebaseStatus(
    state,
    text,
    rightText
) {

    if (statusDot) {

        statusDot.classList.remove(
            "online",
            "offline"
        );


        if (state === "online") {

            statusDot.classList.add(
                "online"
            );

        }
        else {

            statusDot.classList.add(
                "offline"
            );

        }

    }


    if (statusText) {

        statusText.textContent =
            text;

    }


    if (statusRight) {

        statusRight.textContent =
            rightText;

    }

}



/* =========================================================
   NAVIGATION
   ========================================================= */

const navigation = {

    familyButton:
        "./family.html",

    eventsButton:
        "./events.html",

    archiveButton:
        "./archive.html",

    galleryButton:
        "./gallery.html",

    memoriesButton:
        "./memories.html",

    ritualsButton:
        "./rituals.html",

    timelineButton:
        "./timeline.html",

    enquiriesButton:
        "./enquiries.html",

    activityButton:
        "./activity.html"

};



Object.entries(
    navigation
).forEach(
    ([buttonId, page]) => {

        const button =
            document.getElementById(
                buttonId
            );


        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            () => {

                window.location.href =
                    page;

            }
        );

    }
);



/* =========================================================
   QUICK STAT NAVIGATION
   ========================================================= */

const statNavigation = {

    familyStatCard:
        "./family.html",

    eventsStatCard:
        "./events.html",

    archiveStatCard:
        "./archive.html",

    galleryStatCard:
        "./gallery.html",

    timelineStatCard:
        "./timeline.html",

    enquiriesStatCard:
        "./enquiries.html",

    activityStatCard:
        "./activity.html"

};



Object.entries(
    statNavigation
).forEach(
    ([cardId, page]) => {

        const card =
            document.getElementById(
                cardId
            );


        if (!card) {
            return;
        }


        card.addEventListener(
            "click",
            () => {

                window.location.href =
                    page;

            }
        );

    }
);



/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
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
   START
   ========================================================= */

console.log(
    "Roy Bari Admin Dashboard loaded successfully."
);