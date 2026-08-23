/* =========================================================
   ROY BARI — FIREBASE
   FIRESTORE + AUTHENTICATION
   ========================================================= */


/* =========================================================
   FIREBASE APP
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";


/* =========================================================
   FIRESTORE
   ========================================================= */

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


/* =========================================================
   AUTHENTICATION
   ========================================================= */

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {

    apiKey: "AIzaSyAxGxDk4QUINPxm-e5HGZqCr8Cmmmpn5hk",
    authDomain: "roy-bari-durga-puja.firebaseapp.com",
    projectId: "roy-bari-durga-puja",
    storageBucket: "roy-bari-durga-puja.firebasestorage.app",
    messagingSenderId: "657051252101",
    appId: "1:657051252101:web:f65c2f177e2d5d585f80ec",
    measurementId: "G-QQ316L0DC4"

};


/* =========================================================
   INITIALIZE FIREBASE APP
   ========================================================= */

const app =
    initializeApp(firebaseConfig);


/* =========================================================
   INITIALIZE FIRESTORE
   ========================================================= */

const db =
    getFirestore(app);


/* =========================================================
   INITIALIZE AUTHENTICATION
   ========================================================= */

const auth =
    getAuth(app);


/* =========================================================
   EXPORT
   ========================================================= */

export {
    app,
    db,
    auth
};