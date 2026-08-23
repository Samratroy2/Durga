/* =========================================================
   ROY BARI — ADMIN LOGIN
   FIREBASE AUTHENTICATION
   ========================================================= */

import {
    signInWithEmailAndPassword,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


import {
    auth
} from "../firebase.js";


/* =========================================================
   ELEMENTS
   ========================================================= */

const loginForm =
    document.getElementById("loginForm");


const emailInput =
    document.getElementById("email");


const passwordInput =
    document.getElementById("password");


const loginButton =
    document.getElementById("loginButton");


const loginButtonText =
    document.getElementById("loginButtonText");


const loginMessage =
    document.getElementById("loginMessage");


/* =========================================================
   AUTH CHECK
   ========================================================= */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {
            return;
        }


        console.log(
            "Already logged in:",
            user.email
        );


        /*
           Store logged-in admin email.

           Other admin pages can use:

           localStorage.getItem("adminEmail")
        */

        if (user.email) {

            localStorage.setItem(
                "adminEmail",
                user.email
            );

        }


        /*
           User is already authenticated,
           so don't show login page again.
        */

        window.location.replace(
            "./dashboard.html"
        );

    }
);


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showMessage(
    text,
    type = "error"
) {

    if (!loginMessage) {
        return;
    }


    loginMessage.textContent =
        text;


    loginMessage.className =
        `message ${type}`;

}


/* =========================================================
   LOGIN
   ========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            /* =================================================
               GET VALUES
               ================================================= */

            const email =
                emailInput.value.trim();


            const password =
                passwordInput.value;


            /* =================================================
               VALIDATION
               ================================================= */

            if (!email) {

                showMessage(
                    "Please enter your email address.",
                    "error"
                );

                emailInput.focus();

                return;

            }


            if (!password) {

                showMessage(
                    "Please enter your password.",
                    "error"
                );

                passwordInput.focus();

                return;

            }


            /* =================================================
               LOADING STATE
               ================================================= */

            if (loginButton) {

                loginButton.disabled =
                    true;

            }


            if (loginButtonText) {

                loginButtonText.textContent =
                    "Signing in...";

            }


            showMessage(
                ""
            );


            try {

                /* =================================================
                   FIREBASE LOGIN
                   ================================================= */

                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    userCredential.user;


                console.log(
                    "Login successful:",
                    user.email
                );


                /* =================================================
                   STORE ADMIN INFORMATION
                   ================================================= */

                if (user.email) {

                    localStorage.setItem(
                        "adminEmail",
                        user.email
                    );

                }


                if (user.uid) {

                    localStorage.setItem(
                        "adminUid",
                        user.uid
                    );

                }


                /* =================================================
                   SUCCESS MESSAGE
                   ================================================= */

                showMessage(
                    "Login successful. Opening dashboard...",
                    "success"
                );


                /* =================================================
                   REDIRECT
                   ================================================= */

                setTimeout(
                    () => {

                        window.location.replace(
                            "./dashboard.html"
                        );

                    },
                    500
                );

            }
            catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                /* =================================================
                   FIREBASE ERROR
                   ================================================= */

                let message =
                    "Login failed. Please check your email and password.";


                switch (error.code) {

                    case "auth/invalid-credential":

                        message =
                            "Invalid email or password.";

                        break;


                    case "auth/wrong-password":

                        message =
                            "Incorrect password.";

                        break;


                    case "auth/user-not-found":

                        message =
                            "No account found with this email.";

                        break;


                    case "auth/invalid-email":

                        message =
                            "Please enter a valid email address.";

                        break;


                    case "auth/too-many-requests":

                        message =
                            "Too many login attempts. Please try again later.";

                        break;


                    case "auth/network-request-failed":

                        message =
                            "Network error. Please check your internet connection.";

                        break;


                    case "auth/api-key-not-valid":

                        message =
                            "Firebase API key is invalid. Check firebase.js.";

                        break;


                    case "auth/user-disabled":

                        message =
                            "This admin account has been disabled.";

                        break;


                    case "auth/operation-not-allowed":

                        message =
                            "Email/password login is not enabled in Firebase.";

                        break;


                    default:

                        message =
                            error.message ||
                            message;

                }


                showMessage(
                    message,
                    "error"
                );


                /* =================================================
                   RESTORE BUTTON
                   ================================================= */

                if (loginButton) {

                    loginButton.disabled =
                        false;

                }


                if (loginButtonText) {

                    loginButtonText.textContent =
                        "Login to Admin Panel";

                }

            }

        }
    );

}


/* =========================================================
   END
   ========================================================= */

console.log(
    "Roy Bari Admin Login JS loaded successfully."
);