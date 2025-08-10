# Jambys Theme

This theme stores front-end assets in organized subfolders:

- `assets/experiments/proteus` – custom Proteus experiment scripts
- `assets/styles/proteus` – styles related to Proteus experiments
- `assets/experiments/dtc` – scripts for direct-to-consumer experiments
- `assets/styles/dtc` – styles for direct-to-consumer features

Experiment scripts are loaded only when their matching theme settings are enabled.

Each custom script or style includes a header comment describing its purpose. New assets should follow this structure and include similar documentation.

Run `npm test` to verify the placeholder test script.

## Feature snippets

The following snippets power direct-to-consumer features and utilities:

- `checkout-return-info.liquid` – banner with extended return and free shipping details on checkout pages.
- `checkout-reviews.liquid` – highlights recent customer reviews during checkout.
- `variant-button.liquid` – builds selectable variant buttons for related product blocks.
- `gift-purchase.liquid` – cart component that tracks progress toward free shipping and gift thresholds.
- `product-buy-box-review.liquid` – surfaces small review snippets within a product's buy box.
- `chevron-down.liquid` – reusable downward chevron SVG icon.
- `collection-swatches.liquid` – lists available colors for sibling products within a collection.
- `done-icon.liquid` – checkmark icon used in variant selections.
- `hero-slide.liquid` – outputs a single slide for the hero image slider.
- `mega-menu-by-subtype.liquid` – generates a mega menu grouped by product subtype.
- `mega-menu-desktop-custom.liquid` – custom desktop mega menu driven by section blocks.
- `product-type-compare.liquid` – desktop slider comparing product types for a collection.
- `product-type-compare-mobile.liquid` – mobile version of the product type comparison slider.
- `related-product-block.liquid` – "Pairs well with" upsell block with variant and review info.
