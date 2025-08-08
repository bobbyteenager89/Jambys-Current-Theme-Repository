document.addEventListener('DOMContentLoaded', function(){
  var sliders = document.querySelectorAll('.dtc-hero-slider');
  sliders.forEach(function(slider) {
    // Configure navigation controls and optional looping for each slider
    var swiper = new Swiper(slider, {
      navigation: {
        nextEl: slider.parentElement.querySelector('.swiper-button-next'),
        prevEl: slider.parentElement.querySelector('.swiper-button-prev'),
      },
      loop: slider.dataset.loopSlider === 'true' ? true : false,
      watchOverflow: true
    });
    //count the amound of slides in each slider
    var slides = slider.querySelectorAll('.swiper-slide').length;
  });
});


