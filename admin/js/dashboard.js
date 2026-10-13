/* =========================================================
   ROY BARI — ADMIN DASHBOARD
   FIREBASE AUTH + FIRESTORE
   ========================================================= */

/* ==================== FIREBASE AUTH ==================== */

import {
    onAuthStateChanged,
    signOut,
    getIdTokenResult
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

/* ==================== FIRESTORE ==================== */

import {
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

/* ==================== FIREBASE CONFIG ==================== */

import { auth, db } from "../firebase.js";

/* ==================== DOM ELEMENTS ==================== */

const adminEmail = document.getElementById("adminEmail");
const userAvatar = document.getElementById("userAvatar");
const logoutButton = document.getElementById("logoutButton");

const familyCount = document.getElementById("familyCount");
const eventsCount = document.getElementById("eventsCount");
const archiveCount = document.getElementById("archiveCount");
const galleryCount = document.getElementById("galleryCount");
const timelineCount = document.getElementById("timelineCount");
const enquiriesCount = document.getElementById("enquiriesCount");
const activityCount = document.getElementById("activityCount");

const memoriesCount = document.getElementById("memoriesCount");
const ritualsCount = document.getElementById("ritualsCount");

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

const priestCount = document.getElementById("priestCount");

const recentActivityList =
    document.getElementById("recentActivityList");

const activitySummary =
    document.getElementById("activitySummary");

const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const statusRight = document.getElementById("statusRight");


/* =========================================================
   AUTHENTICATION + ADMIN CLAIM VERIFICATION
   ========================================================= */

let dashboardAuthorized = false;
let dashboardAuthCheckInProgress = false;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        dashboardAuthorized = false;
        window.location.replace("./index.html");
        return;
    }

    if (dashboardAuthCheckInProgress) return;
    dashboardAuthCheckInProgress = true;

    try {
        let tokenResult = await getIdTokenResult(user);

        // Refresh the token only when the admin claim is missing.
        if (tokenResult.claims.admin !== true) {
            tokenResult = await getIdTokenResult(user, true);
        }

        if (tokenResult.claims.admin !== true) {
            dashboardAuthorized = false;
            await signOut(auth);
            window.location.replace("./index.html");
            return;
        }

        // IMPORTANT: authorize the dashboard before loading data.
        dashboardAuthorized = true;

        console.log("Admin verified:", user.email);

        // Restore the dashboard initialization.
        await loadDashboard();

    } catch (error) {
        console.error("Dashboard authorization/loading error:", error);

        // Do not sign out just because a network request failed.
    } finally {
        dashboardAuthCheckInProgress = false;
    }
});


/* =========================================================
   LOAD DASHBOARD
   ========================================================= */

async function loadDashboard() {
    if (!dashboardAuthorized) {
        return;
    }

    try {
        setFirebaseStatus(
            "online",
            "Connected",
            "Firestore connected"
        );

        await Promise.all([
            // Core content
            loadCollectionCount("familyMembers", familyCount),
            loadCollectionCount("events", eventsCount),
            loadCollectionCount("archive", archiveCount),
            loadCollectionCount("gallery", galleryCount),
            loadCollectionCount("timeline", timelineCount),

            // Priests
            loadCollectionCount("priests", priestCount),

            // Additional content
            loadCollectionCount("memories", memoriesCount),
            loadCollectionCount("rituals", ritualsCount),

            // Administration
            loadCollectionCount("enquiries", enquiriesCount),
            loadCollectionCount("activityLogs", activityCount),

            // Media
            loadCollectionCount("comparisons", comparisonsCount),
            loadCollectionCount("idolMakers", idolMakersCount),
            loadCollectionCount(
                "newspaperArticles",
                newspaperArticlesCount
            ),
            loadCollectionCount("oldPictures", oldPicturesCount),

            // Homepage
            loadCollectionCount(
                "homepageCountdown",
                homepageCountdownCount
            ),

            // Recent activity
            loadRecentActivity()
        ]);

    } catch (error) {
        console.error("Dashboard loading error:", error);

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

async function loadCollectionCount(collectionName, element) {
    if (!element || !dashboardAuthorized) {
        return;
    }

    try {
        const snapshot = await getDocs(
            collection(db, collectionName)
        );

        if (dashboardAuthorized) {
            element.textContent = snapshot.size;
        }

    } catch (error) {
        console.error(
            `Unable to load ${collectionName}:`,
            error
        );

        element.textContent = "—";
    }
}

/* =========================================================
   LOAD RECENT ACTIVITY
   ========================================================= */

async function loadRecentActivity() {
    if (!recentActivityList || !dashboardAuthorized) {
        return;
    }

    recentActivityList.innerHTML = `
        <div class="activity-loading">
            Loading recent activity...
        </div>
    `;

    try {
        let snapshot;

        // Try ordering by performedAt first.
        try {
            const activityQuery = query(
                collection(db, "activityLogs"),
                orderBy("performedAt", "desc"),
                limit(4)
            );

            snapshot = await getDocs(activityQuery);

        } catch (performedAtError) {
            console.warn(
                "performedAt query failed. Trying createdAt...",
                performedAtError
            );

            // Fallback to createdAt.
            const activityQuery = query(
                collection(db, "activityLogs"),
                orderBy("createdAt", "desc"),
                limit(4)
            );

            snapshot = await getDocs(activityQuery);
        }

        if (!dashboardAuthorized) {
            return;
        }

        const activities = [];

        snapshot.forEach((activityDoc) => {
            activities.push({
                id: activityDoc.id,
                ...activityDoc.data()
            });
        });

        renderRecentActivity(activities.slice(0, 4));

    } catch (error) {
        console.error("Activity loading error:", error);

        // Final fallback: retrieve documents without ordering.
        try {
            if (!dashboardAuthorized) {
                return;
            }

            const snapshot = await getDocs(
                collection(db, "activityLogs")
            );

            const activities = [];

            snapshot.forEach((activityDoc) => {
                activities.push({
                    id: activityDoc.id,
                    ...activityDoc.data()
                });
            });

            activities.sort((a, b) => {
                return getActivityTime(b) - getActivityTime(a);
            });

            if (dashboardAuthorized) {
                renderRecentActivity(activities.slice(0, 4));
            }

        } catch (fallbackError) {
            console.error(
                "Final activity fallback error:",
                fallbackError
            );

            if (recentActivityList) {
                recentActivityList.innerHTML = `
                    <div class="activity-empty">
                        Unable to load recent activity.
                    </div>
                `;
            }

            if (activitySummary) {
                activitySummary.textContent = "Unable to load";
            }
        }
    }
}

/* =========================================================
   GET ACTIVITY TIME
   ========================================================= */

function getActivityTime(activity) {
    const value =
        activity?.performedAt ||
        activity?.createdAt ||
        activity?.timestamp;

    if (!value) {
        return 0;
    }

    try {
        if (typeof value.toDate === "function") {
            return value.toDate().getTime();
        }

        if (
            typeof value === "object" &&
            value.seconds !== undefined
        ) {
            return Number(value.seconds) * 1000;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return 0;
        }

        return date.getTime();

    } catch {
        return 0;
    }
}

/* =========================================================
   RENDER RECENT ACTIVITY
   ========================================================= */

function renderRecentActivity(activities) {
    if (!recentActivityList || !dashboardAuthorized) {
        return;
    }

    if (!activities.length) {
        recentActivityList.innerHTML = `
            <div class="activity-empty">
                No activity history yet.
            </div>
        `;

        if (activitySummary) {
            activitySummary.textContent = "0 activities";
        }

        return;
    }

    if (activitySummary) {
        activitySummary.textContent =
            activities.length === 1
                ? "1 recent activity"
                : `${activities.length} recent activities`;
    }

    recentActivityList.innerHTML = "";

    activities.forEach((activity) => {
        const item = document.createElement("div");
        item.className = "activity-item";

        const icon = getActivityIcon(activity.action);

        const action = String(
            activity.action || "other"
        ).toLowerCase();

        const actionClass = getActionClass(action);
        const actionLabel = getActionLabel(action);

        const title =
            activity.title ||
            activity.itemName ||
            activity.documentName ||
            "Website content";

        const section =
            activity.section ||
            activity.collection ||
            activity.collectionName ||
            "Admin";

        const user =
            activity.userEmail ||
            activity.email ||
            "Administrator";

        const date = formatActivityDate(
            activity.performedAt ||
            activity.createdAt ||
            activity.timestamp
        );

        item.innerHTML = `
            <div class="activity-icon">${icon}</div>

            <div class="activity-main">
                <div class="activity-title">
                    ${escapeHTML(title)}
                </div>

                <div class="activity-meta">
                    <span class="activity-action ${actionClass}">
                        ${escapeHTML(actionLabel)}
                    </span>

                    <span>${escapeHTML(section)}</span>
                    <span>·</span>
                    <span>${escapeHTML(user)}</span>

                    <span class="activity-time">
                        ${escapeHTML(date)}
                    </span>
                </div>
            </div>
        `;

        recentActivityList.appendChild(item);
    });
}

/* =========================================================
   ACTIVITY ICON
   ========================================================= */

function getActivityIcon(action) {
    const value = String(action || "").toLowerCase();

    if (value.includes("create") || value.includes("add")) {
        return "➕";
    }

    if (value.includes("update") || value.includes("edit")) {
        return "✏️";
    }

    if (value.includes("delete") || value.includes("remove")) {
        return "🗑️";
    }

    if (value.includes("login")) {
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

function getActionClass(action) {
    const value = String(action || "").toLowerCase();

    if (value.includes("create") || value.includes("add")) {
        return "created";
    }

    if (value.includes("update") || value.includes("edit")) {
        return "updated";
    }

    if (value.includes("delete") || value.includes("remove")) {
        return "deleted";
    }

    return "other";
}

/* =========================================================
   ACTIVITY LABEL
   ========================================================= */

function getActionLabel(action) {
    const value = String(action || "other").toLowerCase();

    if (value.includes("create") || value.includes("add")) {
        return "Created";
    }

    if (value.includes("update") || value.includes("edit")) {
        return "Updated";
    }

    if (value.includes("delete") || value.includes("remove")) {
        return "Deleted";
    }

    if (value.includes("login")) {
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

function formatActivityDate(value) {
    if (!value) {
        return "Date unavailable";
    }

    try {
        let date;

        if (typeof value.toDate === "function") {
            date = value.toDate();

        } else if (
            typeof value === "object" &&
            value.seconds !== undefined
        ) {
            date = new Date(Number(value.seconds) * 1000);

        } else {
            date = new Date(value);
        }

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
        });

    } catch {
        return "Date unavailable";
    }
}

/* =========================================================
   FIREBASE STATUS
   ========================================================= */

function setFirebaseStatus(state, text, rightText) {
    if (statusDot) {
        statusDot.classList.remove("online", "offline");

        statusDot.classList.add(
            state === "online" ? "online" : "offline"
        );
    }

    if (statusText) {
        statusText.textContent = text;
    }

    if (statusRight) {
        statusRight.textContent = rightText;
    }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

const navigation = {
    dashboardButton: "./dashboard.html",

    familyButton: "./family.html",
    eventsButton: "./events.html",
    priestsButton: "./priest.html",
    archiveButton: "./archive.html",
    galleryButton: "./gallery.html",
    templesButton: "./temples.html",
    ownWordsButton: "./own-words.html",
    ritualsButton: "./rituals.html",

    homepageCountdownButton: "./homepage-countdown.html",

    comparisonsButton: "./comparisons.html",
    idolMakersButton: "./idol-makers.html",
    newspaperArticlesButton: "./newspaper-articles.html",
    oldPicturesButton: "./old-pictures.html",

    enquiriesButton: "./enquiries.html",
    activityButton: "./activity.html",
    changePasswordButton: "./change-password.html"
};

Object.entries(navigation).forEach(([buttonId, page]) => {
    const button = document.getElementById(buttonId);

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {
        if (!dashboardAuthorized) {
            return;
        }

        window.location.href = page;
    });
});

/* =========================================================
   QUICK STAT NAVIGATION
   ========================================================= */

const statNavigation = {
    familyStatCard: "./family.html",
    eventsStatCard: "./events.html",
    priestStatCard: "./priest.html",
    archiveStatCard: "./archive.html",
    galleryStatCard: "./gallery.html",
    timelineStatCard: "./timeline.html",
    enquiriesStatCard: "./enquiries.html",
    activityStatCard: "./activity.html",
    memoriesStatCard: "./memories.html",
    ritualsStatCard: "./rituals.html",
    homepageCountdownStatCard: "./homepage-countdown.html",
    comparisonsStatCard: "./comparisons.html",
    idolMakersStatCard: "./idol-makers.html",
    newspaperArticlesStatCard: "./newspaper-articles.html",
    oldPicturesStatCard: "./old-pictures.html"
};

Object.entries(statNavigation).forEach(([cardId, page]) => {
    const card = document.getElementById(cardId);

    if (!card) {
        return;
    }

    if (
        card.tagName !== "BUTTON" &&
        card.tagName !== "A"
    ) {
        card.setAttribute("role", "link");
        card.setAttribute("tabindex", "0");

        card.addEventListener("keydown", (event) => {
            if (
                event.key === "Enter" ||
                event.key === " "
            ) {
                event.preventDefault();

                if (dashboardAuthorized) {
                    window.location.href = page;
                }
            }
        });
    }

    card.addEventListener("click", () => {
        if (dashboardAuthorized) {
            window.location.href = page;
        }
    });
});

/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            logoutButton.disabled = true;
            logoutButton.textContent = "Logging out...";

            await signOut(auth);

            dashboardAuthorized = false;

            window.location.replace("./index.html");

        } catch (error) {
            console.error("Logout error:", error);

            logoutButton.disabled = false;

            logoutButton.innerHTML = `
                <i class="fa-solid fa-right-from-bracket"></i>
                Logout
            `;
        }
    });
}

/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
   START
   ========================================================= */

console.log(
    "Roy Bari Admin Dashboard loaded successfully."
);