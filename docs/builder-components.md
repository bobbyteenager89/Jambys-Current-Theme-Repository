# Builder Components

The theme no longer includes builder-specific templates or snippets. Legacy builder templates (for example, `page.*.builder.liquid` and `page.*-builder.json`) and snippets (`builder-*`, `bundle-*`, and related content snippets) have been removed.

Remaining builder references exist only in styles, scripts, and class names:

- `assets/outfit-builder.css`
- `assets/styles/experiments/experiments-treatments.css`
- `assets/scripts/experiments/experiments-utils.js`, `experiments-treatments.js`, `experiments-housefit.js`
- `sections/color-swatches.liquid`, `sections/color-swatches-2.liquid`, and `sections/color-swatches-3.liquid` use the `js-builder-color-swatch` class for swatch styling.

Experiment quicklinks use the `experiment-quicklinks` class, providing a neutral label for components tied to these tests.

These artifacts can be cleaned up in the future if the builder functionality is fully deprecated.
