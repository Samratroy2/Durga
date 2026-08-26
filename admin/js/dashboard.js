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
    document.getElementById("adminEmail");


const userAvatar =
    document.getElementById("userAvatar");


const logoutButton =
    document.getElementById("logoutButton");


/* =========================================================
   DOM — COUNTS
   ========================================================= */

const familyCount =
    document.getElementById("familyCount");


const eventsCount =
    document.getElementById("eventsCount");


const archiveCount =
    document.getElementById("archiveCount");


const galleryCount =
    document.getElementById("galleryCount");


const timelineCount =
    document.getElementById("timelineCount");


const enquiriesCount =
    document.getElementById("enquiriesCount");


const activityCount =
    document.getElementById("activityCount");


/*
 * Optional new counts.
 *
 * These will only be used if the corresponding
 * elements exist in dashboard.html.
 */

const memoriesCount =
    document.getElementById("memoriesCount");


const ritualsCount =
    document.getElementById("ritualsCount");


const homepageCountdownCount =
    document.getElementById("homepageCountdownCount");


const comparisonsCount =
    document.getElementById("comparisonsCount");


const idolMakersCount =
    document.getElementById("idolMakersCount");


const newspaperArticlesCount =
    document.getElementById("newspaperArticlesCount");


const oldPicturesCount =
    document.getElementById("oldPicturesCount");


/* =========================================================
   DOM — ACTIVITY
   ========================================================= */

const recentActivityList =
    document.getElementById("recentActivityList");


const activitySummary =
    document.getElementById("activitySummary");


/* =========================================================
   DOM — FIREBASE STATUS
   ========================================================= */

const statusDot =
    document.getElementById("statusDot");


const statusText =
    document.getElementById("statusText");


const statusRight =
    document.getElementById("statusRight");


/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        /*
         * -------------------------------------------------
         * USER NOT LOGGED IN
         * -------------------------------------------------
         */

        if (!user) {

            window.location.replace(
                "./index.html"
            );

            return;

        }


        /*
         * -------------------------------------------------
         * ADMIN EMAIL
         * -------------------------------------------------
         */

        if (adminEmail) {

            adminEmail.textContent =
                user.email ||
                "Administrator";

        }


        /*
         * -------------------------------------------------
         * USER AVATAR
         * -------------------------------------------------
         */

        if (userAvatar) {

            const email =
                user.email ||
                "A";

            userAvatar.textContent =
                email
                    .charAt(0)
                    .toUpperCase();

        }


        /*
         * -------------------------------------------------
         * LOAD DASHBOARD
         * -------------------------------------------------
         */

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

            /* CORE CONTENT */

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


            /* MORE */

            loadCollectionCount(
                "memories",
                memoriesCount
            ),

            loadCollectionCount(
                "rituals",
                ritualsCount
            ),


            /* ADMIN */

            loadCollectionCount(
                "enquiries",
                enquiriesCount
            ),

            loadCollectionCount(
                "activityLogs",
                activityCount
            ),


            /* OPTIONAL MEDIA COLLECTIONS */

            loadCollectionCount(
                "comparisons",
                comparisonsCount
            ),

            loadCollectionCount(
                "idolMakers",
                idolMakersCount
            ),

            loadCollectionCount(
                "newspaperArticles",
                newspaperArticlesCount
            ),

            loadCollectionCount(
                "oldPictures",
                oldPicturesCount
            ),


            /* HOMEPAGE */

            loadCollectionCount(
                "homepageCountdown",
                homepageCountdownCount
            ),


            /* RECENT ACTIVITY */

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

    /*
     * If the dashboard does not have this
     * counter element, simply skip it.
     */

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
         * -------------------------------------------------
         * FIRST TRY performedAt
         * -------------------------------------------------
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
         * -------------------------------------------------
         * FALLBACK TO createdAt
         * -------------------------------------------------
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


        /*
         * -------------------------------------------------
         * CONVERT SNAPSHOT
         * -------------------------------------------------
         */

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
         * -------------------------------------------------
         * SHOW ONLY 4
         * -------------------------------------------------
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
         * -------------------------------------------------
         * FINAL FALLBACK
         * -------------------------------------------------
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
             * -------------------------------------------------
             * SORT MANUALLY
             * -------------------------------------------------
             */

            activities.sort(
                (a, b) => {

                    return (
                        getActivityTime(b) -
                        getActivityTime(a)
                    );

                }
            );


            /*
             * -------------------------------------------------
             * SHOW TOP 4
             * -------------------------------------------------
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
   GET ACTIVITY TIME
   ========================================================= */

function getActivityTime(
    activity
) {

    const value =
        activity?.performedAt ||
        activity?.createdAt ||
        activity?.timestamp;


    if (!value) {

        return 0;

    }


    try {

        if (value?.toDate) {

            return value
                .toDate()
                .getTime();

        }


        if (
            typeof value === "object" &&
            value?.seconds !== undefined
        ) {

            return Number(
                value.seconds
            ) * 1000;

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return 0;

        }


        return date.getTime();

    }

    catch {

        return 0;

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


            /*
             * -------------------------------------------------
             * ICON
             * -------------------------------------------------
             */

            const icon =
                getActivityIcon(
                    activity.action
                );


            /*
             * -------------------------------------------------
             * ACTION
             * -------------------------------------------------
             */

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


            /*
             * -------------------------------------------------
             * TITLE
             * -------------------------------------------------
             */

            const title =
                activity.title ||
                activity.itemName ||
                activity.documentName ||
                "Website content";


            /*
             * -------------------------------------------------
             * SECTION
             * -------------------------------------------------
             */

            const section =
                activity.section ||
                activity.collection ||
                "Admin";


            /*
             * -------------------------------------------------
             * USER
             * -------------------------------------------------
             */

            const user =
                activity.userEmail ||
                activity.email ||
                "Administrator";


            /*
             * -------------------------------------------------
             * DATE
             * -------------------------------------------------
             *
             * IMPORTANT:
             * Use performedAt first because that is the
             * field used by the activity logger.
             */

            const date =
                formatActivityDate(
                    activity.performedAt ||
                    activity.createdAt ||
                    activity.timestamp
                );


            /*
             * -------------------------------------------------
             * HTML
             * -------------------------------------------------
             */

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


    if (
        value.includes("logout") ||
        value.includes("signout")
    ) {

        return "🚪";

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


    if (
        value.includes("logout") ||
        value.includes("signout")
    ) {

        return "Logout";

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


        /*
         * Firestore Timestamp
         */

        if (
            value?.toDate
        ) {

            date =
                value.toDate();

        }


        /*
         * Firestore Timestamp-like object
         */

        else if (
            value?.seconds !== undefined
        ) {

            date =
                new Date(
                    Number(
                        value.seconds
                    ) * 1000
                );

        }


        /*
         * JavaScript Date / ISO string
         */

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


        if (
            state === "online"
        ) {

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

    /*
     * MAIN
     */

    dashboardButton:
        "./dashboard.html",


    /*
     * CONTENT
     */

    familyButton:
        "./family.html",

    eventsButton:
        "./events.html",

    archiveButton:
        "./archive.html",

    galleryButton:
        "./gallery.html",


    /*
     * HOMEPAGE
     */

    homepageCountdownButton:
        "./homepage-countdown.html",


    /*
     * MEDIA & ARCHIVE
     */

    comparisonsButton:
        "./comparisons.html",

    idolMakersButton:
        "./idol-makers.html",

    newspaperArticlesButton:
        "./newspaper-articles.html",

    oldPicturesButton:
        "./old-pictures.html",


    /*
     * MORE
     */

    memoriesButton:
        "./memories.html",

    ritualsButton:
        "./rituals.html",

    timelineButton:
        "./timeline.html",


    /*
     * ADMIN
     */

    enquiriesButton:
        "./enquiries.html",

    activityButton:
        "./activity.html",

    changePasswordButton:
        "./change-password.html"

};


/* =========================================================
   NAVIGATION EVENTS
   ========================================================= */

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
        "./activity.html",


    /*
     * Optional new stat cards.
     * They work only if the corresponding
     * IDs exist in dashboard.html.
     */

    memoriesStatCard:
        "./memories.html",

    ritualsStatCard:
        "./rituals.html",

    homepageCountdownStatCard:
        "./homepage-countdown.html",

    comparisonsStatCard:
        "./comparisons.html",

    idolMakersStatCard:
        "./idol-makers.html",

    newspaperArticlesStatCard:
        "./newspaper-articles.html",

    oldPicturesStatCard:
        "./old-pictures.html"

};


/* =========================================================
   STAT CARD EVENTS
   ========================================================= */

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


        /*
         * Make non-button cards keyboard accessible.
         */

        if (
            card.tagName !== "BUTTON" &&
            card.tagName !== "A"
        ) {

            card.setAttribute(
                "role",
                "link"
            );

            card.setAttribute(
                "tabindex",
                "0"
            );


            card.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        window.location.href =
                            page;

                    }

                }
            );

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


                /*
                 * Restore icon + text
                 */

                logoutButton.innerHTML = `
                    <i class="fa-solid fa-right-from-bracket"></i>
                    Logout
                `;

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

document.getElementById("visitButton")?.addEventListener(
    "click",
    () => {
        window.location.href = "./visit.html";
    }
);


document.getElementById("contactButton")?.addEventListener(
    "click",
    () => {
        window.location.href = "./contact.html";
    }
);


/* =========================================================
   START
   ========================================================= */

console.log(
    "Roy Bari Admin Dashboard loaded successfully."
);


