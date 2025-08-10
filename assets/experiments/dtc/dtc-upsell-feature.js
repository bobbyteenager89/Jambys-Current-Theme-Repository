// Handles DTC upsell feature interactions
// Custom function to observe mutations in the DOM
document.querySelectorEver = (selector, callback) => {
    const targetNode = document.querySelector(selector);
    if (!targetNode) {
        return; // Return early if the target element doesn't exist
    }

    let firstModifiedElement = null; // Store the first modified element

    const config = {
        attributes: true,
        childList: true,
        subtree: true
    };

    const observer = new MutationObserver((mutationList, observer) => {
        for (const mutation of mutationList) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                for (const node of mutation.addedNodes) {
                    if (!firstModifiedElement) {
                        firstModifiedElement = node; // Store the first modified element
                    }
                }
            }
        }

        // Call the callback function with the first modified element
        if (firstModifiedElement) {
            callback(firstModifiedElement);
            firstModifiedElement = null; // Reset the first modified element
        }
    });

    observer.observe(targetNode, config);
};
// Function to handle the click event on alternative variant elements
function handleClick(evt, altVariants) {
    altVariants
        .map(variant => variant.classList.remove('dtc-selected'));
    evt
        .target
        .classList
        .add('dtc-selected');

    evt
        .target
        .closest('.dtc-options-wrapper')
        .classList
        .toggle('dtc-show');

    const $currentValue = document.querySelector('.dtc-variant-current-value');
    console.log(evt.target.dataset.value)
    $currentValue.innerText = evt.target.dataset.value;
}
// Function to handle form submission (e.g., adding a product to the cart)
function handleSubmit() {
    const selectedVariant = this.closest('.dtc-product-content-wrapper').querySelector('.dtc-selected');
    this.querySelector('.dtc-default-content').classList.add('dtc-hide-element');
    this.querySelector('.dtc-adding-message').classList.remove('dtc-hide-element');
    const { id } = selectedVariant.dataset;
    let params = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, quantity: 1 })
    };
    fetch('/cart/add.js', params).then(res => res.json()).then(data => {
    }).then(data => {
        console.log('added')
        this.querySelector('.dtc-default-content').classList.add('dtc-hide-element');
        this.querySelector('.dtc-adding-message').classList.add('dtc-hide-element');
        this.querySelector('.dtc-added-message').classList.remove('dtc-hide-element');
        updateCartCounts();
        toggleCart();
    }).then(data => {
        this.querySelector('.dtc-default-content').classList.remove('dtc-hide-element');
        this.querySelector('.dtc-adding-message').classList.add('dtc-hide-element');
        this.querySelector('.dtc-added-message').classList.add('dtc-hide-element');
    });
}

const initAltSelectors = () => {
    const altVariants = [...document.querySelectorAll('.dtc-variants-wrapper .dtc-variant')];
    altVariants.forEach(variant => variant.addEventListener('click', (evt) => handleClick(evt, altVariants)))
    const $altATCButton = [...document.querySelectorAll('.dtc-atc-button')];
    $altATCButton.forEach(atc => atc.addEventListener('click', handleSubmit));
    const mobileFirstOption = document.querySelectorAll('.dtc-test-button')[0];
    const activeVariant = document.querySelector('.product-color-swatches .dtc-color-swatch.active');
    const clonedElement = activeVariant && activeVariant.cloneNode(true);
    mobileFirstOption && mobileFirstOption.append(clonedElement.querySelector('a'))
}
const selectVariantfromRecomendedProducts = (getValue) => {
    const options = {
        'extra extra small': 'XXS',
        'xxs': 'XXS',
        'extra small': 'XS',
        'xs': 'XS',
        'small': 'S',
        's': 'S',
        'medium': 'M',
        'm': 'M',
        'large': 'L',
        'l': 'L',
        'extra large': 'XL',
        'xl': 'XL',
        'extra extra large': 'XXL',
        'xxl': 'XXL',
        '3xl': '3XL'
    }
    const selectedOption = options[getValue];
    const $newSelectedVariant = document.querySelector(`.dtc-variant[data-value="${selectedOption}"]`) || null;

    if ($newSelectedVariant) {
        const $variants = [...$newSelectedVariant.closest('.dtc-variants-wrapper').querySelectorAll('.dtc-variant')];
        $variants.forEach($variant => $variant.classList.remove('dtc-selected'));
        $newSelectedVariant.classList.add('dtc-selected');
        const $currentValue = document.querySelector('.dtc-variant-current-value');

        if ($newSelectedVariant.classList.contains('dtc-unavailable')) {
            $variants.forEach($variant => $variant.classList.remove('dtc-selected'));
            const filteredVariants = $variants.filter($variant => !$variant.classList.contains('dtc-button-title') && !$variant.classList.contains('dtc-unavailable'));
            filteredVariants[0].classList.add('dtc-selected');
            $currentValue.innerText = filteredVariants[0].dataset.value;
        } else {
            $currentValue.innerText = $newSelectedVariant.dataset.value;
        }
    }
}
const renderNewProduct = ($element, data) => {
    let div = document.createElement('div');
    div.innerHTML = data;
    if ($element != null) {
        $element.innerHTML = '';
        $element.append(div.querySelector('.dtc-product-container'))
    }
    const $mainSelectedVariant = document.querySelector('.options-size .active') || null;
    if ($mainSelectedVariant) {
        const getValue = $mainSelectedVariant.dataset.value.toLowerCase();
        selectVariantfromRecomendedProducts(getValue)
    }
}
const fetchNewProdct = ($mainWrapper, productHandle) => {
    return fetch(`${productHandle}?view=dtc-alternate`)
        .then(res => res.text())
        .then(data => {
            renderNewProduct($mainWrapper, data);
        }).then(() => {
            initSwatches();
        }).then(() => {
            initSwatches2();
            initAltSelectors();
        });
}
window.addEventListener('click', function (evt) {
    if (evt.target.classList.contains('dtc-color-swatch')) {
        const $mainWrapper = evt.target.closest('.dtc-product-wrapper');
        const $selectedVariant = $mainWrapper.querySelector('.dtc-variant.dtc-selected') || $mainWrapper.querySelector('.dtc-options-wrapper-mobile .dtc-selected');
        const { value } = $selectedVariant.dataset;
        const { jsProductHandle } = evt.target.dataset;

        fetchNewProdct($mainWrapper, `/products/${jsProductHandle}`).then(() => {
            let $currentVariant = $mainWrapper.querySelector(`.dtc-variant[data-value="${value}"]`) || null;

            if ($currentVariant) {
                let $firstAvailableVariant = ($currentVariant.classList.contains('dtc-unavailable')) ? $mainWrapper.querySelector('.dtc-variant:not(.dtc-button-title):first-child') : $currentVariant;
                $firstAvailableVariant.click();
                $firstAvailableVariant.closest('.dtc-options-wrapper').classList.remove('dtc-show');
            }

        })
    }

    if (evt.target.classList.contains('dtc-button-dropdown') || evt.target.classList.contains('dtc-close') || evt.target.classList.contains('dtc-options-wrapper') || evt.target.classList.contains('dtc-color-swatches-floating-wrapper')) {
        // Handle clicks on certain elements with specific classes
        const $colorOptions = document.querySelector(`.dtc-product-content-wrapper [data-content="${evt.target.dataset.content}"]`);
        $colorOptions.classList.toggle('dtc-show');
    }

    if (evt.target.dataset.testid === 'wair-flow-finish-button') {
        const activeVariant = document.querySelector('.predict-placement .wr-border-none b');
        let VariantToBeClicked = document.querySelector(`.dtc-variant[data-value="${activeVariant.innerText}"]`);
        VariantToBeClicked.click();
    }
})
// Event listener for the 'color:updated' event
document.addEventListener('color:updated', (evt) => {
    const { pdpRelatedProducts } = evt.detail;
    const relatedProducts = Object.entries(pdpRelatedProducts).map(([key, value]) => value);

    const URL = relatedProducts[0] && relatedProducts[0].prod_url;
    const $mainWrapper = document.querySelector('.dtc-product-wrapper');
    fetchNewProdct($mainWrapper, URL);
})

// Event listener for the 'DOMContentLoaded' event
window.addEventListener('DOMContentLoaded', initAltSelectors)


// Custom function to observe mutations in the DOM and perform actions based on the observed changes
document.querySelectorEver(".predict-placement", (element) => {
    if (element.querySelector('b')) {
        // Get the value from the 'b' element within the observed element
        const getValue = element.querySelector('b').innerText.toLowerCase();
        selectVariantfromRecomendedProducts(getValue)
    }
});