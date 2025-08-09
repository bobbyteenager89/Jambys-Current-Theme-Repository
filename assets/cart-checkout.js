let initializedRebuy = false;

// ---------------------------------------------------------------------------
// Money format handler
// ---------------------------------------------------------------------------
function formatMoney(cents) {
  if (typeof cents == "string") {
    cents = cents.replace(".", "");
  }
  var precision = 2;
  if (Number(cents) % 100 === 0) {
    precision = 0;
  }
  return "$" + formatWithDelimiters(cents, precision);
}

function renderLockIcon() {
  return `
    <svg class="lock-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none">
      <path d="M12 6.16667H11.3333V4.83333C11.3333 2.99333 9.83999 1.5 7.99999 1.5C6.15999 1.5 4.66666 2.99333 4.66666 4.83333V6.16667H3.99999C3.26666 6.16667 2.66666 6.76667 2.66666 7.5V14.1667C2.66666 14.9 3.26666 15.5 3.99999 15.5H12C12.7333 15.5 13.3333 14.9 13.3333 14.1667V7.5C13.3333 6.76667 12.7333 6.16667 12 6.16667ZM5.99999 4.83333C5.99999 3.72667 6.89332 2.83333 7.99999 2.83333C9.10666 2.83333 9.99999 3.72667 9.99999 4.83333V6.16667H5.99999V4.83333ZM12 14.1667H3.99999V7.5H12V14.1667ZM7.99999 12.1667C8.73332 12.1667 9.33332 11.5667 9.33332 10.8333C9.33332 10.1 8.73332 9.5 7.99999 9.5C7.26666 9.5 6.66666 10.1 6.66666 10.8333C6.66666 11.5667 7.26666 12.1667 7.99999 12.1667Z" fill="#36409A"/>
    </svg>
  `;
}

function renderTickIcon() {
  return `
    <svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22" fill="none">
      <g filter="url(#filter0_d_139_664)">
        <rect x="4.5" y="3.5" width="13" height="13" rx="6.5" fill="#36409A"/>
        <path d="M11 4.5835C8.01004 4.5835 5.58337 7.01016 5.58337 10.0002C5.58337 12.9902 8.01004 15.4168 11 15.4168C13.99 15.4168 16.4167 12.9902 16.4167 10.0002C16.4167 7.01016 13.99 4.5835 11 4.5835ZM9.91671 12.7085L7.20837 10.0002L7.97212 9.23641L9.91671 11.1756L14.028 7.06433L14.7917 7.8335L9.91671 12.7085Z" fill="white"/>
      </g>
      <defs>
        <filter id="filter0_d_139_664" x="0.5" y="0.5" width="21" height="21" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
          <feFlood flood-opacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dy="1"/>
          <feGaussianBlur stdDeviation="2"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.55 0 0 0 0 0.55 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_139_664"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_139_664" result="shape"/>
        </filter>
      </defs>
    </svg>
  `;
}

function defaultOption(opt, def) {
  return typeof opt == "undefined" ? def : opt;
}

function formatWithDelimiters(number, precision, thousands, decimal) {
  precision = defaultOption(precision, 2);
  thousands = defaultOption(thousands, ",");
  decimal = defaultOption(decimal, ".");

  if (isNaN(number) || number == null) {
    return 0;
  }

  number = (number / 100.0).toFixed(precision);

  var parts = number.split("."),
    dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands),
    cents = parts[1] ? decimal + parts[1] : "";

  return dollars + cents;
}

function removeCurrentCart() {
  return new Promise((resolve, reject) => {
    try {
      document.body.classList.remove("no-scroll");
      document
        .querySelectorAll(".cart-drawer")
        .forEach((element) => element.remove());
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function ajaxCartrequest(method, query, url) {
  return fetch(url, {
    method: method,
    headers: new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(query),
  }).then(response => response.json());
}

function getCart() {
  let products = [];
  let line_items_discounts_total = 0;

  return fetch("/cart.js")
    .then((response) => response.json())
    .then((cart) => {
      let productPromises = cart.items.map((item) =>
        fetch("/products/" + item.handle.toLowerCase() + ".js")
          .then((response) => response.json())
          .then((product) => {
            products.push(product);
          })
      );

      return Promise.all(productPromises).then(() => cart);
    })
    .then((cart) => {
      cart.items.forEach((item, index) => {
        const selectedVariant = products[index].variants.filter(
          (variant) => variant.id == item.id
        );

        if(selectedVariant[0]?.compare_at_price > selectedVariant[0]?.price){
          line_items_discounts_total = parseInt(line_items_discounts_total) + parseInt((selectedVariant[0].compare_at_price*item.quantity) - (selectedVariant[0].price*item.quantity));
        }

        item.compare_at_price =
          selectedVariant[0]?.compare_at_price > selectedVariant[0]?.price
            ? selectedVariant[0]?.compare_at_price
            : false;
      });

      cart.line_items_total_discount = line_items_discounts_total;
      return cart;
    });
}

function buildItemUpdateJSON(key, quantity) {
  return {
    id: key,
    quantity: quantity,
  };
}

function resizeImageURL(url, size) {
  const jpgReplaced = url.replace(".jpg", `_${size}.jpg`);
  const jpegReplaced = jpgReplaced.replace(".jpeg", `_${size}.jpeg`);
  const pngReplaced = jpegReplaced.replace(".png", `_${size}.png`);
  const gifReplaced = jpegReplaced.replace(".gif", `_${size}.gif`);
  return gifReplaced;
}

function buildLineItemHTML(item) {
  const lineItemTemplate = document.getElementById("cart-line-item");
  let lineItemElement = lineItemTemplate.content.cloneNode(true);

  lineItemElement
    .querySelector(".cart-line-item-link")
    .parentNode.parentNode.setAttribute("data-product-type", item.product_type);
  lineItemElement
    .querySelector(".cart-line-item-link")
    .parentNode.parentNode.parentNode.parentNode.parentNode.setAttribute(
      "data-product-type",
      item.product_type
    );
  lineItemElement
    .querySelector(".cart-line-item-link")
    .parentNode.parentNode.parentNode.parentNode.parentNode.setAttribute(
      "data-product-handle",
      item.handle
    );
  lineItemElement
    .querySelector(".cart-line-item-link")
    .parentNode.parentNode.parentNode.parentNode.parentNode.setAttribute(
      "data-product-upsell",
      item.properties._upsell ? item.properties._upsell : "false"
    );

  lineItemElement.querySelector(".cart-line-item-link").href = item.url;
  lineItemElement.querySelector(".cart-line-img").src = resizeImageURL(
    item.featured_image.url,
    "96x"
  );
  lineItemElement.querySelector(".cart-line-title").innerHTML =
    item.product_title;
  lineItemElement.querySelector(".cart-line-variant-title").innerHTML =
    item.variant_title;
  lineItemElement.querySelector(".cart-line-quantity").value = item.quantity;

  if (item.original_line_price > item.final_line_price) {
    if(item.original_line_price && ( item.original_line_price !== item.line_price )) {
      lineItemElement.querySelector(".cart-line-total-orignal").innerHTML =
        formatMoney(item.original_line_price);
    }
    lineItemElement.querySelector(".cart-line-total").innerHTML = formatMoney(
      item.final_line_price
    );
  } else if (item.compare_at_price) {
    lineItemElement.querySelector(".cart-line-total-orignal").innerHTML =
      formatMoney(item.compare_at_price * item.quantity);
    lineItemElement.querySelector(".cart-line-total").innerHTML = formatMoney(
      item.final_line_price
    );
  } else {
    lineItemElement.querySelector(".cart-line-total").innerHTML = formatMoney(
      item.final_line_price
    );
  }
  lineItemElement.querySelector(".cart-line-quantity-form").dataset.lineKey =
    item.key;

  if (item.original_line_price > item.final_line_price) {
    lineItemElement.querySelector(".mini_orignal_price").innerHTML =
      formatMoney(item.original_price);
    lineItemElement.querySelector(".mini_discount_price").innerHTML =
      formatMoney(item.final_price);
  } else {
    lineItemElement.querySelector(".mini_discount_price").innerHTML =
      formatMoney(item.final_price);
  }

  if (item.line_level_discount_allocations.length > 0) {
    for (ii = 0; ii < item.line_level_discount_allocations.length; ii++) {
      let imessage = item.line_level_discount_allocations[ii].discount_application.title;
      if(imessage && imessage != "" && imessage != "Intelligems"){
        lineItemElement.querySelector(".mini_discount_title").innerHTML =
          item.line_level_discount_allocations[ii].discount_application.title;
        lineItemElement.querySelector(".mini_discount_amount").innerHTML =
          "(-" +
          formatMoney(item.line_level_discount_allocations[ii].amount) +
          ")";
      }
    }
  }
  return lineItemElement;
}

function createCartTemplate(cart) {
  const cartTemplate = document.getElementById("cart-drawer");

  let cartElement = cartTemplate.content.cloneNode(true);
  let frag = document.createDocumentFragment();

  if (cart.item_count > 0) {
    let intelligems_total = 0;

    cart.items.forEach((item) => {
      switch(item.properties._igLineItemDiscount) {
        case 0:
        case '':
        case undefined:
        case null:
            var intelligems_discount = 0;
            break;
        default:
            var intelligems_discount = item.properties._igLineItemDiscount + 0;
            intelligems_total = intelligems_total + item.properties._igLineItemDiscount;
      };

      if (!item?.properties?._free_gift) {
        const lineItemElement = buildLineItemHTML(item, intelligems_discount);
        frag.appendChild(lineItemElement);
      }
    });

    cartElement.querySelector(".cart-line-items").appendChild(frag);

    cartElement.querySelector("#shipping-progress-bar").value = parseInt(
      formatMoney(cart.items_subtotal_price).replace("$", ""),
      10
    );

    cartElement
      .querySelector(".cart-subtotal-currency")
      .setAttribute("data-cart-discount-savings", cart.line_items_total_discount);

    cartElement
      .querySelector(".cart-subtotal-currency")
      .setAttribute("data-cart-total", cart.items_subtotal_price);
    cartElement
      .querySelector(".cart-subtotal-currency")
      .setAttribute("data-cart-full-price", cart.original_total_price);

    if(cart.original_total_price - intelligems_total > cart.items_subtotal_price) {
      cartElement.querySelector(
        ".cart-subtotal-currency"
      ).innerHTML = `<s style="opacity: .6;">${formatMoney(
        cart.original_total_price
      )}</s> ${formatMoney(cart.items_subtotal_price)}`;
    } else {
      if (cartElement.querySelector(".cart-subtotal-currency")) {
        cartElement.querySelector(
          ".cart-subtotal-currency"
        ).innerHTML = `${formatMoney(cart.items_subtotal_price)}`;
      }
    }

    if (
      cart.items_subtotal_price >=
      cartElement.querySelector("#shipping-progress-bar").max * 100
    ) {
      cartElement.querySelector(".shipping-progress-bar-label").innerHTML =
        "<p>This Order Ships Free!</p>";
    } else {
      cartElement.querySelector(".shipping-progress-bar-label").innerHTML =
        "<p>Spend $" +
        (cartElement.querySelector("#shipping-progress-bar").max * 100 -
          cart.items_subtotal_price) /
          100 +
        " More to Get Free Shipping</p>";
    }

    document.dispatchEvent(new CustomEvent("cartChanged"));

    return cartElement;
  }

  let closeButton = cartElement
    .querySelector("[data-close-cart-drawer]")
    .cloneNode(true);
  let freeGift = cartElement
    .querySelector(".dtc-gift-purchase")
    .cloneNode(true);
  let emptyCart = cartElement.querySelector(".cart-empty").cloneNode(true);
  let continueShoppingButton = document.createElement("a");
  continueShoppingButton.classList.add("cart-checkout-button");
  continueShoppingButton.innerHTML = "Shop All";
  continueShoppingButton.href = cartTemplate.dataset.continueShoppingUrl;
  cartElement.querySelector(".cart-section").replaceChildren(emptyCart);
  cartElement.querySelector(".cart-section").classList.add("empty-cart");
  emptyCart.prepend(freeGift);
  cartElement.querySelector(".cart-section").appendChild(closeButton);

  return cartElement;
}

function initRebuyWidget() {
  window.Rebuy.init();
  
  document.addEventListener('rebuy.init', function(event){
    if (initializedRebuy) return;

    document.addEventListener('rebuy.ready', function (event) {
      const rebuyProducts = event?.detail?.widget?.data?.products;
      renderRebuyWidget(rebuyProducts);
    });
    
    document.addEventListener('rebuy.change', function () {
      setTimeout(() => {
        renderRebuyWidget(window.Rebuy?.widgets[0]?.data?.products);
      }, 2000);
    });
    
    document.addEventListener('rebuy.add', function (event) {
      renderCartDrawer();
    });

    document.addEventListener('rebuy.beforeAdds', function (event) {
      $('.dtc-rebuy-single-upsell').addClass('hidden');
    });

    document.addEventListener('rebuy.productsChange', function(event){
      renderRebuyWidget(window.Rebuy?.widgets[0]?.data?.products);
    });

    initializedRebuy = true;
  });
}

function renderRebuyWidget(rebuyProducts) {
  if (!rebuyProducts || rebuyProducts.length === 0) {
    $('.dtc-rebuy-single-upsell').addClass('hidden');
    return;
  }

  const compareAtPrice = parseInt($('.dtc-rebuy-single-upsell .rebuy-widget .rebuy-product-price > div .rebuy-money.compare-at span:last-child').text().replace('$', ''));
  const salePrice = parseInt($('.dtc-rebuy-single-upsell .rebuy-widget .rebuy-product-price > div .rebuy-money:not(.compare-at) span:last-child').text().replace('$', ''));
  const savingPercentage = Math.floor((compareAtPrice - salePrice) / compareAtPrice * 100) || 0;
  const rebuyMessage = `Complete the Outfit${
    savingPercentage && savingPercentage > 0
      ? ` & Save ${savingPercentage}%`
      : ''
  }`;

  if ($('.dtc-rebuy-single-upsell .rebuy-widget .dtc-save-money').length === 0) {
    $('.dtc-rebuy-single-upsell .rebuy-widget .rebuy-product-price > div').append(`<span class="dtc-save-money"></span>`);
  }

  if (
    savingPercentage && 
    savingPercentage > 0
  ) {
    $('.dtc-rebuy-single-upsell .rebuy-widget .dtc-save-money').text(`Save ${savingPercentage}%`);
    $('.dtc-rebuy-single-upsell .rebuy-widget .dtc-save-money').show();
  } else {
    $('.dtc-rebuy-single-upsell .rebuy-widget .dtc-save-money').hide();
  }

  $('.dtc-rebuy-single-upsell > h3').text(rebuyMessage);
  $('.dtc-rebuy-single-upsell').removeClass('hidden');
}

function renderCartDrawer () {
  /*
  return getCart().then((cart) => {
    const ajaxCart = createCartTemplate(cart);

    document.body.classList.add("no-scroll");
    document.body.appendChild(ajaxCart);
    document.body
      .querySelectorAll(".cart-drawer")
      .forEach((element) => element.classList.add("active-drawer"));

    updateDtcProgressBar(cart);
    initRebuyWidget();
  });*/

  window.Rebuy.SmartCart.show();
}

function initGiftListener(cart) {
  const productVariants = window?.gwpVariants || [];
  const addFreeGiftButton = document.querySelector('.add-free-gift');
  // Add an event listener to the button element
  if (!addFreeGiftButton) { return; }
  
  addFreeGiftButton.addEventListener('click', () => {
    // OLD CODE CREATED BY JEAN
    //const selected = {
    //   size: document?.getElementById('size')?.value,
    //   color: document?.getElementById('color')?.value,
    // };
    /*
    Author: Hemnys
    Date: 12-05-2023  
    Description:
      Instead of forcing the object "selected" to have the size and color properties,
      I created the the object "selected" as an empty object and then I added the properties only if one of them exists
    */
    const selected = {};
    if(document?.getElementById('size')?.value){
      selected.size = document?.getElementById('size')?.value;
    }
    if(document?.getElementById('color')?.value){
      selected.color = document?.getElementById('color')?.value;
    }
    /*
    Author: Hemnys
    Date: 12-05-2023  
    Description:
      I removed the old product handle and I added the new one, I mean, I replaced the "House socks" with "Jambys Rambys"
    */
   //const cartKey = cart?.items?.find(item => item?.handle === "house-socks-gift")?.key;
   const cartKey = cart?.items?.find(item => item?.handle === window.gwpProductHandle)?.key;
   // old code created by jean 
    // if (!selected?.size || !selected?.color) {
    //   return;
    // }
     /*
    Author: Hemnys
    Date: 12-05-2023  
    Description:
      Instead of checking if the object "selected" has the size and color properties, I check if the object "selected" is empty
    */
    if(selected.length === 0){
      return;
    }

    $('.dtc-rebuy-single-upsell').addClass('hidden');
    addFreeGiftButton.querySelector('.btn-content').textContent = 'Adding...';
    // Remove product from cart before any other execution
    removeFreeGift(cartKey).then(function(res) {
       /*
      Author: Hemnys
      Date: 12-05-2023  
      Description:
        I created a new logic to filter the product variant by using the title instead of the option1 and option2
        This code works for a product with 1, 2 or 3 options
        this reducer is returning the variant title, for example: "S / Black"
        then, I use the variant title to find the variant id
      */
      let selectedValues = Object.values(selected).reduce((accumulator, currentValue) => {
          return accumulator + ' / ' + currentValue;
      });
      let id = productVariants.find(variant => variant.title === selectedValues)?.id;
      const productData = {
        //id: productVariants?.find(variant => variant?.option1 === selected?.size && variant?.option2 === selected?.color)?.id,
        id,
        quantity: 1,
        properties: {
          '_free_gift': true
        }
      };
  

      if (!productData?.id) { 
        return;
      }
  
      // Call the ajaxCartrequest function to add the product to the cart
      ajaxCartrequest('POST', {
        quantity: productData.quantity,
        id: productData.id,
        properties: productData.properties
      }, '/cart/add.js').then((cart) => {
        // Toggle the cart
        // renderCartDrawer();
        console.info('√ Gift added successfully.');
        $('#free-gift-container').addClass('hidden');
      }).catch((error) => {
        console.error('x error: ', error);
      });
    }).catch(function(error) {
      console.error(error);
      addFreeGiftButton.querySelector('.btn-content').textContent = 'Add';
    });
  })
}

function waitForIgProgressBarWidget() {
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      if (window.igProgressBarWidget && window.igProgressBarWidget.size !== 0) {
        clearInterval(intervalId);
        resolve();
      }
    }, 100);
  });
}

function fillGiftProduct() {
  const product = window?.gwpProduct || [];
  const availableVariants = !!window?.gwpVariants?.length ? window?.gwpVariants.filter(variant => variant.available) : [];
  const $gwpContainer = $("#free-gift-container");
  const template = `
    <h3>Claim your Free Gift!</h3>
    <div class="free-gift disabled">
      <div class="free-gift-image">
        <img 
            src="${product.featured_image}" 
            alt="${product.title}"
            width="100"
            height="100"
            loading="lazy"
        />
      </div>

      <div class="free-gift-content">
        <h4>${product.title}</h4>

        <p class="price">
            <span>${formatMoney(product.price)}</span>
            <span>FREE</span>
        </p>

        <div class="selectors">
          ${product?.options?.find(p => p.name === 'Color') ? `
            <div class="selector-wrapper color-selector">
              <div class="form-group">
                <select name="color" id="color" class="select2 color-options" style="width: 100%"></select>
              </div>
            </div>
          ` : ''}
          ${product?.options?.find(p => p.name === 'Size') ? `
            <div class="selector-wrapper size-selector">
              <div class="form-group">
                <select name="size" id="size" class="select2 size-options" style="width: 100%"></select>
              </div>
            </div>
          ` : ''}
        </div>

        <button class="add-free-gift" disabled>
            ${renderLockIcon()}
            <span class="btn-content">Unlocks At $${(window?.gwpCampaign?.minimumUnits).toFixed(2) || 0}+</span>
            ${renderTickIcon()}
        </button>
      </div>
    </div>
  `;

  // Organize variant information
  let colors = [];
  let sizes = [];

  $gwpContainer.html(template);

  if (!!availableVariants.length) {
    availableVariants.forEach(variant => {
      if (!colors.some(color => color.label === variant.option2)) {
        colors.push({
          label: variant.option2,
          img: variant.featured_image.src,
        });
      }
  
      // I want just the sizes available for the first color option
      if (variant.option2 === colors[0].label) {
        if (!sizes.includes(variant.option1)) {
          sizes.push(variant.option1);
        }
      }
    });
  
    // Fills dropdowns
    colors.forEach(color => {
      const option = new Option(color.label, color.label);
      option.setAttribute('data-image', color.img);
      $(".select2.color-options").append(option);
    });
  
    sizes.forEach(size => {
      $(".select2.size-options").append(new Option(size, size));
    });
  
    $('.select2.color-options').on('select2:select', function (e) {
      const data = e.params.data;
      const availableVariants = window?.gwpVariants?.filter(variant => variant.available);
      const sizes = [];
  
      availableVariants.forEach(variant => {
        // I want just the sizes available for the first color option
        if (variant.option2 === data.text) {
          if (!sizes.includes(variant.option1)) {
            sizes.push(variant.option1);
          }
        }
      });
  
      $(".select2.size-options").empty();
  
      sizes.forEach(size => {
        $(".select2.size-options").append(new Option(size, size));
      });
    });
  } else {
    $(".select2.color-options").append(new Option('Color', ''));
    $(".select2.size-options").append(new Option('Size', ''));
  }
}

function updateDtcProgressBar() {
  // Get the rebuy cart
  setTimeout(() => {
    const cart = window?.Rebuy?.Cart?.getCart() || null;
    const igProgressWidget = window.igProgressBarWidget || null;
    const igData = window?.igData?.campaigns.getGWP() || null;
    const campaign = igData?.find(ig => ig?.isGiftWithPurchase) || null;
    const productHandle = campaign?.giftWithPurchaseHandle;

     /*
      Author: Hemnys
      Date: 12-05-2023
      Description: Adding a condition to hide the free gift container and set the unlock message to empty when cart is empty
     */
     if(cart.items.length === 0){
          document?.querySelector('.free-gift-container')?.classList?.add('hidden');
          updateUnlockMessage('');
     }
  
    if ((!igData || !campaign) && document.querySelector('.free-gift-content')) {
      document?.querySelector('.dtc-gift-purchase.loading')?.classList?.remove('loading');
      document?.querySelector('.free-gift-content')?.classList?.remove('loading');
      document?.querySelector('.dtc-no-gift-purchase')?.classList?.remove('hidden');
      return;
    }
  
    if (productHandle) {
      $.getJSON(`${window.Shopify.routes.root}products/${productHandle}.js`, function(product) {
        window.gwpCampaign = campaign;
        window.gwpProduct = product;
        window.gwpVariants = product?.variants;
        window.gwpProductHandle = productHandle;
  
        fillGiftProduct();
        initSelect2(product);
  
        document?.querySelector('.dtc-gift-purchase.loading')?.classList?.remove('loading');
        document?.querySelector('.dtc-gift-purchase > .content.hidden')?.classList?.remove('hidden');
        document?.querySelector('.dtc-gift-purchase > .unlock-message.hidden')?.classList?.remove('hidden');
      
        if ((cart?.total_price / 100) < campaign?.minimumUnits) {
          const cartKey = cart?.items?.find(item => item?.handle === productHandle)?.key;
          
          if (cartKey) {
            removeFreeGift(cartKey).then(async function(res) {
              console.info('√ Gift removed successfully.', res);
            }).catch(function(error) {
              console.error(error)
            });
          }
        }
      
        const $freeGiftBtn = $('.add-free-gift');
        const freeshippingObj = igProgressWidget?.values()?.next()?.value;
        const { discount, message } = freeshippingObj ?? {};
        const freeShippingThreshold = 85;
        const freeShippingPercentage = freeShippingThreshold && cart?.total_price
          ? (((cart.total_price / 100) / (freeShippingThreshold * 100)) * 100) * 100
          : 0;
        const remaining = message !== "This order ships for FREE!" && freeShippingPercentage < 100
          ? message.replace(/\$xx/g, formatMoney((freeShippingThreshold - (cart.total_price / 100))*100))
          : (message || "Add a product to the cart to start unlocking FREE SHIPPING!");
      
        if (document?.querySelector('.dtc-gift-purchase .heading>h2')) {
          document.querySelector('.dtc-gift-purchase .heading>h2').innerText = `Cart (${cart.item_count})`;
        }
      
        updateRemainingMessage(remaining);
      
        updateFreeShippingProgressBar(freeShippingPercentage).then(async () => {
          if (freeShippingPercentage >= 100) {
            updateUnlockMessage("This order ships for FREE!");
            
            document.querySelector('.free-gift-container').classList.remove('dtc-no-rebuy-single-upsell');
      
            updateThresholdFreeshipping().then(() => {
              if (campaign && campaign.minimumUnits) {
                const freeGiftThreshold = campaign.minimumUnits;
                const whole = freeGiftThreshold - freeShippingThreshold;
                const cartTotal = cart?.total_price / 100 - freeShippingThreshold;
                const remainingPercentage = (whole > 0) ? Math.floor((cartTotal / whole) * 100) : 100;
                /*
                  Author: Hemnys
                  Date: 12-07-2023
                  Description: Getting the product title from the tags, if the tag is not found, then the product title is used
                */ 
                const altName = product?.tags?.find(tag => tag.includes('freegifttext_'))?.split('_')?.[1]?.replace('-',' ').trim() || product?.title;
                /*
                  Author: Hemnys
                  Date: 12-06-2023
                  Description: Wrapping message in a span, then the product title, to apply custom styles with CSS
                */ 

                const remainingMessage = remainingPercentage < 100
                  ? `<span>Add $${(whole - cartTotal).toFixed(2)} to unlock <span class="dtc-product-title">${window?.gwpProduct?.title || altName}</span>!</span>`
                  : `Free ${altName} unlocked`;

                initGiftListener(cart);
                updateRemainingMessage(remainingMessage);
                updateFreeGiftStatus(remainingPercentage, $freeGiftBtn, campaign.minimumUnits, cart);
                setTimeout(() => {
                  updateFreeGiftProgressBar(remainingPercentage).then(() => {
                    if (remainingPercentage >= 100) {
                      updateThresholdFreegift();
                    } else {
                      updateFreeGiftProgressBar(remainingPercentage).then(() => {
                        updateThresholdFreegift(false);
                      }).catch(
                        (error) => console.error(error)
                      );
                    }
                  }).catch(
                    (error) => console.error(error)
                  )
                }, 500);
              }
            }).catch(function (error) {
              console.error(error);
            });
          } else {
            updateUnlockMessage("");
            updateFreeGiftProgressBar(0).then(() => {
              updateThresholdFreegift(false);
              updateThresholdFreeshipping(false)
            }).catch(
              (error) => console.error(error)
            );
          }
      
          document.querySelector('.free-gift-content').classList.remove('loading');
        }).catch(
          (error) => console.error(error)
        );
      });
    }
    /*
      Task:
      Adding percentage of saving to the product price
      Author: Hemnys
      Date: 12-04-2023
    
    */
    const rebuyProducts = [...document.querySelectorAll('.rebuy-cart__flyout-recommendations .rebuy-product-block')];
    if (rebuyProducts.length > 0) {
      const regularPrices = [...document.querySelectorAll('.rebuy-product-price .sale span:last-child')];
      const compareAtPrices = [...document.querySelectorAll('.rebuy-product-price .compare-at span:last-child')];
      const savingPrice = [...document.querySelectorAll('.rebuy-product-price .dtc-save-money')];

      if(regularPrices.length > 0 && compareAtPrices.length > 0 && savingPrice.length === 0){
        regularPrices.forEach((price, index) =>{
          if(compareAtPrices[index]) {
            const regularPrice = parseFloat(price.innerText.replace('$', ''));
            const compareAtPrice = parseFloat(compareAtPrices[index].innerText.replace('$', ''));
            const savingPercentage = ((compareAtPrice - regularPrice) / compareAtPrice * 100).toFixed() || 0;

            

            const priceWrapper = price.closest('.rebuy-product-price');

            if (priceWrapper) {
              const innerSelector = priceWrapper.querySelector('div');
              const savingElement = document.createElement('span');
              
              savingElement.classList.add('dtc-save-money');
              savingElement.innerHTML = `SAVE <span class="dtc-price">${savingPercentage}%</span>`;
              innerSelector.appendChild(savingElement);
            }
          }
        })
      }
    }
  }, 800);
}

function removeFreeGift(id = null) {
  // Call the ajaxCartRequest function to remove the product from the cart
  if (!id) { return Promise.resolve(null); }

  return ajaxCartrequest(
    'POST', 
    { quantity: 0, id }, 
    '/cart/change.js'
  ).then(function(response) {
    // Handle the response from the server
    return response;
  }).catch(function(error) {
    console.error(error)
  });
}

function updateFreeGiftStatus(remainingPercentage, freeGiftBtn, threshold, cart) {
  const freeGiftElement = document.querySelector('.free-gift');
  const fgDropdowns = document.querySelectorAll('.free-gift .select2');
  const inCart = cart?.items?.find(item => item?.handle === window?.gwpProductHandle);
  const $freeGWPItem = $(`.product-${window?.gwpProductHandle} .rebuy-cart__flyout-item-media > a > img`);

  if (!inCart && remainingPercentage >= 100) {
    $('#free-gift-container').removeClass('hidden');
  }else{
    $('#free-gift-container').addClass('hidden');
  }
    

  fgDropdowns.forEach(dropdown => {
    if (remainingPercentage >= 100) {
      dropdown.removeAttribute('disabled');
    } else {
      dropdown.setAttribute('disabled', true);
    }
  });

  if (freeGiftBtn && freeGiftBtn.length > 0) {
    if (remainingPercentage >= 100 && freeGiftBtn) {
      freeGiftElement.classList.remove('disabled');
      freeGiftBtn.prop('disabled', false);
      freeGiftBtn.addClass('add');

      if (inCart && inCart?.image) {
        freeGiftBtn.find('.btn-content').text('Added');
        freeGiftBtn.find('.btn-content').prop('disabled', true);
        freeGiftBtn.removeClass('add');
        freeGiftBtn.addClass('added');
        freeGiftBtn.prop('disabled', true);
      } else {
        freeGiftBtn.find('.btn-content').text('Add');
        freeGiftBtn.find('.btn-content').prop('disabled', false);
        freeGiftBtn.removeClass('added');
        freeGiftBtn.addClass('add');
        freeGiftBtn.prop('disabled', false);
      }
    } else {
      freeGiftBtn.addClass('disabled');
      freeGiftBtn.prop('disabled', true);
      freeGiftBtn.removeClass('add');
      freeGiftBtn.find('.btn-content').text(`Unlocks at $${(threshold).toFixed(2)}+`);
    }
  }
}

function updateFreeShippingProgressBar(freeShippingPercentage = 0) {
  return new Promise((resolve, reject) => {
    try {
      const freeShippingProgressBar = document.querySelector('.freeshipping-tier > .progress-bar');
      freeShippingProgressBar.style.width = `${freeShippingPercentage / 2}%`;
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function updateRemainingMessage(remaining) {
  console.log(remaining)
  const remainMessage = document.querySelector('.remain-message');

  if (!remainMessage) return;
  /*
    Author: Hemnys
    Date: 12-06-2023
    Description: Replacing textContext with innerHTML since we are receiving a string with HTML tags
  */ 
  remainMessage.innerHTML = remaining
    .replace('Spend', 'Add')
    .replace('free shipping', 'FREE SHIPPING!');
}

function updateThresholdFreeshipping(payload = true) {
  return new Promise((resolve, reject) => {
    try {
      const thresholdFreeshipping = document.querySelector('.threshold-freeshipping');
      
      if (payload) {
        thresholdFreeshipping.classList.add('dark');
        thresholdFreeshipping.querySelector('.icon').classList.remove('active');
        thresholdFreeshipping.querySelector('.white-icon').classList.add('active');
      } else {
        thresholdFreeshipping.classList.remove('dark');
        thresholdFreeshipping.querySelector('.icon').classList.add('active');
        thresholdFreeshipping.querySelector('.white-icon').classList.remove('active');
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function updateUnlockMessage(unlockMessage) {
  const unlockMessageParagraph = document.querySelector('.unlock-message > p');
  unlockMessageParagraph.textContent = unlockMessage;
}

function updateFreeGiftProgressBar(remainingPercentage) {
  return new Promise((resolve, reject) => {
    try {
      const freeGiftProgressBar = document.querySelector('.freegift-tier > .progress-bar');
      freeGiftProgressBar.style.width = `${remainingPercentage / 2}%`;
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

function updateThresholdFreegift(payload = true) {
  const thresholdFreegift = document.querySelector('.threshold-freegift');

  if (payload) {
    thresholdFreegift.classList.add('dark');
    thresholdFreegift.querySelector('.icon').classList.remove('active');
    thresholdFreegift.querySelector('.white-icon').classList.add('active');
  } else {
    thresholdFreegift.classList.remove('dark');
    thresholdFreegift.querySelector('.icon').classList.add('active');
    thresholdFreegift.querySelector('.white-icon').classList.remove('active');
  }
}

function initSelect2(product) {
  function formatOption(option) {
    if (!option.id) { return option.text; }
    
    var imgUrl = $(option.element).data('image');
    var $option = $('<span></span>');
    // apend the image and text to the container
    $option.append('<img src="' + imgUrl + '" width="20" height="20" />');

    return $option;
  };
  try{
    const setSwatches = document.querySelectorAll('.select2.color-options');
    setSwatches[0].addEventListener('change', function() {
      const img = product.variants.find(option => option.option2.toLowerCase() == setSwatches[0].value.toLowerCase()).featured_image.src;
      const setNewImg = document.querySelectorAll('.free-gift-image img');
      setNewImg[0].src = img;
    })

    
    $(".select2.color-options").select2({
    dropdownParent: $('.color-selector'),
    minimumResultsForSearch: Infinity,
    templateResult: formatOption,
    templateSelection: formatOption
  });
  $('.select2.size-options').select2({
    placeholder: "Size",
    dropdownParent: $('.size-selector'),
    minimumResultsForSearch: Infinity
  });
  }catch(e){
    console.log(e)
  }
}

function toggleCart() {
  // Trigger convert location event.
  window.singleUpsellCart = true;
  window._conv_q = window._conv_q || [];
  window._conv_q.push(["executeExperiment", "100436263" ]);

  return removeCurrentCart().then(() => {
    renderCartDrawer();
  });
}

function updateCartCounts() {
  return getCart().then((cart) => {
    console.info("cart was called 2");
    document
      .querySelectorAll(".cart-count")
      .forEach((element) => (element.innerHTML = cart.item_count));
    document
      .querySelectorAll("[data-toggle-cart] .text-link")
      .forEach((element) => (element.innerHTML = cart.item_count));
    var fs_threshold = parseInt(
      document.querySelector("#cart-drawer").getAttribute("data-fs-threshold")
    );

    if (cart.item_count == 0) {
      let cartElement = document.querySelector(".cart-drawer");
      const cartTemplate = document.getElementById("cart-drawer");
      let continueShoppingButton = document.createElement("a");
      let closeButton = cartElement?.querySelector("[data-close-cart-drawer]");
      let emptyCart = cartElement?.querySelector(".cart-empty");
      continueShoppingButton.classList.add("cart-checkout-button");
      continueShoppingButton.innerHTML = "Shop All";
      continueShoppingButton.href = cartTemplate?.dataset?.continueShoppingUrl;
      cartElement?.querySelector(".cart-section").replaceChildren(emptyCart);
      cartElement?.querySelector(".cart-section").classList.add("empty-cart");
      cartElement?.querySelector(".cart-section").appendChild(closeButton);
      return;
    }

    let intelligems_total = 0;

    cart.items.forEach((item) => {
      switch(item.properties._igLineItemDiscount) {
        case 0:
        case '':
        case undefined:
        case null:
            var intelligems_discount = 0;
            break;
        default:
            var intelligems_discount = item.properties._igLineItemDiscount + 0
            intelligems_total = intelligems_total + item.properties._igLineItemDiscount
      }
    });

    if (cart.items_subtotal_price >= fs_threshold * 100 && document.querySelector(".shipping-progress-bar-label")) {
      document.querySelector(".shipping-progress-bar-label").innerHTML =
        "<p>This Order Ships Free!</p>";
    } else {
      if (document.querySelector(".shipping-progress-bar-label")) {
        document.querySelector(
          ".shipping-progress-bar-label"
        ).innerHTML = `<p>Spend $${
          (fs_threshold * 100 - cart.items_subtotal_price) / 100
        } More to Get Free Shipping</p>`;
      }
    }

    if(cart.original_total_price - intelligems_total > cart.items_subtotal_price) {
      document.querySelector(
        ".cart-subtotal-currency"
      ).innerHTML = `<s style="opacity: .6;">${formatMoney(
        cart.original_total_price
      )}</s> ${formatMoney(cart.items_subtotal_price)}`;
    } else {
      if (document.querySelector(".cart-subtotal-currency")) {
        document.querySelector(
          ".cart-subtotal-currency"
        ).innerHTML = `${formatMoney(cart.items_subtotal_price)}`;
      }
    }

    if (document.querySelector(".shipping-progress-bar")) {
      document.querySelector(".shipping-progress-bar").value = parseInt(
        formatMoney(cart.items_subtotal_price).replace("$", ""),
        10
      );
    }
  });
}

function clickHandler(e) {
  const element = e.target;
  const elementData = element.dataset;
  const parentElement = element.parentElement;

  if ("toggleCart" in elementData) {
    e.preventDefault();
    return toggleCart();
  }

  if ("closeCartDrawer" in elementData || "cartOverlay" in elementData) {
    return removeCurrentCart();
  }

  if ("cartLineAdjust" in elementData) {
    e.preventDefault();
    const itemKey = parentElement.dataset.lineKey;
    const currentQuantity = parseInt(
      parentElement.querySelector(".cart-line-quantity").value,
      10
    );
    let newQuantity;
    if ("decreaseQuantity" in elementData) {
      newQuantity = currentQuantity - 1;
    }
    if ("increaseQuantity" in elementData) {
      newQuantity = currentQuantity + 1;
    }

    return ajaxCartrequest(
      "POST",
      buildItemUpdateJSON(itemKey, newQuantity),
      "/cart/change.js"
    )
      .then((cart) => {
        renderCartDrawer(cart);
      })
      .then(() => {
        updateCartCounts();
      });
  }
}
function keyUpHandler(e) {
  if (e.key === "Escape") {
    if (document.querySelectorAll(".cart-drawer")) {
      return removeCurrentCart();
    }
  }
}
function initAJAXCart() {
  window.addEventListener("click", clickHandler, false);
  document.addEventListener("keyup", keyUpHandler);
}

// Old cart drawer implementation. Uncomment to use.
initAJAXCart();

// Rebuy Implementation
document.addEventListener('rebuy:smartcart.show', updateDtcProgressBar);
document.addEventListener('rebuy:smartcart.line-item-increase', updateDtcProgressBar);
document.addEventListener('rebuy:smartcart.line-item-decrease', updateDtcProgressBar);
document.addEventListener('rebuy:smartcart.line-item-removed', updateDtcProgressBar);

function isGWP (item) {
  const productHandle = window?.igData?.campaigns?.getGWP()[0]?.giftWithPurchaseHandle;
  return item?.handle === productHandle;
}