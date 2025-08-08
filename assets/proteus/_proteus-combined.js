"use strict";

/**
 * Combined Proteus utilities and treatments for single inclusion.
 * Expected DOM: varies per included feature.
 * Dependencies: Proteus utilities and treatments modules.
 */

console.log("init Proteus utils - v1.05");

let variation;

const init_experiment = (exp_id, iteration = "0.01", force_variation) => {
  let exp_handle = exp_id.replace("-", "").toLowerCase();
  variation = window.window.sessionStorage.getItem(exp_id);

  if (getParam("qa").indexOf(exp_handle) > -1) {
    variation = getParam("qa").replace(exp_handle, "");
  }

  if (force_variation) {
    variation = force_variation;
  }

  let exp_tag = exp_handle + variation;
  document.documentElement.classList.add(exp_tag);
  console.log(`init ${exp_id}${variation} -- ${iteration}`);

  return variation;
};

function getCookie(name) {
  const value = `; ${
    document.cookie
  }`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) 
    return parts.pop().split(";").shift();
  
}

function waitForElement(selector) {
  return new Promise(function(resolve, reject) {
    var element = document.querySelector(selector);

    if (element) {
      resolve(element);
      return;
    }

    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        var nodes = Array.from(mutation.addedNodes);
        for (var node of nodes) {
          if (node.matches && node.matches(selector)) {
            observer.disconnect();
            resolve(node);
            return;
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  });
}

// shim layer with setTimeout fallback
const requestAnimFrame = (function() {
  return(window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
    window.setTimeout(callback, 3000 / 60);
  });
})();

function waitUntil(test) {
  return new Promise(function(resolve) {
    (function poll() {
      if (! test()) 
        return requestAnimFrame(poll, 50);
      
      return resolve();
    })();
  });
}

const observeSelector = (selector, callback, options = {
  timeout: null,
  once: false,
  onTimeout: null,
  document: window.document
}) => {
  let processed = new Map();

  if (options.timeout || options.onTimeout) {
    console.log("------------------------------------------------------------------------------------------------------------------------------");
    console.log("WARNING: observeSelector options timeout and onTimeout are not yet implemented.");
    console.log("------------------------------------------------------------------------------------------------------------------------------");
  }

  let obs,
    isDone = false;
  const done = () => {
    if (! obs) 
      console.warn("observeSelector failed to run done()");
    
    if (obs) 
      obs.disconnect();
    
    processed = undefined;
    obs = undefined;
    return(isDone = true);
  };

  const processElement = (el) => {
    if (processed && ! processed.has(el)) {
      processed.set(el, true);
      callback(el);
      if (options.once) {
        done();
        return true;
      }
    }
  };

  const lookForSelector = (el = document) => {
    if (el.matches && el.matches(selector)) {
      if (processElement(el)) 
        return true;
      
    }
    if (el.querySelectorAll) {
      const elements = el.querySelectorAll(selector);
      if (elements.length) {
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          if (processElement(el)) 
            return true;
          
        }
      }
    }
  };
  lookForSelector();

// We might finish before the mutation observer is necessary:
  if (! isDone) {
    obs = new MutationObserver((mutationsList) => {
      mutationsList.forEach((record) => {
        if (record && record.addedNodes && record.addedNodes.length) {
          for (let i = 0; i < record.addedNodes.length; i++) { // Need to check from the parent element since sibling selectors can be thrown off if elements show up in non-sequential order
            const el = record.addedNodes[i].parentElement;

// if (!el) console.warn('observeSelector element has no parent', record.addedNodes[i], record);
// Note: This appears to also run when elements are removed from the DOM. If the element doesn't have a parent then we don't need to check it.
            if (el && lookForSelector(el)) 
              return true;
            
          }
        }
      });
    });
    obs.observe(options.document || document, {
      attributes: false,
      childList: true,
      subtree: true
    });
  }

  return() => {
    done();
  };
};

// _observeSelector

// -----------

const getParam = (name, optSearch) => {
  "use strict";
  optSearch = optSearch || location.search;
  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(optSearch);
  return results === null
    ? ""
    : decodeURIComponent(results[1].replace(/\+/g, " "));
};

// -----------

const js_loadScript = (url, optCallback) => {
  "use strict";
  const ga = document.createElement("script");
  ga.type = "text/javascript";
  ga.async = true;
  ga.src = url;
  if (typeof optCallback === "function") {
    ga.onload = optCallback;
  }
  const s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(ga, s);
};

// ----

const cart_remove_items = (var_ids) => {

// check cart, and if any specified items exist, remove them
  console.log(`cart_remove_items(${var_ids})`);
  get_cart_json().then((data) => {
    for (let i = 0; i < data.items.length; i++) {
      for (let ii = 0; ii < var_ids.length; ii++) {
        console.log(`searching for ${
          var_ids[ii]
        } === ${
          data.items[i].variant_id
        }`);
        if (data.items[i].variant_id === var_ids[ii]) {
          console.log(`... removing ${
            var_ids[ii]
          }`);
          $.ajax({
            type: "POST",
            url: "/cart/change.js",
            data: {
              quantity: 0,
              id: var_ids[ii]
            },
            dataType: "json"
          });
        }
      } // endfor ii
    } // endfor i
  });
};

const cart_add_item = (var_id, qty, upsell = false) => {
  var items = {
    quantity: qty,
    id: var_id,
    properties: {
      _upsell: upsell
    }
  };
  $.ajax({
    type: "POST",
    url: "/cart/add.js",
    dataType: "json",
    data: items,
    success: function(data) {
      console.log("success upsell");
      console.log(data);
    },
    error: function() {
      console.log("error");
    }
  });
};

const get_cart_json = () => {

// console.log(`get_cart_json()`);
  return $.ajax({type: "GET", url: "/cart.js", dataType: "json", success: function(data) {

// return data;
    }});
};

const cart_contains_subscription = () => {
  return get_cart_json().then((data) => {
    for (let i = 0; i <= data.items.length; i++) {
      if (i === data.items.length) { // console.log('no subs found', i);
        return false;
      } else {
        if (data.items[i].properties && data.items[i].properties.shipping_interval_frequency) { // console.log("subs found in item", i);
          return true;
        } else { // console.log('has properties, not sub tho', i);
        }
      }
    }
  });
};

const cart_contains_item = (var_id) => {

// console.log(`cart_contains_item(${var_id})`);
  return get_cart_json().then((data) => {
    for (let i = 0; i <= data.items.length; i++) {
      if (i === data.items.length) { // console.log('item not found', i);
        return false;
      } else {
        if (data.items[i].variant_id === var_id) { // console.log("item found", i);
          return true;
        }
      }
    }
  });
};

/*
cart_contains_item(39321012895847).then(response => {
  console.log("cart_contains_item(39321012895847)",response);
});
*/

// loadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js", () => {
// console.log("jQuery re-loaded");
// }); //loadScript()

// ----

console.log("init Proteus treatments - v1.06");

if (document.referrer.indexOf('jambys.com') == -1 && document.location.pathname == '/') {
  console.log('optimize.activate_HP_landing');
  waitUntil(() => {
    return !!window.dataLayer;
  }).then(() => {
    window.dataLayer.push({'event': 'optimize.activate_HP_landing'});
  });
}

if (window.location.href.indexOf("/products/rambys") > -1) {
  window.location.href = "/cart";
}

if (getParam("trynow") == "active") {
  window.sessionStorage.setItem("trynow-active", true);
}

if (window.location.pathname === '/collections' || window.location.pathname === '/collections/') {
  console.log("redirect: /collections --> /collections/all-products");
  window.location = "/collections/all-products";
}

/*
START announcement bar override for promos
*/

let announcement_overrides = {};










console.log("announcement_overrides", announcement_overrides);

if (getParam("utm_medium") || window.sessionStorage.getItem("promo-announcement")) {

  let utm_val;
  if (getParam("utm_medium")) {
    utm_val = getParam("utm_medium");
  } else if (window.sessionStorage.getItem("promo-announcement")) {
    utm_val = window.sessionStorage.getItem("promo-announcement");
  }

  console.log("utm_val", utm_val)

  if (!! utm_val && announcement_overrides[utm_val]) { // if there is something that is custom-defined...

    window.sessionStorage.setItem("promo-announcement", utm_val);
    waitForElement('.cc-announcement').then(announcement => {
      announcement.innerHTML = `
        <a data-cc-animate-click="" href="/collections/jambys">
          <div class="cc-announcement__inner hidden-mobile">
            ${
        announcement_overrides[utm_val]
      }
          </div>
          <div class="cc-announcement__inner mobile-only">
            ${
        announcement_overrides[utm_val]
      }
          </div>
        </a>
        `;
    }).catch()

  }


}

/*
START ShipScout free shipping status bar override
*/

window._shipScout = window._shipScout || [];
_shipScout.push(function(response) {
  if (response.variant) {
    document.querySelector('.cc-announcement').innerHTML = `
      <div class="cc-announcement__inner">
        Get Free Shipping With All Orders $${
      (threshold_amount / 100).toFixed(0)
    }+
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

waitUntil(() => {

  return document.querySelectorAll('.cart-subtotal-currency').length > 0;

}).then(() => {

  console.log("INIT");

  let prev_total = document.querySelector('.cart-subtotal-currency').getAttribute("data-cart-full-price");

  observeSelector('#shipping-progress-bar', fs_bar => {

// IF THERE IS AN ACTIVE SHIPSCOUT TEST --> override the free shipping status bar in the ajax cart with updated threshold value

    window._shipScout = window._shipScout || [];
    _shipScout.push(function(response) {

      if (response.testId && document.querySelectorAll('#js-shipping-progress-bar').length == 0) {

        console.log("ShipScout test is active", `${
          response.variant
        }: $${
          (response.freeShippingThresholdCents / 100).toFixed(2)
        } threshold`);
        ga('send', 'event', 'CRO', 'ShipScout', `${
          response.variant
        }: $${
          (response.freeShippingThresholdCents / 100).toFixed(2)
        } threshold`);

        let thresholdCents = (window.Shopify && Shopify.currency && Shopify.currency.rate)
          ? response.freeShippingThresholdCents * Shopify.currency.rate
          : response.freeShippingThresholdCents;

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

        if (cart_total / threshold_amount > 1) {
          fs_text = "This Order Will Ship Free!"
        } else {
          fs_text = `Get Free Shipping With All Orders $${
            (threshold_amount / 100).toFixed(0)
          }+`;
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
      } waitUntil(() => {
        return fs_bar_labels = document.querySelectorAll('.shipping-progress-bar-label').length > 0;
      }).then(() => {
        setTimeout(() => {
          let fs_bar_labels = document.querySelectorAll('.shipping-progress-bar-label');
          for (let i = 0; i < fs_bar_labels.length; i++) {
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

  if (getParam("var")) {
    jmby53_variation = getParam("var");
  } else if (getParam("qa")) {
    jmby53_variation = "v1"
  }

  window.sessionStorage.setItem("JMBY-53", jmby53_variation);
  init_experiment("JMBY-53", "v0.01", jmby53_variation);

// largest item size flag/auto-select in PDP + quick view

  if (jmby53_variation == "v1") {
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

  if (jmby53_variation == "v2") {

// suppress TN elements on PDP
// reveal all once interacted with
// upsell TN in normal ATC

    waitForElement('body').then(body => {

      if (!window.sessionStorage.getItem("JMBY-53v2-interaction")) {
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

        if (!window.sessionStorage.getItem("JMBY-53v2-interaction") && document.querySelectorAll('#js-switch-order').length == 0) {
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


    waitForElement('body').then(() => {});
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
      document.body.insertAdjacentHTML("afterbegin", `
      <style>
        .js-incentives--bar--checkpoint[data-checkpoint="2"]::before {
          content: "20% Off" !important;
        }
      </style>
      `);
    }).catch();
  }).catch();

  waitUntil(() => {
    return !!document.body;
  }).then(() => {
    if (document.body.getAttribute('data-product-type') != "Gift Cards" && window.location.href.indexOf("/cart") == -1) {}
  }).catch();

  observeSelector('#shipping-progress-bar', fs_bar => {

    if (document.querySelectorAll('.js-incentives').length == 0) { // let cart_total = parseInt(document.querySelector('[data-cart-full-price]').getAttribute("data-cart-full-price"));
      let cart_total = parseInt(document.querySelector('[data-cart-full-price]').getAttribute("data-cart-full-price"));
      let cart_total_ig = document.querySelector('.cart-subtotal-currency').getAttribute("data-cart-total");
      let cart_discount_savings = parseInt(document.querySelector('[data-cart-full-price]').getAttribute("data-cart-discount-savings") * .01);
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
      let goal_2 = 12000;
      let goal_3 = 20000;

      let savings_discount_code = "15OFF"; // $15 off order (minimum $105)
      if (window.sessionStorage.getItem("JMBY-69")) {
        savings_discount_code = "20OFF"; // 20% off order (minimum $120)
      }

      let message,
        check_1,
        check_2,
        check_3,
        progress_width,
        progress_min_width;

      let free_gift_value = 3500;
      let rambys_sizes = [
        "Extra Small",
        "Small",
        "Medium",
        "Large",
        "Extra Large",
        "2X Large",
        "3X Large"
      ];
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
        for (let i = 0; i < options_array.length; i++) {
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
        if (window.sessionStorage.getItem(option_name)) {
          options_array[window.sessionStorage.getItem(option_name)].click();
        } else {
          for (let i = 0; i < cart_line_items.length; i++) {
            if (sizes_array.indexOf(cart_line_items[i].innerText) > -1) {
              options_array[sizes_array.indexOf(cart_line_items[i].innerText)].click();
              break;
            }
            if (i == cart_line_items.length - 1) {
              options_array[0].click();
            }
          }
        }
      };

      let inject_rambys_selector = () => {
        waitForElement(".cart-line-items").then(cart_items => {
          if (cart_items.innerText.indexOf("Rambys") == -1) {
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

      if (cart_total < goal_1) {

        message = `Add $${
          (goal_1 - cart_total) / 100
        } for <strong>Free Shipping</strong>`;
        progress_width = (cart_total / goal_1) * .33;
        cart_full_price = parseInt((cart_total) * 0.01);
        cart_subtotal_price = parseInt(cart_total * 0.01);

      } else if (cart_total >= goal_1 && cart_total<goal_2){

        message = `This Order Ships Free!<br>Add $${(goal_2 - cart_total) / 100} to get <strong>$15 off</strong>`;
        progress_width = .33+((cart_total-goal_1)/(goal_2-goal_1))*.33;
        check_1 = "true";
        cart_full_price = parseInt((cart_total) * 0.01);
        cart_subtotal_price = parseInt(cart_total * 0.01);

        if(window.sessionStorage.getItem("JMBY-69")){
          message = `This Order Ships Free!<br>Add $${(goal_2 - cart_total) / 100} to get <strong>20% off</strong>`;
        }

      } else if(cart_total> = goal_2 && cart_total<goal_3){
        message = `This Order Ships Free + $15 Off!<br>Add $${(goal_3 - cart_total) / 100} <strong>for a Free Gift</strong>`;
        progress_width = .66+((cart_total-goal_2)/(goal_3-goal_2))*.33;
        check_1 = true;
        check_2 = true;
        cart_full_price = parseInt((cart_total) * 0.01);
        cart_subtotal_price = parseInt((cart_total - 1500) * 0.01);

        if(window.sessionStorage.getItem("JMBY-69")){
          message = `This Order Ships Free + 20% Off!<br>Add $${(goal_3 - cart_total) / 100} <strong>for a Free Gift</strong>`;
          cart_subtotal_price = parseInt(cart_total * 0.008);
        }

      } else if(cart_total> = goal_3) {

        message = `<strong>Free Shipping + $15 Off + Free Gift!</strong>`;
        progress_width = 1;
        check_1 = true;
        check_2 = true;
        check_3 = true;
        inject_rambys_selector();
        cart_full_price = parseInt((cart_total + free_gift_value) * 0.01);
        cart_subtotal_price = parseInt((cart_total - 1500) * 0.01);

        if (window.sessionStorage.getItem("JMBY-69")) {
          message = `<strong>Free Shipping + 20% Off + Free Gift!</strong>`;
          cart_subtotal_price = parseInt(cart_total * 0.008);
        }

      }
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

// var intelligems_discount = item.properties._igLineItemDiscount + 0
              intelligems_total = intelligems_total + item.properties._igLineItemDiscount
          }
        });
        setTimeout(() => {
          if (intelligems_total == 0) {
            window.console.log("igt->0")

            if ((cart_full_price + cart_discount_savings) == cart_subtotal_price) {
              document.querySelector('.cart-subtotal-currency').innerHTML = `
            $${cart_subtotal_price}
          `;
            } else {
              document.querySelector('.cart-subtotal-currency').innerHTML = `
              <s>$${
                (cart_full_price + cart_discount_savings)
              }</s> $${cart_subtotal_price}
            `;
            }
          } else {
            document.querySelector('.cart-subtotal-currency').innerHTML = `
            $${
              parseInt(cart_total_ig * 0.01)
            }
          `;
          }
          setTimeout(() => {
            document.querySelector('.cart-subtotal-currency').classList.add("js-reveal");

            let checkout_actions = document.querySelectorAll('[href*="/checkout"]');
            let checkout_url = `/checkout`;

            if (getCookie('discount_code')) {
              if (check_2 && ! check_3) {
                checkout_url = `/checkout`;
              } else if (check_2 && check_3) {
                let free_gift_var_id = document.querySelector('[data-product-type="Rambys"] .js-rambys--sizes li.active').getAttribute("data-var-id");
                checkout_url = `/cart/add?items[][id]=${free_gift_var_id}&items[][quantity]=1&return_to=/checkout`;
              }
            } else {
              if (check_2 && ! check_3) {
                checkout_url = `/discount/${savings_discount_code}?redirect=/checkout`;
              } else if (check_2 && check_3) {
                let free_gift_var_id = document.querySelector('[data-product-type="Rambys"] .js-rambys--sizes li.active').getAttribute("data-var-id");
                checkout_url = `/cart/add?items[][id]=${free_gift_var_id}&items[][quantity]=1&return_to=/discount/${savings_discount_code}?redirect=/checkout`;
              }
            }

            for (let i = 0; i < checkout_actions.length; i++) {
              checkout_actions[i].href = checkout_url;
            }

          }, 50);
        }, 400);
      });

// /cart/add?items[][id]=39543255335014&items[][quantity]=2&items[][id]=39543463510118&items[][quantity]=2&return_to=/checkout

// let fs_label = fs_bar.previousElementSibling;
      waitForElement(".cart-line-items").then(cart_items => {
        cart_items.insertAdjacentHTML(
          "beforebegin",
          `
          <div class="js-incentives">
            <div class="js-incentives--label">
              ${message}
            </div>
            <div class="js-incentives--bar">
              <div class="js-incentives--bar--progress" style="width: ${
            progress_width * 100
          }%; min-width: ${progress_min_width}%;"></div>
              <div class="js-incentives--bar--checkpoint" data-checkpoint="1" data-checkpoint-met="${check_1}"></div>
              <div class="js-incentives--bar--checkpoint" data-checkpoint="2" data-checkpoint-met="${check_2}"></div>
              <div class="js-incentives--bar--checkpoint" data-checkpoint="3" data-checkpoint-met="${check_3}"></div>
            </div>
          </div>
        `
        );
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

    if (!!klaviyo_btn.closest('form')) {

      let form_text = klaviyo_btn.closest('form').innerText;

      if (form_text.indexOf("Do you want 20% off your first order?") > -1 || form_text.indexOf("Want 20% off your first order?") > -1 || form_text.indexOf("Want 20% back on your order?") > -1 || form_text.indexOf("Want 20% back on your first order?") > -1) {

        let jmby71_var = "v2";
        if (form_text.indexOf("Want 20% off your first order?") > -1) {
          jmby71_var = "v1";
        } else if (form_text.indexOf("Do you want 20% off your first order?") > -1) {
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


waitUntil(() => {
  return(window.sessionStorage.getItem("JMBY-48") || getParam("qa") == "JMBY-48");
}).then(() => {
  window.sessionStorage.setItem("JMBY-48", "v1");

  const TAG = "jmby48";

  waitForElement(".product-detail__tab-container.go-test").then(() => {
    let pdpRelatedProducts = window.related.pdp_products;

    const pdpUpsellContainer = document.querySelector(".product-detail__upsell-container");

    var buildPdpUpsellForm = async function(event = false) {
      let relatedIndex = 0;

      if (event) {
        let swatchFetchedRelated = await fetch(`/products/${
          event.target.dataset.jsProductHandle
        }?view=metafields_related`).then((response) => response.json()).then((data) => data.related_products);
        pdpRelatedProducts = swatchFetchedRelated;
      }

      let cartItems = await fetch("/cart.js").then((response) => response.json()).then((data) => data.items);

      filteredRelatedProducts = [];

      for ([key, value] of Object.entries(pdpRelatedProducts)) {
        if (! cartItems.some((cartItem) => {
          return cartItem.product_title == value.prod_title;
        })) {
          filteredRelatedProducts.push(value);
        }
      }
      
      let eventDTC = new CustomEvent("color:updated", {detail: {
        pdpRelatedProducts
        }});
      document.dispatchEvent(eventDTC);

// for ([key, value] of Object.entries(pdpRelatedProducts)) {
// if (
//     cartItems.some((cartItem) => {
//       return cartItem.product_title == value.prod_title;
//     })
// ) {
//     relatedIndex++;
// }
// }

      let upsell = Object.values(filteredRelatedProducts)[0];
      let url = upsell ?. prod_url,
        thumb = upsell ?. prod_thumb;
      let title = upsell ?.prod_title;

      let price = upsell ?. prod_price ?? 4500;

      let sizePicker = `

              <li class="cart-line-item-container ${TAG}-upsell-item">
                <header class="cart-line-header" style="padding-left: 0;">
                  <strong>Complete Your Housefit</strong>
                </header>
                <article class="cart-line-item" style="justify-content: flex-start;">
                  <a class="cart-line-item-link" href="${url}" style="width: auto;">
                    <img class="cart-line-img" src="${thumb}">
                  </a>

                  <div class="upsell-info">
                  <a href="${url}">
                    <h3>${title}</h3>
                  </a>
                  <div class="upsell-options">

                    <select id="upsell_${
        upsell.prod_id
      }_select" class="${TAG}-select noreplace" ecl="true">
                      <option value="${
        upsell.xsm
      }" ecl="true">XS</option>
                      <option value="${
        upsell.sm
      }" ecl="true">S</option>
                      <option value="${
        upsell.md
      }" ecl="true">M</option>
                      <option value="${
        upsell.lg
      }" ecl="true">L</option>
                      <option value="${
        upsell.xlg
      }" ecl="true">XL</option>
                      <option value="${
        upsell.x2lg
      }" ecl="true">XXL</option>
                      <option value="${
        upsell.x3lg
      }" ecl="true">3XL</option>
                    </select>
                    <div class="radio-group">
                      <div class="radio" id="upsell_${
        upsell.prod_id
      }_atc">
                        <input type="radio" hidden>
                        <label>Add &#x2022 <span>$${
        price * 0.01
      }</span></label>
                      </div>
                    </div>
                  </div>

                  </div>
                </article>
              </li>

              `;

// show just one upsell
      pdpUpsellContainer.innerHTML = sizePicker;

// size picker handler
      waitForElement(`#upsell_${
        upsell.prod_id
      }_select`).then((upsell_options) => {
        let options = upsell_options.querySelectorAll("option");
        for (let i = 0; i < options.length; i++) {
          let opt_var_id = options[i].value;
          if (opt_var_id == "unavailable") {
            options[i].setAttribute("disabled", "disabled");
            options[i].parentNode.querySelector('option:not([value="unavailable"])').selected = true;
          }
        }

        waitForElement(`#upsell_${
          upsell.prod_id
        }_atc`).then((atc) => {
          atc.addEventListener("click", () => {
            let upsell_id = document.querySelector(`#upsell_${
              upsell.prod_id
            }_select`).value;
            cart_add_item(upsell_id, 1);
            setTimeout(() => {
              toggleCart();
              buildPdpUpsellForm();
            }, 500);
          });
        }).catch();

// window.addEventListener('load', () => {
//     let swatches = document.querySelectorAll("li a.color-swatch");
//     swatches.forEach((swatch) => {
//       //swatch.addEventListener("click", buildPdpUpsellForm);
//       console.log("is a swatch", swatch);
//     });
// })

        waitForElement(".product-color-swatches li a").then((colorSwatch) => {
          let swatches = colorSwatch.closest(".product-color-swatches").querySelectorAll("li a.color-swatch");
          swatches.forEach((swatch) => {
            swatch.addEventListener("click", buildPdpUpsellForm);
          });
        });
      }).catch();
    };
    buildPdpUpsellForm();
  }).catch();

  waitForElement("#shopify-section-cart-drawer #cart-drawer").then(() => {

// buildPdpUpsellForm();
// wait for Rebuy cart to exist

    init_experiment("JMBY-48");

// document.body.insertAdjacentHTML("afterbegin", jmby48_styles);
// console.log("product object", window.upsell_related);

// ===[ Jambys ]=== //
// New upsell based on related products
    observeSelector(".cart-line-items", (jambyCartItem) => {
      let productObject = async function(lastProductAdded) {
        const response = await fetch("/products/" + lastProductAdded.toLowerCase() + "?view=metafields_related");
        return await Promise.resolve(response.json());
      };

      let assignProductObject = async () => {
        allCartItemNames = document.querySelectorAll(".cart-line-info .cart-line-title");

        let lastProductAdded = Array.from(allCartItemNames).find((item) => {
          return item.closest("li").dataset.productUpsell == "false";
        });
        const a = await productObject(lastProductAdded.closest("li").dataset.productHandle);
        let relatedProducts = a.related_products;

// Code to upsell based on product metafields
        let relatedIndex = 0;

        filteredRelatedProducts = [];

        for ([key, value] of Object.entries(relatedProducts)) {
          if (!Array.from(allCartItemNames).some((cartItem) => {
            return cartItem.textContent == value.prod_title;
          })) {
            filteredRelatedProducts.push(value);
          }
        }

        const upsellHeader = '<header class="cart-line-header" style="padding-left: 0;"><strong>Complete Your Housefit</strong></header>';

        sizePickers = filteredRelatedProducts.map((relatedProduct, index) => {
          (url = relatedProduct ?. prod_url),
          (thumb = relatedProduct ?. prod_thumb);
          title = relatedProduct.prod_title;

// const jambyColor = getColor("jambys", getVariant(jambyCartItem));
          price = relatedProduct ?. prod_price ?? 4500;

          return `
                <li class="cart-line-item-container ${TAG}-upsell-item" data-product-type="upsell">
                <article class="cart-line-item" style="justify-content: flex-start;">
                  <a class="cart-line-item-link" href="${url}" style="width: auto;">
                    <img class="cart-line-img" src="${thumb}">
                  </a>

                  <div class="upsell-info">
                  <a href="${url}">
                    <h3>${title}</h3>
                  </a>
                  <div class="upsell-options">

                    <select id="upsell_${index}_select_drawer" class="${TAG}-select" ecl="true">
                    <option value="${
            relatedProduct.xxsm
          }" ecl="true">XXS</option>
                      <option value="${
            relatedProduct.xsm
          }" ecl="true">XS</option>
                      <option value="${
            relatedProduct.sm
          }" ecl="true">S</option>
                      <option value="${
            relatedProduct.md
          }" ecl="true">M</option>
                      <option value="${
            relatedProduct.lg
          }" ecl="true">L</option>
                      <option value="${
            relatedProduct.xlg
          }" ecl="true">XL</option>
                      <option value="${
            relatedProduct.x2lg
          }" ecl="true">XXL</option>
                      <option value="${
            relatedProduct.x3lg
          }" ecl="true">3XL</option>
                    </select>
                    <div class="radio-group">
                      <div class="radio" id="upsell_${index}_atc_drawer">
                        <input type="radio" hidden>
                        <label>Add &#x2022 <span>$${
            price * 0.01
          }</span></label>
                      </div>
                    </div>
                  </div>

                  </div>
                </article>
              </li>
                `;
        }).join("");

// arrow controls
        const controlsHTML = `
              <div class="upsell-control left"></div>
              <div class="upsell-control right"></div>`;

// show just one upsell
        jambyCartItem.closest(".cart-line-items_container").querySelector(".upsell-line-items").insertAdjacentHTML("afterbegin", sizePickers);
        jambyCartItem.closest(".cart-line-items_container").querySelector(".upsell-items-container").insertAdjacentHTML("afterbegin", upsellHeader);
        jambyCartItem.closest(".cart-line-items_container").querySelector(".upsell-items-wrapper").insertAdjacentHTML("beforeend", controlsHTML);

        const upsellItemWidth = jambyCartItem
          .closest(".cart-line-items_container")
          .querySelector(".upsell-items-wrapper .upsell-line-items li")
          .getBoundingClientRect()
          .width;

        const controls = jambyCartItem.closest(".cart-line-items_container").querySelectorAll(".upsell-items-wrapper .upsell-control");

        const leftControl = jambyCartItem.closest(".cart-line-items_container").querySelector(".upsell-items-wrapper .upsell-control.left");

        const upsellItemsContainer = document.querySelector(".upsell-line-items");

        upsellItemsContainer.addEventListener('scroll', (e) => {
          horizontal = e.currentTarget.scrollLeft;
          console.log("horozontal", horizontal);
          horizontal > (upsellItemWidth / 2)
            ? leftControl.classList.add('show')
            : leftControl.classList.remove('show');

        })

        controls.forEach((control) => {
          control.addEventListener("click", (e) => {
            e.target.classList.contains("left")
              ? (upsellItemsContainer.scrollLeft -= upsellItemWidth)
              : (upsellItemsContainer.scrollLeft += upsellItemWidth);
          });

        });


        filteredRelatedProducts.forEach((relatedProduct, index) => {
          waitForElement(`#upsell_${index}_select_drawer`).then((upsell_options) => {
            let options = upsell_options.querySelectorAll("option");
            for (let i = 0; i < options.length; i++) {
              let opt_var_id = options[i].value;
              if (opt_var_id == "unavailable") {
                options[i].setAttribute("disabled", "disabled");
                options[i].parentNode.querySelector('option:not([value="unavailable"])').selected = true;
              }
            }

            waitForElement(`#upsell_${index}_atc_drawer`).then((atc) => {
              atc.addEventListener("click", () => {
                let upsell_id = document.querySelector(`#upsell_${index}_select_drawer`).value;
                cart_add_item(upsell_id, 1, "true");
                setTimeout(() => {

// Pass in true value if upsell item
                  toggleCart(true);

// fetchCart();
                }, 500);
              });
            }).catch();
          }).catch();
        });

// size picker handler
      };

      assignProductObject();

// getProductMetafields(lastProductAdded.dataset.productHandle).then(
// (data) => {
//     let relatedProducts = data.related_products;
//     console.log("relatedProducts", relatedProducts);
// }
// );

// const getVariant = (lineItem) => {
// const cartItemLink = new URL(lineItem.querySelector("a").href);
// return cartItemLink.searchParams.get("variant");
// };

// const getColor = (key, variantID) => {
// const map = window.product_map[key];
// let sizeKey;

// for (color of Object.keys(map)) {
//     const colorMap = map[color];

//     Object.keys(colorMap).find((size) => {
//       if (colorMap[size] == variantID) return (sizeKey = size);
//     });
// }

// // const colorKey = Object.keys(map).find((color) => {
// //   if (map[color][sizeKey] == variantID) return color;
// // });
// // return colorKey;
// };

// this is the color we want to upsell
// const jambyColor = getColor("jambys", getVariant(jambyCartItem));
// console.log("jambyColor", jambyColor);

// checking for existing hoodies and bottoms
// const allBottoms = cart.querySelectorAll(
//     '.cart-line-item-container[data-product-type="Long Jambys"]'
// ),
// allHoodies = cart.querySelectorAll(
//     '.cart-line-item-container[data-product-type="House Hoodie"]'
// );

// const hasMatching = (type) => {
// const items = type === "long_jambys" ? allBottoms : allHoodies;
// if (items) {
//     for (item of items) {
//       if (getColor(type, getVariant(item)) === jambyColor)
//         return true;
//     }
// }
// };

// const hasMatchingBottoms = hasMatching("long_jambys"),
// hasMatchingHoodie = hasMatching("house_hoodie");

// if (hasMatchingBottoms && hasMatchingHoodie) return;

// const upsellItemType = hasMatchingBottoms
//     ? "house_hoodie"
//     : "long_jambys",
// upsell = window.product_map[upsellItemType][jambyColor];

// const url = upsell?.prod_url,
// thumb = upsell?.prod_thumb;

// const price = upsell?.prod_price ?? 4500;
// const title =
// upsell?.prod_title ??
// (hasMatchingBottoms ? "House Hoodie" : "Long Jambys");

// console.log(`Size Picker for ${upsell.prod_title}`);
    });

// Old upsell based on product type Jamby's
    observeSelector('.cart-line-item-container[data-product-type="Jambys"]', (jambyCartItem) => {
      const cart = jambyCartItem.closest(".cart-line-items");

      const getVariant = (lineItem) => {
        const cartItemLink = new URL(lineItem.querySelector("a").href);
        return cartItemLink.searchParams.get("variant");
      };

      window.product_map = window.product_map;

      const getColor = (key, variantID) => {
        const map = window.product_map[key];
        let sizeKey;

        for (color of Object.keys(map)) {
          const colorMap = map[color];

          Object.keys(colorMap).find((size) => {
            if (colorMap[size] == variantID) 
              return(sizeKey = size);
            
          });
        }

        const colorKey = Object.keys(map).find((color) => {
          if (map[color][sizeKey] == variantID) 
            return color;
          
        });
        return colorKey;
      };

// this is the color we want to upsell
      const jambyColor = getColor("jambys", getVariant(jambyCartItem));
      console.log("jambyColor", jambyColor);

// checking for existing hoodies and bottoms
      const allBottoms = cart.querySelectorAll('.cart-line-item-container[data-product-type="Long Jambys"]'),
        allHoodies = cart.querySelectorAll('.cart-line-item-container[data-product-type="House Hoodie"]');

      const hasMatching = (type) => {
        const items = type === "long_jambys"
          ? allBottoms
          : allHoodies;
        if (items) {
          for (item of items) {
            if (getColor(type, getVariant(item)) === jambyColor) 
              return true;
            
          }
        }
      };

      const hasMatchingBottoms = hasMatching("long_jambys"),
        hasMatchingHoodie = hasMatching("house_hoodie");

      if (hasMatchingBottoms && hasMatchingHoodie) 
        return;
      

      const upsellItemType = hasMatchingBottoms
          ? "house_hoodie"
          : "long_jambys",
        upsell = window.product_map[upsellItemType][jambyColor];

      const url = upsell ?. prod_url,
        thumb = upsell ?. prod_thumb;
      const price = upsell ?. prod_price ?? 4500;
      const title = upsell ?. prod_title ?? (
        hasMatchingBottoms
          ? "House Hoodie"
          : "Long Jambys"
      );

// console.log(`Size Picker for ${upsell.prod_title}`);

      const sizePicker = `

          <li class="cart-line-item-container old ${TAG}-upsell-item" data-product-type="upsell">
              <header class="cart-line-header" style="padding-left: 0;">
                    <strong>Complete Your Housefit</strong>
              </header>
            <article class="cart-line-item" style="justify-content: flex-start;">
              <a class="cart-line-item-link" href="${url}" style="width: auto;">
                <img class="cart-line-img" src="${thumb}">
              </a>
              <div class="upsell-info">
                <h3>
                  ${title}
                </h3>
                <div class="upsell-options">
                  <select id="${jambyColor}_${upsellItemType}_select" class="${TAG}-select" ecl="true">
                  <option value="${
        upsell.xxsm
      }" ecl="true">XXS</option>
                    <option value="${
        upsell.xsm
      }" ecl="true">XS</option>
                    <option value="${
        upsell.sm
      }" ecl="true">S</option>
                    <option value="${
        upsell.md
      }" ecl="true">M</option>
                    <option value="${
        upsell.lg
      }" ecl="true">L</option>
                    <option value="${
        upsell.xlg
      }" ecl="true">XL</option>
                    <option value="${
        upsell.x2lg
      }" ecl="true">XXL</option>
                    <option value="${
        upsell.x3lg
      }" ecl="true">3XL</option>
                  </select>
                  <div class="radio-group">
                    <div class="radio" id="${jambyColor}_${upsellItemType}_atc">
                      <input type="radio" hidden>
                      <label>Add 1 for <span>$${
        price * 0.01
      }</span></label>
                      </div>
                    </div>
                </div>
              </div>
            </article>
          </li>`;
      console.log("insert condition true");
      console.log("jambyCartItem", jambyCartItem);

// show just one upsell

      console.log("OBSERVING 1 .....");
      jambyCartItem.insertAdjacentHTML("afterend", sizePicker);

      console.log("after the fact");

// size picker handler
      waitForElement(`#${jambyColor}_${upsellItemType}_select`).then((upsell_options) => {
        let options = upsell_options.querySelectorAll("option");
        for (let i = 0; i < options.length; i++) {
          let opt_var_id = options[i].value;
          if (opt_var_id == "unavailable") {
            options[i].setAttribute("disabled", "disabled");
            options[i].parentNode.querySelector('option:not([value="unavailable"])').selected = true;
          }
        }

        waitForElement(`#${jambyColor}_${upsellItemType}_atc`).then((atc) => {
          atc.addEventListener("click", () => {
            let upsell_id = document.querySelector(`#${jambyColor}_${upsellItemType}_select`).value;
            cart_add_item(upsell_id, 1);
            setTimeout(() => {
              toggleCart(true);
            }, 500);
          });
        }).catch();
      }).catch();
    });
  }).catch();
}).catch();