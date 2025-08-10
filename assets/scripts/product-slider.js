// Product Slider from Shopify's Dawn theme
// https://github.com/Shopify/dawn
function debounceFn(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function checkIfIGenderItemsExist(item) {
  const urlSlide = new URL(window.location.href);
  let genderValueSlide = new URLSearchParams(window.location.search).get('utm_gender');
  
  const buttonCurrentGender = document.querySelector(`button[data-gender-category='${genderValueSlide}']`);
  const buttonDefaultGender = document.querySelector(`button[data-gender-category='unisex']`);
  const genderButtons = document.querySelectorAll('.swatch-category--gender button[data-gender-category]')

  if (buttonCurrentGender) {
    smarthSlideButtonActive(buttonCurrentGender, genderButtons)
  }else{
    smarthSlideButtonActive(buttonDefaultGender, genderButtons)
  }
  if (genderValueSlide != '') {

    const [firstGenderButton, secondGenderButton ] = [...genderButtons].filter(button => button.dataset.genderCategory != buttonCurrentGender?.dataset?.genderCategory );

    if (item.dataset.imageAlt && item.dataset.imageAlt != genderValueSlide) {
      if (firstGenderButton.dataset.genderCategory == item.dataset.imageAlt || secondGenderButton?.dataset?.genderCategory == item.dataset.imageAlt) {
          if (genderValueSlide == 'unisex' || genderValueSlide == null ) return false;
            item.style.display = 'none';
      }
     }
  }

}

function smarthSlideButtonActive(buttonTarget, buttonsGender) {
  const el = buttonTarget;
  const prevEl = document.querySelector('button.gender-active');
  const x = (prevEl == null) ? '0%' : (prevEl.getBoundingClientRect().x - el.getBoundingClientRect().x) + 'px';
  const w2 = window.getComputedStyle(el).width;
  const w1 = (prevEl == null) ? 0 : window.getComputedStyle(prevEl).width;

  buttonsGender.forEach(btngender => btngender.classList.remove('gender-active'))
  
  el.style.setProperty('--x', x);
  el.style.setProperty('--w1', w1);
  el.style.setProperty('--w2', '100%');
  el.classList.add('gender-active');

}

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');

    Array.from(this.sliderItems).forEach(item => {
      checkIfIGenderItemsExist(item);
      if (window.getComputedStyle(item).display === "none") {
        item.remove(); // Remove element from the DOM
      }
    });
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');

    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector(".slider-counter--current");
    this.pageTotalElement = this.querySelector(".slider-counter--total");
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener("scroll", this.update.bind(this));
    this.prevButton.addEventListener("click", this.onButtonClick.bind(this));
    this.nextButton.addEventListener("click", this.onButtonClick.bind(this));
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(
      (element) => element.clientWidth > 0
    );
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset =
      this.sliderItemsToShow[1].offsetLeft -
      this.sliderItemsToShow[0].offsetLeft;
    this.sliderItemMargin =
      this.sliderItemOffset - this.sliderItemsToShow[0].clientWidth;
    this.slidesPerPage = Math.floor(
      (this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) /
        this.sliderItemOffset
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    // Temporarily prevents unneeded updates resulting from variant changes
    // This should be refactored as part of https://github.com/Shopify/dawn/issues/2057
    if (!this.slider || !this.nextButton) return;

    const previousPage = this.currentPage;
    this.currentPage =
      Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent("slideChanged", {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    if (this.enableSliderLooping) return;

    if (
      this.isSlideVisible(this.sliderItemsToShow[0]) &&
      this.slider.scrollLeft === 0
    ) {
      this.prevButton.setAttribute("disabled", "disabled");
    } else {
      this.prevButton.removeAttribute("disabled");
    }

    if (
      this.isSlideVisible(
        this.sliderItemsToShow[this.sliderItemsToShow.length - 1]
      )
    ) {
      this.nextButton.setAttribute("disabled", "disabled");
    } else {
      this.nextButton.removeAttribute("disabled");
    }
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide =
      this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (
      element.offsetLeft + element.clientWidth <= lastVisibleSlide &&
      element.offsetLeft >= this.slider.scrollLeft
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition =
      event.currentTarget.name === "next"
        ? this.slider.scrollLeft + step * this.sliderItemOffset
        : this.slider.scrollLeft - step * this.sliderItemOffset;
    this.slider.scrollTo({
      left: this.slideScrollPosition,
    });
  }
}

customElements.define("slider-component", SliderComponent);

class MediaGallery extends HTMLElement {
  constructor() {
    super();
    this.elements = {
      liveRegion: this.querySelector('[id^="GalleryStatus"]'),
      viewer: this.querySelector('[id^="GalleryViewer"]'),
      thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
    };

    // Convert to an array if it's a NodeList (to avoid issues)
    // These are all thumbnails elements has the container of the thumbnails
    Array.from(this.elements.thumbnails.querySelectorAll("[data-target]")).forEach(item => {     
      
      checkIfIGenderItemsExist(item);

      if (window.getComputedStyle(item).display === "none") {
          item.remove(); // Remove element from the DOM
      }
    });
    this.mql = window.matchMedia("(min-width: 750px)");
    if (!this.elements.thumbnails) return;

    //Main Slider(full width images)
    this.elements.viewer.addEventListener(
      "slideChanged",
      debounceFn(this.onSlideChanged.bind(this), 200)
    );
    this.elements.thumbnails
      .querySelectorAll("[data-target]")
      .forEach((mediaToSwitch) => {
        mediaToSwitch.addEventListener(
          "click",
          this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false)
        );
      });
    if (this.dataset.desktopLayout.includes("thumbnail") && this.mql.matches)
      this.removeListSemantic();

    const firstThumbnail = this.elements.thumbnails.querySelector(
      "[data-target]:first-child"
    );
    if (firstThumbnail) {
      this.setActiveThumbnail(firstThumbnail);
    }
  }

  onSlideChanged(event) {
    const thumbnail = this.elements.thumbnails.querySelector(
      `[data-target="${event.detail.currentElement.dataset.mediaId}"]`
    );
    this.setActiveThumbnail(thumbnail);
  }

  setActiveMedia(mediaId, prepend) {
    const activeMedia = this.elements.viewer.querySelector(
      `[data-media-id="${mediaId}"]`
    );

    this.elements.viewer
      .querySelectorAll("[data-media-id]")
      .forEach((element) => {
        element.classList.remove("is-active");
      });
    activeMedia.classList.add("is-active");

    if (prepend) {
      activeMedia.parentElement.prepend(activeMedia);
      if (this.elements.thumbnails) {
        const activeThumbnail = this.elements.thumbnails.querySelector(
          `[data-target="${mediaId}"]`
        );
        activeThumbnail.parentElement.prepend(activeThumbnail);
      }
      if (this.elements.viewer.slider) this.elements.viewer.resetPages();
    }
    window.setTimeout(() => {
      if (this.elements.thumbnails) {
        activeMedia.parentElement.scrollTo({
          left: activeMedia.offsetLeft,
          behavior: window.innerWidth > 767 ? "instant" : "auto",
        });
      }
      if (
        !this.elements.thumbnails ||
        this.dataset.desktopLayout === "stacked"
      ) {
        activeMedia.scrollIntoView({
          behavior: window.innerWidth > 767 ? "instant" : "smooth",
        });
      }
    });
    this.playActiveMedia(activeMedia);

    if (!this.elements.thumbnails) return;
    const activeThumbnail = this.elements.thumbnails.querySelector(
      `[data-target="${mediaId}"]`
    );
    this.setActiveThumbnail(activeThumbnail);
    this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
  }

  setActiveThumbnail(thumbnail) {
    if (!this.elements.thumbnails || !thumbnail) return;

    this.elements.thumbnails
      .querySelectorAll("[data-target]")
      .forEach((element) => element.removeAttribute("aria-current"));
    thumbnail.setAttribute("aria-current", true);
  }

  //Thumbnails (slider) left side
  announceLiveRegion(activeItem, position) {
    const image = activeItem.querySelector(".product__modal-opener--image img");
    if (!image) return;
    image.onload = () => {
      this.elements.liveRegion.setAttribute("aria-hidden", false);
      this.elements.liveRegion.innerHTML =
        window.accessibilityStrings.imageAvailable.replace("[index]", position);
      setTimeout(() => {
        this.elements.liveRegion.setAttribute("aria-hidden", true);
      }, 2000);
    };
    image.src = image.src;
  }

  playActiveMedia(activeItem) {}

  //Main Slider(full width images)
  removeListSemantic() {
    if (!this.elements.viewer.slider) return;
    this.elements.viewer.slider.setAttribute("role", "presentation");
    this.elements.viewer.sliderItems.forEach((slide) =>
      slide.setAttribute("role", "presentation")
    );
  }
}

customElements.define("media-gallery", MediaGallery);
