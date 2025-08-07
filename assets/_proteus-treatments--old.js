// 2 + 19

if(window.location.pathname === '/collections' || window.location.pathname === '/collections/'){
  console.log("redirect: /collections --> /collections/all-products");
  window.location = "/collections/all-products";
}

/*
START announcement bar override for promos
*/

if(getParam("utm_medium") == "1440" || window.sessionStorage.getItem("promo-announcement") == "1440"){
  window.sessionStorage.setItem("promo-announcement", "1440");
  waitForElement('.cc-announcement').then(announcement => {
    announcement.innerHTML = `
    <a data-cc-animate-click="" href="/collections/jambys">
      <div class="cc-announcement__inner hidden-mobile">
        Save 20% on <strong>ALL</strong> Jambys Using Code: JAMx1440
      </div>
      <div class="cc-announcement__inner mobile-only">
        Save 20% on <strong>ALL</strong> Jambys Using Code: JAMx1440
      </div>
    </a>
    `;
  }).catch()
}

if(getParam("utm_medium") == "dailytonic" || window.sessionStorage.getItem("promo-announcement") == "dailytonic"){
  window.sessionStorage.setItem("promo-announcement", "1440");
  waitForElement('.cc-announcement').then(announcement => {
    announcement.innerHTML = `
    <a data-cc-animate-click="" href="/collections/jambys">
      <div class="cc-announcement__inner hidden-mobile">
        Save 20% on <strong>ALL</strong> Jambys Using Code: TONIC
      </div>
      <div class="cc-announcement__inner mobile-only">
        Save 20% on <strong>ALL</strong> Jambys Using Code: TONIC
      </div>
    </a>
    `;
  }).catch()
}

/*
START ShipScout free shipping status bar override
*/

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

waitUntil(() => {

  return document.querySelectorAll('.cart-subtotal-currency').length > 0;

}).then(() => {

  console.log("INIT");

  let prev_total = document.querySelector('.cart-subtotal-currency').getAttribute("data-cart-total");

  observeSelector('#shipping-progress-bar', fs_bar => {

    // IF THERE IS AN ACTIVE SHIPSCOUT TEST --> override the free shipping status bar in the ajax cart with updated threshold value

    window._shipScout = window._shipScout || [];
    _shipScout.push(function (response) {

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

        let cart_total = document.querySelector('.cart-subtotal-currency').getAttribute("data-cart-total");

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
            js_progress.value = document.querySelector('.cart-subtotal-currency').getAttribute("data-cart-total");
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
  return window.sessionStorage.getItem("JMBY-48") || getParam("qa") == "JMBY-48";
}).then(() => {

  window.sessionStorage.setItem("JMBY-48", "v1");

  const TAG = 'jmby48';

  waitForElement('#shopify-section-cart-drawer #cart-drawer').then(() => {

    //wait for Rebuy cart to exist

    init_experiment("JMBY-48");

    const jmby48_styles = /*html*/ `
      <style>

      aside.cart-drawer.active-dialog{
        z-index:9999;
      }

      .${TAG}-upsell-item {
        padding-bottom: 40px;
      }
      .${TAG}-select {
        background-image: url("data:image/svg+xml,%3Csvg width='24' height='14' viewBox='0 0 24 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22.9065 1.05674L12.1123 12.4957L1.3181 1.05674' stroke='%23ffffff' stroke-width='2'/%3E%3C/svg%3E%0A");
        background-size: 12px;
        font-size:12px;
        background-position: 95% center;
        background-color: transparent;
        background-repeat: no-repeat;
        color: #fff;
        border-radius: 25px;
        border: 1px solid #fff;
        padding: 5px 8px;
        width: 115px;
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
      }

      .${TAG}-select option{
        color: #444;
      }

      .${TAG}-select option[selected]{
        color: #fff;
      }

      .${TAG}-select::-ms-expand {
       display: none;
      }

      .${TAG}-upsell-item .radio-group{

      }
      .${TAG}-upsell-item .radio{
        display: inline-block;
      }

      .${TAG}-upsell-item label{
        font-weight: 900;
        width: 115px;
        text-align: center;
        display: inline-block;
        background-color: #ffe660;
        color: #36409a;
        padding: 5px;
        border-radius: 25px;
        margin-top: 5px;
      }

      </style>
     `;

    document.body.insertAdjacentHTML("afterbegin", jmby48_styles);

    // ===[ Jambys ]=== //

    observeSelector('.cart-line-item-container[data-product-type="Jambys"]', jambyCartItem => {

      const cart = jambyCartItem.closest('.cart-line-items');

      const getVariant = lineItem => {
        const cartItemLink = new URL(lineItem.querySelector('a').href);
        return cartItemLink.searchParams.get('variant');
      };

      window.product_map = window.product_map;

      const getColor = (key, variantID) => {
        const map = window.product_map[key];
        let sizeKey;

        for (color of Object.keys(map)) {
          const colorMap = map[color];

          Object.keys(colorMap).find(size => {
            if (colorMap[size] == variantID) return sizeKey = size;
          });
        };

        const colorKey = Object.keys(map).find(color => {
          if (map[color][sizeKey] == variantID) return color;
        });
        return colorKey;
      };

      // this is the color we want to upsell
      const jambyColor = getColor('jambys', getVariant(jambyCartItem));

      // checking for existing hoodies and bottoms
      const allBottoms = cart.querySelectorAll('.cart-line-item-container[data-product-type="Long Jambys"]'),
        allHoodies = cart.querySelectorAll('.cart-line-item-container[data-product-type="House Hoodie"]');

      const hasMatching = type => {
        const items = type === 'long_jambys' ? allBottoms : allHoodies;
        if (items) {
          for (item of items) {
            if (getColor(type, getVariant(item)) === jambyColor) return true;
          }
        }
      };

      const hasMatchingBottoms = hasMatching('long_jambys'),
        hasMatchingHoodie = hasMatching('house_hoodie');

      if (hasMatchingBottoms && hasMatchingHoodie) return;

      const upsellItemType = hasMatchingBottoms ? 'house_hoodie' : 'long_jambys',
        upsell = window.product_map[upsellItemType][jambyColor];

      const url = upsell?.prod_url,
        thumb = upsell?.prod_thumb;

      const price = upsell?.prod_price ?? 4500;
      const title = upsell?.prod_title ?? (hasMatchingBottoms ? 'House Hoodie' : 'Long Jambys');

      console.log(`Size Picker for ${upsell.prod_title}`);

      const sizePicker = `

      <li class="cart-line-item-container ${TAG}-upsell-item" data-product-type="upsell">
        <article class="cart-line-item" style="justify-content: flex-start;">

          <header class="cart-line-header" style="padding-left: 0;">
            <strong>Complete Your Housefit</strong>
          </header>

          <a class="cart-line-item-link" href="${url}" style="width: auto;">
            <img class="cart-line-img" src="${thumb}">
            <header class="cart-line-header">
              ${title}
            </header>
          </a>

          <div style="flex-grow: 1; text-align: right;">
            <select id="${jambyColor}_${upsellItemType}_select" class="${TAG}-select" ecl="true">
              <option value="${upsell.xsm}" ecl="true">Extra Small</option>
              <option value="${upsell.sm}" ecl="true">Small</option>
              <option value="${upsell.md}" ecl="true">Medium</option>
              <option value="${upsell.lg}" ecl="true">Large</option>
              <option value="${upsell.xlg}" ecl="true">Extra Large</option>
              <option value="${upsell.x2lg}" ecl="true">2X Large</option>
              <option value="${upsell.x3lg}" ecl="true">3X Large</option>
            </select>

            <div class="radio-group">
              <div class="radio" id="${jambyColor}_${upsellItemType}_atc">
                <input type="radio" hidden>
                <label>Add 1 for $${price * .01}</label>
              </div>
            </div>

          </div>
        </article>
      </li>

      `;

      // show just one upsell
      if(document.querySelectorAll('[data-product-type="upsell"]').length == 0){
        console.log("OBSERVING 1 .....");
        jambyCartItem.insertAdjacentHTML('afterend', sizePicker);
      }

      // size picker handler
      waitForElement(`#${jambyColor}_${upsellItemType}_select`).then(upsell_options => {

        let options = upsell_options.querySelectorAll('option');
        for (let i = 0; i < options.length; i++) {
          let opt_var_id = options[i].value;
          if (opt_var_id == "unavailable") {
            options[i].setAttribute("disabled", "disabled");
            options[i].parentNode.querySelector('option:not([value="unavailable"])').selected = true;
          }
        }

        waitForElement(`#${jambyColor}_${upsellItemType}_atc`).then(atc => {

          atc.addEventListener("click", () => {

            let upsell_id = document.querySelector(`#${jambyColor}_${upsellItemType}_select`).value;
            cart_add_item(upsell_id, 1);
            setTimeout(() => {
              toggleCart();
            },500)

          });

        }).catch();

      }).catch();


    });


  }).catch();

}).catch();
