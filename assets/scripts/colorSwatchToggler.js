window.addEventListener("click", (evt) => {
  if (evt.target.classList.contains("dtc-collection-swatch")) {
    const { jsProductHandle } = evt.target.dataset;
    const clickedElement = evt.target;

    fetch("/products/" + jsProductHandle + "?view=swatches-info")
      .then((response) => response.text())
      .then((data) => {
        let div = document.createElement("div");
        let productWrapper = evt.target.closest(
          ".alternative-product-swatches"
        );
        let productContainer = productWrapper.querySelector(
          ".product-block__container"
        );

        productContainer.innerHTML = "";
        div.innerHTML = data;

        let newProduct = div.querySelector(".product-block__inner");
        productContainer.append(newProduct);

        let swatches = [...clickedElement.parentElement.children];
        swatches.forEach((swatch) => {
          swatch.classList.remove("selected-swatch");
        });
        clickedElement.classList.add("selected-swatch");
      })
      .then(() => {
        new Swiper(".slider-images", {
          allowTouchMove: true,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          pagination: {
            el: ".swiper-pagination",
          },
        });
      });
  }
});
