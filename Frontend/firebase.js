/* =========================================================
   ROY BARI — FIREBASE
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {

    apiKey: "AIzaSyAxGxDk4QUINPx-m5HGZqCr8Cmmmpn5hk",

    authDomain:
        "roy-bari-durga-puja.firebaseapp.com",

    projectId:
        "roy-bari-durga-puja",

    storageBucket:
        "roy-bari-durga-puja.firebasestorage.app",

    messagingSenderId:
        "657051252101",

    appId:
        "1:657051252101:web:f65c2f177e2d5d585f80ec"

};


/* =========================================================
   INITIALIZE FIREBASE
   ========================================================= */

const app =
    initializeApp(firebaseConfig);


/* =========================================================
   FIRESTORE
   ========================================================= */

const db =
    getFirestore(app);


/* =========================================================
   EXPORT
   ========================================================= */

export {
    app,
    db
};

