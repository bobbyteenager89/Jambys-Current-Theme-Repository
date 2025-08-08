# Jambys Current Theme Repository

## Asset Structure

Custom assets are grouped into thematic subfolders:

- `assets/proteus/` – scripts and styles for Proteus experiments and related treatments.
- `assets/dtc/` – Direct-to-consumer features such as hero sliders and upsell components.

Other theme assets remain in `assets/`.

## Coding Conventions

- **Header Comments**: Custom JavaScript files include a brief header describing their purpose, expected DOM structure, and dependencies.
- **Asset References**: When referencing assets in Liquid templates, include the subfolder path (e.g., `{{ 'dtc/dtc-hero-slider.js' | asset_url }}`).

## Development Notes

No automated tests are available for this theme. Run any available linting or build tools before committing changes.
