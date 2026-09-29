/* =========================================================
   RELATED TEMPLES
   Roy Bari
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const filterButtons =
        document.querySelectorAll(".temple-filter");

    const templeCards =
        document.querySelectorAll(".temple-card");

    const emptyState =
        document.getElementById("temple-empty");


    /* =====================================================
       FILTER TEMPLES
       ===================================================== */

    function filterTemples(category) {

        let visible = 0;


        templeCards.forEach((card) => {

            const cardCategory =
                card.dataset.category;


            const show =
                category === "all" ||
                cardCategory === category;


            if (show) {

                card.style.display = "";

                visible++;

            } else {

                card.style.display = "none";

            }

        });


        if (emptyState) {

            emptyState.hidden =
                visible !== 0;

        }

    }


    /* =====================================================
       FILTER BUTTONS
       ===================================================== */

    filterButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach((item) => {

                    item.classList.remove(
                        "active"
                    );

                });


                button.classList.add(
                    "active"
                );


                filterTemples(
                    button.dataset.filter
                );

            }
        );

    });


    /* =====================================================
       CARD REVEAL
       ===================================================== */

    templeCards.forEach((card, index) => {

        card.style.opacity = "0";

        card.style.transform =
            "translateY(18px)";


        setTimeout(() => {

            card.style.transition =
                "opacity .5s ease, transform .5s ease";

            card.style.opacity = "1";

            card.style.transform =
                "translateY(0)";

        }, 80 * index);

    });


    /* =====================================================
       MOBILE NAV
       ===================================================== */

    const navToggle =
        document.querySelector(".nav-toggle");

    const navLinks =
        document.querySelector(".nav-links");


    if (navToggle && navLinks) {

        navToggle.addEventListener(
            "click",
            () => {

                const opened =
                    navLinks.classList.toggle("open");


                navToggle.setAttribute(
                    "aria-expanded",
                    opened
                        ? "true"
                        : "false"
                );

            }
        );


        navLinks
            .querySelectorAll("a")
            .forEach((link) => {

                link.addEventListener(
                    "click",
                    () => {

                        navLinks.classList.remove(
                            "open"
                        );

                        navToggle.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            });

    }

});