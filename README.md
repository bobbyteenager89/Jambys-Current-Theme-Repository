# Jambys Theme

This theme stores front-end assets in organized subfolders:

- `assets/scripts/experiments` – JavaScript for theme experiments (e.g., `proteus-utils.js`, `proteus-treatments.js`)
- `assets/styles/proteus` – styles related to Proteus experiments
- `assets/experiments/dtc` – scripts for direct-to-consumer experiments
- `assets/styles/dtc` – styles for direct-to-consumer features

Experiment scripts are loaded only when their matching theme settings are enabled. The `experiment-quicklinks` class (formerly `proteus-quicklinks`) marks quicklink blocks used by Proteus experiments.

Each custom script or style includes a header comment describing its purpose. New assets should follow this structure and include similar documentation.

Run `npm test` to verify the placeholder test script.
