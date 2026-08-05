# MNTN — Hiking Guide

A cinematic landing page for a hiking guide featuring a layered parallax hero, smooth scroll animations, and an accessible, dependency-free implementation.

**Live demo:** https://obielousov.github.io/MNTN_landing_page-/

## Features

- **Parallax hero** — multi-layer mountain scene with layer speed and direction controlled via `data-*` attributes and optimized with `requestAnimationFrame`
- **Scroll reveal animations** — sections fade in using `IntersectionObserver`, triggered only once
- **Section navigation** — vertical sidebar with active section tracking and a sliding indicator
- **Sticky header** — subtle scroll state and responsive burger navigation
- **Accessibility** — skip link, keyboard-friendly navigation, `aria-expanded`, `:focus-visible`, `prefers-reduced-motion`, and noscript fallback
- **SEO & Social** — Open Graph and Twitter Card metadata with preview image

## Tech stack

- **HTML5** — semantic markup and SEO-friendly metadata
- **SCSS** — variables, partials, and modular architecture compiled into minified CSS
- **Vanilla JavaScript** — framework-free, dependency-free implementation
- **Assets** — WebP images, self-hosted Gilroy fonts, and Google Fonts (Playfair Display)

## Project structure

```text
.
├── index.html          # semantic markup with SEO & social metadata
├── scss/               # SCSS source files
├── css/                # compiled and minified CSS
├── js/script.js        # menu, parallax, section navigation, reveal animations
├── img/                # WebP images & SVG icons
└── fonts/              # self-hosted Gilroy (woff2)
```

## Run locally

Clone the repository and open `index.html` in any modern browser.

No installation, build process, or external dependencies are required.
