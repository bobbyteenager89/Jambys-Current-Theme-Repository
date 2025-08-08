/**
 * Implements Proteus marketing treatments and site overrides.
 * Expected DOM: elements such as .cc-announcement and .cart-subtotal-currency.
 * Dependencies: utilities from proteus/_proteus-utils.js (getParam, waitUntil, waitForElement).
 */

console.log("init Proteus treatments - v1.08");

window.sessionStorage.setItem("disable_discount_threshold", true);

if(getParam("qa")){
  window.sessionStorage.setItem(getParam("qa"), "v1");
  if(getParam("var")){
    window.sessionStorage.setItem(getParam("qa"), getParam("var"));
  }
}

if(document.referrer.indexOf('jambys.com') == -1 && document.location.pathname == '/'){
  console.log('optimize.activate_HP_landing');
  waitUntil(() => {
    return !!window.dataLayer;
  }).then(() => {
    window.dataLayer.push({'event': 'optimize.activate_HP_landing'});
  });
}

if(window.location.href.indexOf("/products/rambys") > -1){
  window.location.href = "/cart";
}

if(getParam("trynow") == "active"){
  window.sessionStorage.setItem("trynow-active", true);
}

if(window.location.pathname === '/collections' || window.location.pathname === '/collections/'){
  console.log("redirect: /collections --> /collections/all-products");
  window.location = "/collections/all-products";
}

/*
START announcement bar override for promos
*/

let announcement_overrides = {};












console.log("announcement_overrides", announcement_overrides);

if(getParam("utm_medium") || window.sessionStorage.getItem("promo-announcement")){

    let utm_val;
    if(getParam("utm_medium")){
      utm_val = getParam("utm_medium");
    } else if(window.sessionStorage.getItem("promo-announcement")){
      utm_val = window.sessionStorage.getItem("promo-announcement");
    }

    console.log("utm_val", utm_val)

    if(!!utm_val && announcement_overrides[utm_val]){

      // if there is something that is custom-defined...

      window.sessionStorage.setItem("promo-announcement", utm_val);
      waitForElement('.cc-announcement').then(announcement => {
        announcement.innerHTML = `
        <a data-cc-animate-click="" href="/collections/jambys">
          <div class="cc-announcement__inner hidden-mobile">
            ${announcement_overrides[utm_val]}
          </div>
          <div class="cc-announcement__inner mobile-only">
            ${announcement_overrides[utm_val]}
          </div>
        </a>
        `;
      }).catch()

    }


}

/*
START ShipScout free shipping status bar override
*/

/*
window._shipScout = window._shipScout || [];
_shipScout.push(function (response) {
  if(response.variant){
    document.querySelector('.cc-announcement').innerHTML = `
      <div class="cc-announcement__inner">
        Get Free Shipping With All Orders $${(threshold_amount/100).toFixed(0)}+
      </div>
    `;
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector('body').insertAdjacentHTML("afterbegin", `
    <style>
    .js-invisible, .shipping-progress-bar-label{
      opacity: 0;
      transition: .5s ease all;
    }
    .js-reveal{
      opacity: 1 !important;
    }
    </style>
  `);
});
*/

waitUntil(() => {

  return document.querySelectorAll('.cart-subtotal-currency').length > 0;

}).then(() => {

  console.log("INIT");

  let prev_total = document.querySelector('.cart-subtotal-currency').getAttribute("data-cart-full-price");

  observeSelector('#shipping-progress-bar', fs_bar => {

    // IF THERE IS AN ACTIVE SHIPSCOUT TEST --> override the free shipping status bar in the ajax cart with updated threshold value

    window._shipScout = window._shipScout || [];
    _shipScout.push(function (response) {

      if(response.testId){
        window.sessionStorage.setItem("ss_test_active", response.freeShippingThresholdCents);
      }

      if(response.testId && document.querySelectorAll('#js-shipping-progress-bar').length == 0){

        console.log("ShipScout test is active", `${response.variant}: $${(response.freeShippingThresholdCents/100).toFixed(2)} threshold`);
        ga('send', 'event', 'CRO', 'ShipScout', `${response.variant}: $${(response.freeShippingThresholdCents/100).toFixed(2)} threshold`);

        let thresholdCents = (window.Shopify && Shopify.currency && Shopify.currency.rate) ? response.freeShippingThresholdCents * Shopify.currency.rate : response.freeShippingThresholdCents;

        document.querySelector('body').insertAdjacentHTML("afterbegin", `
          <style>
          #shipping-progress-bar, label[for="shipping-progress-bar"]{
            display: none;
            opacity: 0;
            position: absolute;
            left: -9999px;
          }

          #js-shipping-progress-bar{
            transition: .25s ease all;
          }
          </style>
        `);

        let cart_total = document.querySelector('.cart-subtotal-currency').getAttribute("data-cart-full-price");
        let cart_total_ig = document.querySelector('.cart-subtotal-currency').getAttribute("data-cart-total");

        let threshold_amount = response.freeShippingThresholdCents;

        console.log("update_freeshipping_progress", cart_total, threshold_amount);

        let fs_text;

        if(cart_total/threshold_amount > 1){
          fs_text = "This Order Will Ship Free!"
        } else {
          fs_text = `Get Free Shipping With All Orders $${(threshold_amount/100).toFixed(0)}+`;
        }

        fs_bar.insertAdjacentHTML("beforebegin", `

          <label for="js-shipping-progress-bar" class="shipping-progress-bar-label"><p>${fs_text}</p></label>
          <progress id="js-shipping-progress-bar" class="shipping-progress-bar" value="${prev_total}" max="${threshold_amount}"></progress>

        `);

        waitForElement('#js-shipping-progress-bar').then(js_progress => {
          setTimeout(() => {
            js_progress.value = document.querySelector('.cart-subtotal-currency').getAttribute("data-cart-full-price");
          }, 200);
        }).catch();

        prev_total = cart_total;

      } else {
        console.log("no active ShipScout test");
      }

      waitUntil(() => {
        return fs_bar_labels = document.querySelectorAll('.shipping-progress-bar-label').length > 0;
      }).then(() => {
        setTimeout(() => {
          let fs_bar_labels = document.querySelectorAll('.shipping-progress-bar-label');
          for(let i = 0; i < fs_bar_labels.length; i++){
            fs_bar_labels[i].classList.add("js-reveal");
          }
        }, 200);
      }).catch();

    });
  });

}).catch();

/*
END ShipScout free shipping status bar override
*/

waitUntil(() => {
  return window.sessionStorage.getItem("JMBY-53") || getParam("qa") == "JMBY-53";
}).then(() => {

  let jmby53_variation = window.sessionStorage.getItem("JMBY-53");

  if(getParam("var")){
    jmby53_variation = getParam("var");
  } else if (getParam("qa")){
    jmby53_variation = "v1"
  }

  window.sessionStorage.setItem("JMBY-53", jmby53_variation);
  init_experiment("JMBY-53", "v0.01", jmby53_variation);
  // largest item size flag/auto-select in PDP + quick view

  if(jmby53_variation == "v1"){
    waitForElement('body').then(body => {
      body.insertAdjacentHTML("afterbegin", `
        <style>

        .tn-cart-widget-container{
          font-size: .75rem;
        }

        .tn-cart-widget-container .js-tn-message{
          color: #36409a;
          font-size: .85rem;
          margin-bottom: 1rem;
          background: #fff;
          padding: 0.75em;
          line-height: 1.25em;
          margin: 1em .5em;
          border-radius: 100px;
        }

        .tn-cart-widget-container .js-tn-message--text{
          max-width: 325px;
          margin: auto;
        }

        .tn-cart-widget-container .tn-cart-widget-link{
          display: block;
          font-size: 1rem;
          margin-top: 1rem;
        }

        </style>
      `);

      observeSelector('.tn-cart-widget-container', tn_cart_widget => {
        tn_cart_widget.insertAdjacentHTML("afterbegin", `
          <div class="js-tn-message">
            <div class="js-tn-message--text">
              <strong>Curious about any of our other products?</strong><br>
              With Try Before You Buy you can get up to 5 items for free. Then after 7 days pay only for what you keep!
            </div>
          </div>
        `);

        document.querySelector('.tn-cart-widget-container a').addEventListener("click", (e) => {
          e.preventDefault();
          document.querySelector('[data-close-cart-drawer]').click();
        });

      });

    }).catch();
  }

  if(jmby53_variation == "v2"){
    // suppress TN elements on PDP
    // reveal all once interacted with
    // upsell TN in normal ATC

    waitForElement('body').then(body => {

      if(!window.sessionStorage.getItem("JMBY-53v2-interaction")){
        document.documentElement.classList.add("js-suppress-tn");
      }

      body.insertAdjacentHTML("afterbegin", `
        <style>

        .js-suppress-tn .tn-pdp-button, .js-suppress-tn .tn-info, .js-tn-message{
          display: none;
          position: absolute;
          left: -9999px;
          opacity: 0;
        }

        .js-suppress-tn .js-tn-message{
          display: block;
          position: static;
          opacity: 1;
          cursor: pointer;
          color: #36409a;
          font-size: .85rem;
          margin-bottom: 1rem;
          background: #fff;
          padding: 0.75em;
          line-height: 1.25em;
          margin: 1em .5em;
          text-align: center;
          border-radius: 100px;
        }

        .js-tn-message--text{
          max-width: 375px;
          margin: auto;
        }

        </style>
      `);

      observeSelector('#tn-cart-converter input', tn_toggle => {
        tn_toggle.addEventListener("click", () => {
          window.sessionStorage.setItem("JMBY-53v2-interaction", true);
          document.documentElement.classList.remove("js-suppress-tn");
        });

        if(!window.sessionStorage.getItem("JMBY-53v2-interaction") && document.querySelectorAll('#js-switch-order').length == 0){
          waitForElement('.cart-line-items').then(cart_line_items => {
            cart_line_items.insertAdjacentElement("afterend", tn_toggle.closest('#tn-cart-converter'));
            cart_line_items.insertAdjacentHTML("afterend", `
              <div id="js-switch-order" class="js-tn-message">
                <div class="js-tn-message--text">
                  <strong>Curious to try out more of our products?</strong><br>
                  Switch your order to Try Before You Buy, and add four more products for $0. Only pay for what you keep after 7 days!
                </div>
              </div>
            `);
            waitForElement('#js-switch-order').then(tn_switch => {
              tn_switch.addEventListener("click", () => {
                tn_toggle.click();
              });

              document.querySelector('.tn-cart-widget-container a').addEventListener("click", (e) => {
                e.preventDefault();
                document.querySelector('[data-close-cart-drawer]').click();
              });

            }).catch();

          }).catch();
        }

      })

    }).catch();


    // after ATC --> prominent msg

    // Want to try any of our other products? <strong>Try Jambys for free</strong> with TryNow. Order up to 5 items and after 7 days pay only for what you keep!
    // [switch order to TryNow]


    waitForElement('body').then(() => {

    });
  }

}).catch();


waitUntil(() => {
  return window.sessionStorage.getItem("JMBY-59") || getParam("qa").indexOf("JMBY-59") > -1;
}).then(() => {
  window.sessionStorage.setItem("JMBY-59", "v1");
  init_experiment("JMBY-59", "v0.03", "v1");

  // threshold incentives
  // $89+ Free Shipping
  // $105+ apply discount
  // $150+ free gift

  waitUntil(() => {
    return !!document.body;
  }).then(() => {
    document.body.insertAdjacentHTML("afterbegin", `
      <style>
        .js-hidden{
          display: none;
          opacity: 0;
          position: absolute;
          left: -9999px;
        }

        .cart-details{
          height: auto;
        }

        .cart-line-items_container {
          height: calc(100% - 140px);
        }

        #shipping-progress-bar, [for="shipping-progress-bar"]{
          display: none;
          opacity: 0;
          position: absolute;
          left: -9999px;
        }
        .js-incentives{
          margin: 0 40px;
        }

        .js-incentives--label{
          text-align: center;
          font-size: 18px;
          margin: 1em 0;
        }

        @media(max-width: 768px){
          .js-incentives--label{
            font-size: 16px;
          }
        }

        .js-incentives--label strong{
          text-align: center;
          font-size: 1.1em;
          margin: 1em 0;
        }

        .js-incentives--bar{
          position:relative;
          padding: 5px;
          border-radius:25px;
          background: #e2e8f0;
        }
        .js-incentives--bar--progress{
          position:absolute;
          padding: 5px;
          border-radius:25px 0 0 25px;
          top: 0;
          left: 0;
          background: #8f94c4;
        }
        .js-incentives--bar--checkpoint{
          position: absolute;
          padding: 12px;
          border-radius: 100%;
          background: #e2e8f0;
          top: -7px;
        }
        .js-incentives--bar--checkpoint:after{
          content: "";
          background: #36409a;
          opacity: .25;
          padding: 5px;
          border-radius: 100%;
          position: absolute;
          top: 7px;
          left: 7px;
        }
        .js-incentives--bar--checkpoint[data-checkpoint-met="true"]{
          background: #8f94c4;
        }
        .js-incentives--bar--checkpoint[data-checkpoint-met="true"]:after{
          opacity: 1;
        }

        .js-incentives--bar--checkpoint[data-checkpoint="0"]{
          left: -12px;
        }

        .js-incentives--bar--checkpoint[data-checkpoint="1"]{
          left: calc(33.33% - 12px);
        }
        .js-incentives--bar--checkpoint[data-checkpoint="2"]{
          left: calc(66.66% - 12px);
        }
        .js-incentives--bar--checkpoint[data-checkpoint="3"]{
          left: calc(100% - 12px);
        }

        .js-rambys--sizes{
          width: 100%;
          text-align: center;
          position: absolute;
          bottom: -2.5rem;
          right: 24px;
        }

        .js-rambys--sizes ul{
          display: block;
          margin: .25em 0 0 2.25rem;
          padding: 0;
          text-align: left;
        }

        .js-rambys--sizes ul li{
          display: inline-block;
          border: 2px solid #36409a;
          color: #36409a;
          margin: 4px;
          padding: 0;
          font-size: 14px;
          font-weight: 900;
          height: 32px;
          width: 32px;
          text-align: center;
          border-radius: 100%;
          line-height: 26px;
          opacity: .25;
          transform: scale(.9);
        }

        .js-rambys--sizes ul li:hover{
          cursor: pointer;
          opacity: .5;
        }

        .js-rambys--sizes ul li.active{
          opacity: 1;
          color: #36409a;
          transform: scale(1);
        }

        [data-product-type="Rambys"] .cart-line-item{
          flex-wrap: wrap;
          position: relative;
        }

        [data-product-type="Rambys"] article h3{
          color: #ffe660;
        }

        .cart-line-items_container {
          max-height: calc(100vh - 100px) !important;
        }

        @media screen and (min-width: 769px){
          .cart-section {
            padding-top: 0 !important;
          }
        }

        @media (max-width: 500px){

          [data-product-type="Rambys"]{
            margin: 0 0 2rem 0;
          }

          .js-rambys--sizes ul{
            margin: .25em 0 0 0;
          }

          .js-rambys--sizes{
            text-align: left;
            bottom: -3rem;
            left: 16px;
            right: auto;
          }

          .js-rambys--sizes li{
            margin: 6px 0 !important;
          }
        }

        .js-bfcm-sm{
          position: relative;
          font-size: 1.1em;
          font-weight: 900;
        }

        .js-bfcm-sm > *{
          opacity: .75;
          font-size: .85em;
          font-weight: 400;
        }

        .product-detail__form .js-bfcm-sm{
          top: 1rem;
          right: -1rem;
        }

        .product-detail__form .js-bfcm-sm > span{
          display: block;
          font-size: .6em;
        }

        .product-detail__form__action > button .js-bfcm-sm{
          position: static;
        }

      </style>
    `);
    waitUntil(() => {
      return window.sessionStorage.getItem("JMBY-69") || getParam("qa").indexOf("JMBY-69") > -1;
    }).then(() => {
      console.log('init JMBY-69v1 -- v0.01')
      window.sessionStorage.setItem("JMBY-69", "v1");
      waitForElement(".cart-drawer .js-incentives").then(js_incentives => {
        js_incentives.insertAdjacentHTML("afterbegin", `
        <style>
          .js-incentives--bar--checkpoint[data-checkpoint="2"]::before {
            content: "20% Off" !important;
          }
      </style>
      `);
      }).catch();
    }).catch();
  }).catch();

  waitUntil(() => {
    return !!document.body;
  }).then(() => {
    if(document.body.getAttribute('data-product-type') != "Gift Cards" && window.location.href.indexOf("/cart") == -1){
    }
  }).catch();

  // JMBY-75 - update banners
  waitUntil(() => {
    return window.sessionStorage.getItem("JMBY-75") || getParam("qa").indexOf("JMBY-75") > -1;
  }).then(() => {
    observeSelector('.cc-announcement', announcement => {
      /*
      if(window.sessionStorage.getItem("JMBY-75") == "v1"){
        announcement.innerHTML = `
        <a data-cc-animate-click="" href="https://www.jambys.com/collections/all-products">
          <div class="cc-announcement__inner hidden-mobile">
          Get a free pair of all-new House Socks with Orders $45+
          </div>
          <div class="cc-announcement__inner mobile-only">
            Free Socks on Orders $45+
          </div>
        </a>
        `;
      }
      if(window.sessionStorage.getItem("JMBY-75") == "v2"){
        announcement.innerHTML = `
        <a data-cc-animate-click="" href="https://www.jambys.com/collections/all-products">
          <div class="cc-announcement__inner hidden-mobile">
            Get a free pair of all-new House Socks with Any Order Today
          </div>
          <div class="cc-announcement__inner mobile-only">
            Free Socks with every order
          </div>
        </a>
        `;
      }
      */
    });
  }).catch();

  observeSelector('#shipping-progress-bar', fs_bar => {

    if(document.querySelectorAll('.js-incentives').length == 0){

      let cart_total = parseInt(document.querySelector('[data-cart-full-price]').getAttribute("data-cart-full-price"));
      let cart_total_after_li_d = parseInt(document.querySelector('[data-cart-total]').getAttribute("data-cart-total"));
      let cart_total_ig = document.querySelector('.cart-subtotal-currency').getAttribute("data-cart-total");
      let cart_discount_savings = parseInt(document.querySelector('[data-cart-full-price]').getAttribute("data-cart-discount-savings")*.01);
      console.log("cart_total", cart_total);

      document.body.insertAdjacentHTML("afterbegin", `
        <style>
        .cart-subtotal-currency{
          transition: .5s ease opacity;
          opacity: 0;
        }
        .cart-subtotal-currency > s{
          opacity: .6;
        }
        .cart-subtotal-currency.js-reveal {
          opacity: 1 !important;
        }
        </style>
      `);

      let goal_1 = 8900;
      if(window.sessionStorage.getItem("ss_test_active")){
        goal_1 = window.sessionStorage.getItem("ss_test_active");
      }
      let goal_2 = 12000;
      let goal_3 = 20000;

      let savings_discount_code = "NO-DISCOUNT"; // $15 off order (minimum $105)
      if(window.sessionStorage.getItem("ss_test_active") || window.sessionStorage.getItem("disable_discount_threshold")){
        savings_discount_code = "NO-DISCOUNT"; // disable and remove discount threshold
      } else if(window.sessionStorage.getItem("JMBY-69")){
        savings_discount_code = "20OFF"; // 20% off order (minimum $120)
      } 

      if(!!window.sessionStorage.getItem("JMBY-75")){
        goal_2 = 10500;
        if(window.sessionStorage.getItem("ss_test_active") || window.sessionStorage.getItem("disable_discount_threshold")){
          goal_2 = 0;
        }
        savings_discount_code = "NO-DISCOUNT"; // $15 off order (minimum $105)

        waitUntil(() => {
          return document.querySelectorAll('.js-incentives .js-incentives--bar').length > 0;
        }).then(() => {
          if(window.sessionStorage.getItem("ss_test_active") || window.sessionStorage.getItem("disable_discount_threshold")){
            document.querySelector('.js-incentives .js-incentives--bar').insertAdjacentHTML("afterbegin", `
              <style>
              .js-incentives--bar--checkpoint[data-checkpoint="2"],
              .js-incentives--bar--checkpoint[data-checkpoint="2"]::before,
              .js-incentives--bar--checkpoint[data-checkpoint="2"]::after {
                content: none !important;
                display: none !important;
              }
              </style>
            `);
          }
          document.querySelector('.js-incentives .js-incentives--bar').insertAdjacentHTML("afterbegin", `
            <style>
            .js-incentives--bar--checkpoint[data-checkpoint="0"] {
              z-index: 10;
            }
            .js-incentives--bar--checkpoint[data-checkpoint="0"]::before {
              content: "Free Socks";
            }
            .js-incentives--bar--checkpoint[data-checkpoint="2"]::before {
              content: "$15 Off" !important;
            }
            </style>
            <div class="js-incentives--bar--checkpoint" data-checkpoint="0" data-checkpoint-met="false"></div>
          `);
        }).catch();

        waitForElement('ul.cart-line-items').then(cart_line_items => {

          cart_line_items.insertAdjacentHTML("afterend", `

          <div id="js-free-socks" class="cart-box-container" style="display: none;">
            <header class="cart-line-header" style="padding-left: 0;">
              <strong>Select your free pair of House Socks</strong>
            </header>
            <div class="cart-box-wrapper">

              <ul class="upsell-line-items">
                <li class="cart-line-item-container jmby48-upsell-item" data-product-type="upsell">

                  <article class="cart-line-item" style="justify-content: flex-start;">
                    <img id="js-sock-image" class="cart-line-img" src="https://cdn.shopify.com/s/files/1/0090/4128/1109/products/housesock-whiteecom.png?v=1675543089&width=200">

                    <div class="upsell-info">
                      <h3>Jambys House Socks</h3>

                      <div class="upsell-options">

                        <select id="js-sock-size" class="jmby48-select" ecl="true">
                          <option id="js-sock-size--s" value="40444584263765" ecl="true">S</option>
                          <option id="js-sock-size--m" value="40444584296533" ecl="true">M</option>
                          <option id="js-sock-size--l" value="40444584329301" ecl="true">L</option>
                        </select>

                        <select id="js-sock-color" class="jmby48-select" ecl="true">
                          <option value="white" ecl="true">White</option>
                          <option value="black" ecl="true">Black</option>
                          <option value="navymint" ecl="true">Navy/Mint</option>
                        </select>

                        <div class="radio-group">
                          <a style="display: block;" id="js-atc-socks">Add</a>
                        </div>

                      </div>

                      <a href="/products/white-house-socks" style="transform: scale(.75); transform-origin: left; margin-left: -15px;">
                        <svg class=" fill-current" width="100%" height="100%" viewBox="0 0 24 24" fill="none" ecl="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.86816 6.26563C1.67289 6.4609 1.67289 6.77748 1.86816 6.97274L3.73503 8.83962C3.74065 8.84582 3.74645 8.85192 3.75243 8.8579C3.75842 8.86389 3.76452 8.86969 3.77072 8.8753L5.62335 10.7279C5.628 10.733 5.63278 10.738 5.63769 10.7429C5.64259 10.7478 5.64757 10.7525 5.65262 10.7572L7.50595 12.6105C7.51129 12.6164 7.51679 12.6222 7.52245 12.6278C7.52812 12.6335 7.53388 12.639 7.53975 12.6443L9.39469 14.4993C9.39893 14.5038 9.40327 14.5083 9.40771 14.5128C9.41215 14.5172 9.41665 14.5216 9.42121 14.5258L11.2771 16.3817C11.2821 16.3871 11.2872 16.3925 11.2925 16.3977C11.2977 16.403 11.3031 16.4081 11.3085 16.4131L13.166 18.2706C13.1698 18.2747 13.1737 18.2787 13.1777 18.2827C13.1817 18.2867 13.1858 18.2906 13.1899 18.2945L15.0482 20.1527C15.0528 20.1578 15.0576 20.1628 15.0625 20.1677C15.0674 20.1726 15.0724 20.1774 15.0774 20.182L16.9478 22.0524C17.1431 22.2477 17.4597 22.2477 17.6549 22.0524L22.0532 17.6542C22.2485 17.4589 22.2485 17.1423 22.0532 16.9471L6.9735 1.86739C6.77824 1.67213 6.46166 1.67213 6.2664 1.86739L1.86816 6.26563ZM14.2386 17.929L15.4163 19.1067L16.4767 18.0464C16.672 17.8511 16.9886 17.8511 17.1838 18.0464C17.3791 18.2416 17.3791 18.5582 17.1838 18.7535L16.1235 19.8138L17.3014 20.9918L20.9925 17.3006L6.61995 2.92805L2.92882 6.61919L4.10643 7.7968L5.16665 6.73658C5.36191 6.54132 5.67849 6.54132 5.87375 6.73658C6.06902 6.93184 6.06902 7.24843 5.87375 7.44369L4.81354 8.50391L5.99154 9.68191L7.75901 7.91444C7.95427 7.71918 8.27085 7.71918 8.46611 7.91444C8.66138 8.1097 8.66138 8.42628 8.46611 8.62155L6.69864 10.389L7.8764 11.5668L8.93667 10.5065C9.13193 10.3112 9.44851 10.3112 9.64377 10.5065C9.83904 10.7018 9.83904 11.0184 9.64377 11.2136L8.58351 12.2739L9.7615 13.4519L11.529 11.6844C11.7243 11.4891 12.0409 11.4891 12.2361 11.6844C12.4314 11.8796 12.4314 12.1962 12.2361 12.3915L10.4686 14.159L11.6464 15.3367L12.7067 14.2764C12.9019 14.0812 13.2185 14.0812 13.4138 14.2764C13.6091 14.4717 13.6091 14.7883 13.4138 14.9835L12.3535 16.0438L13.5315 17.2218L15.299 15.4543C15.4943 15.259 15.8109 15.259 16.0062 15.4543C16.2014 15.6495 16.2014 15.9661 16.0062 16.1614L14.2386 17.929Z" ecl="true"></path></svg>Sizing Info
                      </a>

                    </div>
                  </article>

                </li>
              </ul>

            </div>
          </div>
          `);

          waitForElement('#js-atc-socks').then(atc_socks => {
            atc_socks.addEventListener("click", () => {

              let sock_var_id = document.querySelector("#js-sock-size").value;
              cart_add_item(sock_var_id, 1);
              setTimeout(() => {
                updateCartCounts();
                toggleCart()
              }, 300);

            });
          }).catch();

          const socks_var_ids = {
            white: {
              s: 40444584263765,
              m: 40444584296533,
              l: 40444584329301
            },
            black: {
              s: 40444585050197,
              m: 40444585082965,
              l: 40444585115733
            },
            navymint: {
              s: 40444586229845,
              m: 40444586262613,
              l: 40444586295381
            }
          }

          waitForElement('#js-free-socks').then(free_socks => {
            let size_sel = free_socks.querySelector('#js-sock-size');
            let size_s = free_socks.querySelector('#js-sock-size--s');
            let size_m = free_socks.querySelector('#js-sock-size--m');
            let size_l = free_socks.querySelector('#js-sock-size--l');

            let color_sel = free_socks.querySelector('#js-sock-color');
            let sock_img = free_socks.querySelector('#js-sock-image');

            color_sel.addEventListener("change", () => {

              size_s.value = socks_var_ids[document.querySelector('#js-sock-color').value].s;
              size_m.value = socks_var_ids[document.querySelector('#js-sock-color').value].m;
              size_l.value = socks_var_ids[document.querySelector('#js-sock-color').value].l;

              if(document.querySelector('#js-sock-color').value == "white"){
                sock_img.src = "https://cdn.shopify.com/s/files/1/0090/4128/1109/products/housesock-whiteecom.png?v=1675543089&width=200";
              } else if(document.querySelector('#js-sock-color').value == "black"){
                sock_img.src = "https://cdn.shopify.com/s/files/1/0090/4128/1109/products/housesock-blackecom.png?v=1675543299&width=200";
              } else if(document.querySelector('#js-sock-color').value == "navymint"){
                sock_img.src = "https://cdn.shopify.com/s/files/1/0090/4128/1109/products/housesock-navymintecom.png?v=1675543187&width=200";
              }
            });
          }).catch();
        }).catch();

      } // JMBY-75

      let message, check_1, check_2, check_3, progress_width, progress_min_width;

      let free_gift_value = 3500;
      let rambys_sizes = ["Extra Small", "Small", "Medium", "Large", "Extra Large", "2X Large", "3X Large"];
      let rambys_html = `
      <li id="free-gift--rambys" class="cart-line-item-container" data-product-type="Rambys">
        <article class="cart-line-item">

          <a class="cart-line-item-link" href="#">
            <img class="cart-line-img" src="https://cdn.shopify.com/s/files/1/0090/4128/1109/files/Jambys.gif?v=1665556429">
            <div class="cart-line-info" style="position: relative;">
              <h3 class="cart-line-title">A Totally Random Pair of Jambys!</h3>
              <h4 class="cart-line-variant-title" id="js-rambys-size">Choose your size:</h4>
              <div class="mini_cart_final" style="position: absolute; bottom: 0; right: 0;">
                <strong>FREE</strong>
              </div>

              <div class="js-rambys--sizes">
                <ul>
                  <li data-var-id="40124675620949" data-size-name="Extra Small" class="">XS</li>
                  <li data-var-id="40124675653717" data-size-name="Small" class="">S</li>
                  <li data-var-id="40124675686485" data-size-name="Medium" class="">M</li>
                  <li data-var-id="40124675719253" data-size-name="Large" class="">L</li>
                  <li data-var-id="40124675752021" data-size-name="Extra Large" class="">XL</li>
                  <li data-var-id="40124675784789" data-size-name="2X Large" class="">XXL</li>
                  <li data-var-id="40124675817557" data-size-name="3X Large" class="">3XL</li>
                </ul>
              </div>

            </div>
          </a>
        </article>
      </li>
      `;

      const setup_option_actions = (options_array, option_name) => {
        for(let i = 0; i < options_array.length; i++) {
          options_array[i].addEventListener("click", (e) => {
            e.target.classList.add("active");
            window.sessionStorage.setItem(option_name, i);

            let sibling = e.target.parentNode.firstChild;
            while (sibling) {
              if (sibling.nodeType === 1 && sibling !== e.target) {
                sibling.classList.remove("active");
              }
              sibling = sibling.nextSibling
            }

          });

        }
      };

      let cart_line_items = document.querySelectorAll('.cart-line-item .cart-line-variant-title');
      const pre_select_size_option = (sizes_array, options_array, option_name) => {
        if(window.sessionStorage.getItem(option_name)){
          options_array[window.sessionStorage.getItem(option_name)].click();
        } else {
          for(let i = 0; i < cart_line_items.length; i++){
            if(sizes_array.indexOf(cart_line_items[i].innerText) > -1){
              options_array[sizes_array.indexOf(cart_line_items[i].innerText)].click();
              break;
            }
            if(i == cart_line_items.length -1){
              options_array[0].click();
            }
          }
        }
      };

      let inject_rambys_selector = () => {
        waitForElement(".cart-line-items").then(cart_items => {
          if(cart_items.innerText.indexOf("Rambys") == -1){
            cart_items.insertAdjacentHTML("afterbegin", `
              ${rambys_html}
            `);
          }
        }).catch();

        waitUntil(() => {
          return document.querySelectorAll('.js-rambys--sizes').length > 0;
        }).then(() => {
          let rambys_options = document.querySelectorAll('[data-product-type="Rambys"] .js-rambys--sizes li');

          setup_option_actions(rambys_options, "Rambys");
          pre_select_size_option(rambys_sizes, rambys_options, "Rambys");

        }).catch();
      };


      let cart_full_price = 0;
      let cart_subtotal_price = 0;

      if(window.sessionStorage.getItem("JMBY-75") && document.querySelectorAll('.cart-line-items [data-product-type="House Socks"]').length == 0){
        waitForElement('#js-free-socks').then(free_socks => {
          
          waitForElement('.js-incentives--bar--checkpoint[data-checkpoint="0"]').then(bar_dot => {
            if(window.sessionStorage.getItem("JMBY-75") == "v1"){
              bar_dot.style.left = "calc(18% - 12px)";
              if(cart_total < 4500){
                bar_dot.setAttribute("data-checkpoint-met", "false");
              } else {
                bar_dot.setAttribute("data-checkpoint-met", "true");
              }

            } else if(window.sessionStorage.getItem("JMBY-75") == "v2"){
              bar_dot.style.left = "calc(5% - 12px)";
              bar_dot.setAttribute("data-checkpoint-met", "true");
            }
          }).catch();

          console.log("cart total is", cart_total);
          if(window.sessionStorage.getItem("JMBY-75") == "v1" && cart_total < 4500){
            free_socks.style.display = "none";
          } else {
            free_socks.style.display = "block";
          }
        }).catch();
      }

      if(cart_total < goal_1){

        message = `Add $${(goal_1 - cart_total) / 100} for <strong>Free Shipping</strong>`;
        progress_width = (cart_total/goal_1)*.33;
        cart_full_price = parseInt((cart_total) * 0.01);
        cart_subtotal_price = parseInt(cart_total_after_li_d * 0.01);

      } else if(cart_total >= goal_1 && cart_total < goal_2){

        message = `This Order Ships Free!<br>Add $${(goal_2 - cart_total) / 100} to get <strong>$15 off</strong>`;
        progress_width = .33+((cart_total-goal_1)/(goal_2-goal_1))*.33;
        check_1 = "true";
        cart_full_price = parseInt((cart_total) * 0.01);
        cart_subtotal_price = parseInt(cart_total_after_li_d * 0.01);

        if(window.sessionStorage.getItem("JMBY-69") && !window.sessionStorage.getItem("JMBY-75")){
          message = `This Order Ships Free!<br>Add $${(goal_2 - cart_total) / 100} to get <strong>20% off</strong>`;
        }

      } else if(cart_total >= goal_2 && cart_total < goal_3){
        message = `This Order Ships Free + $15 Off!<br>Add $${(goal_3 - cart_total) / 100} <strong>for a Free Gift</strong>`;
        progress_width = .66+((cart_total-goal_2)/(goal_3-goal_2))*.33;
        check_1 = true;
        check_2 = true;
        cart_full_price = parseInt((cart_total) * 0.01);
        // cart_subtotal_price = parseInt((cart_total_after_li_d - 1500) * 0.01);
        cart_subtotal_price = parseInt((cart_total_after_li_d) * 0.01);

        if(window.sessionStorage.getItem("JMBY-69") && !window.sessionStorage.getItem("JMBY-75")){
          message = `This Order Ships Free + 20% Off!<br>Add $${(goal_3 - cart_total) / 100} <strong>for a Free Gift</strong>`;
          cart_subtotal_price = parseInt(cart_total * 0.008);
        }

        if(goal_2 == 0){
          message = `This Order Ships Free!<br>Add $${(goal_3 - cart_total) / 100} <strong>for a Free Gift</strong>`;
        }

      } else if(cart_total >= goal_3){

        message = `<strong>Free Shipping + $15 Off + Free Gift!</strong>`;
        
        progress_width = 1;
        check_1 = true;
        check_2 = true;
        check_3 = true;
        inject_rambys_selector();
        cart_full_price = parseInt((cart_total + free_gift_value) * 0.01);
        cart_subtotal_price = parseInt((cart_total - 1500) * 0.01);

        if(window.sessionStorage.getItem("JMBY-69") && !window.sessionStorage.getItem("JMBY-75")){
          message = `<strong>Free Shipping + 20% Off + Free Gift!</strong>`;
          cart_subtotal_price = parseInt(cart_total * 0.008);
        }

        if(goal_2 == 0){
          message = `<strong>Free Shipping + Free Gift!</strong>`;
        }

      }

      let update_checkout_url = () => {
        console.log("update_checkout_url()");
        setTimeout(() => {
          document.querySelector('.cart-subtotal-currency').classList.add("js-reveal");

          let checkout_actions = document.querySelectorAll('a[href*="/checkout"]');
          let checkout_url = `/checkout`;

          if(getCookie('discount_code')){
            if(check_2 && !check_3){
              checkout_url = `/checkout`;
            } else if(check_2 && check_3){
              let free_gift_var_id = document.querySelector('[data-product-type="Rambys"] .js-rambys--sizes li.active').getAttribute("data-var-id");
              checkout_url = `/cart/add?items[][id]=${free_gift_var_id}&items[][quantity]=1&return_to=/checkout`;
            }
          } else {
            if(check_2 && !check_3){
              checkout_url = `/discount/${savings_discount_code}?redirect=/checkout`;
            } else if(check_2 && check_3){
              let free_gift_var_id = document.querySelector('[data-product-type="Rambys"] .js-rambys--sizes li.active').getAttribute("data-var-id");
              checkout_url = `/cart/add?items[][id]=${free_gift_var_id}&items[][quantity]=1&return_to=/discount/${savings_discount_code}?redirect=/checkout`;
            }
          }

          for(let i = 0; i < checkout_actions.length; i++){
            checkout_actions[i].href = checkout_url;
          }

        }, 50);
      };

      observeSelector('.js-rambys--sizes li', rambys_options => {
        rambys_options.addEventListener("click", update_checkout_url);
      })

      let intelligems_total = 0;
      get_cart_json().then(cart => {

        cart.items.forEach((item) => {
          switch (item.properties._igLineItemDiscount) {
            case 0:
            case '':
            case null:
            case undefined:
              break;
            default:
              //var intelligems_discount = item.properties._igLineItemDiscount + 0
              intelligems_total = intelligems_total + item.properties._igLineItemDiscount
          }
        });
      setTimeout(() => {
        if(intelligems_total == 0) {
          window.console.log("igt->0")

          if((cart_full_price + cart_discount_savings)  == cart_subtotal_price){
          document.querySelector('.cart-subtotal-currency').innerHTML = `
            $${cart_subtotal_price}
          `;
          } else {
            document.querySelector('.cart-subtotal-currency').innerHTML = `
              <s>$${(cart_full_price + cart_discount_savings)}</s> $${cart_subtotal_price}
            `;
          }
        } else {
          document.querySelector('.cart-subtotal-currency').innerHTML = `
            $${parseInt(cart_total_ig*0.01)}
          `;
        }

        update_checkout_url();

      }, 400);
      });
      // /cart/add?items[][id]=39543255335014&items[][quantity]=2&items[][id]=39543463510118&items[][quantity]=2&return_to=/checkout

      //let fs_label = fs_bar.previousElementSibling;
      waitForElement(".cart-line-items").then(cart_items => {
        cart_items.insertAdjacentHTML("beforebegin", `
          <div class="js-incentives">
            <div class="js-incentives--label">
              ${message}
            </div>
            <div class="js-incentives--bar">
              <div class="js-incentives--bar--progress" style="width: ${progress_width*100}%; min-width: ${progress_min_width}%;"></div>
              <div class="js-incentives--bar--checkpoint" data-checkpoint="1" data-checkpoint-met="${check_1}"></div>
              <div class="js-incentives--bar--checkpoint" data-checkpoint="2" data-checkpoint-met="${check_2}"></div>
              <div class="js-incentives--bar--checkpoint" data-checkpoint="3" data-checkpoint-met="${check_3}"></div>
            </div>
          </div>
        `);
      }).catch();

    } // if no .js-incentives

  });

}).catch();

/*
JMB-71 Fondue/Klaviyo form metrics

mobile v0: "Do you want 20% off your first order?" Yes!
mobile v1: "Want 20% off your first order?" Yes!
mobile v2: "Want 20% back on your order?" Yes, I want 20%!

desktop v0: "Do you want 20% off your first order?" Yes, I want 20% off!
desktop v1: "Want 20% off your first order?" Yes, I want 20% off!
desktop v2: "Want 20% back on your first order?" Yes, I want 20%!
*/

observeSelector('button.needsclick', klaviyo_btn => {

  setTimeout(() => {

    if(!!klaviyo_btn.closest('form')){

      let form_text = klaviyo_btn.closest('form').innerText;

      if(form_text.indexOf("Do you want 20% off your first order?") > -1 || form_text.indexOf("Want 20% off your first order?") > -1 || form_text.indexOf("Want 20% back on your order?") > -1 || form_text.indexOf("Want 20% back on your first order?") > -1){

        let jmby71_var = "v2";
        if(form_text.indexOf("Want 20% off your first order?") > -1){
          jmby71_var = "v1";
        } else if(form_text.indexOf("Do you want 20% off your first order?") > -1){
          jmby71_var = "v0";
        }

        console.log(`Fondue ${jmby71_var} active`);

        init_experiment("JMBY-71", "v0.01", `${jmby71_var}`);
        ga('send', 'event', 'CRO', `[JMBY-71] Fondue: ${jmby71_var}`, 'button seen');
        klaviyo_btn.addEventListener("click", () => {
          ga('send', 'event', 'CRO', `[JMBY-71] Fondue: ${jmby71_var}`, 'button click');
          observeSelector('input.needsclick[name="email"]', klaviyo_email_input => {
            klaviyo_email_input.closest('form').addEventListener("submit", () => {
              ga('send', 'event', 'CRO', `[JMBY-71] Fondue: ${jmby71_var}`, 'form submitted');
            });

          });
        });

      }

    }

  }, 1000);

});
