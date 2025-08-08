# Builder Components

The theme no longer includes builder-specific templates or snippets. Legacy builder templates (for example, `page.*.builder.liquid` and `page.*-builder.json`) and snippets (`builder-*`, `bundle-*`, and related content snippets) have been removed.

Remaining builder references exist only in styles and class names:

- `assets/outfit-builder.css`
- `assets/proteus-treatments.css`
- `sections/color-swatches.liquid`, `sections/color-swatches-2.liquid`, and `sections/color-swatches-3.liquid` use the `js-builder-color-swatch` class for swatch styling.

These artifacts can be cleaned up in the future if the builder functionality is fully deprecated.
