# Color Data and Combined Listings

## Color data sourcing

Color information for each product is stored in the `product.color` metafield. The swatch
snippet (`snippets/dtc-collection-swatches.liquid`) gathers all sibling products of the same
type and reads their color from this metafield. If a product does not have the metafield
defined, the snippet falls back to the first value of an option named “Color.”

Up to six sibling colors are rendered on desktop (three on mobile). Additional colors are
collapsed behind a “+X more” link.

## Shopify combined listing evaluation

Shopify’s combined listings allow multiple standalone products (such as separate colorways) to
be presented as a single product with selectable options. Each child product retains its own URL,
preserving SEO value while giving customers a unified product page.

**Benefits**

- Consolidates color variants into one listing for a cleaner storefront.
- Maintains distinct URLs for each color, helping search engines index individual variants.
- Simplifies merchandising and reduces duplicate content.

**Considerations**

- Requires configuration of parent/child relationships in the Shopify admin.
- Themes must be updated to read combined listing metafields.
- Some apps and analytics tools may not yet fully support combined listings.

