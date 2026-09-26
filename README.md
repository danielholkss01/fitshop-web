# Fit&Shop web

An early outfit discovery demo for men and women. Shoppers can set their sizes and total outfit budget, then see up to three coordinated sample looks.

## Run locally

```bash
npm ci
npm run dev
```

Open http://localhost:3000. No API URL or account is required. The site uses its own `POST /api/outfits/generate` route, so the button works on a normal Vercel deployment.

## Current scope

- Sizes and budget are saved in the shopper's browser using local storage.
- Products in `src/lib/catalog.json` are sample data. Garment drawings are illustrative, and prices do not represent live retailer offers.
- There is no checkout or address collection. Retailer products and shopping links appear only after an approved partner feed is imported.

## Partner products

See [the partner feed guide](docs/partner-feed.md) for the CSV format and import command. When current, approved partner products can form a complete outfit for the shopper's size and budget, the site shows their images and links to the retailers. Otherwise it displays the clearly labelled sample catalogue.

The separate `fitshop-api` repository remains an earlier API prototype. The web app generates outfits on its own server so it works before that service is deployed.
