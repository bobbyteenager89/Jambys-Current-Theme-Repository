let togglerButtons = [...document.querySelectorAll(".favorites__toggler")];
let togglerBtnLeft = document.getElementById("toggler-btn-left");
let togglerBtnCenter = document.getElementById("toggler-btn-center");
let togglerBtnRight = document.getElementById("toggler-btn-right");
let favoriteProductsA = [...document.querySelectorAll(".favorite-products-a")];
let favoriteProductsB = [...document.querySelectorAll(".favorite-products-b")];
let favoriteProductsC = [...document.querySelectorAll(".favorite-products-c")];
let favoriteProductACTAContainer = document.querySelector(
  ".favorites__cta-container.cta-container__a"
);
let favoriteProductBCTAContainer = document.querySelector(
  ".favorites__cta-container.cta-container__b"
);
let favoriteProductCCTAContainer = document.querySelector(
  ".favorites__cta-container.cta-container__c"
);

togglerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    togglerButtons.forEach((btn) => {
      btn.classList.remove("favorites__toggler-active");
    });
    button.classList.add("favorites__toggler-active");
  });
});

togglerBtnRight.addEventListener("click", () => {
  favoriteProductsB.forEach((card) => {
    card.classList.remove("hidden-favorite__products");
    favoriteProductBCTAContainer.classList.remove("hidden-favorite__products");
  });
  favoriteProductsC.forEach((card) => {
    card.classList.add("hidden-favorite__products");
    favoriteProductCCTAContainer.classList.add("hidden-favorite__products");
  });
  favoriteProductsA.forEach((card) => {
    card.classList.add("hidden-favorite__products");
    favoriteProductACTAContainer.classList.add("hidden-favorite__products");
  });
});

togglerBtnLeft.addEventListener("click", () => {
  favoriteProductsA.forEach((card) => {
    card.classList.remove("hidden-favorite__products");
    favoriteProductACTAContainer.classList.remove("hidden-favorite__products");
  });

  favoriteProductsB.forEach((card) => {
    card.classList.add("hidden-favorite__products");
    favoriteProductBCTAContainer.classList.add("hidden-favorite__products");
  });
  favoriteProductsC.forEach((card) => {
    card.classList.add("hidden-favorite__products");
    favoriteProductCCTAContainer.classList.add("hidden-favorite__products");
  });
});

togglerBtnCenter.addEventListener("click", () => {
  favoriteProductsC.forEach((card) => {
    card.classList.remove("hidden-favorite__products");
    favoriteProductCCTAContainer.classList.remove("hidden-favorite__products");
  });
  favoriteProductsA.forEach((card) => {
    card.classList.add("hidden-favorite__products");
    favoriteProductACTAContainer.classList.add("hidden-favorite__products");
  });
  favoriteProductsB.forEach((card) => {
    card.classList.add("hidden-favorite__products");
    favoriteProductBCTAContainer.classList.add("hidden-favorite__products");
  });
});

//Carousels

new Swiper(".favorites-carousel-outer", {
  slidesPerView: 2,
  spaceBetween: 17,
  allowTouchMove: false,
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  breakpoints: {
    768: {
      slidesPerView: "auto",
    },
  },
});

new Swiper(".favorites-carousel-content", {
  allowTouchMove: true,
  slidesPerView: 1,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
});

let nextBtn = document.querySelector(".swiper-button-next.favorites");
let carouselContainer = document.querySelector(
  ".favorites-carousel-outer > .swiper-wrapper"
);
nextBtn.addEventListener("click", () => {
  if (
    screen.width >= 1440 &&
    nextBtn.classList.contains("swiper-button-disabled")
  ) {
    carouselContainer.style.transform = "translate3d(-1315px, 0px, 0px)";
  }
});

//Convert trigger

const categoriesSection = document.querySelector(".shop-by-category");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        window.dataLayer = window.dataLayer || [];
        window.passingCategoriesSection = true;
        window._conv_q = window._conv_q || [];
        window._conv_q.push(["executeExperiment", "100445422"]);
      } else {
        return;
      }
    });
  },
  { threshold: 0.5 }
);

observer.observe(categoriesSection);