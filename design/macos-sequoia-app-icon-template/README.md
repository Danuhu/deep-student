# macOS Sequoia App Icon SVG Template

This folder contains a Figma-friendly SVG rebuild of Apple's macOS Sequoia Photoshop production template for app icons.

Files:

- `macos-sequoia-app-icon-template.svg`: full production-board layout rebuilt as vector SVG.
- `macos-sequoia-app-icon-master-1024.svg`: focused 1024px master canvas with the measured macOS icon body and guides.
- `measurements.json`: measured tile positions and optical body insets from the rendered PSD.

Measured geometry from `Template - Icon - App.psd`:

- PSD canvas: `2040 x 1990`
- 1024 export tile: positioned at `x=40, y=860`
- 1024 tile optical icon body: `824 x 824`
- 1024 tile optical inset: `100px` on each side
- 512 tile optical icon body: `412 x 412`
- 512 tile optical inset: `50px` on each side

Usage in Figma:

1. Drag `macos-sequoia-app-icon-master-1024.svg` into Figma.
2. Put the icon artwork inside the blue dashed optical body box, not edge-to-edge on the 1024 canvas.
3. Export the macOS source from the full 1024 canvas with transparency.
4. Use a separate iOS source if you need a full-bleed iOS AppIcon.

Important: this is a clean-room helper rebuilt from measured template geometry. It is not an official Apple file and does not replace Apple's original production templates.
