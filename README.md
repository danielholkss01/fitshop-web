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
- There is no checkout, address collection, retailer inventory, or shopping link yet.

The separate `fitshop-api` repository remains an earlier API prototype. The web demo currently generates outfits locally so it can work before that service is deployed. Before real listings go live, replace the sample catalogue with authorised retailer data and connect the shopping links.
