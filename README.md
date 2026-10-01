# Fit&Shop web

An early outfit discovery demo for men and women. Shoppers can set sizes, budget, style, occasion and colour preferences, then browse the coordinated looks available from the current catalogue. Results arrive six at a time with no fixed outfit cap.

## Run locally

```bash
npm ci
npm run dev
```

Open http://localhost:3000. No API URL or account is required. The site uses its own `POST /api/outfits/generate` route, so the button works on a normal Vercel deployment.

## Current scope

- Sizes, budget, and taste preferences are saved in the shopper's browser using local storage. No training or account system is running yet. The first ranking is based on reviewed item tags, compatible colours, sizes and budget.
- Products in `src/lib/catalog.json` are sample data. Each of the 20 valid sample combinations has a generated full-body model photo, and the top, bottom and shoe details are crops of that same photo. Item prices appear before the outfit total. These images are styling examples, not photographs of actual retailer products or a virtual try-on of the shopper. Sizes and prices do not represent live retailer offers. See [sample image maintenance](docs/demo-look-images.md).
- There is no checkout or address collection. Retailer products and shopping links appear only after an approved partner feed is imported.
- Approved feeds can describe dresses, gowns, jumpsuits, jackets, polos, jeans and other types with their actual brand, material and size labels. Dress or jumpsuit looks do not require a separate top and bottom. This is catalogue support; it does not imply those items are available before a supplier provides them.

## Partner products

See [the partner feed guide](docs/partner-feed.md) for the CSV format and import command. When current, approved partner products can form a complete outfit for the shopper's size and budget, the site shows their images and links to the retailers. Otherwise it displays the clearly labelled sample catalogue.

An [Awin feed adapter](docs/awin-feed.md) imports authorised fashion feeds in legacy CSV or enhanced JSONL format. The `/shop` page displays current, approved Baccus products with retailer photos, prices and tracked links. A daily Baccus refresh is ready once its private download URL is added as a GitHub repository secret. These products have no verified size availability and stay out of size-matched outfit recommendations.

The separate `fitshop-api` repository remains an earlier API prototype. The web app generates outfits on its own server so it works before that service is deployed.
