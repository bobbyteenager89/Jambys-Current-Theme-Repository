function editImgURL(url, size) {
  url = url.replace(/_\d*x\./, ".");
  url = url.replaceAll(".jpeg", "_" + size + "x.jpeg");
  url = url.replaceAll(".jpg", "_" + size + "x.jpg");
  url = url.replaceAll(".png", "_" + size + "x.png");
  url = url.replaceAll(".gif", "_" + size + "x.gif");
  return url
}
var visited = false;
/**
 * @param candid Array of results
 * @return Returns an array where index 0 = array of even ones, and index 1 = array of odd ones
*/
function splitArray(candid) {
  var oddOnes = [],
    evenOnes = [];
  for (var i = 0; i < candid.length; i++)
    (i % 2 == 0 ? evenOnes : oddOnes).push(candid[i]);
  return [evenOnes, oddOnes];
}

function elementIsInModal(element) {
  if (element.closest('.theme-modal')) {
    return true;
  }
  return false;
}

async function request(url, method, body) {
  const response = await fetch(url, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
    .then(response => {
      return response.json();
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  return response
}

// this could be updated to a graphql query, not sure which is faster
async function getProductMetafields(handle) {
  const response = await fetch('/products/' + handle.toLowerCase() + '?view=metafields');
  return await Promise.resolve(response.json());
}

function replaceContentViaSelector(source, destination, selector) {
  const sourceEl = source.querySelector(selector);
  const destinationEl = destination.querySelector(selector);
  if (sourceEl && destinationEl) {
    destinationEl.innerHTML = sourceEl.innerHTML;
  }
}

async function renderUpdatedProduct(element, productHandle) {
  try {
    // Render current section in context of new product's handle
    const productContainer = element.closest(".product-container");
    const sectionId = productContainer.dataset.sectionId;
    const splitProductUrl =
      productContainer.dataset.productUrl.split("/products/");
    splitProductUrl[1] = `${productHandle}?section_id=${sectionId}`;
    const sectionRenderResponse = await fetch(
      splitProductUrl.join("/products/")
    ).then((res) => res.text());


    // Parse new section HTML
    const sourceEl = new DOMParser().parseFromString(
      sectionRenderResponse,
      "text/html"
    );

    // Prepare new gallery to lazy-load automatically
    sourceEl
      .querySelectorAll(".rimage_custom.lazyload--manual")
      .forEach((customImg) => {
        customImg.classList.remove("lazyload--manual");
        customImg.classList.add("lazyload");
      });
    // Replace current section's content with new product gallery + breadcrumbs
    replaceContentViaSelector(sourceEl, productContainer, ".left_Section");
    replaceContentViaSelector(
      sourceEl,
      productContainer,
      ".product-breadcrumbs-wrapper"
    );

  } catch (error) { }
}


let new_product_tags;


async function clickHandler(e) {

  const element = e.target;
  const elementData = element.dataset;
  const elementParent = element.parentElement;


  if ('colorSwatch' in elementData) {
    e.preventDefault();

    const isQuickBuyModal = elementIsInModal(element);
    const productID = parseInt(element.dataset.productIdSwatch, 10);
    const productHandle = element.dataset.jsProductHandle;

    let $target = $(document.querySelector('[data-section-type="product-template"]'));
    let sectionContainer = document.querySelector('[data-section-type="product-template"]');
    if (isQuickBuyModal) {
      $target = $(document.querySelector('.theme-modal [data-section-type="product-template"]'));
      sectionContainer = document.querySelector('.theme-modal [data-section-type="product-template"]');
    }
    let currentVariantOption;
    if (sectionContainer.querySelector('.original-selector option:checked')) {
      currentVariantOption = sectionContainer.querySelector('.original-selector option:checked').innerHTML;
    }

    // Use section-rendering API to update the gallery + breadcrumbs
    renderUpdatedProduct(element, productHandle);

    //const newProduct = window.colorSwatchCollection.find(product => product.id === productID);
    jQuery.getJSON('/products/' + productHandle + '.js', function (product) {

      const newProduct = product;

      new_product_tags = newProduct.tags;
      const genderTagValue = newProduct.tags.find(tag => tag == 'gender=unisex');
    
      const genderCategoryContainer = sectionContainer.querySelectorAll('.swatch-catergory--container');
    
      genderCategoryContainer.forEach(container => {
        if (genderTagValue != 'gender=unisex') {
          container.classList.remove('dn-i-gender');
        }
      });

      let colorSwatches = sectionContainer.querySelectorAll('.product-color-swatches li');
      let mediaColumns = sectionContainer.querySelectorAll('.media-column');

      let color_selector = document.getElementById("color-swatch-selector")
      let new_color = "Color: "+ newProduct.title.replace(newProduct.type,"")
      color_selector.innerText = new_color


      // update product image slider
      let productSlider = sectionContainer.querySelector('.theme-images');

      let swiperSliderFrag = document.createDocumentFragment();
      let formFrag = document.createDocumentFragment();

      getProductMetafields(newProduct.handle).then(response => {
        const collection_subtitle_metafield = sectionContainer.querySelector('#collection-subtitle-metafield').innerHTML
        sectionContainer.querySelector('.mobile-header .product-subtitle').innerHTML = "";
        sectionContainer.querySelector('.product-detail__form .product-subtitle').innerHTML = "";
        if (response.global_metafields.subtitle && collection_subtitle_metafield == "") {
          sectionContainer.querySelector('.mobile-header .product-subtitle').style.display = 'block';
          sectionContainer.querySelector('.product-detail__form .product-subtitle').style.display = 'block';
          sectionContainer.querySelector('.mobile-header .product-subtitle').innerHTML = response.global_metafields.subtitle; 
          sectionContainer.querySelector('.product-detail__form .product-subtitle').innerHTML = response.global_metafields.subtitle;
        } else if(collection_subtitle_metafield != ""){
          sectionContainer.querySelector('.mobile-header .product-subtitle').style.display = 'block';
          sectionContainer.querySelector('.product-detail__form .product-subtitle').style.display = 'block';
          sectionContainer.querySelector('.mobile-header .product-subtitle').innerHTML = collection_subtitle_metafield; 
          sectionContainer.querySelector('.product-detail__form .product-subtitle').innerHTML = collection_subtitle_metafield;
        }
        else {
          sectionContainer.querySelector('.mobile-header .product-subtitle').style.display = 'none';
          sectionContainer.querySelector('.product-detail__form .product-subtitle').style.display = 'none';
        }

        if (!!response.global_metafields.specialMessage) {
          // if special message "Promo Message" exists...
          if (sectionContainer.querySelectorAll('.product-special-message').length > 0) {
            // -AND IF- the promo element exists, update it
            sectionContainer.querySelector('.product-special-message').innerHTML = response.global_metafields.specialMessage;
          } else {
            // -AND IF- the promo element DOES NOT exist, create it
            sectionContainer.querySelector('.product-detail__form__action > button').insertAdjacentHTML("afterend", `
                  <span class="product-special-message">${response.global_metafields.specialMessage}</span>
                `);
          }
        } else {
          // the special message "Promo Message" does not exist...
          // -AND IF- the promo element exists, empty it
          if (sectionContainer.querySelectorAll('.product-special-message').length > 0) {
            sectionContainer.querySelector('.product-special-message').innerHTML = "";
          }
        }

        if (response.global_metafields.size_chart) {
          sectionContainer.querySelector('#tab-sizing').style.display = 'block';
          sectionContainer.querySelector('[tab-sizing-content]').innerHTML = response.global_metafields.size_chart;
        } else {
          sectionContainer.querySelector('#tab-sizing').style.display = 'none';
          sectionContainer.querySelector('[tab-sizing-content]').innerHTML = '';

          if (sectionContainer.querySelector('#tab-sizing a').hasAttribute("aria-selected")) {
            sectionContainer.querySelector('#tab-sizing a').removeAttribute("aria-selected");
            sectionContainer.querySelector('[tab-sizing-content]').setAttribute("hidden", "hidden");
            sectionContainer.querySelector('#tab-first').setAttribute("aria-selected", "true");
            sectionContainer.querySelector('#tab-first-content').removeAttribute("hidden");
          }
        }

      });

      theme.productData = {};
      theme.productData[productID] = newProduct;
      $(".hide-this-color-line").remove()

      colorSwatches.forEach(swatch => {
        if (swatch.classList.contains('hide-this-color')) {
          swatch.classList.remove('hide-this-color');

        }
        if (swatch.classList.contains('active')) {
          swatch.classList.remove('active');
        }
      })

      //console.log(newProduct);
      /*getProductMetafields(newProduct.handle).then(response => {
        if (response.badge_metafields.text) {
          for (var i = 0; i < 20; i++) {
            console.log(response.badge_metafields.text);
            mac = mac+'<span>' + response.badge_metafields.text + '</span>';
          }
        }
  let pl = document.querySelectorAll(".product-label");
        console.log('aaa')
        pl.forEach(function(item) {
          item.innerHTML('aaaaaaa')
        })
      });*/

      let productOptionsFrag = document.createDocumentFragment();

      newProduct.options.forEach(option => {
        let selectorWrapper = document.createElement('div');
        selectorWrapper.classList.add('selector-wrapper');
        selectorWrapper.setAttribute('data-option-name', option.name);

        let selectLabel = document.createElement('label');

        selectLabel.setAttribute('for', `option-${option.name.toLowerCase()}-${newProduct.id}`);
        selectLabel.setAttribute('id', `size-swatch-selector`);
        selectLabel.innerHTML = option.name;


        let optionSelect = document.createElement('select');
        optionSelect.id = `option-${option.name.toLowerCase()}-${newProduct.id}`;
        optionSelect.setAttribute('data-make-box', '');
        optionSelect.classList.add('noreplace');
        optionSelect.classList.add(`option-${option.name.toLowerCase()}`);

        selectorWrapper.appendChild(selectLabel);
        selectorWrapper.appendChild(optionSelect);
        productOptionsFrag.appendChild(selectorWrapper);
      })


      let variant;

      const variantElms = document.querySelectorAll('.all-variants');
      let variantsObj = [];
      variantElms.forEach(function (variantElm) {
        variantsObj.push(
          {
            id: variantElm.dataset.variantIdStock,
            inventory_qty: variantElm.dataset.variantInventoryQty,
            metafield: variantElm.dataset.variantCustomMetafield
          })
      });
      

      newProduct.variants.forEach(newProductVariant => {
        let optionElement = document.createElement('option');
        optionElement.value = newProductVariant.id;
        optionElement.innerHTML = newProductVariant.title;

        let filter = variantsObj.filter(d => d.id == newProductVariant.id)
        let this_stock = parseInt(filter[0].inventory_qty) <= 0 ? 'out' : ''
        //console.log(filter)

        optionElement.setAttribute('data-stock', this_stock);
        if (newProductVariant.option1 == currentVariantOption) {
          optionElement.setAttribute('selected', '');
          variant = newProductVariant;
        }
        formFrag.appendChild(optionElement);

        let optionElement2 = document.createElement('option');
        optionElement2.id = newProductVariant.id;
        if (newProductVariant.available) {
          optionElement2.className = "opt_enable";
        } else {
          optionElement2.className = "opt_disable";
        }
        optionElement2.value = newProductVariant.option1;
        optionElement2.dataset.jsProductHandle = newProduct.handle

        let variant_title = newProductVariant.title;

        if (variant_title == 'Extra Extra Small') {
          variant_title = 'XXS';
        }
        if (variant_title == 'Extra Small') {
          variant_title = 'XS';
        }
        if (variant_title == 'Small') {
          variant_title = 'S';
        }
        if (variant_title == 'Medium') {
          variant_title = 'M';
        }
        if (variant_title == 'Large') {
          variant_title = 'L';
        }
        if (variant_title == 'Extra Large') {
          variant_title = 'XL';
        }
        if (variant_title == 'Extra Extra Large') {
          variant_title = 'XXL';
        }
        if (variant_title == 'Extra Extra Extra Large') {
          variant_title = 'XXXL';
        }

        optionElement2.innerHTML = variant_title;
        if (newProductVariant.option1 == currentVariantOption) {
          optionElement2.setAttribute('selected', '');
        }

        if (newProductVariant.option1) {
          productOptionsFrag.querySelector(`#option-${newProduct.options[0].name.toLowerCase().replace(' ', '-')}-${newProduct.id}`).appendChild(optionElement2);
        }

        if (newProductVariant.option2) {
          productOptionsFrag.querySelector(`#option-${newProduct.options[1].name.toLowerCase().replace(' ', '-')}-${newProduct.id}`).appendChild(optionElement2);
        }

        if (newProductVariant.option3) {
          productOptionsFrag.querySelector(`#option-${newProduct.options[2].name.toLowerCase().replace(' ', '-')}-${newProduct.id}`).appendChild(optionElement2);
        }


      })


      sectionContainer.querySelectorAll('[data-product-id]').forEach(element => {
        element.setAttribute('data-product-id', productID);
      })

      // replace options in original selector
      sectionContainer.querySelector('.original-selector').replaceChildren(formFrag);

      // document.querySelector('shopify-payment-terms').setAttribute('variant-id', variantID);

      if (!isQuickBuyModal) {
        document.title = newProduct.title;
        if (document.querySelector('.theme-init') !== null) {
          document.querySelector('.theme-init').classList.remove('theme-init');
        }
      }


      const titleElements = sectionContainer.querySelectorAll('.product-area__details__title');
      titleElements.forEach(titleElement => {
        titleElement.innerHTML = newProduct.type.replace(newProduct.type, `<br>${newProduct.type}`);
      });
      getProductMetafields(newProduct.handle).then(response => {
        console.log("response", response.global_metafields.subtitle, response);
      }).catch();

      elementParent.classList.add('active');


      if (sectionContainer.querySelector('.options-1')) {
        sectionContainer.querySelector('.options-1').replaceChild(productOptionsFrag, sectionContainer.querySelector('.options-1').querySelector('.selector-wrapper'));
      }



      const hasjQueryInKey = (k) => { return ~k.indexOf("jQuery") };

      for (const [key, value] of Object.entries($target[0])) {
        let testIndex = hasjQueryInKey(key);

        if (testIndex === -1) {
          $target[0][key].productId = newProduct.id;
        }


      }

      let target = sectionContainer;

      const url = new URL(window.location.href);
      const genderValue = url.searchParams.get('utm_gender');
      

        const pathParts = url.pathname.split('/');
        const productIndex = pathParts.indexOf('products');
      
        if (productIndex > -1) {
          pathParts[productIndex + 1] = newProduct.handle;
      
          const newPath = pathParts.slice(0, productIndex + 2).join('/');

          const newUrl = new URL(window.location.origin + newPath);
          genderValue && newUrl.searchParams.set('utm_gender', genderValue);
      
          history.pushState({}, "", newUrl.toString());
        
      }
      
      /// Boxed-options (do before initProductOptions - which applies classes to these boxes)
      theme.convertOptionsToBoxes(target);

      // /// Product options
      theme.OptionManager.initProductOptions($(target));

      // theme.ProductMediaGallery($gallery, $('.theme-gallery-thumb', target), false, false, document.querySelector('[data-section-type="product-template"]').dataset.sectionId).initSwiper();

    });

    //update COMPLETE YOUR HOUSEFIT
    setTimeout(() => {
      console.log("--- UPDATE CYH ---");
      $('[data-section-type="featured-collection"]').load(document.URL + ' [data-section-type="featured-collection"]');

    }, 500);
    try{
    if(isShowMetaobject){
      let faqs = document.querySelectorAll('#faqs-product .cc-accordion');
      let hasCustom = false;
      
      faqs.forEach(faq => {
        if (faq.id == productID) {
          faq.style.display = 'block';
          hasCustom = true;
        } else {
          faq.style.display = 'none';
        }
      });

      if (!hasCustom) {
        faqs.forEach(faq => {
          if (faq.dataset.general == "true") {
            faq.style.display = 'block';
          }
        });
      }
 
    }
    }catch(e){
      console.log(e)
    }

  }


  if ('value' in elementData) {

    e.preventDefault();
    const btn = document.getElementsByClassName("button hover-grow")[0];
    btn.style.pointerEvents = "auto";
    const btnGift = document.getElementsByClassName("GiftWizard-gift-button gwbutton")[0];
    if(btnGift){
      btnGift.style.pointerEvents = "auto";
    }

    let sectionContainer = document.querySelector('[data-section-type="product-template"]');

    let colorSwatches = sectionContainer.querySelectorAll('.product-color-swatches li');

    let filter = array_variants.filter(d => d.size == element.dataset.value)
    $(".hide-this-color-line").remove()
    let filter_available = array_variants_available.filter(d => d.size == element.dataset.value)

  

    colorSwatches.forEach(swatch => {
      if (swatch.classList.contains('hide-this-color')) {
        swatch.classList.remove('hide-this-color');

      }
      for (let e of filter) {
        if (e.color == swatch.dataset.jsProductHandle) {
          swatch.classList.add('hide-this-color')
          let div = document.createElement('div');
          div.classList.add("hide-this-color-line")
          swatch.children[0].appendChild(div)
        }
      }
      //console.log(filter_available.filter(e => e.color == swatch.dataset.jsProductHandle).length,swatch.dataset.jsProductHandle)
      if(filter_available.filter(e => e.color == swatch.dataset.jsProductHandle).length <= 0 ){
        if(!swatch.classList.contains('hide-this-color')){
          swatch.classList.add('hide-this-color')
          let div = document.createElement('div');
          div.classList.add("hide-this-color-line")
          swatch.children[0].appendChild(div)
        }
      }

      
      if (swatch.classList.contains('active')) {
        swatch.classList.remove('active');
      }
    })
    
    if(element.dataset.optionNameValue == "Type"){
      let type_selector = document.getElementById("type-swatch-selector")
      let new_size = element.dataset.optionNameValue+": "+ element.dataset.value
      type_selector.innerText = new_size
    }else{
      let size_selector = document.getElementById("size-swatch-selector")  
      let new_size = ""

      if(element.dataset.optionNameValue){
        new_size = element.dataset.optionNameValue+": "+ element.dataset.value
      }else{
        new_size = "Size: "+ element.dataset.value
      }
      size_selector.innerText = new_size
    }
    

    document.getElementsByClassName("pdp-error")[0].style.display = 'none'
    visited = true
  }

  if(element.id == "add-button-pdp"){
    if(!visited){
      document.getElementsByClassName("pdp-error")[0].style.display = 'block'
    }
  }
  if(element.id == "add-button-pdp-gift"){
    if(!visited){
      document.getElementsByClassName("pdp-error")[0].style.display = 'block'
    }
  }

  if (e.target.classList.contains('sizing-link')) {

    let currentActiveElement = document.querySelectorAll('.cc-tabs__tab__panel');
    currentActiveElement.forEach(element => element.setAttribute('hidden', ''));
    const elementID = e.target.getAttribute('aria-controls');


    let sizingTabTitle = document.getElementById('tab-sizing').querySelector('a');
    sizingTabTitle.setAttribute('aria-selected', 'true');

    let sizingTab = document.getElementById(sizingTabTitle.getAttribute('aria-controls'));
    sizingTab.removeAttribute('hidden');
  }
  
}

async function renderGallery(newHandle) {
  const productContainer = document.querySelector(".product-container");
  if (!productContainer) return;

  const sectionId = productContainer.dataset.sectionId;
  const baseUrl = productContainer.dataset.productUrl.split("/products/")[0];
  const fetchUrl = `${baseUrl}/products/${newHandle}?section_id=${sectionId}`;

  const html = await fetch(fetchUrl).then((res) => res.text());
  const doc = new DOMParser().parseFromString(html, "text/html");


  doc.querySelectorAll(".rimage_custom.lazyload--manual").forEach(img => {
    img.classList.remove("lazyload--manual");
    img.classList.add("lazyload");
  });

  const newGallery = doc.querySelector(".left_Section");
  const currentGallery = productContainer.querySelector(".left_Section");

  if (newGallery && currentGallery) {
    currentGallery.replaceWith(newGallery);

   
    if (window.lazySizes && lazySizes.loader) {
      lazySizes.loader.checkElems();
    }
  }
}

function setupGenderButtons() {
  const buttonsGender = document.querySelectorAll('.swatch-category--gender button[data-gender-category]');
  
  buttonsGender.forEach(button => {
    button.addEventListener('click', async () => {
      const genderValue = button.getAttribute('data-gender-category').toLowerCase();
      const url = new URL(window.location.href);

      smarthSlideButtonActive(button, buttonsGender);

      if(!url.search.includes(`utm_gender=${genderValue}`) || !url.searchParams.get('utm_gender')){
        if (genderValue) {
          url.searchParams.set('utm_gender', genderValue);
        } else {
          url.searchParams.delete('utm_gender');
        }
        
        history.replaceState(null, '', url.toString());
        
        const currentHandle = location.pathname.split('/products/')[1]?.split('?')[0] ?? '';
        
        const newHandle = `${currentHandle}?utm_gender=${genderValue}`;
        
        await renderGallery(newHandle);
      }
    });

  });
}
//animate the button on click
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

setupGenderButtons();


window.addEventListener('click', clickHandler, true);
