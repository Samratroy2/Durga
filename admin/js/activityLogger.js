/* =========================================================
   ROY BARI — ACTIVITY LOGGER
   FIREBASE FIRESTORE
   ========================================================= */

import {
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    db
} from "../firebase.js";


/* =========================================================
   GET CURRENT ADMIN
   ========================================================= */

function getCurrentAdmin() {

    let email =
        localStorage.getItem("adminEmail");


    if (!email) {

        email =
            sessionStorage.getItem("adminEmail");

    }


    if (!email) {

        email =
            localStorage.getItem("userEmail");

    }


    return email || "Admin";

}


/* =========================================================
   LOG ACTIVITY
   ========================================================= */

export async function logActivity({

    action,

    collectionName,

    documentId = "",

    title = "",

    details = ""

}) {

    try {

        const performedBy =
            getCurrentAdmin();


        const activityData = {

            action:
                String(action || "activity"),

            collection:
                String(collectionName || ""),

            documentId:
                String(documentId || ""),

            title:
                String(title || ""),

            performedBy:
                String(performedBy),

            performedAt:
                serverTimestamp()

        };


        /*
           Only store details if
           something was actually provided.
        */

        if (
            details &&
            String(details).trim()
        ) {

            activityData.details =
                String(details);

        }


        const activityRef =
            await addDoc(
                collection(
                    db,
                    "activityLogs"
                ),
                activityData
            );


        console.log(
            "Activity recorded:",
            activityRef.id,
            activityData
        );


        return activityRef.id;


    } catch (error) {

        /*
           Activity logging should NOT
           break the actual save/update/delete.
        */

        console.error(
            "Activity log failed:",
            error
        );


        return null;

    }

}