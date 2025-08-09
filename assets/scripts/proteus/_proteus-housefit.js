// Proteus housefit experiment script
waitUntil(() => {
  return (
    window.sessionStorage.getItem("JMBY-48") || getParam("qa") == "JMBY-48"
  );
})
  .then(() => {
    window.sessionStorage.setItem("JMBY-48", "v1");

    const TAG = "jmby48";

    waitForElement(".product-detail__tab-container.go-test")
      .then(() => {
        let pdpRelatedProducts = window.related.pdp_products;

        const pdpUpsellContainer = document.querySelector(
          ".product-detail__upsell-container"
        );

        var buildPdpUpsellForm = async function (event = false) {
          let relatedIndex = 0;

          if (event) {
            let swatchFetchedRelated = await fetch(
              `/products/${event.target.dataset.jsProductHandle}?view=metafields_related`
            )
              .then((response) => response.json())
              .then((data) => data.related_products);
            pdpRelatedProducts = swatchFetchedRelated;
          }

          let cartItems = await fetch("/cart.js")
            .then((response) => response.json())
            .then((data) => data.items);

          filteredRelatedProducts = [];

          for ([key, value] of Object.entries(pdpRelatedProducts)) {
            if (
              !cartItems.some((cartItem) => {
                return cartItem.product_title == value.prod_title;
              })
            ) {
              filteredRelatedProducts.push(value);
            }
          }
      
          let eventDTC = new CustomEvent("color:updated", { detail: { pdpRelatedProducts } });
          document.dispatchEvent(eventDTC);
          

          // for ([key, value] of Object.entries(pdpRelatedProducts)) {
          //   if (
          //     cartItems.some((cartItem) => {
          //       return cartItem.product_title == value.prod_title;
          //     })
          //   ) {
          //     relatedIndex++;
          //   }
          // }

          let upsell = Object.values(filteredRelatedProducts)[0];
          let url = upsell?.prod_url,
            thumb = upsell?.prod_thumb;
          let title = upsell ?.prod_title;

          let price = upsell?.prod_price ?? 4500;

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
                      upsell && upsell.prod_id
                    }_select" class="${TAG}-select noreplace" ecl="true">
                      <option value="${upsell?.xsm}" ecl="true">XS</option>
                      <option value="${upsell?.sm}" ecl="true">S</option>
                      <option value="${upsell?.md}" ecl="true">M</option>
                      <option value="${upsell?.lg}" ecl="true">L</option>
                      <option value="${upsell?.xlg}" ecl="true">XL</option>
                      <option value="${upsell?.x2lg}" ecl="true">XXL</option>
                      <option value="${upsell?.x3lg}" ecl="true">3XL</option>
                    </select>
                    <div class="radio-group">
                      <div class="radio" id="upsell_${upsell?.prod_id}_atc">
                        <input type="radio" hidden>
                        <label>Add &#x2022 <span>$${price * 0.01}</span></label>
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
          waitForElement(`#upsell_${upsell?.prod_id}_select`)
            .then((upsell_options) => {
              let options = upsell_options.querySelectorAll("option");
              for (let i = 0; i < options.length; i++) {
                let opt_var_id = options[i].value;
                if (opt_var_id == "unavailable") {
                  options[i].setAttribute("disabled", "disabled");
                  options[i].parentNode.querySelector(
                    'option:not([value="unavailable"])'
                  ).selected = true;
                }
              }

              waitForElement(`#upsell_${upsell?.prod_id}_atc`)
                .then((atc) => {
                  atc.addEventListener("click", () => {
                    let upsell_id = document.querySelector(
                      `#upsell_${upsell?.prod_id}_select`
                    ).value;
                    cart_add_item(upsell_id, 1);
                    setTimeout(() => {
                      toggleCart();
                      buildPdpUpsellForm();
                    }, 500);
                  });
                })
                .catch();

              // window.addEventListener('load', () => {
              //     let swatches = document.querySelectorAll("li a.color-swatch");
              //     swatches.forEach((swatch) => {
              //       //swatch.addEventListener("click", buildPdpUpsellForm);
              //       console.log("is a swatch", swatch);
              //     });
              // })

              waitForElement(".product-color-swatches li a").then(
                (colorSwatch) => {
                  let swatches = colorSwatch
                    .closest(".product-color-swatches")
                    .querySelectorAll("li a.color-swatch");
                  swatches.forEach((swatch) => {
                    swatch.addEventListener("click", buildPdpUpsellForm);
                  });
                }
              );
            })
            .catch();
        };
        buildPdpUpsellForm();
      })
      .catch();

    waitForElement("#shopify-section-cart-drawer #cart-drawer")
      .then(() => {
        //buildPdpUpsellForm();
        //wait for Rebuy cart to exist

        init_experiment("JMBY-48");

        //document.body.insertAdjacentHTML("afterbegin", jmby48_styles);
        //console.log("product object", window.upsell_related);

        // ===[ Jambys ]=== //
        //New upsell based on related products
        observeSelector(".cart-line-items", (jambyCartItem) => {
          let productObject = async function (lastProductAdded) {
            const response = await fetch(
              "/products/" +
                lastProductAdded.toLowerCase() +
                "?view=metafields_related"
            );
            return await Promise.resolve(response.json());
          };

          let assignProductObject = async () => {
            allCartItemNames = document.querySelectorAll(
              ".cart-line-info .cart-line-title"
            );

            let lastProductAdded = Array.from(allCartItemNames).find((item) => {
              return item.closest("li").dataset.productUpsell == "false";
            });
            const a = await productObject(
              lastProductAdded.closest("li").dataset.productHandle
            );
            let relatedProducts = a.related_products;
            //Code to upsell based on product metafields
            let relatedIndex = 0;

            filteredRelatedProducts = [];

            for ([key, value] of Object.entries(relatedProducts)) {
              if (
                !Array.from(allCartItemNames).some((cartItem) => {
                  return cartItem.textContent == value.prod_title;
                })
              ) {
                filteredRelatedProducts.push(value);
              }
            }

            const upsellHeader =
              '<header class="cart-line-header" style="padding-left: 0;"><strong>Complete Your Housefit</strong></header>';

            sizePickers = filteredRelatedProducts
              .map((relatedProduct, index) => {
                (url = relatedProduct?.prod_url),
                  (thumb = relatedProduct?.prod_thumb);
                title = relatedProduct.prod_title;
                //const jambyColor = getColor("jambys", getVariant(jambyCartItem));
                price = relatedProduct?.prod_price ?? 4500;

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
                      <option value="${relatedProduct.sm}" ecl="true">S</option>
                      <option value="${relatedProduct.md}" ecl="true">M</option>
                      <option value="${relatedProduct.lg}" ecl="true">L</option>
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
                        <label>Add &#x2022 <span>$${price * 0.01}</span></label>
                      </div>
                    </div>
                  </div>

                  </div>
                </article>
              </li>
                `;
              })
              .join("");
            //arrow controls
            const controlsHTML = `
              <div class="upsell-control left"></div>
              <div class="upsell-control right"></div>`;
            // show just one upsell
            jambyCartItem
              .closest(".cart-line-items_container")
              .querySelector(".upsell-items-container .upsell-line-items")
              .insertAdjacentHTML("afterbegin", sizePickers);
            jambyCartItem
              .closest(".cart-line-items_container")
              .querySelector(".upsell-items-container")
              .insertAdjacentHTML("afterbegin", upsellHeader);
            jambyCartItem
              .closest(".cart-line-items_container")
              .querySelector(".upsell-items-wrapper")
              .insertAdjacentHTML("beforeend", controlsHTML);

            const upsellItemWidth = jambyCartItem
              .closest(".cart-line-items_container")
              .querySelector(".upsell-items-wrapper .upsell-line-items li")
              .getBoundingClientRect().width;

            const controls = jambyCartItem
              .closest(".cart-line-items_container")
              .querySelectorAll(".upsell-items-wrapper .upsell-control");

              const leftControl = jambyCartItem
              .closest(".cart-line-items_container")
              .querySelector(".upsell-items-wrapper .upsell-control.left");

            const upsellItemsContainer =
              document.querySelector(".upsell-items-container .upsell-line-items");

              upsellItemsContainer.addEventListener('scroll', (e) => {
                horizontal = e.currentTarget.scrollLeft;
                console.log("horozontal", horizontal);
                horizontal > (upsellItemWidth / 2) ? leftControl.classList.add('show') : leftControl.classList.remove('show');

              })

            controls.forEach((control) => {
              control.addEventListener("click", (e) => {
                e.target.classList.contains("left")
                  ? (upsellItemsContainer.scrollLeft -= upsellItemWidth)
                  : (upsellItemsContainer.scrollLeft += upsellItemWidth);
              });

            });


            filteredRelatedProducts.forEach((relatedProduct, index) => {
              waitForElement(`#upsell_${index}_select_drawer`)
                .then((upsell_options) => {
                  let options = upsell_options.querySelectorAll("option");
                  for (let i = 0; i < options.length; i++) {
                    let opt_var_id = options[i].value;
                    if (opt_var_id == "unavailable") {
                      options[i].setAttribute("disabled", "disabled");
                      if(options[i].parentNode.querySelectorAll('option:not([value="unavailable"])').length > 0){
                        options[i].parentNode.querySelector(
                          'option:not([value="unavailable"])'
                        ).selected = true;
                      }
                    }
                  }

                  waitForElement(`#upsell_${index}_atc_drawer`)
                    .then((atc) => {
                      atc.addEventListener("click", () => {
                        let upsell_id = document.querySelector(
                          `#upsell_${index}_select_drawer`
                        ).value;
                        cart_add_item(upsell_id, 1, "true");
                        setTimeout(() => {
                          //Pass in true value if upsell item
                          toggleCart(true);
                          //fetchCart();
                        }, 500);
                      });
                    })
                    .catch();
                })
                .catch();
            });

            // size picker handler
          };

          assignProductObject();

          // getProductMetafields(lastProductAdded.dataset.productHandle).then(
          //   (data) => {
          //     let relatedProducts = data.related_products;
          //     console.log("relatedProducts", relatedProducts);
          //   }
          // );

          // const getVariant = (lineItem) => {
          //   const cartItemLink = new URL(lineItem.querySelector("a").href);
          //   return cartItemLink.searchParams.get("variant");
          // };

          // const getColor = (key, variantID) => {
          //   const map = window.product_map[key];
          //   let sizeKey;

          //   for (color of Object.keys(map)) {
          //     const colorMap = map[color];

          //     Object.keys(colorMap).find((size) => {
          //       if (colorMap[size] == variantID) return (sizeKey = size);
          //     });
          //   }

          //   // const colorKey = Object.keys(map).find((color) => {
          //   //   if (map[color][sizeKey] == variantID) return color;
          //   // });
          //   // return colorKey;
          // };

          // this is the color we want to upsell
          // const jambyColor = getColor("jambys", getVariant(jambyCartItem));
          // console.log("jambyColor", jambyColor);

          // checking for existing hoodies and bottoms
          // const allBottoms = cart.querySelectorAll(
          //     '.cart-line-item-container[data-product-type="Long Jambys"]'
          //   ),
          //   allHoodies = cart.querySelectorAll(
          //     '.cart-line-item-container[data-product-type="House Hoodie"]'
          //   );

          // const hasMatching = (type) => {
          //   const items = type === "long_jambys" ? allBottoms : allHoodies;
          //   if (items) {
          //     for (item of items) {
          //       if (getColor(type, getVariant(item)) === jambyColor)
          //         return true;
          //     }
          //   }
          // };

          // const hasMatchingBottoms = hasMatching("long_jambys"),
          //   hasMatchingHoodie = hasMatching("house_hoodie");

          // if (hasMatchingBottoms && hasMatchingHoodie) return;

          // const upsellItemType = hasMatchingBottoms
          //     ? "house_hoodie"
          //     : "long_jambys",
          //   upsell = window.product_map[upsellItemType][jambyColor];

          // const url = upsell?.prod_url,
          //   thumb = upsell?.prod_thumb;

          // const price = upsell?.prod_price ?? 4500;
          // const title =
          //   upsell?.prod_title ??
          //   (hasMatchingBottoms ? "House Hoodie" : "Long Jambys");

          // console.log(`Size Picker for ${upsell.prod_title}`);
        });
        //Old upsell based on product type Jamby's
        observeSelector(
          '.cart-line-item-container[data-product-type="Jambys"]',
          (jambyCartItem) => {
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
                  if (colorMap[size] == variantID) return (sizeKey = size);
                });
              }

              const colorKey = Object.keys(map).find((color) => {
                if (map[color][sizeKey] == variantID) return color;
              });
              return colorKey;
            };

            // this is the color we want to upsell
            const jambyColor = getColor("jambys", getVariant(jambyCartItem));
            console.log("jambyColor", jambyColor);

            // checking for existing hoodies and bottoms
            const allBottoms = cart.querySelectorAll(
                '.cart-line-item-container[data-product-type="Long Jambys"]'
              ),
              allHoodies = cart.querySelectorAll(
                '.cart-line-item-container[data-product-type="House Hoodie"]'
              );

            const hasMatching = (type) => {
              const items = type === "long_jambys" ? allBottoms : allHoodies;
              if (items) {
                for (item of items) {
                  if (getColor(type, getVariant(item)) === jambyColor)
                    return true;
                }
              }
            };

            const hasMatchingBottoms = hasMatching("long_jambys"),
              hasMatchingHoodie = hasMatching("house_hoodie");

            if (hasMatchingBottoms && hasMatchingHoodie) return;

            const upsellItemType = hasMatchingBottoms
                ? "house_hoodie"
                : "long_jambys",
              upsell = window.product_map[upsellItemType][jambyColor];

            const url = upsell?.prod_url,
              thumb = upsell?.prod_thumb;
            const price = upsell?.prod_price ?? 4500;
            const title =
              upsell?.prod_title ??
              (hasMatchingBottoms ? "House Hoodie" : "Long Jambys");

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
                  <option value="${upsell?.xxsm}" ecl="true">XXS</option>
                    <option value="${upsell?.xsm}" ecl="true">XS</option>
                    <option value="${upsell?.sm}" ecl="true">S</option>
                    <option value="${upsell?.md}" ecl="true">M</option>
                    <option value="${upsell?.lg}" ecl="true">L</option>
                    <option value="${upsell?.xlg}" ecl="true">XL</option>
                    <option value="${upsell?.x2lg}" ecl="true">XXL</option>
                    <option value="${upsell?.x3lg}" ecl="true">3XL</option>
                  </select>
                  <div class="radio-group">
                    <div class="radio" id="${jambyColor}_${upsellItemType}_atc">
                      <input type="radio" hidden>
                      <label>Add 1 for <span>$${price * 0.01}</span></label>
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
            waitForElement(`#${jambyColor}_${upsellItemType}_select`)
              .then((upsell_options) => {
                let options = upsell_options.querySelectorAll("option");
                for (let i = 0; i < options.length; i++) {
                  let opt_var_id = options[i].value;
                  if (opt_var_id == "unavailable") {
                    options[i].setAttribute("disabled", "disabled");
                    options[i].parentNode.querySelector(
                      'option:not([value="unavailable"])'
                    ).selected = true;
                  }
                }

                waitForElement(`#${jambyColor}_${upsellItemType}_atc`)
                  .then((atc) => {
                    atc.addEventListener("click", () => {
                      let upsell_id = document.querySelector(
                        `#${jambyColor}_${upsellItemType}_select`
                      ).value;
                      cart_add_item(upsell_id, 1);
                      setTimeout(() => {
                        toggleCart(true);
                      }, 500);
                    });
                  })
                  .catch();
              })
              .catch();
          }
        );
      })
      .catch();
  })
  .catch();
