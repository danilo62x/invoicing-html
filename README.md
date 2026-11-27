# Invoicing & Finance / HTML

[Leia em português](./README.pt-BR.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) ![Free](https://img.shields.io/badge/price-free-brightgreen)

Invoicing for service providers: public site and a finance area with an overview (receivable, overdue, received this month, expenses), invoices with a printable document and partial payments, quotes that turn into invoices, recurring subscriptions by cycle, clients with tax details and statements, and expenses by category.

Everything runs on mock data, so no backend, external API or service is needed.

## Highlights

- 18 HTML pages
- Internationalisation in Portuguese (pt-BR), English and Spanish
- Installable PWA
- Light and dark themes
- Responsive layout from phone to desktop
- Mock data in Portuguese (Brazil), easy to replace with a real API

## Tech stack

- HTML5
- JavaScript
- Tailwind CSS v4
- ApexCharts

## Requirements

- Node.js 20 or newer and npm

## Getting started

```bash
npm install
npm run dev
```

The dev server prints the local URL to open.

Demo account:

- `financeiro@contacerta.com` / `demo123`

## Build for production

```bash
npm run build
```

Writes the production bundle to `dist/`; preview it locally with `npm run preview`. Any static host works; for client-side routes, point unknown paths to `index.html`.
Writes the optimised pages and assets to `dist/`. The HTML files also work when served as-is by any static server.

## Project structure

```
18 HTML pages at the root
assets/
```

## Other stacks

This template also exists in 4 other stacks, with the same screens and visual identity. All of them are free:

- React 19: https://github.com/danilo62x/invoicing-react
- Vue 3: https://github.com/danilo62x/invoicing-vue3
- Angular 19: https://github.com/danilo62x/invoicing-angular
- Laravel 11: https://github.com/danilo62x/invoicing-laravel

More free templates (admin dashboards, vertical systems and Flutter apps): https://github.com/danilo62x?tab=repositories

## License

[MIT](./LICENSE), copyright 2026 Danilo Quinelato.
