/* =========================================================
   ROY BARI — CHANGE PASSWORD
   Firebase Authentication
   ========================================================= */

import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    auth
} from "../firebase.js";


/* =========================================================
   ELEMENTS
   ========================================================= */

const form = document.getElementById(
    "change-password-form"
);

const currentPasswordInput = document.getElementById(
    "current-password"
);

const newPasswordInput = document.getElementById(
    "new-password"
);

const confirmPasswordInput = document.getElementById(
    "confirm-password"
);

const messageBox = document.getElementById(
    "password-message"
);

const changePasswordButton = document.getElementById(
    "change-password-btn"
);

const strengthBox = document.getElementById(
    "password-strength"
);

const strengthProgress = document.getElementById(
    "strength-progress"
);

const strengthText = document.getElementById(
    "strength-text"
);


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(message, type = "error") {

    messageBox.textContent = message;

    messageBox.className =
        `password-message ${type}`;

    messageBox.hidden = false;
}


function hideMessage() {

    messageBox.hidden = true;

    messageBox.textContent = "";

    messageBox.className =
        "password-message";

}


/* =========================================================
   PASSWORD VISIBILITY
   ========================================================= */

document
    .querySelectorAll(".toggle-password")
    .forEach(button => {

        button.addEventListener("click", () => {

            const target =
                document.getElementById(
                    button.dataset.target
                );

            const icon =
                button.querySelector("i");


            if (target.type === "password") {

                target.type = "text";

                icon.classList.remove(
                    "fa-eye"
                );

                icon.classList.add(
                    "fa-eye-slash"
                );

                button.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                target.type = "password";

                icon.classList.remove(
                    "fa-eye-slash"
                );

                icon.classList.add(
                    "fa-eye"
                );

                button.setAttribute(
                    "aria-label",
                    "Show password"
                );

            }

        });

    });


/* =========================================================
   PASSWORD STRENGTH
   ========================================================= */

function getPasswordStrength(password) {

    let score = 0;


    if (password.length >= 6) {
        score++;
    }

    if (password.length >= 10) {
        score++;
    }

    if (/[a-z]/.test(password)) {
        score++;
    }

    if (/[A-Z]/.test(password)) {
        score++;
    }

    if (/[0-9]/.test(password)) {
        score++;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
        score++;
    }


    return score;

}


function updatePasswordStrength() {

    const password =
        newPasswordInput.value;


    if (!password) {

        strengthBox.hidden = true;

        strengthProgress.style.width =
            "0%";

        strengthText.textContent =
            "Password strength";

        return;

    }


    strengthBox.hidden = false;


    const score =
        getPasswordStrength(password);


    let percentage = 0;

    let text = "Very weak";


    if (score <= 2) {

        percentage = 25;

        text = "Weak";

    } else if (score === 3) {

        percentage = 50;

        text = "Fair";

    } else if (score === 4) {

        percentage = 75;

        text = "Good";

    } else {

        percentage = 100;

        text = "Strong";

    }


    strengthProgress.style.width =
        `${percentage}%`;

    strengthText.textContent =
        `Password strength: ${text}`;

}


newPasswordInput.addEventListener(
    "input",
    updatePasswordStrength
);


/* =========================================================
   VALIDATION
   ========================================================= */

function validatePasswords() {

    const currentPassword =
        currentPasswordInput.value;

    const newPassword =
        newPasswordInput.value;

    const confirmPassword =
        confirmPasswordInput.value;


    if (!currentPassword) {

        showMessage(
            "Please enter your current password."
        );

        currentPasswordInput.focus();

        return false;

    }


    if (newPassword.length < 6) {

        showMessage(
            "New password must contain at least 6 characters."
        );

        newPasswordInput.focus();

        return false;

    }


    if (
        newPassword === currentPassword
    ) {

        showMessage(
            "Your new password must be different from your current password."
        );

        newPasswordInput.focus();

        return false;

    }


    if (
        newPassword !== confirmPassword
    ) {

        showMessage(
            "New password and confirmation password do not match."
        );

        confirmPasswordInput.focus();

        return false;

    }


    return true;

}


/* =========================================================
   FIREBASE ERROR MESSAGE
   ========================================================= */

function getFirebaseErrorMessage(error) {

    console.error(
        "Firebase password error:",
        error
    );


    switch (error.code) {

        case "auth/invalid-credential":

        case "auth/wrong-password":

            return "Your current password is incorrect.";


        case "auth/invalid-email":

            return "The account email address is invalid.";


        case "auth/user-not-found":

            return "The admin account could not be found.";


        case "auth/weak-password":

            return "The new password is too weak.";


        case "auth/requires-recent-login":

            return "For security, please sign in again before changing your password.";


        case "auth/too-many-requests":

            return "Too many attempts. Please wait and try again later.";


        case "auth/network-request-failed":

            return "Network error. Please check your internet connection.";


        default:

            return (
                error.message ||
                "Unable to change the password. Please try again."
            );

    }

}


/* =========================================================
   BUTTON STATE
   ========================================================= */

function setLoadingState(isLoading) {

    changePasswordButton.disabled =
        isLoading;


    if (isLoading) {

        changePasswordButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Changing...</span>
        `;

    } else {

        changePasswordButton.innerHTML = `
            <i class="fa-solid fa-key"></i>
            <span>Change Password</span>
        `;

    }

}


/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        hideMessage();


        /* ---------------------------------------------
           VALIDATE
           --------------------------------------------- */

        if (!validatePasswords()) {
            return;
        }


        /* ---------------------------------------------
           CURRENT USER
           --------------------------------------------- */

        const user =
            auth.currentUser;


        if (!user) {

            showMessage(
                "Your admin session has expired. Please sign in again."
            );

            return;

        }


        if (!user.email) {

            showMessage(
                "No email address is associated with this account."
            );

            return;

        }


        const currentPassword =
            currentPasswordInput.value;

        const newPassword =
            newPasswordInput.value;


        try {

            setLoadingState(true);


            /* -----------------------------------------
               RE-AUTHENTICATE USER
               ----------------------------------------- */

            const credential =
                EmailAuthProvider.credential(
                    user.email,
                    currentPassword
                );


            await reauthenticateWithCredential(
                user,
                credential
            );


            /* -----------------------------------------
               UPDATE PASSWORD
               ----------------------------------------- */

            await updatePassword(
                user,
                newPassword
            );


            /* -----------------------------------------
               SUCCESS
               ----------------------------------------- */

            showMessage(
                "Your password has been changed successfully.",
                "success"
            );


            form.reset();

            strengthBox.hidden = true;

            strengthProgress.style.width =
                "0%";

            strengthText.textContent =
                "Password strength";


            setLoadingState(false);


        } catch (error) {

            showMessage(
                getFirebaseErrorMessage(error)
            );

            setLoadingState(false);

        }

    }
);