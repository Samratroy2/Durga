
/* =========================================================
   ROY BARI — ADMIN LOGIN
   FIREBASE AUTHENTICATION + CUSTOM CLAIMS
   ========================================================= */

import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    getIdTokenResult
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    auth
} from "../firebase.js";


/* =========================================================
   ELEMENTS
   ========================================================= */

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginMessage = document.getElementById("loginMessage");


/* =========================================================
   UI HELPERS
   ========================================================= */

function showMessage(text, type = "error") {
    if (!loginMessage) return;

    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
}

function setLoading(loading) {
    if (loginButton) {
        loginButton.disabled = loading;
    }

    if (loginButtonText) {
        loginButtonText.textContent = loading
            ? "Verifying account..."
            : "Login to Admin Panel";
    }
}


/* =========================================================
   ADMIN CLAIM VERIFICATION
   ========================================================= */

// Force-refresh the ID token so newly assigned custom claims
// can be detected after login or an admin-role change.

async function isAdmin(user) {
    if (!user) return false;

    const tokenResult = await getIdTokenResult(user, true);

    return tokenResult.claims.admin === true;
}


/* =========================================================
   AUTHENTICATION STATE
   ========================================================= */

let redirectingToDashboard = false;

onAuthStateChanged(
    auth,
    async (user) => {
        if (!user) {
            redirectingToDashboard = false;
            return;
        }

        try {
            const authorized = await isAdmin(user);

            if (!authorized) {
                await signOut(auth);

                showMessage(
                    "Access denied. This account is not an authorized administrator."
                );

                return;
            }

            if (!redirectingToDashboard) {
                redirectingToDashboard = true;
                window.location.replace("./dashboard.html");
            }

        } catch (error) {
            console.error(
                "Admin authorization check failed:",
                error.code || error.message
            );

            try {
                await signOut(auth);
            } catch (signOutError) {
                console.error(
                    "Sign-out failed:",
                    signOutError.code
                );
            }

            showMessage(
                "Unable to verify administrator permissions. Please try again."
            );
        }
    },
    (error) => {
        console.error(
            "Authentication state error:",
            error.code
        );

        showMessage(
            "Unable to verify your login session. Please reload the page."
        );
    }
);


/* =========================================================
   LOGIN FORM
   ========================================================= */

if (loginForm) {
    loginForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value;

            if (!email) {
                showMessage("Please enter your email address.");
                emailInput.focus();
                return;
            }

            if (!password) {
                showMessage("Please enter your password.");
                passwordInput.focus();
                return;
            }

            setLoading(true);
            showMessage("");

            try {
                // Authenticate the account with Firebase.
                const userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const user = userCredential.user;

                // Verify the server-issued admin custom claim.
                const authorized = await isAdmin(user);

                if (!authorized) {
                    await signOut(auth);

                    showMessage(
                        "Access denied. Your account is not authorized for admin access."
                    );

                    return;
                }

                showMessage(
                    "Login successful. Opening dashboard...",
                    "success"
                );

                if (!redirectingToDashboard) {
                    redirectingToDashboard = true;

                    window.location.replace("./dashboard.html");
                }

            } catch (error) {
                console.error(
                    "Firebase login error:",
                    error.code || error.message
                );

                const errorMessages = {
                    "auth/invalid-credential":
                        "Invalid email or password.",

                    "auth/wrong-password":
                        "Invalid email or password.",

                    "auth/user-not-found":
                        "Invalid email or password.",

                    "auth/invalid-email":
                        "Please enter a valid email address.",

                    "auth/too-many-requests":
                        "Too many login attempts. Please try again later.",

                    "auth/network-request-failed":
                        "Network error. Check your internet connection.",

                    "auth/user-disabled":
                        "This account has been disabled.",

                    "auth/operation-not-allowed":
                        "Email/password sign-in is not enabled in Firebase.",

                    "auth/invalid-api-key":
                        "Firebase API key is invalid. Check firebase.js."
                };

                showMessage(
                    errorMessages[error.code] ||
                    "Login or authorization failed. Please try again."
                );

            } finally {
                setLoading(false);
            }
        }
    );
}


/* =========================================================
   INITIALIZATION
   ========================================================= */

console.log(
    "Roy Bari admin login initialized."
);
