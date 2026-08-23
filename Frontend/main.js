/* =========================================================
   ROY BARI — MAIN JS
   Shared behaviours for every page
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initNavToggle();

    markActiveNavLink();

    initAlponaReplay();

});


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function initNavToggle() {

    const toggle =
        document.querySelector(".nav-toggle");

    const links =
        document.querySelector(".nav-links");


    if (!toggle || !links) {
        return;
    }


    /* -----------------------------------------------------
       OPEN / CLOSE MENU
       ----------------------------------------------------- */

    toggle.addEventListener(
        "click",
        () => {

            const isOpen =
                links.classList.toggle("open");


            toggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );


            toggle.setAttribute(
                "aria-label",
                isOpen
                    ? "Close navigation"
                    : "Open navigation"
            );

        }
    );


    /* -----------------------------------------------------
       CLOSE AFTER CLICKING A LINK
       ----------------------------------------------------- */

    links
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    closeMenu();

                }
            );

        });


    /* -----------------------------------------------------
       CLOSE WHEN CLICKING OUTSIDE
       ----------------------------------------------------- */

    document.addEventListener(
        "click",
        event => {

            const clickedInsideMenu =
                links.contains(event.target);

            const clickedToggle =
                toggle.contains(event.target);


            if (
                !clickedInsideMenu &&
                !clickedToggle &&
                links.classList.contains("open")
            ) {

                closeMenu();

            }

        }
    );


    /* -----------------------------------------------------
       CLOSE WITH ESCAPE
       ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                links.classList.contains("open")
            ) {

                closeMenu();

                toggle.focus();

            }

        }
    );


    /* -----------------------------------------------------
       CLOSE MENU FUNCTION
       ----------------------------------------------------- */

    function closeMenu() {

        links.classList.remove("open");


        toggle.setAttribute(
            "aria-expanded",
            "false"
        );


        toggle.setAttribute(
            "aria-label",
            "Open navigation"
        );

    }

}


/* =========================================================
   ACTIVE NAVIGATION LINK
   ========================================================= */

function markActiveNavLink() {

    let current =
        location.pathname
            .split("/")
            .pop();


    /*
       If the URL is:

       /
       /index.html

       both should activate Home.
    */

    if (
        !current ||
        current === ""
    ) {

        current = "index.html";

    }


    const navLinks =
        document.querySelectorAll(
            ".nav-links a"
        );


    navLinks.forEach(
        link => {

            const href =
                link.getAttribute("href");


            if (!href) {
                return;
            }


            /*
               Remove manually assigned active
               class first.

               This means the correct page is
               always highlighted automatically.
            */

            link.classList.remove(
                "active"
            );


            /*
               Remove URL hash before comparing.

               Example:

               visit.html#location

               becomes:

               visit.html
            */

            const cleanHref =
                href.split("#")[0];


            if (
                cleanHref === current
            ) {

                link.classList.add(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   ALPONA DIVIDER ANIMATION
   ========================================================= */

function initAlponaReplay() {

    const dividers =
        document.querySelectorAll(
            ".alpona-divider"
        );


    /*
       Nothing to animate
    */

    if (
        !dividers.length
    ) {

        return;

    }


    /*
       Browser does not support
       IntersectionObserver.
    */

    if (
        !("IntersectionObserver" in window)
    ) {

        return;

    }


    /* -----------------------------------------------------
       INTERSECTION OBSERVER
       ----------------------------------------------------- */

    const observer =
        new IntersectionObserver(
            entries => {

                entries.forEach(
                    entry => {

                        if (
                            !entry.isIntersecting
                        ) {

                            return;

                        }


                        const paths =
                            entry.target
                                .querySelectorAll(
                                    "path"
                                );


                        /*
                           Restart animation
                           every time divider
                           enters viewport.
                        */

                        paths.forEach(
                            path => {

                                path.style.animation =
                                    "none";


                                /*
                                   Force browser
                                   reflow.
                                */

                                void path.offsetWidth;


                                /*
                                   Restore CSS
                                   animation.
                                */

                                path.style.animation =
                                    "";

                            }
                        );


                        /*
                           Only animate once.
                        */

                        observer.unobserve(
                            entry.target
                        );

                    }
                );

            },
            {
                threshold: 0.4
            }
        );


    /* -----------------------------------------------------
       OBSERVE ALL DIVIDERS
       ----------------------------------------------------- */

    dividers.forEach(
        divider => {

            observer.observe(
                divider
            );

        }
    );

}


/* =========================================================
   OPTIONAL: SMOOTH HASH SCROLL
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        const link =
            event.target.closest(
                'a[href*="#"]'
            );


        if (!link) {
            return;
        }


        const href =
            link.getAttribute("href");


        const hash =
            href.split("#")[1];


        if (!hash) {
            return;
        }


        const target =
            document.getElementById(
                hash
            );


        if (!target) {
            return;
        }


        /*
           Only handle same-page links.
        */

        const url =
            new URL(
                link.href,
                window.location.href
            );


        if (
            url.pathname !==
            window.location.pathname
        ) {

            return;

        }


        event.preventDefault();


        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        /*
           Update URL without
           jumping to the element.
        */

        history.pushState(
            null,
            "",
            `#${hash}`
        );

    }
);